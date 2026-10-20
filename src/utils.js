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
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.46, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const glowTexture = createGlowTexture();

export function createWindowTexture(seed, colors) {
  const width = 128;
  const height = 256;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = width;
  textureCanvas.height = height;
  const context = textureCanvas.getContext('2d');
  const random = mulberry32(seed);

  context.fillStyle = '#05080f';
  context.fillRect(0, 0, width, height);

  const backgroundGradient = context.createLinearGradient(0, 0, 0, height);
  backgroundGradient.addColorStop(0, 'rgba(24,37,57,0.22)');
  backgroundGradient.addColorStop(0.55, 'rgba(10,18,31,0.12)');
  backgroundGradient.addColorStop(1, 'rgba(2,5,10,0.35)');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, width, height);

  const columns = 6;
  const rows = 15;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellWidth + 4;
      const y = row * cellHeight + 4;
      const w = cellWidth - 8;
      const h = cellHeight - 7;
      const roll = random();
      const lit = roll > 0.56;

      if (!lit) {
        context.fillStyle = `rgba(11,22,37,${0.42 + random() * 0.24})`;
        context.fillRect(x, y, w, h);
        continue;
      }

      const color = colors[Math.floor(random() * colors.length)];
      const alpha = 0.38 + random() * 0.5;
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fillRect(x, y, w, h);

      if (random() > 0.62) {
        context.globalAlpha = alpha * 0.32;
        context.fillRect(x - 2, y - 2, w + 4, h + 4);
      }

      context.globalAlpha = 1;
    }
  }

  context.globalAlpha = 0.5;
  context.strokeStyle = '#0a1220';
  context.lineWidth = 3;
  for (let row = 0; row <= rows; row += 1) {
    context.beginPath();
    context.moveTo(0, row * cellHeight);
    context.lineTo(width, row * cellHeight);
    context.stroke();
  }

  context.globalAlpha = 0.32;
  context.strokeStyle = '#192b45';
  for (let column = 0; column <= columns; column += 1) {
    context.beginPath();
    context.moveTo(column * cellWidth, 0);
    context.lineTo(column * cellWidth, height);
    context.stroke();
  }

  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createHoloTexture({
  title = 'NEO AETHER',
  subtitle = 'MAGLEV LOOP // 01',
  accent = '#8ff6ff',
  seed = 1,
} = {}) {
  const width = 512;
  const height = 256;
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = width;
  textureCanvas.height = height;
  const context = textureCanvas.getContext('2d');
  const random = mulberry32(seed);

  context.clearRect(0, 0, width, height);

  const panelGradient = context.createLinearGradient(0, 0, width, height);
  panelGradient.addColorStop(0, 'rgba(22, 111, 138, 0.22)');
  panelGradient.addColorStop(0.55, 'rgba(7, 34, 52, 0.1)');
  panelGradient.addColorStop(1, 'rgba(109, 36, 114, 0.16)');
  context.fillStyle = panelGradient;
  context.fillRect(6, 6, width - 12, height - 12);

  context.strokeStyle = accent;
  context.globalAlpha = 0.76;
  context.lineWidth = 2;
  context.strokeRect(9, 9, width - 18, height - 18);

  context.globalAlpha = 0.95;
  context.lineWidth = 4;
  const corner = 26;
  [
    [9, 9, 1, 1],
    [width - 9, 9, -1, 1],
    [9, height - 9, 1, -1],
    [width - 9, height - 9, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    context.beginPath();
    context.moveTo(x + sx * corner, y);
    context.lineTo(x, y);
    context.lineTo(x, y + sy * corner);
    context.stroke();
  });

  context.globalAlpha = 0.12;
  context.strokeStyle = accent;
  context.lineWidth = 1;
  for (let x = 24; x < width; x += 24) {
    context.beginPath();
    context.moveTo(x, 12);
    context.lineTo(x, height - 12);
    context.stroke();
  }

  context.globalAlpha = 0.16;
  for (let y = 20; y < height; y += 6) {
    context.fillStyle = '#8ff6ff';
    context.fillRect(12, y, width - 24, 1);
  }

  context.globalAlpha = 1;
  context.fillStyle = accent;
  context.font = '600 20px "Bahnschrift", "Segoe UI", sans-serif';
  context.letterSpacing = '6px';
  context.fillText(subtitle, 34, 56);

  context.fillStyle = '#f3ffff';
  context.font = '700 56px "Bahnschrift", "Arial Narrow", "Segoe UI", sans-serif';
  context.letterSpacing = '2px';
  context.fillText(title, 32, 126);

  context.fillStyle = '#8ff6ff';
  context.globalAlpha = 0.8;
  context.fillRect(34, 150, 222, 2);
  context.globalAlpha = 0.42;
  context.fillRect(266, 150, 176, 2);

  context.globalAlpha = 0.78;
  context.fillStyle = accent;
  context.font = '500 16px "Segoe UI", sans-serif';
  context.letterSpacing = '4px';
  context.fillText('SKYLINE TRANSIT · ONLINE', 34, 184);

  context.globalAlpha = 0.4;
  context.fillStyle = '#a8eaff';
  for (let index = 0; index < 12; index += 1) {
    const barHeight = 4 + random() * 22;
    context.fillRect(34 + index * 20, 218 - barHeight, 8, barHeight);
  }

  context.globalAlpha = 0.55;
  context.font = '500 12px "Segoe UI", sans-serif';
  context.textAlign = 'right';
  context.fillText('NEO-07 // 2187', width - 32, 214);
  context.textAlign = 'left';

  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
