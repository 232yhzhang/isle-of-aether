import * as THREE from 'three';
import { glowTexture, mulberry32 } from './utils.js';

export const CITY_TOP = 0.82;
export const DECK_RADIUS = 7.12;

function createDeckTextures() {
  const size = 1024;
  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = size;
  baseCanvas.height = size;
  const base = baseCanvas.getContext('2d');

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = size;
  glowCanvas.height = size;
  const glow = glowCanvas.getContext('2d');

  const center = size / 2;
  const maxRadius = size * 0.496;

  const background = base.createRadialGradient(center, center, 0, center, center, size * 0.7);
  background.addColorStop(0, '#101b2c');
  background.addColorStop(0.55, '#0a1322');
  background.addColorStop(1, '#050a12');
  base.fillStyle = background;
  base.fillRect(0, 0, size, size);

  glow.fillStyle = '#000000';
  glow.fillRect(0, 0, size, size);

  base.save();
  base.translate(center, center);

  base.strokeStyle = 'rgba(58, 103, 136, 0.22)';
  base.lineWidth = 1;
  for (let radius = 32; radius < maxRadius; radius += 32) {
    base.beginPath();
    base.arc(0, 0, radius, 0, Math.PI * 2);
    base.stroke();
  }

  base.strokeStyle = 'rgba(74, 135, 172, 0.2)';
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    base.beginPath();
    base.moveTo(Math.cos(angle) * 46, Math.sin(angle) * 46);
    base.lineTo(Math.cos(angle) * maxRadius, Math.sin(angle) * maxRadius);
    base.stroke();
  }

  base.strokeStyle = 'rgba(123, 224, 255, 0.28)';
  base.lineWidth = 2;
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + 0.2;
    base.beginPath();
    base.moveTo(Math.cos(angle) * 90, Math.sin(angle) * 90);
    base.lineTo(Math.cos(angle) * maxRadius, Math.sin(angle) * maxRadius);
    base.stroke();
  }

  base.fillStyle = 'rgba(5, 12, 22, 0.72)';
  base.strokeStyle = 'rgba(87, 166, 200, 0.24)';
  base.lineWidth = 1.5;
  const random = mulberry32(433);
  for (let index = 0; index < 160; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 120 + random() * (maxRadius - 150);
    const w = 10 + random() * 45;
    const h = 8 + random() * 26;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    base.save();
    base.translate(x, y);
    base.rotate(angle + Math.PI / 2);
    base.fillRect(-w / 2, -h / 2, w, h);
    base.strokeRect(-w / 2, -h / 2, w, h);
    base.restore();
  }

  base.restore();

  glow.save();
  glow.translate(center, center);
  glow.strokeStyle = 'rgba(78, 240, 255, 0.85)';
  glow.lineWidth = 3;
  [maxRadius * 0.27, maxRadius * 0.55, maxRadius * 0.83].forEach((radius, index) => {
    glow.beginPath();
    glow.arc(0, 0, radius, index * 0.8, Math.PI * 1.55 + index * 0.6);
    glow.stroke();
  });

  glow.strokeStyle = 'rgba(255, 86, 209, 0.8)';
  glow.lineWidth = 2;
  glow.beginPath();
  glow.arc(0, 0, maxRadius * 0.68, Math.PI * 1.22, Math.PI * 1.72);
  glow.stroke();

  glow.strokeStyle = 'rgba(109, 245, 255, 0.6)';
  glow.lineWidth = 1.5;
  for (let index = 0; index < 24; index += 1) {
    if (index % 3 === 0) continue;
    const angle = (index / 24) * Math.PI * 2;
    glow.beginPath();
    glow.moveTo(Math.cos(angle) * 66, Math.sin(angle) * 66);
    glow.lineTo(Math.cos(angle) * maxRadius, Math.sin(angle) * maxRadius);
    glow.stroke();
  }

  const dotRandom = mulberry32(912);
  glow.fillStyle = 'rgba(124, 247, 255, 0.7)';
  for (let index = 0; index < 260; index += 1) {
    const angle = dotRandom() * Math.PI * 2;
    const radius = 80 + dotRandom() * (maxRadius - 90);
    glow.beginPath();
    glow.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 1 + dotRandom() * 2.1, 0, Math.PI * 2);
    glow.fill();
  }

  glow.restore();

  const baseTexture = new THREE.CanvasTexture(baseCanvas);
  baseTexture.colorSpace = THREE.SRGBColorSpace;
  baseTexture.anisotropy = 8;

  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  glowTexture.anisotropy = 8;

  return { baseTexture, glowTexture };
}

export function createRockGeometry(seed = 7.3, segments = 48, rings = 20) {
  const radius = 7.7;
  const depth = 12.4;
  const topY = 0.05;
  const positions = [];
  const colors = [];
  const indices = [];
  const ringStarts = [];

  const topColor = new THREE.Color('#434b58');
  const deepColor = new THREE.Color('#232b37');
  const coldColor = new THREE.Color('#2c4052');

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
      const strata = Math.sin(t * 24 + Math.sin(angle * 3 + seed) * 2) * 0.035;
      color.offsetHSL(0.015 * Math.sin(angle * 2 + t * 3), 0.06, strata);

      if (t > 0.16 && t < 0.7 && Math.sin(angle * 4.2 + seed * 2.3) > 0.45) {
        color.lerp(coldColor, (1 - Math.abs(t - 0.42) / 0.3) * 0.35);
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
  const tipColor = deepColor.clone().offsetHSL(0.01, 0.1, -0.02);
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

const rockMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.93,
  metalness: 0.08,
});

const darkMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0x161f2d,
  metalness: 0.86,
  roughness: 0.28,
});

const darkerMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0x0b111b,
  metalness: 0.8,
  roughness: 0.38,
});

const cyanNeonMaterial = new THREE.MeshStandardMaterial({
  color: 0x07151b,
  emissive: 0x5ff4ff,
  emissiveIntensity: 2.0,
  roughness: 0.2,
  metalness: 0.25,
});

const magentaNeonMaterial = new THREE.MeshStandardMaterial({
  color: 0x1b0817,
  emissive: 0xff5fd6,
  emissiveIntensity: 1.9,
  roughness: 0.2,
  metalness: 0.2,
});

export function createIslandBase() {
  const group = new THREE.Group();

  const rock = new THREE.Mesh(createRockGeometry(7.3), rockMaterial);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  const { baseTexture, glowTexture: deckGlowTexture } = createDeckTextures();

  const deckMaterial = new THREE.MeshStandardMaterial({
    map: baseTexture,
    emissiveMap: deckGlowTexture,
    emissive: 0xffffff,
    emissiveIntensity: 0.75,
    color: 0xaebfcc,
    metalness: 0.68,
    roughness: 0.42,
  });

  const deck = new THREE.Mesh(new THREE.CircleGeometry(DECK_RADIUS, 128), deckMaterial);
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = CITY_TOP;
  deck.receiveShadow = true;
  group.add(deck);

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(7.4, 7.72, 0.95, 96, 1, true),
    darkMetalMaterial,
  );
  skirt.position.y = 0.38;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);

  const skirtSlatGeometry = new THREE.BoxGeometry(0.04, 0.4, 0.045);
  const slatCount = 48;
  const slats = new THREE.InstancedMesh(skirtSlatGeometry, cyanNeonMaterial, slatCount);
  const slatDummy = new THREE.Object3D();

  for (let index = 0; index < slatCount; index += 1) {
    const angle = (index / slatCount) * Math.PI * 2;
    slatDummy.position.set(Math.cos(angle) * 7.55, 0.56, Math.sin(angle) * 7.55);
    slatDummy.rotation.set(0, -angle + Math.PI / 2, 0);
    slatDummy.updateMatrix();
    slats.setMatrixAt(index, slatDummy.matrix);
  }
  slats.instanceMatrix.needsUpdate = true;
  group.add(slats);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.16, 10, 160), darkMetalMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = CITY_TOP - 0.02;
  rim.castShadow = true;
  rim.receiveShadow = true;
  group.add(rim);

  const rimGlow = new THREE.Mesh(new THREE.TorusGeometry(7.09, 0.024, 6, 180), cyanNeonMaterial);
  rimGlow.rotation.x = -Math.PI / 2;
  rimGlow.position.y = CITY_TOP + 0.05;
  group.add(rimGlow);

  const outerGlow = new THREE.Mesh(
    new THREE.TorusGeometry(7.31, 0.018, 6, 180),
    magentaNeonMaterial,
  );
  outerGlow.rotation.x = -Math.PI / 2;
  outerGlow.position.y = 0.2;
  group.add(outerGlow);

  const deckRings = [];
  [
    { radius: 2.75, color: cyanNeonMaterial, intensity: 1 },
    { radius: 4.8, color: magentaNeonMaterial, intensity: 0.7 },
  ].forEach((spec) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, 0.015, 6, 160), spec.color);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = CITY_TOP + 0.012;
    group.add(ring);
    deckRings.push({ mesh: ring, intensity: spec.intensity });
  });

  const underside = new THREE.Group();
  group.add(underside);

  const underRings = [];
  const ringSpecs = [
    { y: -3.1, radius: 6.82, color: cyanNeonMaterial, nodes: 6 },
    { y: -5.9, radius: 5.42, color: magentaNeonMaterial, nodes: 5 },
    { y: -8.9, radius: 3.82, color: cyanNeonMaterial, nodes: 4 },
  ];

  ringSpecs.forEach((spec, index) => {
    const unit = new THREE.Group();
    unit.position.y = spec.y;

    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, 0.07, 8, 140),
      darkerMetalMaterial,
    );
    frame.rotation.x = -Math.PI / 2;
    unit.add(frame);

    const energy = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius + 0.01, 0.026, 6, 160),
      spec.color,
    );
    energy.rotation.x = -Math.PI / 2;
    energy.position.y = 0.04;
    unit.add(energy);

    const nodeGeometry = new THREE.BoxGeometry(0.16, 0.12, 0.5);
    for (let nodeIndex = 0; nodeIndex < spec.nodes; nodeIndex += 1) {
      const angle = (nodeIndex / spec.nodes) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeometry, spec.color);
      node.position.set(Math.cos(angle) * spec.radius, 0.03, Math.sin(angle) * spec.radius);
      node.rotation.y = -angle;
      unit.add(node);
    }

    unit.userData.phase = index * 1.7;
    underside.add(unit);
    underRings.push({ group: unit, color: spec.color, phase: index * 1.7 });
  });

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0x5feaff,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    toneMapped: false,
  });

  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 1.55, 14, 24, 1, true), beamMaterial);
  beam.position.y = -20;
  underside.add(beam);

  const beamCoreMaterial = beamMaterial.clone();
  beamCoreMaterial.opacity = 0.085;
  const beamCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.36, 14, 16, 1, true),
    beamCoreMaterial,
  );
  beamCore.position.y = -20;
  underside.add(beamCore);

  const underGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x57e6ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  underGlow.position.y = -12.5;
  underGlow.scale.set(10, 5, 1);
  underside.add(underGlow);

  const underLight = new THREE.PointLight(0x4adfff, 26, 34, 2);
  underLight.position.y = -12.5;
  group.add(underLight);

  const conduitAngles = [0.35, 1.15, 2.05, 3.35, 4.45, 5.55];
  const conduitMaterials = [cyanNeonMaterial, magentaNeonMaterial];

  conduitAngles.forEach((angle, index) => {
    const material = conduitMaterials[index % 2];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const top = new THREE.Vector3(cos * 7.5, -1.05, sin * 7.5);
    const middle = new THREE.Vector3(cos * 6.35, -3.65, sin * 6.35);
    const bottom = new THREE.Vector3(cos * 5.15, -6.1, sin * 5.15);
    const curve = new THREE.CatmullRomCurve3([top, middle, bottom]);
    const conduit = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.028, 5, false),
      material,
    );
    underside.add(conduit);

    const node = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), material);
    node.position.copy(top);
    underside.add(node);
  });

  const tipRing = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.035, 6, 90), cyanNeonMaterial);
  tipRing.rotation.x = -Math.PI / 2;
  tipRing.position.y = -11.2;
  underside.add(tipRing);

  const tipCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.46, 0),
    magentaNeonMaterial,
  );
  tipCore.position.y = -11.2;
  underside.add(tipCore);

  const tipGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x5be9ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  tipGlow.position.y = -12.8;
  tipGlow.scale.set(4.4, 4.4, 1);
  underside.add(tipGlow);

  function update(time) {
    underRings.forEach((ring, index) => {
      ring.group.rotation.y = time * (0.045 + index * 0.012);
      ring.color.emissiveIntensity = 1.8 + Math.sin(time * 1.25 + ring.phase) * 0.45;
    });

    beamMaterial.opacity = 0.032 + Math.sin(time * 0.9) * 0.01;
    beamCoreMaterial.opacity = 0.06 + Math.sin(time * 1.3 + 1) * 0.02;
    underGlow.material.opacity = 0.24 + Math.sin(time * 1.1) * 0.07;
    underLight.intensity = 23 + Math.sin(time * 1.1) * 5;

    deckRings.forEach((ring, index) => {
      ring.mesh.material.emissiveIntensity = 1.5 + Math.sin(time * 1.6 + index * 1.2) * 0.4;
    });
  }

  return { group, rock, deck, update, underside };
}

export function createSatellitePlatform(seed) {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(createRockGeometry(seed, 24, 11), rockMaterial);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  const pad = new THREE.Mesh(new THREE.CircleGeometry(7.15, 48), darkMetalMaterial);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = CITY_TOP;
  pad.receiveShadow = true;
  group.add(pad);

  const padRing = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.05, 6, 80), cyanNeonMaterial);
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.y = CITY_TOP + 0.03;
  group.add(padRing);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.035, 6, 64), magentaNeonMaterial);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = CITY_TOP + 0.04;
  group.add(innerRing);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 4, 8), darkMetalMaterial);
  mast.position.y = CITY_TOP + 2;
  mast.castShadow = true;
  group.add(mast);

  const mastGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 6), cyanNeonMaterial);
  mastGlow.position.y = CITY_TOP + 2.1;
  group.add(mastGlow);

  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), magentaNeonMaterial);
  beacon.position.y = CITY_TOP + 4.2;
  group.add(beacon);

  const beaconGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff7ce0,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  beaconGlow.position.y = CITY_TOP + 4.2;
  beaconGlow.scale.set(2.5, 2.5, 1);
  group.add(beaconGlow);

  return group;
}
