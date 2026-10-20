import * as THREE from 'three';
import { createWindowTexture } from './utils.js';
import { CITY_TOP } from './island.js';

const ivory = new THREE.MeshStandardMaterial({
  color: 0xe6dfd2,
  roughness: 0.7,
  metalness: 0.04,
  envMapIntensity: 0.65,
});

const paleStone = new THREE.MeshStandardMaterial({
  color: 0xd3ccbf,
  roughness: 0.82,
  metalness: 0.03,
  envMapIntensity: 0.4,
});

const silver = new THREE.MeshStandardMaterial({
  color: 0xbdc3c4,
  roughness: 0.24,
  metalness: 0.86,
  envMapIntensity: 1.3,
});

const bronze = new THREE.MeshStandardMaterial({
  color: 0xa4855d,
  roughness: 0.32,
  metalness: 0.8,
  envMapIntensity: 1.15,
});

const darkMetal = new THREE.MeshStandardMaterial({
  color: 0x2d3639,
  roughness: 0.4,
  metalness: 0.7,
});

const warmLight = new THREE.MeshStandardMaterial({
  color: 0x4b3b25,
  emissive: 0xffd8a0,
  emissiveIntensity: 0.85,
  roughness: 0.3,
  metalness: 0.2,
});

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x22353b,
  roughness: 0.06,
  metalness: 0.32,
  envMapIntensity: 2.2,
});

const hedgeMaterial = new THREE.MeshStandardMaterial({
  color: 0x677f5e,
  roughness: 0.9,
  metalness: 0,
});

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x5d4c3c,
  roughness: 0.95,
});

const treeMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x6f8c65, roughness: 0.88 }),
  new THREE.MeshStandardMaterial({ color: 0x7c9a70, roughness: 0.9 }),
  new THREE.MeshStandardMaterial({ color: 0x627e5b, roughness: 0.9 }),
];

const bridgeGlass = new THREE.MeshStandardMaterial({
  color: 0xa9c3cc,
  transparent: true,
  opacity: 0.26,
  roughness: 0.08,
  metalness: 0.25,
  envMapIntensity: 1.9,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const frostedGlass = new THREE.MeshStandardMaterial({
  color: 0xc4d6dd,
  transparent: true,
  opacity: 0.2,
  roughness: 0.15,
  metalness: 0.15,
  envMapIntensity: 1.6,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const windowTextures = {
  cool: createWindowTexture(17, 'cool'),
  warm: createWindowTexture(29, 'warm'),
  bronze: createWindowTexture(43, 'bronze'),
};

function cloneWindowTexture(texture, repeatX, repeatY) {
  const clone = texture.clone();
  clone.wrapS = THREE.RepeatWrapping;
  clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeatX, repeatY);
  clone.needsUpdate = true;
  return clone;
}

function createFacadeMaterial(texture, width, height) {
  const repeatX = Math.max(1, Math.round(width / 2.6));
  const repeatY = Math.max(1, Math.round(height / 5.4));
  const map = cloneWindowTexture(texture, repeatX, repeatY);

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    emissive: 0xffddb0,
    emissiveMap: map,
    emissiveIntensity: 0.48,
    metalness: 0.52,
    roughness: 0.09,
    envMapIntensity: 1.7,
  });
}

function createTree(scale = 1, random = Math.random) {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.075, 0.9, 5),
    trunkMaterial,
  );
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  group.add(trunk);

  const blobs = [
    { x: 0, y: 1.15, z: 0, r: 0.58 },
    { x: 0.3, y: 1.48, z: 0.12, r: 0.42 },
    { x: -0.28, y: 1.42, z: -0.12, r: 0.38 },
  ];

  blobs.forEach((blob, index) => {
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(blob.r, 1),
      treeMaterials[Math.floor(random() * treeMaterials.length)],
    );
    canopy.position.set(blob.x, blob.y, blob.z);
    canopy.rotation.set(random() * 2, random() * 2, random() * 2);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    group.add(canopy);
  });

  group.scale.setScalar(scale);
  group.rotation.y = random() * Math.PI * 2;
  return group;
}

function createPlanter(width, depth, height = 0.32) {
  const group = new THREE.Group();

  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), paleStone);
  box.position.y = height / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.14, 0.04, depth - 0.14),
    hedgeMaterial,
  );
  soil.position.y = height + 0.01;
  group.add(soil);

  return group;
}

function addFacadeBox(parent, baseY, width, depth, height, texture) {
  const sideX = createFacadeMaterial(texture, depth, height);
  const sideZ = createFacadeMaterial(texture, width, height);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    [sideX, sideX, ivory, ivory, sideZ, sideZ],
  );
  body.position.y = baseY + height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  parent.add(body);

  [0.52, 0.79].forEach((fraction) => {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.09, 0.055, depth + 0.09),
      ivory,
    );
    band.position.y = baseY + height * fraction;
    band.castShadow = true;
    parent.add(band);
  });

  return body;
}

function createFinnedTower(spec) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.radius * 0.82, spec.radius, spec.height, 14, 1),
    (() => {
      const material = createFacadeMaterial(
        windowTextures[spec.mood],
        Math.PI * 2 * spec.radius,
        spec.height,
      );
      material.metalness = 0.62;
      material.roughness = 0.075;
      return material;
    })(),
  );
  glass.position.y = CITY_TOP + spec.height / 2;
  glass.castShadow = true;
  glass.receiveShadow = true;
  group.add(glass);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.radius + 0.38, spec.radius + 0.5, 0.32, 20),
    ivory,
  );
  plinth.position.y = CITY_TOP + 0.16;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const whiteFins = 14;
  const finGeometry = new THREE.BoxGeometry(0.05, spec.height * 0.95, 0.18);
  for (let index = 0; index < whiteFins; index += 1) {
    const angle = (index / whiteFins) * Math.PI * 2;
    const fin = new THREE.Mesh(finGeometry, ivory);
    fin.position.set(
      Math.cos(angle) * spec.radius * 0.94,
      CITY_TOP + spec.height * 0.5,
      Math.sin(angle) * spec.radius * 0.94,
    );
    fin.rotation.y = Math.PI / 2 - angle;
    fin.castShadow = true;
    group.add(fin);
  }

  [0.34, 0.62, 0.86].forEach((fraction) => {
    const radius = spec.radius - spec.radius * 0.18 * fraction + 0.08;
    const band = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.035, 6, 64), silver);
    band.rotation.x = Math.PI / 2;
    band.position.y = CITY_TOP + spec.height * fraction;
    group.add(band);
  });

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(
      spec.radius * 0.84,
      spec.radius * 0.84,
      0.22,
      20,
    ),
    ivory,
  );
  crown.position.y = CITY_TOP + spec.height + 0.11;
  crown.castShadow = true;
  group.add(crown);

  const crownLight = new THREE.Mesh(
    new THREE.TorusGeometry(spec.radius * 0.86, 0.018, 5, 48),
    warmLight,
  );
  crownLight.rotation.x = -Math.PI / 2;
  crownLight.position.y = CITY_TOP + spec.height + 0.01;
  group.add(crownLight);

  const roofGarden = new THREE.Group();
  roofGarden.position.y = CITY_TOP + spec.height + 0.22;
  const garden = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.radius * 0.62, spec.radius * 0.62, 0.12, 20),
    hedgeMaterial,
  );
  garden.receiveShadow = true;
  roofGarden.add(garden);
  const gardenTree = createTree(0.36);
  gardenTree.position.set(spec.radius * 0.22, 0.1, -spec.radius * 0.16);
  roofGarden.add(gardenTree);
  group.add(roofGarden);

  if (spec.spire) {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.045, 1.25, 5),
      silver,
    );
    mast.position.y = CITY_TOP + spec.height + 0.8;
    group.add(mast);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), warmLight);
    beacon.position.y = CITY_TOP + spec.height + 1.44;
    group.add(beacon);
  }

  return group;
}

function createSetbackTower(spec) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const tiers = [
    { w: spec.width, d: spec.depth, h: spec.height * 0.46 },
    { w: spec.width * 0.76, d: spec.depth * 0.76, h: spec.height * 0.32 },
    { w: spec.width * 0.52, d: spec.depth * 0.52, h: spec.height * 0.22 },
  ];

  let baseY = CITY_TOP;
  tiers.forEach((tier, index) => {
    const body = addFacadeBox(
      group,
      baseY,
      tier.w,
      tier.d,
      tier.h,
      windowTextures[spec.mood],
    );

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(tier.w + 0.1, 0.13, tier.d + 0.1),
      ivory,
    );
    slab.position.y = baseY + tier.h + 0.065;
    slab.castShadow = true;
    group.add(slab);

    if (index === 0) {
      const cornerGeometry = new THREE.BoxGeometry(0.08, tier.h, 0.08);
      [
        [-tier.w / 2 + 0.04, -tier.d / 2 + 0.04],
        [tier.w / 2 - 0.04, -tier.d / 2 + 0.04],
        [-tier.w / 2 + 0.04, tier.d / 2 - 0.04],
        [tier.w / 2 - 0.04, tier.d / 2 - 0.04],
      ].forEach(([x, z]) => {
        const post = new THREE.Mesh(cornerGeometry, ivory);
        post.position.set(x, baseY + tier.h / 2, z);
        post.castShadow = true;
        group.add(post);
      });
    }

    const lightBand = new THREE.Mesh(
      new THREE.BoxGeometry(tier.w + 0.12, 0.018, tier.d + 0.12),
      warmLight,
    );
    lightBand.position.y = baseY + tier.h * 0.78;
    group.add(lightBand);

    baseY += tier.h + 0.13;
  });

  const topTier = tiers[tiers.length - 1];
  const roofGarden = new THREE.Group();
  roofGarden.position.y = baseY;
  const planter = createPlanter(topTier.w * 0.66, topTier.d * 0.66, 0.3);
  planter.position.set(0, 0, -topTier.d * 0.08);
  roofGarden.add(planter);

  const roofTree = createTree(0.46);
  roofTree.position.set(-topTier.w * 0.12, 0.3, topTier.d * 0.08);
  roofGarden.add(roofTree);

  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(topTier.w * 0.42, 0.5, topTier.d * 0.42),
    silver,
  );
  crown.position.set(topTier.w * 0.22, 0.25, topTier.d * 0.22);
  crown.castShadow = true;
  roofGarden.add(crown);

  group.add(roofGarden);

  return group;
}

function createTaperedTower(spec) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.radius * 0.62, spec.radius, spec.height, 6, 1),
    (() => {
      const material = createFacadeMaterial(
        windowTextures[spec.mood],
        Math.PI * 2 * spec.radius,
        spec.height,
      );
      material.metalness = 0.66;
      material.roughness = 0.08;
      return material;
    })(),
  );
  glass.position.y = CITY_TOP + spec.height / 2;
  glass.castShadow = true;
  glass.receiveShadow = true;
  group.add(glass);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.radius + 0.3, spec.radius + 0.42, 0.28, 6),
    paleStone,
  );
  plinth.position.y = CITY_TOP + 0.14;
  plinth.castShadow = true;
  group.add(plinth);

  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, spec.height * 0.94, 0.12),
      bronze,
    );
    fin.position.set(
      Math.cos(angle) * spec.radius * 0.82,
      CITY_TOP + spec.height * 0.5,
      Math.sin(angle) * spec.radius * 0.82,
    );
    fin.rotation.y = Math.PI / 2 - angle;
    fin.castShadow = true;
    group.add(fin);
  }

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(spec.radius * 0.64, spec.radius * 0.64, 0.16, 8),
    silver,
  );
  crown.position.y = CITY_TOP + spec.height + 0.08;
  crown.castShadow = true;
  group.add(crown);

  const garden = createPlanter(spec.radius * 1.2, spec.radius * 1.2, 0.24);
  garden.position.y = CITY_TOP + spec.height + 0.16;
  group.add(garden);

  const gardenTree = createTree(0.34);
  gardenTree.position.set(0, CITY_TOP + spec.height + 0.4, 0);
  group.add(gardenTree);

  return group;
}

function createPavilion(spec) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width + 0.3, 0.2, spec.depth + 0.3),
    paleStone,
  );
  base.position.y = CITY_TOP + 0.1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width, spec.height, spec.depth),
    spec.mood === 'bronze' ? bridgeGlass : frostedGlass,
  );
  wall.position.y = CITY_TOP + 0.2 + spec.height / 2;
  group.add(wall);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width + 0.05, 0.06, spec.depth + 0.05),
    silver,
  );
  frame.position.y = CITY_TOP + 0.88;
  group.add(frame);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width + 0.55, 0.12, spec.depth + 0.55),
    ivory,
  );
  roof.position.y = CITY_TOP + spec.height + 0.26;
  roof.castShadow = true;
  group.add(roof);

  const lightLine = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width + 0.3, 0.02, spec.depth + 0.3),
    warmLight,
  );
  lightLine.position.y = CITY_TOP + spec.height + 0.18;
  group.add(lightLine);

  const roofGarden = new THREE.Group();
  roofGarden.position.y = CITY_TOP + spec.height + 0.33;
  const planter = createPlanter(spec.width * 0.72, spec.depth * 0.68, 0.22);
  roofGarden.add(planter);
  const tree = createTree(0.42);
  tree.position.set(-spec.width * 0.16, 0.22, 0.1);
  roofGarden.add(tree);
  group.add(roofGarden);

  return group;
}

function createSkybridge(a, b, height) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const group = new THREE.Group();
  group.position.set((a.x + b.x) / 2, CITY_TOP + height, (a.z + b.z) / 2);
  group.rotation.y = Math.atan2(dx, dz);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, length), bridgeGlass);
  group.add(glass);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, length), paleStone);
  floor.position.y = -0.21;
  floor.castShadow = true;
  group.add(floor);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, length), silver);
  roof.position.y = 0.22;
  group.add(roof);

  const warmStrip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, length * 0.96), warmLight);
  warmStrip.position.y = -0.14;
  group.add(warmStrip);

  const ribCount = Math.max(2, Math.round(length / 0.9));
  for (let index = 0; index <= ribCount; index += 1) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.46, 0.035), ivory);
    rib.position.z = -length / 2 + (index / ribCount) * length;
    group.add(rib);
  }

  return group;
}

function createCentralSpire() {
  const group = new THREE.Group();
  group.position.y = CITY_TOP;

  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.5, 80), waterMaterial);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.015;
  pool.receiveShadow = true;
  group.add(pool);

  const poolRim = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.08, 6, 120), ivory);
  poolRim.rotation.x = -Math.PI / 2;
  poolRim.position.y = 0.04;
  group.add(poolRim);

  const poolInlay = new THREE.Mesh(new THREE.TorusGeometry(2.31, 0.015, 5, 110), bronze);
  poolInlay.rotation.x = -Math.PI / 2;
  poolInlay.position.y = 0.045;
  group.add(poolInlay);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.12, 0.28, 12), ivory);
  base.position.y = 0.14;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const step = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.2, 12), paleStone);
  step.position.y = 0.38;
  step.castShadow = true;
  group.add(step);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.56, 7.9, 8, 1),
    new THREE.MeshStandardMaterial({
      color: 0xe9e4d8,
      roughness: 0.48,
      metalness: 0.28,
      envMapIntensity: 0.9,
    }),
  );
  shaft.position.y = 4.25;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  group.add(shaft);

  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 6.4, 0.11),
      bridgeGlass,
    );
    slot.position.set(Math.cos(angle) * 0.38, 4.5, Math.sin(angle) * 0.38);
    slot.rotation.y = -angle;
    group.add(slot);
  }

  const warmSlot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 6.2, 0.04), warmLight);
  warmSlot.position.set(Math.cos(0.3) * 0.39, 4.4, Math.sin(0.3) * 0.39);
  warmSlot.rotation.y = -0.3;
  group.add(warmSlot);

  const observation = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.56, 16),
    frostedGlass,
  );
  observation.position.y = 7.25;
  group.add(observation);

  const observationTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.68, 0.06, 16),
    silver,
  );
  observationTop.position.y = 7.55;
  group.add(observationTop);

  const observationLight = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.014, 5, 48),
    warmLight,
  );
  observationLight.rotation.x = -Math.PI / 2;
  observationLight.position.y = 7.48;
  group.add(observationLight);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.03, 6, 80), silver);
  halo.position.y = 8.72;
  halo.rotation.set(Math.PI / 2 + 0.12, 0.2, 0);
  group.add(halo);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.65, 8), silver);
  cap.position.y = 8.4;
  cap.castShadow = true;
  group.add(cap);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), warmLight);
  beacon.position.y = 9.02;
  group.add(beacon);

  const spireLight = new THREE.PointLight(0xffd8a2, 6, 6, 2);
  spireLight.position.y = 8.9;
  group.add(spireLight);

  return {
    group,
    update(time) {
      halo.rotation.z = time * 0.04;
      observationLight.material.emissiveIntensity = 0.75 + Math.sin(time * 0.8) * 0.08;
    },
  };
}

function createPlazaDetails() {
  const group = new THREE.Group();

  const benches = [
    { angle: 0.5, radius: 3.2 },
    { angle: 1.65, radius: 3.4 },
    { angle: 3.4, radius: 3.2 },
    { angle: 4.9, radius: 3.4 },
  ];

  benches.forEach((bench) => {
    const b = new THREE.Group();
    b.position.set(
      Math.cos(bench.angle) * bench.radius,
      CITY_TOP,
      Math.sin(bench.angle) * bench.radius,
    );
    b.rotation.y = -bench.angle + Math.PI / 2;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.38), paleStone);
    seat.position.y = 0.35;
    seat.castShadow = true;
    b.add(seat);

    [-0.42, 0.42].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.3), silver);
      leg.position.set(x, 0.16, 0);
      b.add(leg);
    });

    group.add(b);
  });

  const treeSpots = [
    { x: -4.9, z: -3.8, scale: 0.9 },
    { x: 4.9, z: -3.9, scale: 0.75 },
    { x: -4.7, z: 3.6, scale: 0.82 },
  ];

  treeSpots.forEach((spot) => {
    const planter = createPlanter(1.1, 1.1, 0.36);
    planter.position.set(spot.x, CITY_TOP, spot.z);
    group.add(planter);
    const tree = createTree(spot.scale);
    tree.position.set(spot.x, CITY_TOP + 0.36, spot.z);
    group.add(tree);
  });

  const bollardGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.72, 6);
  const bollardTipGeometry = new THREE.SphereGeometry(0.045, 8, 6);
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2 + 0.22;
    const radius = 5.15;
    const bollard = new THREE.Group();
    bollard.position.set(
      Math.cos(angle) * radius,
      CITY_TOP,
      Math.sin(angle) * radius,
    );

    const post = new THREE.Mesh(bollardGeometry, silver);
    post.position.y = 0.36;
    bollard.add(post);

    const tip = new THREE.Mesh(bollardTipGeometry, warmLight);
    tip.position.y = 0.75;
    bollard.add(tip);

    group.add(bollard);
  }

  return group;
}

export function createCity() {
  const group = new THREE.Group();

  const finnedTowers = [
    { x: -3.0, z: 2.0, radius: 1.02, height: 7.15, mood: 'cool', spire: true },
    { x: -1.0, z: 3.85, radius: 0.72, height: 4.65, mood: 'warm' },
  ];
  finnedTowers.forEach((spec) => group.add(createFinnedTower(spec)));

  group.add(
    createSetbackTower({
      x: -1.15,
      z: -3.1,
      width: 2.15,
      depth: 1.8,
      height: 6.4,
      mood: 'warm',
    }),
  );

  group.add(
    createTaperedTower({
      x: 2.55,
      z: -2.15,
      radius: 0.96,
      height: 5.4,
      mood: 'bronze',
    }),
  );

  group.add(
    createSetbackTower({
      x: 3.8,
      z: 0.65,
      width: 1.3,
      depth: 1.25,
      height: 4.5,
      mood: 'cool',
    }),
  );

  group.add(
    createPavilion({
      x: -4.1,
      z: -1.15,
      width: 2.0,
      depth: 1.45,
      height: 2.7,
      mood: 'bronze',
    }),
  );

  group.add(
    createPavilion({
      x: 1.2,
      z: -4.5,
      width: 1.85,
      depth: 1.45,
      height: 2.1,
      mood: 'cool',
    }),
  );

  group.add(
    createPavilion({
      x: 4.75,
      z: -1.3,
      width: 1.45,
      depth: 1.15,
      height: 1.9,
      mood: 'bronze',
    }),
  );

  group.add(
    createSetbackTower({
      x: 0.9,
      z: 4.05,
      width: 1.05,
      depth: 1.05,
      height: 3.6,
      mood: 'bronze',
    }),
  );

  const spire = createCentralSpire();
  group.add(spire.group);

  group.add(createPlazaDetails());

  group.add(createSkybridge({ x: -3.0, z: 2.0 }, { x: -1.0, z: 3.85 }, 3.3));
  group.add(createSkybridge({ x: 2.55, z: -2.15 }, { x: 3.8, z: 0.65 }, 3.15));

  function update(time) {
    spire.update(time);
  }

  return { group, update };
}
