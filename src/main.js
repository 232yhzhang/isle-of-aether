import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './style.css';
import { CITY_TOP, createIslandBase, createSatellitePlatform } from './island.js';
import { createCity } from './city.js';
import { createMaglevLine } from './train.js';
import { glowTexture, mulberry32, smooth01 } from './utils.js';

const canvas = document.querySelector('#scene');
const rotateToggle = document.querySelector('#rotate-toggle');
const resetButton = document.querySelector('#reset-view');
const hint = document.querySelector('#hint');
const speedValue = document.querySelector('#speed-value');
const loopProgress = document.querySelector('#loop-progress');
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
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x08101e, 0.0075);

const camera = new THREE.PerspectiveCamera(
  44,
  window.innerWidth / window.innerHeight,
  0.1,
  900,
);

const HOME_TARGET = new THREE.Vector3(0, 2.0, 0);
const HOME_VIEW = new THREE.Vector3(19.5, 10.5, 27.5);

function homePull(aspect) {
  if (aspect < 0.62) return 1.32;
  if (aspect < 0.9) return 1.14;
  return 1;
}

function getHomePosition(aspect = camera.aspect) {
  return HOME_VIEW.clone().sub(HOME_TARGET).multiplyScalar(homePull(aspect)).add(HOME_TARGET);
}

const initialAspect = window.innerWidth / window.innerHeight;
camera.fov = initialAspect < 0.62 ? 56 : initialAspect < 0.9 ? 48 : 44;
camera.updateProjectionMatrix();
camera.position.copy(getHomePosition(initialAspect));

const controls = new OrbitControls(camera, canvas);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 60;
controls.minPolarAngle = Math.PI * 0.17;
controls.maxPolarAngle = Math.PI * 0.72;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.8;
controls.autoRotateSpeed = 0.42;
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

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.34,
  0.5,
  0.85,
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/* --------------------------------- sky ---------------------------------- */

const skyRadius = 300;
const skyGeometry = new THREE.SphereGeometry(skyRadius, 64, 40);
const skyPositions = skyGeometry.attributes.position;
const skyColors = [];
const skyTop = new THREE.Color('#01030a');
const skyMid = new THREE.Color('#07142d');
const skyHorizon = new THREE.Color('#2b173c');
const skyBelow = new THREE.Color('#02050c');

for (let index = 0; index < skyPositions.count; index += 1) {
  const y = skyPositions.getY(index) / skyRadius;
  let color;

  if (y >= 0) {
    color = skyHorizon.clone().lerp(skyMid, smooth01(y / 0.33));
    color.lerp(skyTop, smooth01((y - 0.25) / 0.7));
  } else {
    color = skyHorizon.clone().lerp(skyBelow, smooth01(-y / 0.3));
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
  }),
);
sky.frustumCulled = false;
scene.add(sky);

const glowMaterial = (color, opacity) =>
  new THREE.SpriteMaterial({
    map: glowTexture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });

const skyGlowMagenta = new THREE.Sprite(glowMaterial(0xc343a4, 0.15));
skyGlowMagenta.position.set(-195, 18, -180);
skyGlowMagenta.scale.set(210, 95, 1);
scene.add(skyGlowMagenta);

const skyGlowCyan = new THREE.Sprite(glowMaterial(0x2f7bd8, 0.1));
skyGlowCyan.position.set(160, 8, -220);
skyGlowCyan.scale.set(170, 80, 1);
scene.add(skyGlowCyan);

const starRandom = mulberry32(551);

function createStars(count, radius, size, color, opacity) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const theta = starRandom() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.lerp(-0.12, 1, starRandom()));
    const r = radius * (0.88 + starRandom() * 0.12);
    positions[index * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = r * Math.cos(phi);
    positions[index * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: glowTexture,
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    fog: false,
  });

  return new THREE.Points(geometry, material);
}

const starField = new THREE.Group();
starField.add(createStars(620, 255, 0.8, 0xb5dcff, 0.85));
starField.add(createStars(280, 245, 1.5, 0x9fdfff, 0.7));
scene.add(starField);

function createPlanet() {
  const planetCanvas = document.createElement('canvas');
  planetCanvas.width = 512;
  planetCanvas.height = 512;
  const context = planetCanvas.getContext('2d');
  const random = mulberry32(711);

  context.fillStyle = '#6d8db6';
  context.fillRect(0, 0, 512, 512);

  const bands = [
    ['#9ec2df', 0.0],
    ['#7397c4', 0.14],
    ['#b7d5ea', 0.27],
    ['#6386b7', 0.39],
    ['#9cbbd9', 0.52],
    ['#6e92bd', 0.64],
    ['#aac9e3', 0.76],
    ['#5d7da8', 0.88],
  ];

  bands.forEach(([color, start], index) => {
    context.fillStyle = color;
    context.globalAlpha = 0.48 + (index % 3) * 0.1;
    context.fillRect(0, start * 512, 512, 56 + (index % 2) * 22);
  });

  context.globalAlpha = 0.24;
  for (let index = 0; index < 45; index += 1) {
    context.fillStyle = index % 2 === 0 ? '#e2f4ff' : '#35547b';
    const x = random() * 512;
    const y = random() * 512;
    const w = 16 + random() * 90;
    context.beginPath();
    context.ellipse(x, y, w, 4 + random() * 10, random() * 0.4, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 0.32;
  const shade = context.createRadialGradient(370, 200, 20, 256, 256, 300);
  shade.addColorStop(0, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,6,18,0.95)');
  context.fillStyle = shade;
  context.fillRect(0, 0, 512, 512);
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(planetCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const group = new THREE.Group();
  group.position.set(-192, 34, -187);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(19, 40, 30),
    new THREE.MeshBasicMaterial({ map: texture, color: 0x8ea5c0, fog: false }),
  );
  planet.rotation.z = -0.22;
  group.add(planet);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(25, 34, 96),
    new THREE.MeshBasicMaterial({
      color: 0x88afd9,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    }),
  );
  ring.rotation.set(Math.PI * 0.42, 0.3, 0.15);
  group.add(ring);

  const halo = new THREE.Sprite(glowMaterial(0x77a8e8, 0.12));
  halo.scale.set(84, 84, 1);
  group.add(halo);

  return group;
}

scene.add(createPlanet());

/* -------------------------------- lights -------------------------------- */

const hemisphereLight = new THREE.HemisphereLight(0x476aa8, 0x05070d, 0.5);
scene.add(hemisphereLight);

const moonLight = new THREE.DirectionalLight(0xa9ccff, 1.5);
moonLight.position.set(-30, 42, -24);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
moonLight.shadow.camera.left = -17;
moonLight.shadow.camera.right = 17;
moonLight.shadow.camera.top = 17;
moonLight.shadow.camera.bottom = -17;
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 120;
moonLight.shadow.bias = -0.00045;
moonLight.shadow.normalBias = 0.035;
scene.add(moonLight);
scene.add(moonLight.target);

const fillLight = new THREE.DirectionalLight(0x4e73b5, 0.55);
fillLight.position.set(22, 11, 20);
scene.add(fillLight);

const magentaRim = new THREE.DirectionalLight(0xff5fb9, 0.35);
magentaRim.position.set(-18, 7, 24);
scene.add(magentaRim);

const cityFill = new THREE.PointLight(0x7c9cff, 14, 22, 2);
cityFill.position.set(0, 5.5, 4);
scene.add(cityFill);

const undersideFill = new THREE.DirectionalLight(0x3d7ca3, 0.8);
undersideFill.position.set(4, -24, 18);
scene.add(undersideFill);

/* ------------------------------ world build ----------------------------- */

const world = new THREE.Group();
scene.add(world);

const islandGroup = new THREE.Group();
world.add(islandGroup);

const islandBase = createIslandBase();
islandGroup.add(islandBase.group);

const city = createCity();
islandGroup.add(city.group);

const maglev = createMaglevLine();
islandGroup.add(maglev.group);

const floatersGroup = new THREE.Group();
world.add(floatersGroup);

const satelliteSpecs = [
  { x: -14.2, y: 4.2, z: 5.6, scale: 0.36, seed: 31, phase: 0.2 },
  { x: 13.1, y: 1.8, z: -6.7, scale: 0.3, seed: 67, phase: 1.7 },
  { x: -10.4, y: -4.6, z: -8.7, scale: 0.25, seed: 91, phase: 3.1 },
];

const floatingPlatforms = [];

satelliteSpecs.forEach((spec) => {
  const platform = createSatellitePlatform(spec.seed);
  platform.scale.setScalar(spec.scale);
  platform.position.set(spec.x, spec.y, spec.z);
  platform.rotation.y = spec.phase;
  platform.userData.baseY = spec.y;
  platform.userData.phase = spec.phase;
  platform.userData.spin = 0.025 + (spec.seed % 5) * 0.006;
  floatersGroup.add(platform);
  floatingPlatforms.push(platform);
});

/* -------------------------------- clouds -------------------------------- */

const cloudMaterial = new THREE.MeshStandardMaterial({
  color: 0x314a67,
  emissive: 0x1b3152,
  emissiveIntensity: 0.9,
  roughness: 1,
  metalness: 0,
  flatShading: false,
});

function createCloudMesh(size, random) {
  const geometries = [];
  const puffCount = 9 + Math.floor(random() * 4);

  for (let index = 0; index < puffCount; index += 1) {
    const puff = new THREE.SphereGeometry(1, 10, 7);
    const puffRadius = (0.6 + random() * 0.55) * size;
    const scaleX = puffRadius * (0.92 + random() * 0.3);
    const scaleY = puffRadius * (0.45 + random() * 0.26);
    const scaleZ = puffRadius * (0.8 + random() * 0.35);
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(
        (random() * 2 - 1) * 1.7 * size,
        (random() * 0.42 - 0.08) * size,
        (random() * 2 - 1) * 0.9 * size,
      ),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(random() * 0.3, random() * Math.PI, random() * 0.3),
      ),
      new THREE.Vector3(scaleX, scaleY, scaleZ),
    );
    puff.applyMatrix4(matrix);
    geometries.push(puff);
  }

  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  merged.computeVertexNormals();
  merged.computeBoundingSphere();

  return new THREE.Mesh(merged, cloudMaterial);
}

const cloudsGroup = new THREE.Group();
scene.add(cloudsGroup);

const cloudSpecs = [
  { x: -28, y: -21, z: 19, size: 4.6, seed: 201 },
  { x: 27, y: -25, z: 10, size: 4.9, seed: 211 },
  { x: 17, y: -28, z: 26, size: 4.9, seed: 223 },
  { x: -35, y: -18, z: -7, size: 4.5, seed: 227 },
  { x: 10, y: -30, z: -29, size: 5.4, seed: 233 },
  { x: 37, y: -19, z: 17, size: 4.3, seed: 239 },
  { x: -22, y: -15, z: -38, size: 3.2, seed: 241 },
  { x: 26, y: -27, z: -18, size: 4.8, seed: 251 },
  { x: -43, y: -12, z: 13, size: 5.0, seed: 257 },
  { x: 13, y: -31, z: 7, size: 5.6, seed: 263 },
  { x: -9, y: -29, z: 34, size: 4.7, seed: 269 },
  { x: 35, y: -17, z: 32, size: 3.2, seed: 271 },
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
    spin: (random() - 0.5) * 0.014,
  });
});

/* ------------------------------- speeders ------------------------------- */

const speederBodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x151e2b,
  metalness: 0.9,
  roughness: 0.22,
});

const speederWindowMaterial = new THREE.MeshStandardMaterial({
  color: 0x072028,
  emissive: 0x6af2ff,
  emissiveIntensity: 2.6,
  roughness: 0.15,
  metalness: 0.2,
});

const speederMagentaMaterial = new THREE.MeshStandardMaterial({
  color: 0x21081b,
  emissive: 0xff60cf,
  emissiveIntensity: 2.7,
  roughness: 0.2,
  metalness: 0.2,
});

const speederBodyGeometry = new THREE.CapsuleGeometry(0.07, 0.42, 3, 8);
speederBodyGeometry.rotateX(Math.PI / 2);
const speederWingGeometry = new THREE.BoxGeometry(0.46, 0.015, 0.16);

function createSpeeder(accent) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(speederBodyGeometry, speederBodyMaterial);
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.045, 0.18),
    speederWindowMaterial,
  );
  cabin.position.set(0, 0.06, 0.02);
  group.add(cabin);

  const leftWing = new THREE.Mesh(speederWingGeometry, speederBodyMaterial);
  leftWing.position.set(-0.18, -0.01, -0.03);
  leftWing.rotation.z = -0.14;
  group.add(leftWing);

  const rightWing = leftWing.clone();
  rightWing.position.x = 0.18;
  rightWing.rotation.z = 0.14;
  group.add(rightWing);

  const wingLightLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, 0.1),
    accent === 'magenta' ? speederMagentaMaterial : speederWindowMaterial,
  );
  wingLightLeft.position.set(-0.39, -0.005, -0.03);
  group.add(wingLightLeft);

  const wingLightRight = wingLightLeft.clone();
  wingLightRight.position.x = 0.39;
  group.add(wingLightRight);

  const engine = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: accent === 'magenta' ? 0xff67d9 : 0x71f4ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  engine.position.z = -0.36;
  engine.scale.set(0.55, 0.55, 1);
  group.add(engine);

  return group;
}

const speederSpecs = [
  { radiusX: 10.5, radiusZ: 9.2, height: 6.6, speed: 0.17, phase: 0.2, accent: 'cyan', scale: 1.1 },
  { radiusX: 12.8, radiusZ: 10.8, height: 8.4, speed: -0.13, phase: 2.4, accent: 'magenta', scale: 0.85 },
  { radiusX: 8.6, radiusZ: 7.2, height: 5.2, speed: 0.21, phase: 4.2, accent: 'cyan', scale: 0.75 },
  { radiusX: 14.6, radiusZ: 12.3, height: 7.3, speed: -0.09, phase: 1.1, accent: 'magenta', scale: 1.0 },
  { radiusX: 9.8, radiusZ: 12.6, height: 9.4, speed: 0.12, phase: 3.5, accent: 'cyan', scale: 0.65 },
  { radiusX: 16.2, radiusZ: 13.0, height: 4.6, speed: -0.11, phase: 5.3, accent: 'cyan', scale: 0.9 },
];

const speeders = speederSpecs.map((spec) => {
  const group = createSpeeder(spec.accent);
  group.scale.setScalar(spec.scale * 1.4);
  group.userData.spec = spec;
  scene.add(group);
  return group;
});

/* ------------------------------- particles ------------------------------ */

const particleRandom = mulberry32(941);
const undersideParticleCount = 130;
const undersidePositions = new Float32Array(undersideParticleCount * 3);
const undersideData = [];

for (let index = 0; index < undersideParticleCount; index += 1) {
  const angle = particleRandom() * Math.PI * 2;
  const radius = 1.8 + particleRandom() * 7.6;
  const y = -17 + particleRandom() * 19;
  undersideData.push({
    angle,
    radius,
    y,
    speed: 0.2 + particleRandom() * 0.55,
    phase: particleRandom() * Math.PI * 2,
  });
  undersidePositions[index * 3] = Math.cos(angle) * radius;
  undersidePositions[index * 3 + 1] = y;
  undersidePositions[index * 3 + 2] = Math.sin(angle) * radius;
}

const undersideGeometry = new THREE.BufferGeometry();
undersideGeometry.setAttribute('position', new THREE.BufferAttribute(undersidePositions, 3));
const undersideMaterial = new THREE.PointsMaterial({
  map: glowTexture,
  color: 0x6ff2ff,
  size: 0.32,
  transparent: true,
  opacity: 0.52,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
  fog: false,
});
const undersideParticles = new THREE.Points(undersideGeometry, undersideMaterial);
scene.add(undersideParticles);

const airParticleCount = 90;
const airPositions = new Float32Array(airParticleCount * 3);
const airData = [];

for (let index = 0; index < airParticleCount; index += 1) {
  const angle = particleRandom() * Math.PI * 2;
  const radius = 8 + particleRandom() * 15;
  const y = 0.5 + particleRandom() * 12;
  airData.push({ angle, radius, y, speed: 0.01 + particleRandom() * 0.025, phase: particleRandom() * 6.28 });
  airPositions[index * 3] = Math.cos(angle) * radius;
  airPositions[index * 3 + 1] = y;
  airPositions[index * 3 + 2] = Math.sin(angle) * radius;
}

const airGeometry = new THREE.BufferGeometry();
airGeometry.setAttribute('position', new THREE.BufferAttribute(airPositions, 3));
const airMaterial = new THREE.PointsMaterial({
  map: glowTexture,
  color: 0x9fd9ff,
  size: 0.26,
  transparent: true,
  opacity: 0.34,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
  fog: false,
});
const airParticles = new THREE.Points(airGeometry, airMaterial);
scene.add(airParticles);

/* ------------------------------- animation ------------------------------ */

let lastTimestamp = 0;
let elapsed = 0;
let hudTimer = 0;
const undersideAttribute = undersideGeometry.attributes.position;
const airAttribute = airGeometry.attributes.position;

function updateParticles(time) {
  for (let index = 0; index < undersideParticleCount; index += 1) {
    const particle = undersideData[index];
    const angle = particle.angle + time * 0.06;
    let y = particle.y + time * particle.speed;
    y = -17 + ((y + 17) % 19);
    undersideAttribute.setXYZ(
      index,
      Math.cos(angle) * particle.radius,
      y,
      Math.sin(angle) * particle.radius,
    );
  }
  undersideAttribute.needsUpdate = true;

  for (let index = 0; index < airParticleCount; index += 1) {
    const particle = airData[index];
    const angle = particle.angle + time * particle.speed;
    airAttribute.setXYZ(
      index,
      Math.cos(angle) * particle.radius,
      particle.y + Math.sin(time * 0.35 + particle.phase) * 0.6,
      Math.sin(angle) * particle.radius,
    );
  }
  airAttribute.needsUpdate = true;
}

function updateSpeeders(time) {
  speeders.forEach((speeder) => {
    const spec = speeder.userData.spec;
    const angle = spec.phase + time * spec.speed;
    const x = Math.cos(angle) * spec.radiusX;
    const z = Math.sin(angle) * spec.radiusZ;
    const y = spec.height + Math.sin(time * 0.6 + spec.phase) * 0.3;
    speeder.position.set(x, y, z);

    const ahead = angle + Math.sign(spec.speed) * 0.04;
    speeder.lookAt(
      Math.cos(ahead) * spec.radiusX,
      y + Math.sin(time * 0.6 + spec.phase + 0.1) * 0.05,
      Math.sin(ahead) * spec.radiusZ,
    );
  });
}

function updateHud(delta, time) {
  hudTimer += delta;
  if (hudTimer < 0.1) return;
  hudTimer = 0;

  speedValue.textContent = `${Math.round(maglev.state.speed).toString().padStart(3, '0')} KM/H`;
  loopProgress.style.transform = `scaleX(${maglev.state.progress.toFixed(4)})`;
}

function animate(timestamp = 0) {
  requestAnimationFrame(animate);

  const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
  lastTimestamp = timestamp;
  elapsed += delta;
  const time = elapsed;

  islandGroup.position.y = Math.sin(time * 0.32) * 0.16;
  islandGroup.rotation.z = Math.sin(time * 0.18) * 0.0022;

  islandBase.update(time);
  city.update(time, delta);
  maglev.update(time, delta);

  floatersGroup.rotation.y = time * 0.007;
  floatingPlatforms.forEach((platform, index) => {
    platform.position.y =
      platform.userData.baseY + Math.sin(time * 0.44 + platform.userData.phase) * 0.32;
    platform.rotation.y += platform.userData.spin * delta;
    platform.rotation.z = Math.sin(time * 0.3 + index) * 0.015;
  });

  cloudsGroup.rotation.y = time * 0.0018;
  clouds.forEach((cloud) => {
    cloud.mesh.position.y = cloud.baseY + Math.sin(time * 0.18 + cloud.phase) * 0.38;
    cloud.mesh.rotation.y += cloud.spin * delta;
  });

  updateSpeeders(time);
  updateParticles(time);

  starField.rotation.y = time * 0.0015;
  updateHud(delta, time);

  if (cameraTween) {
    cameraTween.time = Math.min(1, cameraTween.time + delta / 1.15);
    const eased = 1 - Math.pow(1 - cameraTween.time, 3);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);

    if (cameraTween.time >= 1) cameraTween = null;
  }

  controls.update();
  composer.render();
}

function updateViewport() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(width, height);
  bloomPass.setSize(width, height);

  camera.aspect = width / height;
  camera.fov = camera.aspect < 0.62 ? 56 : camera.aspect < 0.9 ? 48 : 44;
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
