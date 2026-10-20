import * as THREE from 'three';
import { glowTexture, mulberry32 } from './utils.js';

export const CITY_TOP = 0.84;
export const DECK_RADIUS = 7.12;

const rockMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.96,
  metalness: 0.04,
});

const ivoryStoneMaterial = new THREE.MeshStandardMaterial({
  color: 0xded8cc,
  roughness: 0.72,
  metalness: 0.04,
});

const lightStoneMaterial = new THREE.MeshStandardMaterial({
  color: 0xcfc8bb,
  roughness: 0.8,
  metalness: 0.03,
});

const silverMaterial = new THREE.MeshStandardMaterial({
  color: 0xb9c0c1,
  roughness: 0.27,
  metalness: 0.82,
});

const bronzeMaterial = new THREE.MeshStandardMaterial({
  color: 0xa18158,
  roughness: 0.34,
  metalness: 0.78,
});

const darkMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0x30383b,
  roughness: 0.38,
  metalness: 0.72,
});

const warmLightMaterial = new THREE.MeshStandardMaterial({
  color: 0x3a3022,
  emissive: 0xffd9a1,
  emissiveIntensity: 0.75,
  roughness: 0.3,
  metalness: 0.2,
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x9db5bd,
  transparent: true,
  opacity: 0.3,
  roughness: 0.08,
  metalness: 0.2,
  envMapIntensity: 1.8,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function createDeckTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const random = mulberry32(491);
  const center = size / 2;
  const maxRadius = size * 0.497;

  const background = context.createRadialGradient(center, center, 40, center, center, size * 0.7);
  background.addColorStop(0, '#e3ded3');
  background.addColorStop(0.55, '#d7d1c6');
  background.addColorStop(1, '#bbb4a7');
  context.fillStyle = background;
  context.fillRect(0, 0, size, size);

  context.globalAlpha = 0.08;
  for (let index = 0; index < 5000; index += 1) {
    context.fillStyle = random() > 0.5 ? '#ffffff' : '#706a60';
    const x = random() * size;
    const y = random() * size;
    context.fillRect(x, y, 1 + random() * 2, 1 + random() * 2);
  }
  context.globalAlpha = 1;

  context.save();
  context.translate(center, center);

  context.strokeStyle = 'rgba(122, 117, 106, 0.26)';
  context.lineWidth = 1.5;
  for (let radius = 58; radius < maxRadius; radius += 58) {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
  }

  context.strokeStyle = 'rgba(122, 117, 106, 0.18)';
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    context.beginPath();
    context.moveTo(Math.cos(angle) * 52, Math.sin(angle) * 52);
    context.lineTo(Math.cos(angle) * maxRadius, Math.sin(angle) * maxRadius);
    context.stroke();
  }

  context.strokeStyle = 'rgba(82, 82, 78, 0.24)';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, 224, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = 'rgba(255, 251, 242, 0.38)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, 232, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = 'rgba(102, 96, 84, 0.16)';
  context.lineWidth = 1;
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2 + 0.11;
    const inner = 104 + random() * 32;
    const outer = 300 + random() * 150;
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }

  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createRockGeometry(seed = 7.3, segments = 48, rings = 20) {
  const radius = 7.7;
  const depth = 7.2;
  const topY = 0.05;
  const positions = [];
  const colors = [];
  const indices = [];
  const ringStarts = [];

  const topColor = new THREE.Color('#6f6a61');
  const deepColor = new THREE.Color('#2a2e30');
  const coldColor = new THREE.Color('#45545a');

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

      const color = topColor.clone().lerp(deepColor, Math.pow(t, 0.75));
      const strata = Math.sin(t * 21 + Math.sin(angle * 3 + seed) * 2) * 0.028;
      color.offsetHSL(0.01 * Math.sin(angle * 2 + t * 3), 0.02, strata);

      if (t > 0.2 && t < 0.68 && Math.sin(angle * 4.2 + seed * 2.3) > 0.52) {
        color.lerp(coldColor, (1 - Math.abs(t - 0.44) / 0.28) * 0.26);
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
  const tipColor = deepColor.clone().offsetHSL(0.01, 0.06, -0.02);
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

export function createIslandBase() {
  const group = new THREE.Group();

  const rock = new THREE.Mesh(createRockGeometry(7.3), rockMaterial);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  const deckTexture = createDeckTexture();
  const deckMaterial = new THREE.MeshStandardMaterial({
    map: deckTexture,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.04,
    envMapIntensity: 0.5,
  });

  const deck = new THREE.Mesh(new THREE.CircleGeometry(DECK_RADIUS, 128), deckMaterial);
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = CITY_TOP;
  deck.receiveShadow = true;
  group.add(deck);

  const fascia = new THREE.Mesh(
    new THREE.CylinderGeometry(7.34, 7.58, 1.0, 96, 1, true),
    ivoryStoneMaterial,
  );
  fascia.position.y = 0.36;
  fascia.castShadow = true;
  fascia.receiveShadow = true;
  group.add(fascia);

  const lowerFascia = new THREE.Mesh(
    new THREE.CylinderGeometry(7.56, 7.62, 0.24, 96, 1, true),
    darkMetalMaterial,
  );
  lowerFascia.position.y = -0.2;
  group.add(lowerFascia);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(7.21, 0.095, 8, 160), silverMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = CITY_TOP;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  const bronzePinline = new THREE.Mesh(
    new THREE.TorusGeometry(7.33, 0.022, 6, 160),
    bronzeMaterial,
  );
  bronzePinline.rotation.x = -Math.PI / 2;
  bronzePinline.position.y = 0.78;
  group.add(bronzePinline);

  const rimLights = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.045, 8, 6),
    warmLightMaterial,
    32,
  );
  const lightDummy = new THREE.Object3D();
  for (let index = 0; index < 32; index += 1) {
    const angle = (index / 32) * Math.PI * 2;
    lightDummy.position.set(Math.cos(angle) * 7.33, 0.24, Math.sin(angle) * 7.33);
    lightDummy.updateMatrix();
    rimLights.setMatrixAt(index, lightDummy.matrix);
  }
  rimLights.instanceMatrix.needsUpdate = true;
  group.add(rimLights);

  const fasciaRibs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.05, 0.72, 0.16),
    silverMaterial,
    36,
  );
  const ribDummy = new THREE.Object3D();
  for (let index = 0; index < 36; index += 1) {
    const angle = (index / 36) * Math.PI * 2;
    ribDummy.position.set(Math.cos(angle) * 7.43, -0.06, Math.sin(angle) * 7.43);
    ribDummy.rotation.set(0, Math.PI / 2 - angle, 0);
    ribDummy.updateMatrix();
    fasciaRibs.setMatrixAt(index, ribDummy.matrix);
  }
  fasciaRibs.instanceMatrix.needsUpdate = true;
  group.add(fasciaRibs);

  const underside = new THREE.Group();
  group.add(underside);

  const underRings = [];
  const ringSpecs = [
    { y: -2.4, radius: 6.05, material: silverMaterial, nodes: 6 },
    { y: -4.8, radius: 4.0, material: bronzeMaterial, nodes: 4 },
  ];

  ringSpecs.forEach((spec, index) => {
    const unit = new THREE.Group();
    unit.position.y = spec.y;

    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, 0.07, 8, 120),
      spec.material,
    );
    frame.rotation.x = -Math.PI / 2;
    unit.add(frame);

    const inset = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius + 0.01, 0.018, 6, 140),
      warmLightMaterial,
    );
    inset.rotation.x = -Math.PI / 2;
    inset.position.y = 0.03;
    unit.add(inset);

    const nodeGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.34);
    for (let nodeIndex = 0; nodeIndex < spec.nodes; nodeIndex += 1) {
      const angle = (nodeIndex / spec.nodes) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeometry, spec.material);
      node.position.set(
        Math.cos(angle) * (spec.radius + 0.08),
        0.02,
        Math.sin(angle) * (spec.radius + 0.08),
      );
      node.rotation.y = -angle;
      unit.add(node);
    }

    underside.add(unit);
    underRings.push({ group: unit, phase: index * 1.8 });
  });

  const structureAngles = [0.25, 1.05, 1.85, 2.65, 3.45, 4.25, 5.05, 5.85];
  structureAngles.forEach((angle, index) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const points = [
      new THREE.Vector3(cos * 7.4, -0.25, sin * 7.4),
      new THREE.Vector3(cos * 6.05, -2.4, sin * 6.05),
      new THREE.Vector3(cos * 4.05, -4.8, sin * 4.05),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const strut = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, 0.035, 5, false),
      index % 2 === 0 ? silverMaterial : bronzeMaterial,
    );
    underside.add(strut);

    points.forEach((point) => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), silverMaterial);
      node.position.copy(point);
      underside.add(node);
    });
  });

  const engineHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 1.05, 0.6, 12),
    silverMaterial,
  );
  engineHousing.position.y = -6.95;
  underside.add(engineHousing);

  const engineRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.045, 6, 48),
    warmLightMaterial,
  );
  engineRing.rotation.x = Math.PI / 2;
  engineRing.position.y = -7.17;
  underside.add(engineRing);

  const engineGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xd9f1ff,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  engineGlow.position.y = -7.55;
  engineGlow.scale.set(3.2, 3.2, 1);
  underside.add(engineGlow);

  const underLight = new THREE.PointLight(0xcfe6f2, 11, 22, 2);
  underLight.position.y = -6.6;
  group.add(underLight);

  function update(time) {
    underRings.forEach((ring, index) => {
      ring.group.rotation.y = time * (0.018 + index * 0.008);
    });
    engineGlow.material.opacity = 0.28 + Math.sin(time * 0.7) * 0.05;
    underLight.intensity = 10 + Math.sin(time * 0.7) * 2;
  }

  return { group, rock, deck, update, underside };
}

export function createSatellitePlatform(seed) {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(createRockGeometry(seed, 24, 11), rockMaterial);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  const pad = new THREE.Mesh(new THREE.CircleGeometry(7.1, 64), ivoryStoneMaterial);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = CITY_TOP;
  pad.receiveShadow = true;
  group.add(pad);

  const padRim = new THREE.Mesh(new THREE.TorusGeometry(7.05, 0.07, 6, 110), silverMaterial);
  padRim.rotation.x = -Math.PI / 2;
  padRim.position.y = CITY_TOP;
  group.add(padRim);

  const inlay = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.025, 6, 90), bronzeMaterial);
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = CITY_TOP + 0.02;
  group.add(inlay);

  const pavilion = new THREE.Group();
  pavilion.position.set(0.8, CITY_TOP, -0.9);
  group.add(pavilion);

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.16, 1.7), ivoryStoneMaterial);
  base.position.y = 0.08;
  base.receiveShadow = true;
  pavilion.add(base);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.05, 1.4), glassMaterial);
  glass.position.y = 0.7;
  pavilion.add(glass);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.1, 1.75), silverMaterial);
  roof.position.y = 1.28;
  roof.castShadow = true;
  pavilion.add(roof);

  const postGeometry = new THREE.BoxGeometry(0.05, 1.05, 0.05);
  [
    [-1.0, -0.62],
    [1.0, -0.62],
    [-1.0, 0.62],
    [1.0, 0.62],
  ].forEach(([x, z]) => {
    const post = new THREE.Mesh(postGeometry, silverMaterial);
    post.position.set(x, 0.7, z);
    pavilion.add(post);
  });

  const pavilionGlow = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.02, 0.05),
    warmLightMaterial,
  );
  pavilionGlow.position.set(0, 1.2, 0.6);
  pavilion.add(pavilionGlow);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 3.2, 6), silverMaterial);
  mast.position.set(-2.3, CITY_TOP + 1.6, 1.1);
  mast.castShadow = true;
  group.add(mast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), warmLightMaterial);
  beacon.position.set(-2.3, CITY_TOP + 3.22, 1.1);
  group.add(beacon);

  return group;
}
