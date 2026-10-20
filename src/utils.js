import * as THREE from 'three';

export function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smooth01(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

export function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.48, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const glowTexture = createGlowTexture();

export function createWindowTexture(seed, mood = 'cool') {
  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const random = mulberry32(seed);

  const palettes = {
    cool: {
      glassTop: '#405a69',
      glassBottom: '#17232c',
      mullion: 'rgba(201, 208, 209, 0.7)',
      reflection: 'rgba(141, 177, 194, 0.2)',
      interior: 'rgba(255, 226, 188, 0.34)',
      interiorChance: 0.18,
    },
    warm: {
      glassTop: '#3e4b51',
      glassBottom: '#202628',
      mullion: 'rgba(190, 174, 150, 0.65)',
      reflection: 'rgba(164, 187, 193, 0.16)',
      interior: 'rgba(255, 214, 166, 0.4)',
      interiorChance: 0.24,
    },
    bronze: {
      glassTop: '#3b3c3b',
      glassBottom: '#201f1e',
      mullion: 'rgba(167, 137, 99, 0.7)',
      reflection: 'rgba(181, 183, 173, 0.16)',
      interior: 'rgba(255, 206, 156, 0.38)',
      interiorChance: 0.2,
    },
  };

  const palette = palettes[mood] || palettes.cool;

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, palette.glassTop);
  background.addColorStop(0.55, palette.glassBottom);
  background.addColorStop(1, '#121b21');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.45;
  for (let index = 0; index < 9; index += 1) {
    const x = random() * width;
    const streak = context.createLinearGradient(x, 0, x + 42, 0);
    streak.addColorStop(0, 'rgba(255,255,255,0)');
    streak.addColorStop(0.5, palette.reflection);
    streak.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = streak;
    context.fillRect(x, 0, 42 + random() * 38, height);
  }
  context.globalAlpha = 1;

  const columns = 10;
  const rows = 22;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const litRows = new Set();
  const litRowCount = 2 + Math.floor(random() * 3);
  while (litRows.size < litRowCount) {
    litRows.add(2 + Math.floor(random() * (rows - 4)));
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellWidth;
      const y = row * cellHeight;
      const floorLit = litRows.has(row);

      if (floorLit || random() < palette.interiorChance) {
        const glow = context.createLinearGradient(x, y, x, y + cellHeight);
        glow.addColorStop(0, palette.interior);
        glow.addColorStop(
          0.5,
          floorLit ? 'rgba(255, 213, 165, 0.58)' : palette.interior,
        );
        glow.addColorStop(1, 'rgba(255, 206, 156, 0.04)');
        context.fillStyle = glow;
        context.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      } else if (random() > 0.62) {
        context.fillStyle = 'rgba(194, 214, 221, 0.055)';
        context.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      }
    }
  }

  context.strokeStyle = palette.mullion;
  context.lineWidth = 1.4;
  for (let column = 0; column <= columns; column += 1) {
    context.beginPath();
    context.moveTo(column * cellWidth, 0);
    context.lineTo(column * cellWidth, height);
    context.stroke();
  }

  context.globalAlpha = 0.8;
  context.strokeStyle = 'rgba(218, 222, 219, 0.28)';
  context.lineWidth = 2;
  for (let row = 0; row <= rows; row += 1) {
    context.beginPath();
    context.moveTo(0, row * cellHeight);
    context.lineTo(width, row * cellHeight);
    context.stroke();
  }

  context.globalAlpha = 0.12;
  context.fillStyle = '#ffffff';
  for (let index = 0; index < 90; index += 1) {
    context.fillRect(random() * width, random() * height, 1 + random() * 2, 1);
  }

  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createCloudTexture(seed) {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const random = mulberry32(seed);

  context.clearRect(0, 0, width, height);

  const shadowGradient = context.createRadialGradient(256, 200, 30, 256, 200, 220);
  shadowGradient.addColorStop(0, 'rgba(135, 163, 180, 0.38)');
  shadowGradient.addColorStop(1, 'rgba(135, 163, 180, 0)');
  context.fillStyle = shadowGradient;
  context.fillRect(0, 0, width, height);

  context.filter = 'blur(7px)';

  for (let index = 0; index < 18; index += 1) {
    const x = 80 + random() * 352;
    const y = 100 + random() * 70;
    const radius = 34 + random() * 58;
    const gradient = context.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 253, 249, ${0.48 + random() * 0.24})`);
    gradient.addColorStop(0.55, `rgba(247, 249, 247, ${0.26 + random() * 0.18})`);
    gradient.addColorStop(1, 'rgba(236, 242, 243, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  for (let index = 0; index < 7; index += 1) {
    const x = 120 + random() * 280;
    const y = 160 + random() * 36;
    const radius = 48 + random() * 48;
    const gradient = context.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    gradient.addColorStop(0, 'rgba(186, 205, 216, 0.22)');
    gradient.addColorStop(1, 'rgba(186, 205, 216, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.filter = 'none';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function createSignTexture(title = 'LOOP 01', subtitle = 'AETHER TRANSIT') {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.fillStyle = '#1c272b';
  context.fillRect(0, 0, width, height);

  context.strokeStyle = '#b58f62';
  context.lineWidth = 3;
  context.strokeRect(8, 8, width - 16, height - 16);

  context.strokeStyle = 'rgba(232, 222, 205, 0.28)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(34, 86);
  context.lineTo(width - 34, 86);
  context.stroke();

  context.fillStyle = '#f3ede2';
  context.font = '600 42px "Bahnschrift", "Segoe UI", sans-serif';
  context.letterSpacing = '3px';
  context.fillText(title, 34, 64);

  context.fillStyle = '#d3b184';
  context.font = '500 14px "Segoe UI", sans-serif';
  context.letterSpacing = '5px';
  context.fillText(subtitle, 34, 108);

  context.textAlign = 'right';
  context.fillStyle = '#b58f62';
  context.font = '500 13px "Segoe UI", sans-serif';
  context.letterSpacing = '3px';
  context.fillText('07 / SKYLINE', width - 34, 108);
  context.textAlign = 'left';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
