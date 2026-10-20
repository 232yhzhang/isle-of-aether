import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createIslandBase, createSatellitePlatform } from './island.js';
import { createCity } from './city.js';
import { createMaglevLine } from './train.js';
import { createCloudTexture, glowTexture, mulberry32, smooth01 } from './utils.js';

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
renderer.toneMappingExposure = 0.9;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc3d3dc, 0.0023);

const camera = new THREE.PerspectiveCamera(
  44,
  window.innerWidth / window.innerHeight,
  0.1,
  900,
);

const HOME_TARGET = new THREE.Vector3(0, 3.0, 0);
const HOME_VIEW = new THREE.Vector3(17.5, 8.5, 24.5);

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
controls.maxDistance = 62;
controls.minPolarAngle = Math.PI * 0.16;
controls.maxPolarAngle = Math.PI * 0.7;
controls.rotateSpeed = 0.68;
controls.zoomSpeed = 0.8;
controls.autoRotateSpeed = 0.35;
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

function createEnvironmentMap() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#153a56');
  gradient.addColorStop(0.42, '#5d8fa9');
  gradient.addColorStop(0.62, '#f0c391');
  gradient.addColorStop(0.75, '#c2d5dd');
  gradient.addColorStop(1, '#96b0bc');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const sunX = width * 0.22;
  const sunY = height * 0.42;
  const sunGlow = context.createRadialGradient(sunX, sunY, 3, sunX, sunY, 160);
  sunGlow.addColorStop(0, 'rgba(255, 250, 230, 1)');
  sunGlow.addColorStop(0.12, 'rgba(255, 235, 198, 0.9)');
  sunGlow.addColorStop(0.4, 'rgba(255, 222, 178, 0.36)');
  sunGlow.addColorStop(1, 'rgba(255, 220, 180, 0)');
  context.fillStyle = sunGlow;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.16;
  context.fillStyle = '#ffffff';
  for (let index = 0; index < 12; index += 1) {
    const x = (index / 12) * width + 20;
    const y = height * 0.52 + Math.sin(index * 1.7) * 18;
    const w = 90 + (index % 3) * 50;
    context.beginPath();
    context.ellipse(x, y, w, 12 + (index % 2) * 6, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return environment;
}

scene.environment = createEnvironmentMap();
scene.environmentIntensity = 0.32;

/* ---------------------------------- sky ---------------------------------- */

const skyRadius = 300;
const skyGeometry = new THREE.SphereGeometry(skyRadius, 64, 40);
const skyPositions = skyGeometry.attributes.position;
const skyColors = [];
const skyTop = new THREE.Color('#123551');
const skyMid = new THREE.Color('#5b8ea9');
const skyHorizon = new THREE.Color('#f2c28d');
const skyBelow = new THREE.Color('#a3beca');

for (let index = 0; index < skyPositions.count; index += 1) {
  const y = skyPositions.getY(index) / skyRadius;
  let color;

  if (y >= 0) {
    color = skyHorizon.clone().lerp(skyMid, smooth01(y / 0.13));
    color.lerp(skyTop, smooth01((y - 0.11) / 0.66));
  } else {
    color = skyHorizon.clone().lerp(skyBelow, smooth01(-y / 0.2));
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

const sunDirection = new THREE.Vector3(-0.68, 0.26, 0.52).normalize();

const horizonGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffd8a8,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }),
);
horizonGlow.position.set(-150, 18, -235);
horizonGlow.scale.set(190, 88, 1);
scene.add(horizonGlow);

const sunHalo = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xffe5c0,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }),
);
sunHalo.position.copy(sunDirection).multiplyScalar(skyRadius * 0.84);
sunHalo.scale.set(160, 160, 1);
scene.add(sunHalo);

const sunCore = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xfff8e9,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }),
);
sunCore.position.copy(sunHalo.position);
sunCore.scale.set(42, 42, 1);
scene.add(sunCore);

/* -------------------------------- lights --------------------------------- */

const hemisphereLight = new THREE.HemisphereLight(0xd7e8f1, 0x6f6559, 0.46);
scene.add(hemisphereLight);

const sunLight = new THREE.DirectionalLight(0xffd199, 5.2);
sunLight.position.copy(sunDirection).multiplyScalar(58);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -17;
sunLight.shadow.camera.right = 17;
sunLight.shadow.camera.top = 17;
sunLight.shadow.camera.bottom = -17;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 140;
sunLight.shadow.bias = -0.0004;
sunLight.shadow.normalBias = 0.025;
scene.add(sunLight);
scene.add(sunLight.target);

const fillLight = new THREE.DirectionalLight(0xb4d2e7, 0.28);
fillLight.position.set(22, 14, 22);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x9bbfda, 0.34);
rimLight.position.set(12, 12, -26);
scene.add(rimLight);

const bounceLight = new THREE.DirectionalLight(0xcab191, 0.09);
bounceLight.position.set(-10, -18, 8);
scene.add(bounceLight);

/* ------------------------------ world build ------------------------------ */

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
  { x: -15.2, y: 5.2, z: 6.4, scale: 0.34, seed: 31, phase: 0.4 },
  { x: 14.5, y: 2.4, z: -7.4, scale: 0.27, seed: 67, phase: 2.1 },
];

const floatingPlatforms = [];

satelliteSpecs.forEach((spec) => {
  const platform = createSatellitePlatform(spec.seed);
  platform.scale.setScalar(spec.scale);
  platform.position.set(spec.x, spec.y, spec.z);
  platform.rotation.y = spec.phase;
  platform.userData.baseY = spec.y;
  platform.userData.phase = spec.phase;
  platform.userData.spin = 0.02;
  floatersGroup.add(platform);
  floatingPlatforms.push(platform);
});

/* -------------------------------- clouds --------------------------------- */

const cloudTextures = [
  createCloudTexture(101),
  createCloudTexture(211),
  createCloudTexture(307),
];

const cloudsGroup = new THREE.Group();
scene.add(cloudsGroup);

const cloudSpecs = [
  { x: -27, y: -14, z: 18, width: 34, height: 15, seed: 4, opacity: 0.94 },
  { x: 25, y: -20, z: 12, width: 38, height: 16, seed: 7, opacity: 0.9 },
  { x: 14, y: -25, z: 28, width: 32, height: 14, seed: 9, opacity: 0.86 },
  { x: -34, y: -11, z: -6, width: 30, height: 13, seed: 12, opacity: 0.92 },
  { x: 8, y: -28, z: -30, width: 40, height: 17, seed: 13, opacity: 0.84 },
  { x: 37, y: -16, z: 20, width: 32, height: 13, seed: 18, opacity: 0.9 },
  { x: -31, y: 11, z: -27, width: 28, height: 12, seed: 22, opacity: 0.82 },
  { x: 27, y: 14, z: -31, width: 30, height: 12, seed: 24, opacity: 0.76 },
  { x: -43, y: -7, z: 15, width: 36, height: 15, seed: 26, opacity: 0.9 },
  { x: 10, y: -31, z: 8, width: 42, height: 17, seed: 29, opacity: 0.8 },
  { x: -8, y: -29, z: 36, width: 32, height: 13, seed: 33, opacity: 0.76 },
  { x: 1, y: 7, z: -45, width: 36, height: 15, seed: 37, opacity: 0.72 },
  { x: 36, y: 13, z: 34, width: 24, height: 10, seed: 41, opacity: 0.42 },
  { x: -20, y: 15, z: 28, width: 22, height: 9, seed: 43, opacity: 0.36 },
];

const clouds = [];

cloudSpecs.forEach((spec) => {
  const random = mulberry32(spec.seed * 97);
  const group = new THREE.Group();
  group.position.set(spec.x, spec.y, spec.z);

  const layerCount = 3 + Math.floor(random() * 2);
  for (let layer = 0; layer < layerCount; layer += 1) {
    const texture = cloudTextures[Math.floor(random() * cloudTextures.length)];
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: layer === 0 ? 0xffffff : 0xe9f0f2,
      transparent: true,
      opacity: Math.min(0.98, spec.opacity * (0.8 + random() * 0.2)),
      depthWrite: false,
      fog: true,
      blending: THREE.NormalBlending,
    });
    material.rotation = random() * 0.4 - 0.2;

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(
      spec.width * (0.8 + random() * 0.4),
      spec.height * (0.8 + random() * 0.4),
      1,
    );
    sprite.position.set(
      (random() - 0.5) * spec.width * 0.4,
      (random() - 0.5) * spec.height * 0.22,
      (random() - 0.5) * 5,
    );
    group.add(sprite);
  }

  cloudsGroup.add(group);
  clouds.push({
    group,
    baseX: spec.x,
    baseY: spec.y,
    phase: random() * Math.PI * 2,
    drift: 0.15 + random() * 0.2,
  });
});

/* ------------------------------- animation ------------------------------- */

let lastTimestamp = 0;
let elapsed = 0;
let hudTimer = 0;

function updateHud(delta) {
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

  islandGroup.position.y = Math.sin(time * 0.28) * 0.12;
  islandGroup.rotation.z = Math.sin(time * 0.16) * 0.0014;

  islandBase.update(time);
  city.update(time);
  maglev.update(time, delta);

  floatersGroup.rotation.y = time * 0.006;
  floatingPlatforms.forEach((platform) => {
    platform.position.y =
      platform.userData.baseY + Math.sin(time * 0.4 + platform.userData.phase) * 0.28;
    platform.rotation.y += platform.userData.spin * delta;
  });

  cloudsGroup.rotation.y = time * 0.0012;
  clouds.forEach((cloud) => {
    cloud.group.position.x =
      cloud.baseX + Math.sin(time * 0.06 + cloud.phase) * 0.55;
    cloud.group.position.y =
      cloud.baseY + Math.sin(time * 0.16 + cloud.phase) * 0.3;
  });

  updateHud(delta);

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
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);

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
