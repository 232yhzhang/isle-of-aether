import * as THREE from 'three';
import { CITY_TOP } from './island.js';
import { createSignTexture, glowTexture } from './utils.js';

export const TRACK_RADIUS = 6.55;
export const TRACK_Y = 3.34;
export const STATION_ANGLE = 0.35;

const TRAIN_SPEED = 0.24;
const TRAIN_START_OFFSET = 0.9;
const CAR_COUNT = 6;
const CAR_SPACING = 0.3;

const trackStone = new THREE.MeshStandardMaterial({
  color: 0xd9d4c9,
  roughness: 0.5,
  metalness: 0.08,
  envMapIntensity: 0.7,
});

const guideway = new THREE.MeshStandardMaterial({
  color: 0x736d64,
  roughness: 0.55,
  metalness: 0.16,
  envMapIntensity: 0.7,
});

const silver = new THREE.MeshStandardMaterial({
  color: 0xb5bcbe,
  roughness: 0.25,
  metalness: 0.86,
  envMapIntensity: 1.25,
});

const ivoryTrim = new THREE.MeshStandardMaterial({
  color: 0xe9e3d7,
  roughness: 0.42,
  metalness: 0.18,
  envMapIntensity: 0.9,
});

const bronze = new THREE.MeshStandardMaterial({
  color: 0xa2835b,
  roughness: 0.32,
  metalness: 0.8,
  envMapIntensity: 1.1,
});

const trainBody = new THREE.MeshStandardMaterial({
  color: 0xb09a7c,
  roughness: 0.28,
  metalness: 0.68,
  envMapIntensity: 1.3,
});

const graphite = new THREE.MeshStandardMaterial({
  color: 0x293236,
  roughness: 0.27,
  metalness: 0.72,
  envMapIntensity: 1.15,
});

const darkGlass = new THREE.MeshStandardMaterial({
  color: 0x1d2a30,
  roughness: 0.07,
  metalness: 0.7,
  envMapIntensity: 2,
});

const warmLight = new THREE.MeshStandardMaterial({
  color: 0x4c3b26,
  emissive: 0xffd7a0,
  emissiveIntensity: 0.7,
  roughness: 0.3,
  metalness: 0.2,
});

const stationGlass = new THREE.MeshStandardMaterial({
  color: 0xb8d0d7,
  transparent: true,
  opacity: 0.22,
  roughness: 0.08,
  metalness: 0.2,
  envMapIntensity: 1.8,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const stationSignTexture = createSignTexture('LOOP 01', 'AETHER TRANSIT');

function createTrack() {
  const group = new THREE.Group();

  const beam = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS, 0.15, 8, 240),
    guideway,
  );
  beam.rotation.x = -Math.PI / 2;
  beam.position.y = TRACK_Y;
  beam.castShadow = true;
  beam.receiveShadow = true;
  group.add(beam);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS, 0.035, 6, 240),
    graphite,
  );
  rail.rotation.x = -Math.PI / 2;
  rail.position.y = TRACK_Y + 0.155;
  group.add(rail);

  const innerTrim = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS - 0.14, 0.012, 5, 240),
    bronze,
  );
  innerTrim.rotation.x = -Math.PI / 2;
  innerTrim.position.y = TRACK_Y + 0.12;
  group.add(innerTrim);

  const lightStrip = new THREE.Mesh(
    new THREE.TorusGeometry(TRACK_RADIUS + 0.145, 0.01, 5, 240),
    warmLight,
  );
  lightStrip.rotation.x = -Math.PI / 2;
  lightStrip.position.y = TRACK_Y + 0.08;
  group.add(lightStrip);

  return group;
}

function createPylon(angle) {
  const group = new THREE.Group();
  group.position.set(Math.cos(angle) * TRACK_RADIUS, 0, Math.sin(angle) * TRACK_RADIUS);
  group.rotation.y = -angle;

  const height = TRACK_Y - CITY_TOP - 0.15;
  const column = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, height, 0.24),
    silver,
  );
  column.position.y = CITY_TOP + height / 2;
  column.castShadow = true;
  column.receiveShadow = true;
  group.add(column);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 0.1, 8),
    trackStone,
  );
  base.position.y = CITY_TOP + 0.05;
  base.castShadow = true;
  group.add(base);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.34), bronze);
  collar.position.y = CITY_TOP + height - 0.1;
  group.add(collar);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.32), trackStone);
  cap.position.y = TRACK_Y - 0.18;
  cap.castShadow = true;
  group.add(cap);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, height * 0.86, 0.04), bronze);
  fin.position.set(0, CITY_TOP + height * 0.5, 0.13);
  group.add(fin);

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
    new THREE.BoxGeometry(4.4, 0.18, 1.5),
    trackStone,
  );
  platform.position.y = 2.73;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  const platformEdge = new THREE.Mesh(
    new THREE.BoxGeometry(4.44, 0.025, 0.035),
    bronze,
  );
  platformEdge.position.set(0, 2.83, 0.74);
  group.add(platformEdge);

  const platformGlow = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.012, 0.02),
    warmLight,
  );
  platformGlow.position.set(0, 2.82, -0.63);
  group.add(platformGlow);

  const supportGeometry = new THREE.CylinderGeometry(0.055, 0.075, 2.58, 8);
  [-1.6, 1.6].forEach((x) => {
    [-0.42, 0.42].forEach((z) => {
      const support = new THREE.Mesh(supportGeometry, silver);
      support.position.set(x, 1.29, z);
      support.castShadow = true;
      group.add(support);

      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.17, 0.06, 10),
        bronze,
      );
      foot.position.set(x, 0.03, z);
      group.add(foot);
    });
  });

  const canopyGlassA = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.035, 0.84), stationGlass);
  canopyGlassA.position.set(0, 4.72, 0.34);
  canopyGlassA.rotation.x = 0.16;
  group.add(canopyGlassA);

  const canopyGlassB = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.035, 0.84), stationGlass);
  canopyGlassB.position.set(0, 4.72, -0.34);
  canopyGlassB.rotation.x = -0.16;
  group.add(canopyGlassB);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.06, 0.06), silver);
  ridge.position.y = 4.8;
  ridge.castShadow = true;
  group.add(ridge);

  const ridgeLight = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.012, 0.03), warmLight);
  ridgeLight.position.set(0, 4.7, 0);
  group.add(ridgeLight);

  const frameGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.94);
  [-2.1, -0.7, 0.7, 2.1].forEach((x) => {
    const leftRafter = new THREE.Mesh(frameGeometry, ivoryFrame);
    leftRafter.position.set(x, 4.72, 0.34);
    leftRafter.rotation.x = 0.16;
    group.add(leftRafter);

    const rightRafter = new THREE.Mesh(frameGeometry, ivoryFrame);
    rightRafter.position.set(x, 4.72, -0.34);
    rightRafter.rotation.x = -0.16;
    group.add(rightRafter);

    [0.67, -0.67].forEach((z) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.0, 0.045), ivoryFrame);
      post.position.set(x, 4.12, z);
      group.add(post);
    });
  });

  const elevator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 2.55, 12),
    stationGlass,
  );
  elevator.position.set(0.05, 1.3, -1.6);
  group.add(elevator);

  const elevatorRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 5, 30), silver);
  elevatorRing.rotation.x = -Math.PI / 2;
  elevatorRing.position.set(0.05, 2.45, -1.6);
  group.add(elevatorRing);

  const signPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.4),
    new THREE.MeshBasicMaterial({ map: stationSignTexture }),
  );
  signPanel.position.set(0, 5.05, 0.4);
  group.add(signPanel);

  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.46, 0.03), bronze);
  signFrame.position.set(0, 5.05, 0.39);
  group.add(signFrame);

  const signBracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), silver);
  signBracket.position.set(-0.55, 4.87, 0.4);
  group.add(signBracket);

  const signBracketRight = signBracket.clone();
  signBracketRight.position.x = 0.55;
  group.add(signBracketRight);

  const benchLeft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.09, 0.34), silver);
  benchLeft.position.set(0.4, 3.0, -0.18);
  group.add(benchLeft);

  const benchRight = benchLeft.clone();
  benchRight.position.x = -1.0;
  group.add(benchRight);

  const stationLight = new THREE.PointLight(0xffdcb0, 7, 8, 2);
  stationLight.position.set(0, 4.15, 0);
  group.add(stationLight);

  return { group };
}

const ivoryFrame = new THREE.MeshStandardMaterial({
  color: 0xe2dccf,
  roughness: 0.5,
  metalness: 0.12,
});

function createTrainCar(index) {
  const group = new THREE.Group();
  const isLead = index === 0;
  const isTail = index === CAR_COUNT - 1;

  const bodyGeometry = new THREE.CapsuleGeometry(0.34, 1.12, 6, 16);
  bodyGeometry.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeometry, trainBody);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 1.5), ivoryTrim);
  roof.position.y = 0.33;
  group.add(roof);

  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.012, 1.28), bronze);
  roofTrim.position.y = 0.348;
  group.add(roofTrim);

  const sideWindowGeometry = new THREE.BoxGeometry(0.012, 0.13, 1.34);
  const windowLeft = new THREE.Mesh(sideWindowGeometry, darkGlass);
  windowLeft.position.set(0.342, 0.075, 0.01);
  group.add(windowLeft);

  const windowRight = new THREE.Mesh(sideWindowGeometry, darkGlass);
  windowRight.position.set(-0.342, 0.075, 0.01);
  group.add(windowRight);

  const paneDividerGeometry = new THREE.BoxGeometry(0.018, 0.14, 0.018);
  [-0.44, 0, 0.44].forEach((offset) => {
    const leftDivider = new THREE.Mesh(paneDividerGeometry, silver);
    leftDivider.position.set(0.345, 0.075, offset);
    group.add(leftDivider);

    const rightDivider = new THREE.Mesh(paneDividerGeometry, silver);
    rightDivider.position.set(-0.345, 0.075, offset);
    group.add(rightDivider);
  });

  const waistline = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.02, 1.48), ivoryTrim);
  waistline.position.set(0.343, -0.015, 0.01);
  group.add(waistline);

  const waistlineRight = waistline.clone();
  waistlineRight.position.x = -0.343;
  group.add(waistlineRight);

  const sillLight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 1.15), warmLight);
  sillLight.position.set(0.344, -0.055, 0.01);
  group.add(sillLight);

  const sillLightRight = sillLight.clone();
  sillLightRight.position.x = -0.344;
  group.add(sillLightRight);

  const underbody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.2), darkGlass);
  underbody.position.y = -0.335;
  group.add(underbody);

  const levitationGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.9),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: 0xd8efff,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  levitationGlow.rotation.x = -Math.PI / 2;
  levitationGlow.position.y = -0.43;
  group.add(levitationGlow);

  if (isLead) {
    const noseGeometry = new THREE.ConeGeometry(0.34, 0.5, 16);
    noseGeometry.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeometry, trainBody);
    nose.position.set(0, 0, 1.15);
    nose.castShadow = true;
    group.add(nose);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.015), darkGlass);
    windshield.position.set(0, 0.1, 1.02);
    group.add(windshield);

    const headlight = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xfff3df,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    headlight.position.set(0, 0.03, 1.42);
    headlight.scale.set(1.0, 1.0, 1);
    group.add(headlight);

    const headlightPoint = new THREE.PointLight(0xffe2b8, 8, 6, 2);
    headlightPoint.position.set(0, 0.1, 1.0);
    group.add(headlightPoint);
  }

  if (isTail) {
    const tailLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a1614,
      emissive: 0xff8b6e,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.015), tailLightMaterial);
    tailStrip.position.set(0, 0.06, -0.9);
    group.add(tailStrip);
  }

  if (!isTail) {
    const connector = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.32),
      graphite,
    );
    connector.position.set(0, 0.02, -1.02);
    group.add(connector);

    const connectorBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.018, 0.26),
      ivoryTrim,
    );
    connectorBand.position.set(0, 0.08, -1.02);
    group.add(connectorBand);
  }

  return group;
}

export function createMaglevLine() {
  const group = new THREE.Group();
  group.add(createTrack());

  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2 + 0.35;
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
    angle: 0,
    progress: 0,
    speed: 0,
  };

  function update(time, delta) {
    const angle = STATION_ANGLE + TRAIN_START_OFFSET + time * TRAIN_SPEED;

    cars.forEach((car, index) => {
      const carAngle = angle - index * CAR_SPACING;
      car.position.set(
        Math.cos(carAngle) * TRACK_RADIUS,
        TRACK_Y + 0.66 + Math.sin(time * 4 + index * 0.6) * 0.008,
        Math.sin(carAngle) * TRACK_RADIUS,
      );
      car.rotation.y = -carAngle;
    });

    const relativeAngle =
      ((angle - STATION_ANGLE - TRAIN_START_OFFSET) % (Math.PI * 2) + Math.PI * 2) %
      (Math.PI * 2);
    state.angle = relativeAngle;
    state.progress = relativeAngle / (Math.PI * 2);
    state.speed = 320 + Math.sin(time * 0.65) * 5;
  }

  return { group, update, state };
}
