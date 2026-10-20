import * as THREE from 'three';
import { CITY_TOP } from './island.js';
import { createHoloTexture, glowTexture } from './utils.js';

export const TRACK_RADIUS = 6.55;
export const TRACK_Y = 3.34;
export const STATION_ANGLE = 0.35;

const TRAIN_SPEED = 0.24;
const TRAIN_START_OFFSET = 0.9;
const CAR_COUNT = 6;
const CAR_SPACING = 0.3;

const trackMaterial = new THREE.MeshStandardMaterial({
  color: 0x111a27,
  metalness: 0.92,
  roughness: 0.24,
});

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x8196a9,
  metalness: 0.62,
  roughness: 0.3,
  emissive: 0x122233,
  emissiveIntensity: 0.25,
});

const windowMaterial = new THREE.MeshStandardMaterial({
  color: 0x3a1b09,
  emissive: 0xffb347,
  emissiveIntensity: 0.9,
  roughness: 0.12,
  metalness: 0.2,
});

const runningLightMaterial = new THREE.MeshStandardMaterial({
  color: 0x031216,
  emissive: 0x9fefff,
  emissiveIntensity: 1.2,
  roughness: 0.15,
  metalness: 0.2,
});

const underglowMaterial = new THREE.MeshBasicMaterial({
  color: 0x7ef6ff,
  transparent: true,
  opacity: 0.2,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  map: glowTexture,
  fog: false,
  toneMapped: false,
});

const cyanNeon = new THREE.MeshStandardMaterial({
  color: 0x04161c,
  emissive: 0x62f2ff,
  emissiveIntensity: 0.85,
  roughness: 0.18,
  metalness: 0.25,
});

const magentaNeon = new THREE.MeshStandardMaterial({
  color: 0x1b0716,
  emissive: 0xff67d9,
  emissiveIntensity: 0.95,
  roughness: 0.18,
  metalness: 0.2,
});

const stationHoloTexture = createHoloTexture({
  title: 'LOOP 01',
  subtitle: 'NEO AETHER TRANSIT',
  accent: '#7ff4ff',
  seed: 57,
});

function createTrack() {
  const group = new THREE.Group();

  const beam = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS, 0.16, 8, 220),
    trackMaterial,
  );
  beam.rotation.x = -Math.PI / 2;
  beam.position.y = TRACK_Y;
  beam.castShadow = true;
  beam.receiveShadow = true;
  group.add(beam);

  const innerRail = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS - 0.14, 0.022, 6, 220),
    cyanNeon,
  );
  innerRail.rotation.x = -Math.PI / 2;
  innerRail.position.y = TRACK_Y + 0.16;
  group.add(innerRail);

  const outerRail = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS + 0.14, 0.022, 6, 220),
    cyanNeon,
  );
  outerRail.rotation.x = -Math.PI / 2;
  outerRail.position.y = TRACK_Y + 0.16;
  group.add(outerRail);

  const centerLine = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS, 0.032, 6, 220),
    magentaNeon,
  );
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.y = TRACK_Y + 0.19;
  group.add(centerLine);

  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS, 0.4, 8, 120),
    new THREE.MeshBasicMaterial({
      color: 0x5fefff,
      transparent: true,
      opacity: 0.02,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = TRACK_Y - 0.06;
  group.add(glowRing);

  return group;
}

function createPylon(angle) {
  const group = new THREE.Group();
  const radius = TRACK_RADIUS;
  group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  group.rotation.y = -angle;

  const height = TRACK_Y - CITY_TOP - 0.16;
  const column = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, height, 0.26),
    trackMaterial,
  );
  column.position.y = CITY_TOP + height / 2;
  column.castShadow = true;
  column.receiveShadow = true;
  group.add(column);

  const lightStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, height * 0.78, 0.04),
    cyanNeon,
  );
  lightStrip.position.set(0, CITY_TOP + height * 0.46, -0.14);
  group.add(lightStrip);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.46, 0.12, 8),
    trackMaterial,
  );
  base.position.y = CITY_TOP + 0.06;
  base.castShadow = true;
  group.add(base);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.1, 0.38),
    trackMaterial,
  );
  cap.position.y = TRACK_Y - 0.18;
  cap.castShadow = true;
  group.add(cap);

  const capLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.016, 0.2),
    magentaNeon,
  );
  capLight.position.y = TRACK_Y - 0.12;
  group.add(capLight);

  const braceLength = Math.hypot(1.35, height * 0.9);
  const brace = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, braceLength, 0.08),
    trackMaterial,
  );
  brace.position.set(0, CITY_TOP + height * 0.52, -0.62);
  brace.rotation.x = Math.atan2(1.25, height * 0.9);
  brace.castShadow = true;
  group.add(brace);

  const braceLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, braceLength * 0.8, 0.025),
    cyanNeon,
  );
  braceLight.position.set(0.06, brace.position.y, brace.position.z);
  braceLight.rotation.x = brace.rotation.x;
  group.add(braceLight);

  return group;
}

function createStation() {
  const group = new THREE.Group();
  const radius = 5.82;
  group.position.set(
    Math.cos(STATION_ANGLE) * radius,
    CITY_TOP,
    Math.sin(STATION_ANGLE) * radius,
  );
  group.rotation.y = Math.PI / 2 - STATION_ANGLE;

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(4.3, 0.16, 1.42),
    trackMaterial,
  );
  platform.position.y = 2.72;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  const platformEdge = new THREE.Mesh(
    new THREE.BoxGeometry(4.32, 0.03, 0.04),
    cyanNeon,
  );
  platformEdge.position.set(0, 2.81, 0.7);
  group.add(platformEdge);

  const platformInnerEdge = platformEdge.clone();
  platformInnerEdge.position.z = -0.7;
  platformInnerEdge.material = magentaNeon;
  group.add(platformInnerEdge);

  const supportGeometry = new THREE.BoxGeometry(0.12, 2.62, 0.12);
  [-1.65, 1.65].forEach((x) => {
    [-0.42, 0.42].forEach((z) => {
      const support = new THREE.Mesh(supportGeometry, trackMaterial);
      support.position.set(x, 1.32, z);
      support.castShadow = true;
      group.add(support);
    });
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d3240,
    emissive: 0x1b5f73,
    emissiveIntensity: 0.25,
    metalness: 0.4,
    roughness: 0.2,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
  });

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.06, 1.4),
    glassMaterial,
  );
  canopy.position.set(0, 4.5, -0.18);
  group.add(canopy);

  const canopySpine = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 0.08, 0.04),
    trackMaterial,
  );
  canopySpine.position.set(0, 4.53, -0.18);
  group.add(canopySpine);

  const canopyEdgeA = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 0.025, 0.025),
    cyanNeon,
  );
  canopyEdgeA.position.set(0, 4.49, 0.5);
  group.add(canopyEdgeA);

  const canopyEdgeB = canopyEdgeA.clone();
  canopyEdgeB.material = magentaNeon;
  canopyEdgeB.position.z = -0.86;
  group.add(canopyEdgeB);

  const elevator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 2.8, 12),
    glassMaterial,
  );
  elevator.position.set(0.1, 1.4, -1.55);
  group.add(elevator);

  const elevatorGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.33, 0.03, 16),
    cyanNeon,
  );
  elevatorGlow.position.set(0.1, 2.72, -1.55);
  group.add(elevatorGlow);

  const holoMaterial = new THREE.SpriteMaterial({
    map: stationHoloTexture,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const holo = new THREE.Sprite(holoMaterial);
  holo.position.set(0, 5.05, 0.72);
  holo.scale.set(2.3, 1.15, 1);
  group.add(holo);

  const canopyLight = new THREE.PointLight(0x6fefff, 8, 8, 2);
  canopyLight.position.set(0, 4.1, 0);
  group.add(canopyLight);

  return { group, holo, holoMaterial };
}

function createTrainCar(index) {
  const group = new THREE.Group();
  const isLead = index === 0;
  const isTail = index === CAR_COUNT - 1;

  const bodyGeometry = new THREE.CapsuleGeometry(0.34, 1.12, 5, 12);
  bodyGeometry.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const sideWindowGeometry = new THREE.BoxGeometry(0.012, 0.08, 0.14);
  const windowOffsets = [-0.48, -0.24, 0, 0.24, 0.48];
  windowOffsets.forEach((offset) => {
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(0.342, 0.08, offset);
    group.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(-0.342, 0.08, offset);
    group.add(rightWindow);
  });

  const endWindowGeometry = new THREE.BoxGeometry(0.38, 0.08, 0.012);
  const frontWindow = new THREE.Mesh(endWindowGeometry, windowMaterial);
  frontWindow.position.set(0, 0.08, 0.86);
  group.add(frontWindow);

  const rearWindow = new THREE.Mesh(endWindowGeometry, windowMaterial);
  rearWindow.position.set(0, 0.08, -0.86);
  group.add(rearWindow);

  const runningStripGeometry = new THREE.BoxGeometry(0.013, 0.018, 1.2);
  const runningStripLeft = new THREE.Mesh(runningStripGeometry, runningLightMaterial);
  runningStripLeft.position.set(0.346, -0.02, 0.02);
  group.add(runningStripLeft);

  const runningStripRight = new THREE.Mesh(runningStripGeometry, runningLightMaterial);
  runningStripRight.position.set(-0.346, -0.02, 0.02);
  group.add(runningStripRight);

  const upperTrimLeft = new THREE.Mesh(runningStripGeometry, runningLightMaterial);
  upperTrimLeft.position.set(0.328, 0.2, 0.02);
  group.add(upperTrimLeft);

  const upperTrimRight = new THREE.Mesh(runningStripGeometry, runningLightMaterial);
  upperTrimRight.position.set(-0.328, 0.2, 0.02);
  group.add(upperTrimRight);

  const roofStrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 1.08), cyanNeon);
  roofStrip.position.y = 0.342;
  group.add(roofStrip);

  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.055, 1.3),
    isTail ? magentaNeon : cyanNeon,
  );
  skirt.position.y = -0.335;
  group.add(skirt);

  const underglow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), underglowMaterial);
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = -0.4;
  group.add(underglow);

  if (isLead) {
    const noseGeometry = new THREE.ConeGeometry(0.34, 0.48, 12);
    noseGeometry.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.position.set(0, 0, 1.14);
    nose.castShadow = true;
    group.add(nose);

    const noseLight = new THREE.Mesh(runningStripGeometry, runningLightMaterial);
    noseLight.position.set(0, 0.2, 0.98);
    noseLight.scale.set(0.8, 1, 0.8);
    group.add(noseLight);

    const headlight = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xe6feff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    headlight.position.set(0, 0.05, 1.42);
    headlight.scale.set(1.35, 1.35, 1);
    group.add(headlight);

    const headlightPoint = new THREE.PointLight(0x7ff6ff, 12, 7, 2);
    headlightPoint.position.set(0, 0.12, 1.0);
    group.add(headlightPoint);
  }

  if (isTail) {
    const tailLight = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xff4fa8,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    tailLight.position.set(0, 0.02, -1.02);
    tailLight.scale.set(0.8, 0.8, 1);
    group.add(tailLight);
  }

  if (!isTail) {
    const connector = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.12, 0.34),
      bodyMaterial,
    );
    connector.position.set(0, 0.01, -1.04);
    group.add(connector);

    const connectorLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.025, 0.28),
      runningLightMaterial,
    );
    connectorLight.position.set(0, 0.08, -1.04);
    group.add(connectorLight);
  }

  return group;
}

export function createMaglevLine() {
  const group = new THREE.Group();
  group.add(createTrack());

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + 0.4;
    group.add(createPylon(angle));
  }

  const station = createStation();
  group.add(station.group);

  const cars = [];
  for (let index = 0; index < CAR_COUNT; index += 1) {
    const car = createTrainCar(index);
    group.add(car);
    cars.push(car);
  }

  const state = {
    angle: STATION_ANGLE,
    progress: 0,
    speed: 0,
  };

  function update(time, delta) {
    const angle = STATION_ANGLE + TRAIN_START_OFFSET + time * TRAIN_SPEED;

    cars.forEach((car, index) => {
      const carAngle = angle - index * CAR_SPACING;
      car.position.set(
        Math.cos(carAngle) * TRACK_RADIUS,
        TRACK_Y + 0.62 + Math.sin(time * 5 + index * 0.7) * 0.012,
        Math.sin(carAngle) * TRACK_RADIUS,
      );
      car.rotation.y = -carAngle;
    });

    const relativeAngle =
      ((angle - STATION_ANGLE - TRAIN_START_OFFSET) % (Math.PI * 2) + Math.PI * 2) %
      (Math.PI * 2);
    state.angle = relativeAngle;
    state.progress = relativeAngle / (Math.PI * 2);
    state.speed = 300 + Math.sin(time * 0.7) * 7;

    station.holoMaterial.opacity = 0.62 + Math.sin(time * 2.1) * 0.06;
    station.holo.position.y = 5.05 + Math.sin(time * 0.8) * 0.025;
  }

  return { group, update, state };
}
