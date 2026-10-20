import * as THREE from 'three';
import { createWindowTexture, glowTexture } from './utils.js';
import { CITY_TOP } from './island.js';

const roofMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f1724,
  metalness: 0.8,
  roughness: 0.36,
});

const structureMaterial = new THREE.MeshStandardMaterial({
  color: 0x101a28,
  metalness: 0.82,
  roughness: 0.32,
});

const neonCyan = new THREE.MeshStandardMaterial({
  color: 0x04141b,
  emissive: 0x63f2ff,
  emissiveIntensity: 2.1,
  roughness: 0.18,
  metalness: 0.24,
});

const neonMagenta = new THREE.MeshStandardMaterial({
  color: 0x1b0718,
  emissive: 0xff68dc,
  emissiveIntensity: 1.9,
  roughness: 0.18,
  metalness: 0.2,
});

const neonAmber = new THREE.MeshStandardMaterial({
  color: 0x1b1107,
  emissive: 0xffb45d,
  emissiveIntensity: 1.7,
  roughness: 0.2,
  metalness: 0.2,
});

const accentMaterials = {
  cyan: neonCyan,
  magenta: neonMagenta,
  amber: neonAmber,
};

const beaconMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a0509,
  emissive: 0xff456d,
  emissiveIntensity: 1.7,
  roughness: 0.25,
  metalness: 0.2,
});
const windowTextures = [
  createWindowTexture(11, ['#26d7f5', '#79f4ff', '#168fc6', '#b8ffff']),
  createWindowTexture(23, ['#ff45c5', '#ff8ade', '#c16bff', '#ffe6ff']),
  createWindowTexture(37, ['#ffae45', '#ffd47c', '#ff7b45', '#fff0bd']),
];

function cloneWindowTexture(texture, repeatX, repeatY) {
  const clone = texture.clone();
  clone.wrapS = THREE.RepeatWrapping;
  clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeatX, repeatY);
  clone.needsUpdate = true;
  return clone;
}

function createFacadeMaterial(texture, width, height) {
  const repeatX = Math.max(1, Math.round(width / 2.35));
  const repeatY = Math.max(1, Math.round(height / 5.4));
  const windowTexture = cloneWindowTexture(texture, repeatX, repeatY);

  return new THREE.MeshStandardMaterial({
    color: 0x9fb3c6,
    map: windowTexture,
    emissive: 0xffffff,
    emissiveMap: windowTexture,
    emissiveIntensity: 1.05,
    metalness: 0.54,
    roughness: 0.36,
  });
}

function createFacadeBox(spec, parent, baseY, height, width, depth, palette) {
  const texture = windowTextures[palette];
  const sideX = createFacadeMaterial(texture, depth, height);
  const sideZ = createFacadeMaterial(texture, width, height);
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(geometry, [
    sideX,
    sideX,
    roofMaterial,
    roofMaterial,
    sideZ,
    sideZ,
  ]);
  body.position.y = baseY + height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  parent.add(body);

  return body;
}

function createCylinderTower(spec, parent) {
  const radius = Math.max(spec.w, spec.d) * 0.48;
  const height = spec.h;
  const texture = windowTextures[spec.palette];
  const repeatX = Math.max(2, Math.round((Math.PI * 2 * radius) / 2.6));
  const repeatY = Math.max(1, Math.round(height / 5.4));
  const windowTexture = cloneWindowTexture(texture, repeatX, repeatY);
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0x9fb3c6,
    map: windowTexture,
    emissive: 0xffffff,
    emissiveMap: windowTexture,
    emissiveIntensity: 1.05,
    metalness: 0.54,
    roughness: 0.36,
  });
  const geometry = new THREE.CylinderGeometry(
    radius * 0.72,
    radius,
    height,
    14,
    1,
  );
  const body = new THREE.Mesh(geometry, [sideMaterial, roofMaterial, roofMaterial]);
  body.position.y = CITY_TOP + height / 2;
  body.rotation.y = spec.rotation || 0;
  body.castShadow = true;
  body.receiveShadow = true;
  parent.add(body);

  const accent = accentMaterials[spec.accent];
  [0.3, 0.58, 0.82].forEach((fraction) => {
    const ringRadius = radius * (1 - fraction * 0.28);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius + 0.03, 0.025, 6, 64),
      accent,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = CITY_TOP + height * fraction;
    parent.add(ring);
  });

  return body;
}

function createRoofDetails(spec, parent, topY, accent, beacons) {
  const big = Math.max(spec.w, spec.d);
  const roofBlock = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w * 0.58, 0.18, spec.d * 0.58),
    structureMaterial,
  );
  roofBlock.position.y = topY + 0.09;
  roofBlock.castShadow = true;
  parent.add(roofBlock);

  if (spec.antenna !== false) {
    const antennaHeight = spec.antennaHeight || 0.85;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.045, antennaHeight, 5),
      structureMaterial,
    );
    mast.position.y = topY + 0.18 + antennaHeight / 2;
    parent.add(mast);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), beaconMaterial);
    beacon.position.y = topY + 0.18 + antennaHeight;
    parent.add(beacon);

    const beaconGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xff5c7f,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    beaconGlow.position.y = beacon.position.y;
    beaconGlow.scale.set(0.8, 0.8, 1);
    parent.add(beaconGlow);
    beacons.push(beaconGlow);
  }

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w + 0.1, 0.07, spec.d + 0.1),
    accent,
  );
  trim.position.y = topY - 0.03;
  parent.add(trim);

  if (big > 1.5) {
    const cornerStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, topY - CITY_TOP - 0.2, 0.04),
      accent,
    );
    cornerStrip.position.set(spec.w * 0.42, CITY_TOP + (topY - CITY_TOP) * 0.52, spec.d * 0.42);
    parent.add(cornerStrip);
  }
}

function addBoxTower(spec, cityGroup, beacons) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);
  cityGroup.add(group);

  const accent = accentMaterials[spec.accent];
  const totalHeight = spec.h;

  if (spec.style === 'stepped') {
    const lowerHeight = totalHeight * 0.68;
    const upperHeight = totalHeight * 0.32;
    createFacadeBox(spec, group, CITY_TOP, lowerHeight, spec.w, spec.d, spec.palette);
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(spec.w + 0.12, 0.08, spec.d + 0.12),
      accent,
    );
    trim.position.y = CITY_TOP + lowerHeight - 0.03;
    group.add(trim);

    createFacadeBox(
      { ...spec, w: spec.w * 0.66, d: spec.d * 0.66 },
      group,
      CITY_TOP + lowerHeight,
      upperHeight,
      spec.w * 0.66,
      spec.d * 0.66,
      spec.palette,
    );

    createRoofDetails(
      { ...spec, w: spec.w * 0.66, d: spec.d * 0.66 },
      group,
      CITY_TOP + totalHeight,
      accent,
      beacons,
    );
  } else {
    createFacadeBox(spec, group, CITY_TOP, totalHeight, spec.w, spec.d, spec.palette);
    createRoofDetails(spec, group, CITY_TOP + totalHeight, accent, beacons);
  }

  if (spec.band) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(spec.w + 0.08, 0.05, spec.d + 0.08),
      accent,
    );
    band.position.y = CITY_TOP + totalHeight * 0.62;
    group.add(band);
  }

  return group;
}

function createBridge(a, b, height, accent) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const group = new THREE.Group();
  group.position.set((a.x + b.x) / 2, CITY_TOP + height, (a.z + b.z) / 2);
  group.rotation.y = Math.atan2(dx, dz);

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.22, length),
    structureMaterial,
  );
  bridge.castShadow = true;
  bridge.receiveShadow = true;
  group.add(bridge);

  const topStrip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, length), accent);
  topStrip.position.y = 0.13;
  group.add(topStrip);

  const lowerStrip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.018, length), accent);
  lowerStrip.position.y = -0.13;
  group.add(lowerStrip);

  return group;
}

function createCentralCore() {
  const group = new THREE.Group();
  group.position.y = CITY_TOP;

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.75, 0.28, 12),
    structureMaterial,
  );
  plinth.position.y = 0.14;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const plinthGlow = new THREE.Mesh(
    new THREE.TorusGeometry(2.35, 0.035, 6, 80),
    neonCyan,
  );
  plinthGlow.rotation.x = -Math.PI / 2;
  plinthGlow.position.y = 0.3;
  group.add(plinthGlow);

  const tier = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 2.1, 0.22, 10),
    structureMaterial,
  );
  tier.position.y = 0.39;
  tier.castShadow = true;
  tier.receiveShadow = true;
  group.add(tier);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 1.35, 5.2, 8),
    structureMaterial,
  );
  tower.position.y = 3.1;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  [1.3, 2.6, 3.9, 5.1].forEach((fraction, index) => {
    const ringRadius = 1.35 - (fraction / 5.2) * 0.73;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius + 0.03, 0.025, 6, 64),
      index % 2 === 0 ? neonCyan : neonMagenta,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = fraction;
    group.add(ring);
  });

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 8;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 4.7, 0.045), neonCyan);
    strip.position.set(Math.cos(angle) * 0.94, 2.9, Math.sin(angle) * 0.94);
    strip.rotation.y = -angle;
    group.add(strip);
  }

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.0, 0.18, 12),
    structureMaterial,
  );
  crown.position.y = 5.78;
  crown.castShadow = true;
  group.add(crown);

  const crownGlow = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.028, 6, 64),
    neonMagenta,
  );
  crownGlow.rotation.x = -Math.PI / 2;
  crownGlow.position.y = 5.89;
  group.add(crownGlow);

  const orbGroup = new THREE.Group();
  orbGroup.position.y = 7.15;
  group.add(orbGroup);

  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ff9ff,
    emissive: 0x43dff5,
    emissiveIntensity: 1.0,
    metalness: 0.15,
    roughness: 0.12,
    transparent: true,
    opacity: 0.96,
  });
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 2), orbMaterial);
  orbGroup.add(orb);

  const orbWire = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 14, 9),
    new THREE.MeshBasicMaterial({
      color: 0x9ffcff,
      wireframe: true,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  orbGroup.add(orbWire);

  const orbHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x6df2ff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  orbHalo.scale.set(4.2, 4.2, 1);
  orbGroup.add(orbHalo);

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.026, 6, 96), neonCyan);
  ringA.rotation.set(Math.PI / 2.6, 0.25, 0);
  orbGroup.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.018, 6, 96), neonMagenta);
  ringB.rotation.set(Math.PI / 2.1, -0.5, 0.35);
  orbGroup.add(ringB);

  const holoRingA = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.012, 4, 100),
    new THREE.MeshBasicMaterial({
      color: 0x88f4ff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  holoRingA.rotation.set(Math.PI / 2 + 0.35, 0, 0.2);
  holoRingA.position.y = 7.4;
  group.add(holoRingA);

  const coreLight = new THREE.PointLight(0x5feaff, 26, 16, 2);
  coreLight.position.y = 7.2;
  group.add(coreLight);

  return {
    group,
    update(time, delta) {
      orb.rotation.y += delta * 0.22;
      orb.rotation.x = Math.sin(time * 0.25) * 0.12;
      orbWire.rotation.y -= delta * 0.12;
      orbWire.rotation.z += delta * 0.05;
      ringA.rotation.z += delta * 0.16;
      ringA.rotation.x += delta * 0.06;
      ringB.rotation.y -= delta * 0.12;
      ringB.rotation.z -= delta * 0.08;
      holoRingA.rotation.z += delta * 0.03;

      const pulse = 0.85 + Math.sin(time * 1.5) * 0.12;
      orb.scale.setScalar(pulse);
      orbMaterial.emissiveIntensity = 0.92 + Math.sin(time * 1.5) * 0.18;
      coreLight.intensity = 20 + Math.sin(time * 1.5) * 4;
      orbHalo.material.opacity = 0.16 + Math.sin(time * 1.5) * 0.04;
    },
  };
}

function createLandingPad(x, z, accent) {
  const group = new THREE.Group();
  group.position.set(x, CITY_TOP + 0.02, z);

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(1.05, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0b1420,
      metalness: 0.8,
      roughness: 0.38,
    }),
  );
  pad.rotation.x = -Math.PI / 2;
  group.add(pad);

  const ringMaterial = accent === 'magenta' ? neonMagenta : neonCyan;
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 48), ringMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.012;
  group.add(rim);

  const inner = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.46, 32), ringMaterial);
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.014;
  group.add(inner);

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.08), ringMaterial);
    light.position.set(Math.cos(angle) * 1.05, 0.02, Math.sin(angle) * 1.05);
    group.add(light);
  }

  return group;
}

export function createCity() {
  const group = new THREE.Group();
  const beacons = [];

  const buildingSpecs = [
    { x: 3.15, z: 0.55, w: 1.9, d: 1.75, h: 4.5, palette: 0, accent: 'cyan', style: 'stepped' },
    { x: -3.05, z: 2.05, w: 2.1, d: 1.65, h: 6.0, palette: 1, accent: 'magenta', band: true },
    { x: -1.35, z: -3.3, w: 2.0, d: 1.9, h: 5.5, palette: 0, accent: 'cyan', style: 'cylinder' },
    { x: 2.1, z: -3.0, w: 1.55, d: 2.0, h: 3.4, palette: 2, accent: 'amber' },
    { x: -4.0, z: -1.1, w: 1.55, d: 1.5, h: 3.0, palette: 0, accent: 'cyan' },
    { x: 3.9, z: -2.3, w: 1.35, d: 1.35, h: 2.5, palette: 1, accent: 'magenta' },
    { x: -2.55, z: 3.7, w: 1.45, d: 1.45, h: 4.6, palette: 2, accent: 'amber' },
    { x: 0.95, z: 4.05, w: 1.65, d: 1.25, h: 3.2, palette: 0, accent: 'cyan' },
    { x: -3.0, z: -3.1, w: 1.3, d: 1.3, h: 3.2, palette: 1, accent: 'magenta' },
    { x: 4.35, z: 1.25, w: 1.25, d: 1.25, h: 2.0, palette: 2, accent: 'amber', antennaHeight: 1.4 },
  ];

  buildingSpecs.forEach((spec) => {
    if (spec.style === 'cylinder') {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(spec.x, 0, spec.z);
      group.add(towerGroup);
      createCylinderTower(spec, towerGroup);
      createRoofDetails(spec, towerGroup, CITY_TOP + spec.h, accentMaterials[spec.accent], beacons);
    } else {
      addBoxTower(spec, group, beacons);
    }
  });

  group.add(
    createBridge(
      { x: 3.15, z: 0.55 },
      { x: 4.35, z: 1.25 },
      2.55,
      neonCyan,
    ),
  );
  group.add(
    createBridge(
      { x: -3.05, z: 2.05 },
      { x: -2.55, z: 3.7 },
      2.15,
      neonMagenta,
    ),
  );
  group.add(
    createBridge(
      { x: -1.35, z: -3.3 },
      { x: -3.0, z: -3.1 },
      2.7,
      neonCyan,
    ),
  );

  const core = createCentralCore();
  group.add(core.group);

  group.add(createLandingPad(3.2, -4.9, 'cyan'));
  group.add(createLandingPad(-4.6, -2.6, 'magenta'));

  const lampGeometry = new THREE.CylinderGeometry(0.025, 0.04, 0.86, 6);
  const lampTipGeometry = new THREE.SphereGeometry(0.07, 8, 6);

  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2 + 0.17;
    const radius = 5.35;
    const lamp = new THREE.Group();
    lamp.position.set(Math.cos(angle) * radius, CITY_TOP, Math.sin(angle) * radius);

    const pole = new THREE.Mesh(lampGeometry, structureMaterial);
    pole.position.y = 0.43;
    lamp.add(pole);

    const tip = new THREE.Mesh(lampTipGeometry, index % 4 === 0 ? neonMagenta : neonCyan);
    tip.position.y = 0.88;
    lamp.add(tip);

    group.add(lamp);
  }

  function update(time, delta) {
    core.update(time, delta);

    beaconMaterial.emissiveIntensity = 1.4 + Math.sin(time * 2.5) * 0.6;
    beacons.forEach((beacon, index) => {
      beacon.material.opacity = 0.28 + Math.sin(time * 2.5 + index * 0.7) * 0.12;
    });
  }

  return { group, update };
}
