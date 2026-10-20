import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './style.css';

const canvas = document.querySelector('#scene');
const rotateToggle = document.querySelector('#rotate-toggle');
const resetButton = document.querySelector('#reset-view');
const hint = document.querySelector('#hint');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xd8e9f3, 0.0068);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  900,
);

const HOME_TARGET = new THREE.Vector3(0, 0.2, 0);
const HOME_VIEW = new THREE.Vector3(18, 10.5, 24.5);

function homePull(aspect) {
  if (aspect < 0.62) return 1.34;
  if (aspect < 0.9) return 1.16;
  return 1;
}

function getHomePosition(aspect = camera.aspect) {
  return HOME_VIEW.clone().sub(HOME_TARGET).multiplyScalar(homePull(aspect)).add(HOME_TARGET);
}

const initialAspect = window.innerWidth / window.innerHeight;
camera.fov = initialAspect < 0.62 ? 58 : initialAspect < 0.9 ? 50 : 42;
camera.updateProjectionMatrix();
camera.position.copy(getHomePosition(initialAspect));

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 14;
controls.maxDistance = 54;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.72;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.8;
controls.autoRotateSpeed = 0.5;
controls.autoRotate = !prefersReducedMotion;

function setAutoRotate(enabled) {
  controls.autoRotate = enabled;
  rotateToggle.setAttribute('aria-pressed', String(enabled));
}
setAutoRotate(controls.autoRotate);

rotateToggle.addEventListener('click', () => setAutoRotate(!controls.autoRotate));

let cameraTween = null;
function resetView() {
  cameraTween = {
    time: 0,
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPosition: getHomePosition(),
    toTarget: HOME_TARGET.clone(),
  };
}
resetButton.addEventListener('click', resetView);

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === 'r' || event.key === 'R') resetView();
  if (event.key === 'a' || event.key === 'A') setAutoRotate(!controls.autoRotate);
});

canvas.addEventListener(
  'pointerdown',
  () => {
    hint.classList.add('hide');
  },
  { once: true },
);

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth01(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

const ISLAND = {
  radius: 7.2,
  centerY: 0.62,
  drop: 0.42,
};

const POND = {
  x: -2.1,
  z: 1.25,
  r: 1.42,
};

function groundBase(x, z) {
  const t = Math.min(1, Math.hypot(x, z) / ISLAND.radius);
  const angle = Math.atan2(z, x);
  return ISLAND.centerY - ISLAND.drop * t * t + 0.05 * Math.sin(angle * 6 + 1.7) * t * t * t;
}

function islandGround(x, z) {
  const distance = Math.hypot(x - POND.x, z - POND.z);
  const bowl = 1 - smooth01(distance / (POND.r + 0.93));
  return groundBase(x, z) - 0.3 * bowl * bowl;
}

const POND_WATER_Y = groundBase(POND.x, POND.z) - 0.035;

const pathPoints = [
  new THREE.Vector3(-0.72, 0, 1.92),
  new THREE.Vector3(0.1, 0, 2.9),
  new THREE.Vector3(1.0, 0, 4.2),
  new THREE.Vector3(2.1, 0, 5.5),
  new THREE.Vector3(3.05, 0, 6.4),
];

const pathCurve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
const pathSamples = pathCurve.getPoints(80);

function distanceToPath(x, z) {
  let closest = Infinity;

  for (let index = 0; index < pathSamples.length - 1; index += 1) {
    const start = pathSamples[index];
    const end = pathSamples[index + 1];
    const segmentX = end.x - start.x;
    const segmentZ = end.z - start.z;
    const lengthSquared = segmentX * segmentX + segmentZ * segmentZ;
    const t = lengthSquared
      ? THREE.MathUtils.clamp(
          ((x - start.x) * segmentX + (z - start.z) * segmentZ) / lengthSquared,
          0,
          1,
        )
      : 0;
    const dx = x - (start.x + segmentX * t);
    const dz = z - (start.z + segmentZ * t);
    closest = Math.min(closest, Math.hypot(dx, dz));
  }

  return closest;
}

function createGlowTexture() {
  const size = 128;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.82)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.24)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const glowTexture = createGlowTexture();

/* ---------------------------------- sky --------------------------------- */

const skyRadius = 300;
const skyGeometry = new THREE.SphereGeometry(skyRadius, 64, 40);
const skyPositions = skyGeometry.attributes.position;
const skyColors = [];
const skyTop = new THREE.Color('#2f6ca4');
const skyMid = new THREE.Color('#8ec2e3');
const skyHorizon = new THREE.Color('#ffe1b8');
const skyBelow = new THREE.Color('#b5ccd7');

for (let index = 0; index < skyPositions.count; index += 1) {
  const y = skyPositions.getY(index) / skyRadius;
  let color;

  if (y >= 0) {
    color = skyHorizon.clone().lerp(skyMid, smooth01(y / 0.28));
    color.lerp(skyTop, smooth01((y - 0.22) / 0.68));
  } else {
    color = skyHorizon.clone().lerp(skyBelow, smooth01(-y / 0.26));
  }

  skyColors.push(color.r, color.g, color.b);
}

skyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));

const sky = new THREE.Mesh(
  skyGeometry,
  new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }),
);
sky.frustumCulled = false;
scene.add(sky);

const sunDirection = new THREE.Vector3(-0.5, 0.55, -0.68).normalize();

const sunHalo = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffd59a,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }),
);
sunHalo.position.copy(sunDirection).multiplyScalar(skyRadius * 0.82);
sunHalo.scale.set(135, 135, 1);
scene.add(sunHalo);

const sunCore = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xfff5dc,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }),
);
sunCore.position.copy(sunHalo.position);
sunCore.scale.set(30, 30, 1);
scene.add(sunCore);

/* -------------------------------- lighting ------------------------------ */

const hemisphereLight = new THREE.HemisphereLight(0xcbe5ff, 0x4f4034, 1.2);
scene.add(hemisphereLight);

const sunLight = new THREE.DirectionalLight(0xffd8a4, 3.3);
sunLight.position.copy(sunDirection).multiplyScalar(52);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -16;
sunLight.shadow.camera.right = 16;
sunLight.shadow.camera.top = 16;
sunLight.shadow.camera.bottom = -16;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 110;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.normalBias = 0.025;
scene.add(sunLight);
scene.add(sunLight.target);

const fillLight = new THREE.DirectionalLight(0xa4c9ee, 1.05);
fillLight.position.set(18, 12, 22);
scene.add(fillLight);

const underLight = new THREE.DirectionalLight(0x91b3cc, 0.68);
underLight.position.set(0, -30, 6);
scene.add(underLight);

/* ------------------------------ island pieces --------------------------- */

const rockMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.95,
  metalness: 0.02,
});

const grassMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.92,
  metalness: 0,
});

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x6b4c36,
  flatShading: true,
  roughness: 1,
});

const pineMaterials = ['#3c7144', '#447c49', '#35683e'].map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.95,
    }),
);

const roundMaterials = ['#6e9c4c', '#7eab57', '#609045', '#89b45e'].map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.95,
    }),
);

const stoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x81776b,
  flatShading: true,
  roughness: 1,
});

function createRockGeometry(seed, segments = 40, rings = 18) {
  const radius = 7.72;
  const depth = 12;
  const topY = 0.05;
  const positions = [];
  const colors = [];
  const indices = [];
  const ringStarts = [];

  const topColor = new THREE.Color('#7d6450');
  const deepColor = new THREE.Color('#48413f');
  const mossColor = new THREE.Color('#5d7d43');

  positions.push(0, topY, 0);
  colors.push(topColor.r, topColor.g, topColor.b);

  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    ringStarts.push(positions.length / 3);

    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const taper = Math.pow(1 - t, 0.62);
      const wobble =
        Math.sin(angle * 3 + seed * 1.7) * 0.28 +
        Math.sin(angle * 7 - seed * 0.9) * 0.11 +
        Math.sin(angle * 13 + seed * 2.1) * 0.05;

      let ringRadius = radius * taper;
      ringRadius *= 1 + wobble * (0.3 + t) * 0.85;
      ringRadius *= 1 + 0.09 * Math.sin(t * Math.PI * 2.6 + seed);
      ringRadius = Math.max(ringRadius, 0.02);

      const yJitter =
        (Math.sin(angle * 5 + t * 9 + seed) * 0.2 + Math.cos(angle * 9 - t * 4) * 0.09) * t;
      const y = topY - depth * Math.pow(t, 1.07) + yJitter;

      positions.push(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius);

      const color = topColor.clone().lerp(deepColor, Math.pow(t, 0.82));
      const band = Math.sin(t * 21 + Math.sin(angle * 3 + seed) * 2) * 0.03;
      color.offsetHSL(0.006 * Math.sin(angle * 2 + t * 3), 0.02, band);

      const mossNoise = Math.sin(angle * 4.5 + seed * 3.1) * 0.5 + 0.5;
      if (t < 0.34 && mossNoise > 0.52) {
        const mossStrength = (1 - t / 0.34) * (mossNoise - 0.52) * 0.9;
        color.lerp(mossColor, Math.min(mossStrength, 0.5));
      }

      colors.push(color.r, color.g, color.b);
    }
  }

  const topRingStart = ringStarts[0];
  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    indices.push(0, topRingStart + next, topRingStart + segment);
  }

  for (let ring = 0; ring < rings; ring += 1) {
    const current = ringStarts[ring];
    const below = ringStarts[ring + 1];

    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const a = current + segment;
      const b = current + next;
      const c = below + segment;
      const d = below + next;
      indices.push(a, b, c, b, d, c);
    }
  }

  const tipIndex = positions.length / 3;
  positions.push(0.22, topY - depth - 0.65, -0.15);
  const tipColor = deepColor.clone().offsetHSL(0, 0, -0.04);
  colors.push(tipColor.r, tipColor.g, tipColor.b);

  const bottomRing = ringStarts[rings];
  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    indices.push(bottomRing + segment, bottomRing + next, tipIndex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createGrassGeometry(seed, withPond, segments = 112, rings = 14) {
  const positions = [];
  const colors = [];
  const indices = [];
  const ringStarts = [];
  const heightAt = withPond ? islandGround : groundBase;

  const grassA = new THREE.Color('#6d9b46');
  const grassB = new THREE.Color('#86b255');
  const grassC = new THREE.Color('#5d8d41');
  const wetColor = new THREE.Color('#656244');
  const pathColor = new THREE.Color('#9b7c52');

  positions.push(0, heightAt(0, 0), 0);
  const centerColor = grassA.clone().lerp(grassB, 0.5);
  colors.push(centerColor.r, centerColor.g, centerColor.b);

  for (let ring = 1; ring <= rings; ring += 1) {
    ringStarts.push(positions.length / 3);
    const t = ring / rings;

    for (let segment = 0; segment < segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const edge =
        1 +
        0.04 * Math.sin(angle * 5 + seed * 0.8) +
        0.022 * Math.sin(angle * 9 - seed * 1.3) +
        0.012 * Math.sin(angle * 17 + seed);
      const radius = ISLAND.radius * t * (1 + (edge - 1) * Math.pow(t, 4));
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = heightAt(x, z);

      positions.push(x, y, z);

      const mix = Math.sin(angle * 3.2 + seed * 2.1) * 0.5 + 0.5;
      const color = grassA.clone().lerp(grassB, mix * 0.7 + t * 0.12);
      color.lerp(grassC, Math.max(0, Math.sin(angle * 2.3 - seed) * 0.3) * t);
      color.offsetHSL(0, 0, 0.015 * Math.sin(angle * 7 + t * 5));

      if (withPond) {
        const pondDistance = Math.hypot(x - POND.x, z - POND.z);
        const wet = 1 - smooth01((pondDistance - POND.r) / 0.9);
        if (wet > 0) color.lerp(wetColor, wet * 0.38);

        const pathMask = 1 - smooth01((distanceToPath(x, z) - 0.3) / 0.38);
        if (pathMask > 0) color.lerp(pathColor, pathMask * 0.88);
      }

      colors.push(color.r, color.g, color.b);
    }
  }

  for (let segment = 0; segment < segments; segment += 1) {
    const next = (segment + 1) % segments;
    indices.push(0, ringStarts[0] + next, ringStarts[0] + segment);
  }

  for (let ring = 0; ring < rings - 1; ring += 1) {
    const current = ringStarts[ring];
    const outer = ringStarts[ring + 1];

    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      const a = current + segment;
      const b = current + next;
      const c = outer + segment;
      const d = outer + next;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/* --------------------------------- trees -------------------------------- */

const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.19, 1.3, 5);
const pineConeGeometry = new THREE.ConeGeometry(1, 1, 7);
const roundBlobGeometry = new THREE.DodecahedronGeometry(1, 0);

function createTree(type, random) {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 0.65;
  group.add(trunk);

  if (type === 'pine') {
    const palette = pineMaterials;
    const cones = [
      { y: 1.55, r: 0.82, h: 1.25 },
      { y: 2.08, r: 0.64, h: 1.02 },
      { y: 2.56, r: 0.44, h: 0.78 },
    ];

    cones.forEach((cone, index) => {
      const mesh = new THREE.Mesh(pineConeGeometry, palette[Math.floor(random() * palette.length)]);
      mesh.position.y = cone.y;
      mesh.scale.set(cone.r, cone.h, cone.r);
      mesh.rotation.y = random() * Math.PI + index * 0.8;
      group.add(mesh);
    });
  } else {
    const palette = roundMaterials;
    const blobs = [
      { x: 0, y: 1.58, z: 0, sx: 0.9, sy: 0.72, sz: 0.86 },
      { x: 0.42, y: 1.98, z: 0.16, sx: 0.62, sy: 0.54, sz: 0.6 },
      { x: -0.38, y: 1.94, z: -0.15, sx: 0.56, sy: 0.48, sz: 0.54 },
      { x: 0.03, y: 2.22, z: -0.18, sx: 0.4, sy: 0.34, sz: 0.38 },
    ];

    blobs.forEach((blob) => {
      const mesh = new THREE.Mesh(roundBlobGeometry, palette[Math.floor(random() * palette.length)]);
      mesh.position.set(blob.x, blob.y, blob.z);
      mesh.scale.set(blob.sx, blob.sy, blob.sz);
      mesh.rotation.set(random() * 2, random() * 2, random() * 2);
      group.add(mesh);
    });
  }

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  group.rotation.y = random() * Math.PI * 2;
  group.userData.swayPhase = random() * Math.PI * 2;

  return group;
}

/* --------------------------------- world -------------------------------- */

const world = new THREE.Group();
scene.add(world);

const island = new THREE.Group();
world.add(island);

const mainRock = new THREE.Mesh(createRockGeometry(7.3), rockMaterial);
mainRock.castShadow = true;
mainRock.receiveShadow = true;
island.add(mainRock);

const mainGrass = new THREE.Mesh(createGrassGeometry(4.1, true), grassMaterial);
mainGrass.receiveShadow = true;
island.add(mainGrass);

const treeSpecs = [
  { x: 0.8, z: -3.0, type: 'pine', scale: 1.25 },
  { x: 3.0, z: -0.8, type: 'round', scale: 1.05 },
  { x: 4.8, z: 1.4, type: 'pine', scale: 1.15 },
  { x: -1.0, z: -4.9, type: 'round', scale: 0.9 },
  { x: -4.6, z: -2.2, type: 'pine', scale: 1.3 },
  { x: -5.2, z: 1.8, type: 'round', scale: 1.0 },
  { x: -3.4, z: 4.2, type: 'pine', scale: 1.05 },
  { x: -0.5, z: 5.1, type: 'round', scale: 1.2 },
  { x: 5.4, z: -2.9, type: 'round', scale: 0.85 },
];

const treeRandom = mulberry32(112);
const swayingTrees = [];

treeSpecs.forEach((spec) => {
  const tree = createTree(spec.type, treeRandom);
  tree.position.set(spec.x, islandGround(spec.x, spec.z) - 0.03, spec.z);
  tree.scale.setScalar(spec.scale);
  tree.userData.baseRotationZ = tree.rotation.z;
  island.add(tree);
  swayingTrees.push(tree);
});

/* ---------------------------------- pond -------------------------------- */

const pond = new THREE.Group();
island.add(pond);

const pondBottom = new THREE.Mesh(
  new THREE.CircleGeometry(POND.r * 0.94, 40),
  new THREE.MeshStandardMaterial({
    color: 0x245760,
    roughness: 0.7,
    metalness: 0.05,
  }),
);
pondBottom.rotation.x = -Math.PI / 2;
pondBottom.position.set(POND.x, POND_WATER_Y - 0.055, POND.z);
pond.add(pondBottom);

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x65d3e5,
  roughness: 0.13,
  metalness: 0.12,
  transparent: true,
  opacity: 0.86,
  emissive: 0x1f7f8d,
  emissiveIntensity: 0.3,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const pondWater = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 52), waterMaterial);
pondWater.rotation.x = -Math.PI / 2;
pondWater.position.set(POND.x, POND_WATER_Y, POND.z);
pondWater.receiveShadow = true;
pond.add(pondWater);

const rippleMaterial = new THREE.MeshBasicMaterial({
  color: 0xd9fbff,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const ripples = [];
for (let index = 0; index < 2; index += 1) {
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 0.94, 40), rippleMaterial.clone());
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.set(POND.x - 0.2, POND_WATER_Y + 0.008, POND.z + 0.1);
  ripple.userData.phase = index * 0.5;
  pond.add(ripple);
  ripples.push(ripple);
}

const lilyMaterial = new THREE.MeshStandardMaterial({
  color: 0x5f964d,
  roughness: 0.85,
  side: THREE.DoubleSide,
});

const lilyPads = [
  { x: POND.x - 0.52, z: POND.z - 0.15, r: 0.24 },
  { x: POND.x + 0.35, z: POND.z + 0.48, r: 0.19 },
  { x: POND.x + 0.26, z: POND.z - 0.5, r: 0.15 },
];

lilyPads.forEach((pad, index) => {
  const lily = new THREE.Mesh(new THREE.CircleGeometry(pad.r, 14), lilyMaterial);
  lily.rotation.x = -Math.PI / 2;
  lily.rotation.z = index * 1.2;
  lily.position.set(pad.x, POND_WATER_Y + 0.014, pad.z);
  pond.add(lily);
});

const pondStones = [];
for (let index = 0; index < 15; index += 1) {
  const angle = (index / 15) * Math.PI * 2 + 0.15;
  const radius = 1.58 + (index % 3) * 0.09;
  const x = POND.x + Math.cos(angle) * radius;
  const z = POND.z + Math.sin(angle) * radius;
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), stoneMaterial);
  const scale = 0.1 + ((index * 37) % 10) / 70;
  stone.scale.set(scale, scale * 0.7, scale);
  stone.position.set(x, islandGround(x, z) + scale * 0.22, z);
  stone.rotation.set(index * 0.4, index * 0.9, index * 0.25);
  stone.castShadow = true;
  stone.receiveShadow = true;
  island.add(stone);
  pondStones.push(stone);
}

/* --------------------------- extra island detail ------------------------- */

const boulderSpecs = [
  { x: 0.9, z: 1.9, s: 0.42 },
  { x: -3.4, z: -0.9, s: 0.3 },
  { x: 4.2, z: -4.1, s: 0.5 },
  { x: -4.8, z: 3.3, s: 0.34 },
  { x: 2.9, z: 2.2, s: 0.27 },
];

boulderSpecs.forEach((spec, index) => {
  const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), stoneMaterial);
  boulder.scale.set(spec.s, spec.s * 0.72, spec.s * 0.92);
  boulder.position.set(spec.x, islandGround(spec.x, spec.z) + spec.s * 0.26, spec.z);
  boulder.rotation.set(index * 0.7, index * 1.1, index * 0.4);
  boulder.castShadow = true;
  boulder.receiveShadow = true;
  island.add(boulder);
});

const pathStoneGeometry = new THREE.DodecahedronGeometry(1, 0);

for (let index = 0; index < 7; index += 1) {
  const point = pathCurve.getPointAt(0.16 + index * 0.105);
  const size = 0.14 + (index % 3) * 0.025;
  const stone = new THREE.Mesh(pathStoneGeometry, stoneMaterial);
  stone.scale.set(size * 1.35, 0.04, size);
  stone.position.set(point.x, islandGround(point.x, point.z) + 0.042, point.z);
  stone.rotation.y = index * 0.94;
  stone.receiveShadow = true;
  island.add(stone);
}

const bushMaterial = new THREE.MeshStandardMaterial({
  color: 0x5d8e44,
  flatShading: true,
  roughness: 1,
});

const bushSpecs = [
  { x: -1.1, z: 3.4, s: 0.52 },
  { x: 3.9, z: -3.7, s: 0.44 },
  { x: -4.4, z: -0.1, s: 0.36 },
  { x: 2.2, z: 2.2, s: 0.4 },
];

bushSpecs.forEach((spec, index) => {
  const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), bushMaterial);
  bush.scale.set(spec.s, spec.s * 0.7, spec.s);
  bush.position.set(spec.x, islandGround(spec.x, spec.z) + spec.s * 0.36, spec.z);
  bush.rotation.y = index * 1.3;
  bush.castShadow = true;
  bush.receiveShadow = true;
  island.add(bush);
});

function randomIslandPoint(random, minRadius = 1.9, maxRadius = 6.6) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(
      minRadius * minRadius + (maxRadius * maxRadius - minRadius * minRadius) * random(),
    );
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.55) continue;
    if (distanceToPath(x, z) < 0.58) continue;

    return { x, z, y: islandGround(x, z), angle, radius };
  }

  return { x: 0, z: 0, y: islandGround(0, 0), angle: 0, radius: 0 };
}

const tuftGeometry = new THREE.ConeGeometry(0.055, 0.32, 3);
tuftGeometry.translate(0, 0.16, 0);

const tuftMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.95,
  flatShading: true,
});

const tuftRandom = mulberry32(311);
const tuftCount = 230;
const tufts = new THREE.InstancedMesh(tuftGeometry, tuftMaterial, tuftCount);
const tuftDummy = new THREE.Object3D();
const tuftPalette = [new THREE.Color('#6e9747'), new THREE.Color('#82a853'), new THREE.Color('#5e8a3f')];

for (let index = 0; index < tuftCount; index += 1) {
  const point = randomIslandPoint(tuftRandom, 1.9, 6.65);
  tuftDummy.position.set(point.x, point.y + 0.01, point.z);
  tuftDummy.rotation.set(
    (tuftRandom() - 0.5) * 0.28,
    tuftRandom() * Math.PI * 2,
    (tuftRandom() - 0.5) * 0.28,
  );
  const scale = 0.7 + tuftRandom() * 0.95;
  tuftDummy.scale.set(scale, scale, scale);
  tuftDummy.updateMatrix();
  tufts.setMatrixAt(index, tuftDummy.matrix);
  tufts.setColorAt(index, tuftPalette[index % tuftPalette.length]);
}
tufts.instanceMatrix.needsUpdate = true;
if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true;
tufts.receiveShadow = true;
island.add(tufts);

const flowerGeometry = new THREE.OctahedronGeometry(0.075, 0);
const flowerMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.8,
  flatShading: true,
});
const flowerRandom = mulberry32(733);
const flowerCount = 54;
const flowers = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, flowerCount);
const flowerDummy = new THREE.Object3D();
const flowerPalette = [
  new THREE.Color('#fff1d0'),
  new THREE.Color('#ffc0cb'),
  new THREE.Color('#ffe28c'),
  new THREE.Color('#f6b8e4'),
];

for (let index = 0; index < flowerCount; index += 1) {
  const point = randomIslandPoint(flowerRandom, 2.1, 6.5);
  flowerDummy.position.set(point.x, point.y + 0.16, point.z);
  flowerDummy.rotation.set(0, flowerRandom() * Math.PI, 0);
  const scale = 0.8 + flowerRandom() * 0.65;
  flowerDummy.scale.setScalar(scale);
  flowerDummy.updateMatrix();
  flowers.setMatrixAt(index, flowerDummy.matrix);
  flowers.setColorAt(index, flowerPalette[index % flowerPalette.length]);
}
flowers.instanceMatrix.needsUpdate = true;
if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
flowers.receiveShadow = true;
island.add(flowers);

/* -------------------------------- crystals ------------------------------ */

const crystalSpecs = [
  { x: 0, z: 0, sx: 1, sy: 2.8, sz: 1, rz: 0.06, color: 0 },
  { x: 0.52, z: 0.3, sx: 0.72, sy: 1.9, sz: 0.72, rz: -0.32, color: 0 },
  { x: -0.48, z: 0.36, sx: 0.62, sy: 1.6, sz: 0.62, rz: 0.36, color: 1 },
  { x: 0.16, z: -0.55, sx: 0.8, sy: 2.2, sz: 0.8, rz: 0.18, color: 1 },
  { x: -0.5, z: -0.35, sx: 0.5, sy: 1.2, sz: 0.5, rz: -0.45, color: 0 },
];

const crystalMaterialA = new THREE.MeshStandardMaterial({
  color: 0x7de7fa,
  emissive: 0x27aecb,
  emissiveIntensity: 0.7,
  roughness: 0.15,
  metalness: 0.12,
  transparent: true,
  opacity: 0.92,
  flatShading: true,
});

const crystalMaterialB = new THREE.MeshStandardMaterial({
  color: 0xbcaeff,
  emissive: 0x6f5ee6,
  emissiveIntensity: 0.6,
  roughness: 0.16,
  metalness: 0.1,
  transparent: true,
  opacity: 0.92,
  flatShading: true,
});

const crystalGroup = new THREE.Group();
const crystalBaseX = 4.35;
const crystalBaseZ = 3.35;
crystalGroup.position.set(crystalBaseX, islandGround(crystalBaseX, crystalBaseZ) + 0.1, crystalBaseZ);
island.add(crystalGroup);

const crystalGeometry = new THREE.OctahedronGeometry(0.32, 0);
const crystals = [];

crystalSpecs.forEach((spec, index) => {
  const crystal = new THREE.Mesh(
    crystalGeometry,
    spec.color === 0 ? crystalMaterialA : crystalMaterialB,
  );
  crystal.scale.set(spec.sx, spec.sy, spec.sz);
  crystal.rotation.set(spec.rz * 0.4, index * 0.9, spec.rz);
  crystal.position.set(spec.x, 0.32 * spec.sy, spec.z);
  crystal.castShadow = true;
  crystal.userData.baseRotationY = crystal.rotation.y;
  crystal.userData.spin = 0.04 + index * 0.012;
  crystalGroup.add(crystal);
  crystals.push(crystal);
});

const crystalGlowMaterial = new THREE.SpriteMaterial({
  map: glowTexture,
  color: 0x72e6ff,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  toneMapped: false,
});
const crystalGlow = new THREE.Sprite(crystalGlowMaterial);
crystalGlow.position.y = 0.7;
crystalGlow.scale.set(2.6, 2.6, 1);
crystalGroup.add(crystalGlow);

const crystalGlowCoreMaterial = crystalGlowMaterial.clone();
crystalGlowCoreMaterial.opacity = 0.5;
const crystalGlowCore = new THREE.Sprite(crystalGlowCoreMaterial);
crystalGlowCore.position.y = 0.7;
crystalGlowCore.scale.set(0.8, 0.8, 1);
crystalGroup.add(crystalGlowCore);

const crystalLight = new THREE.PointLight(0x67ddff, 9, 7.5, 2);
crystalLight.position.y = 1;
crystalGroup.add(crystalLight);

/* ---------------------------- floating islands --------------------------- */

const floatersGroup = new THREE.Group();
world.add(floatersGroup);

const floaterSpecs = [
  { x: -15.2, y: 4.6, z: 6.2, scale: 0.4, seed: 31, prop: 'pine', phase: 0.2 },
  { x: 13.4, y: 2.4, z: -6.4, scale: 0.33, seed: 67, prop: 'round', phase: 1.7 },
  { x: -10.6, y: -4.1, z: -9.3, scale: 0.28, seed: 91, prop: 'round', phase: 3.1 },
];

const floatingIslands = [];

floaterSpecs.forEach((spec) => {
  const group = new THREE.Group();
  const random = mulberry32(spec.seed);

  const rock = new THREE.Mesh(createRockGeometry(spec.seed, 26, 11), rockMaterial);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  const grass = new THREE.Mesh(createGrassGeometry(spec.seed + 3, false, 52, 8), grassMaterial);
  grass.receiveShadow = true;
  group.add(grass);

  if (spec.prop) {
    const tree = createTree(spec.prop, random);
    tree.scale.setScalar(0.95);
    tree.position.set(0.9, groundBase(0.9, -0.4) - 0.02, -0.4);
    group.add(tree);
  }

  const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), stoneMaterial);
  pebble.position.set(-1.6, groundBase(-1.6, 0.8) + 0.24, 0.8);
  pebble.rotation.set(0.4, 1.1, 0.2);
  pebble.castShadow = true;
  group.add(pebble);

  group.scale.setScalar(spec.scale);
  group.position.set(spec.x, spec.y, spec.z);
  group.userData.baseY = spec.y;
  group.userData.phase = spec.phase;
  group.userData.spin = (spec.seed % 2 === 0 ? 1 : -1) * 0.015;
  floatersGroup.add(group);
  floatingIslands.push(group);
});

/* -------------------------------- clouds -------------------------------- */

const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0xfff8ec,
  emissive: 0xffedd8,
  emissiveIntensity: 0.42,
  roughness: 1,
  metalness: 0,
  flatShading: true,
});

function createCloudMesh(size, random) {
  const geometries = [];
  const puffCount = 6 + Math.floor(random() * 3);

  for (let index = 0; index < puffCount; index += 1) {
    const puff = new THREE.SphereGeometry(1, 8, 6);
    const puffRadius = (0.55 + random() * 0.55) * size;
    const scaleX = puffRadius * (0.92 + random() * 0.3);
    const scaleY = puffRadius * (0.55 + random() * 0.3);
    const scaleZ = puffRadius * (0.8 + random() * 0.35);
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(
        (random() * 2 - 1) * 1.55 * size,
        (random() * 0.55 - 0.05) * size,
        (random() * 2 - 1) * 0.8 * size,
      ),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(random() * 0.4, random() * Math.PI, random() * 0.4),
      ),
      new THREE.Vector3(scaleX, scaleY, scaleZ),
    );
    puff.applyMatrix4(matrix);
    geometries.push(puff);
  }

  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  merged.computeBoundingSphere();

  const cloud = new THREE.Mesh(merged, cloudMaterial);
  cloud.matrixAutoUpdate = true;
  return cloud;
}

const cloudsGroup = new THREE.Group();
scene.add(cloudsGroup);

const cloudSpecs = [
  { x: 28, y: 6.5, z: -8, size: 4.2, seed: 201 },
  { x: -27, y: 4.5, z: 17, size: 4.6, seed: 211 },
  { x: 17, y: -8.5, z: 25, size: 4.8, seed: 223 },
  { x: -32, y: -2.5, z: -9, size: 5.4, seed: 227 },
  { x: 7, y: 13, z: -31, size: 4.1, seed: 233 },
  { x: 36, y: -5.5, z: 16, size: 4.8, seed: 239 },
  { x: -16, y: 11, z: -28, size: 3.4, seed: 241 },
  { x: 24, y: -14, z: -19, size: 5.2, seed: 251 },
  { x: -41, y: 5, z: 13, size: 5.4, seed: 257 },
  { x: 14, y: -17, z: 9, size: 5.6, seed: 263 },
  { x: -9, y: -19, z: 31, size: 5.8, seed: 269 },
  { x: 33, y: 15, z: 33, size: 5.0, seed: 271 },
  { x: -6, y: -12, z: -22, size: 4.4, seed: 277 },
];

const clouds = [];

cloudSpecs.forEach((spec) => {
  const random = mulberry32(spec.seed);
  const cloud = createCloudMesh(spec.size, random);
  cloud.position.set(spec.x, spec.y, spec.z);
  cloud.rotation.y = random() * Math.PI * 2;
  cloudsGroup.add(cloud);
  clouds.push({
    mesh: cloud,
    baseY: spec.y,
    phase: random() * Math.PI * 2,
    spin: (random() - 0.5) * 0.02,
  });
});

/* --------------------------------- birds -------------------------------- */

const birdMaterial = new THREE.MeshBasicMaterial({
  color: 0x36444f,
  side: THREE.DoubleSide,
});

const wingGeometry = new THREE.BufferGeometry();
wingGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(
    [0, 0, 0, -1.15, 0.18, 0.16, -0.12, 0, 0.42],
    3,
  ),
);
wingGeometry.computeVertexNormals();

const birdBodyGeometry = new THREE.ConeGeometry(0.06, 0.46, 5);
birdBodyGeometry.rotateX(Math.PI / 2);

function createBird() {
  const bird = new THREE.Group();

  const body = new THREE.Mesh(birdBodyGeometry, birdMaterial);
  bird.add(body);

  const leftWing = new THREE.Mesh(wingGeometry, birdMaterial);
  const rightWing = new THREE.Mesh(wingGeometry, birdMaterial);
  rightWing.scale.x = -1;
  bird.add(leftWing, rightWing);
  bird.userData.leftWing = leftWing;
  bird.userData.rightWing = rightWing;

  return bird;
}

const birdsGroup = new THREE.Group();
scene.add(birdsGroup);

const birdSpecs = [
  { radius: 17.5, height: 8.2, speed: 0.052, phase: 0.2 },
  { radius: 18.6, height: 9.0, speed: 0.047, phase: 1.1 },
  { radius: 16.4, height: 7.4, speed: 0.058, phase: 2.4 },
  { radius: 20.2, height: 9.8, speed: 0.043, phase: 3.9 },
  { radius: 19.2, height: 8.6, speed: 0.049, phase: 5.1 },
];

const birds = birdSpecs.map((spec) => {
  const bird = createBird();
  bird.scale.setScalar(0.45);
  bird.userData.spec = spec;
  bird.userData.flapPhase = spec.phase * 3.1;
  birdsGroup.add(bird);
  return bird;
});

/* --------------------------------- motes -------------------------------- */

const moteCount = 120;
const motePositions = new Float32Array(moteCount * 3);
const moteData = [];
const moteRandom = mulberry32(941);

for (let index = 0; index < moteCount; index += 1) {
  const radius = 5 + moteRandom() * 16;
  const angle = moteRandom() * Math.PI * 2;
  const y = -9 + moteRandom() * 17;

  moteData.push({
    radius,
    angle,
    y,
    speed: 0.015 + moteRandom() * 0.04,
    phase: moteRandom() * Math.PI * 2,
    bob: 0.3 + moteRandom() * 0.8,
  });

  motePositions[index * 3] = Math.cos(angle) * radius;
  motePositions[index * 3 + 1] = y;
  motePositions[index * 3 + 2] = Math.sin(angle) * radius;
}

const moteGeometry = new THREE.BufferGeometry();
moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));

const moteMaterial = new THREE.PointsMaterial({
  map: glowTexture,
  color: 0xffe6b2,
  size: 0.26,
  transparent: true,
  opacity: 0.42,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});

const motes = new THREE.Points(moteGeometry, moteMaterial);
scene.add(motes);

/* ------------------------------- animation ------------------------------ */

let lastTimestamp = 0;
const elapsed = { value: 0 };
const motePositionAttribute = moteGeometry.attributes.position;

function animate(timestamp = 0) {
  requestAnimationFrame(animate);

  const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
  lastTimestamp = timestamp;
  elapsed.value += delta;
  const time = elapsed.value;

  island.position.y = Math.sin(time * 0.38) * 0.22;
  island.rotation.z = Math.sin(time * 0.21) * 0.004;

  swayingTrees.forEach((tree, index) => {
    const phase = tree.userData.swayPhase;
    tree.rotation.z =
      tree.userData.baseRotationZ + Math.sin(time * 0.7 + phase) * 0.011;
    tree.rotation.x = Math.cos(time * 0.53 + phase + index) * 0.008;
  });

  crystals.forEach((crystal) => {
    crystal.rotation.y = crystal.userData.baseRotationY + time * crystal.userData.spin;
  });

  const glowPulse = 0.58 + Math.sin(time * 1.4) * 0.12;
  crystalMaterialA.emissiveIntensity = glowPulse;
  crystalMaterialB.emissiveIntensity = glowPulse * 0.86;
  crystalGlowMaterial.opacity = 0.27 + Math.sin(time * 1.4) * 0.06;
  crystalGlowCoreMaterial.opacity = 0.43 + Math.sin(time * 1.4 + 0.8) * 0.09;
  crystalLight.intensity = 8 + Math.sin(time * 1.4) * 2;

  ripples.forEach((ripple) => {
    const progress = (time * 0.14 + ripple.userData.phase) % 1;
    const scale = 0.55 + progress * 1.55;
    ripple.scale.setScalar(scale);
    ripple.material.opacity = (1 - progress) * 0.33;
  });

  floatersGroup.rotation.y = time * 0.009;
  floatingIslands.forEach((floater) => {
    floater.position.y =
      floater.userData.baseY + Math.sin(time * 0.55 + floater.userData.phase) * 0.36;
    floater.rotation.y += floater.userData.spin * delta;
  });

  cloudsGroup.rotation.y = time * 0.0022;
  clouds.forEach((cloud) => {
    cloud.mesh.position.y = cloud.baseY + Math.sin(time * 0.22 + cloud.phase) * 0.45;
    cloud.mesh.rotation.y += cloud.spin * delta;
  });

  birds.forEach((bird) => {
    const spec = bird.userData.spec;
    const angle = spec.phase + time * spec.speed;
    bird.position.set(
      Math.cos(angle) * spec.radius,
      spec.height + Math.sin(time * 0.45 + spec.phase) * 0.8,
      Math.sin(angle) * spec.radius,
    );
    bird.rotation.y = -angle;
    bird.rotation.z = Math.sin(time * 0.7 + spec.phase) * 0.08;

    const flap = Math.sin(time * 5.6 + bird.userData.flapPhase) * 0.55;
    bird.userData.leftWing.rotation.z = flap;
    bird.userData.rightWing.rotation.z = -flap;
  });

  motes.rotation.y = time * 0.012;
  for (let index = 0; index < moteCount; index += 1) {
    const mote = moteData[index];
    const angle = mote.angle + time * mote.speed;
    motePositionAttribute.setXYZ(
      index,
      Math.cos(angle) * mote.radius,
      mote.y + Math.sin(time * 0.32 + mote.phase) * mote.bob,
      Math.sin(angle) * mote.radius,
    );
  }
  motePositionAttribute.needsUpdate = true;

  if (cameraTween) {
    cameraTween.time = Math.min(1, cameraTween.time + delta / 1.15);
    const eased = 1 - Math.pow(1 - cameraTween.time, 3);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);

    if (cameraTween.time >= 1) cameraTween = null;
  }

  controls.update();
  renderer.render(scene, camera);
}

function updateViewport() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.fov = camera.aspect < 0.62 ? 58 : camera.aspect < 0.9 ? 50 : 42;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', updateViewport);
updateViewport();

renderer.compile(scene, camera);
requestAnimationFrame(animate);

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.body.classList.add('ready');
  });
});
