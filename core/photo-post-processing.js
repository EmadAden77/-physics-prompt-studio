export const XIAOMI_15_ULTRA_PRESET = Object.freeze({
  iso: 'auto',
  lumaNoise: 0.44,
  chromaNoise: 0.23,
  chromaticAberration: 0.46,
  vignette: 0.10,
  wbDrift: 0.020,
  sharpnessReduction: 0.055,
  jpegQuality: 0.94,
  hdrHalo: 0.038
});

function clamp(value, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function cloneImageDataLike(imageData) {
  if (!imageData || !Number.isInteger(imageData.width) || !Number.isInteger(imageData.height) || !imageData.data) {
    throw new TypeError('Expected an ImageData-like object with width, height, and data.');
  }
  const data = new Uint8ClampedArray(imageData.data);
  if (typeof ImageData !== 'undefined') return new ImageData(data, imageData.width, imageData.height);
  return { data, width: imageData.width, height: imageData.height };
}

function mulberry32(seed) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random) {
  const u1 = Math.max(random(), 1e-12);
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function isoScale(iso) {
  const numeric = Number(iso);
  const resolved = Number.isFinite(numeric) && numeric > 0 ? numeric : 800;
  return Math.sqrt(resolved / 800);
}

export function addSensorNoise(imageData, { iso = 800, luma = 0.44, chroma = 0.23, seed = 42 } = {}) {
  const out = cloneImageDataLike(imageData);
  const random = mulberry32(seed);
  const scale = isoScale(iso);
  const lumaSigma = Math.max(0, Number(luma) || 0) * 8 * scale;
  const chromaSigma = Math.max(0, Number(chroma) || 0) * 6 * scale;

  for (let i = 0; i < out.data.length; i += 4) {
    const yNoise = gaussian(random) * lumaSigma;
    const rbNoise = gaussian(random) * chromaSigma;
    const gNoise = gaussian(random) * chromaSigma * 0.35;
    out.data[i] = Math.round(clamp(out.data[i] + yNoise + rbNoise));
    out.data[i + 1] = Math.round(clamp(out.data[i + 1] + yNoise + gNoise));
    out.data[i + 2] = Math.round(clamp(out.data[i + 2] + yNoise - rbNoise));
  }

  return out;
}

export function applyVignette(imageData, { strength = 0.10 } = {}) {
  const out = cloneImageDataLike(imageData);
  const amount = clamp(Number(strength) || 0, 0, 1);
  if (!amount) return out;

  const cx = (out.width - 1) / 2;
  const cy = (out.height - 1) / 2;
  const maxDistance = Math.max(Math.hypot(cx, cy), 1);

  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const radius = Math.hypot(x - cx, y - cy) / maxDistance;
      const factor = 1 - amount * radius * radius;
      const index = (y * out.width + x) * 4;
      out.data[index] = Math.round(clamp(out.data[index] * factor));
      out.data[index + 1] = Math.round(clamp(out.data[index + 1] * factor));
      out.data[index + 2] = Math.round(clamp(out.data[index + 2] * factor));
    }
  }

  return out;
}

function sampleChannel(data, width, height, x, y, channel) {
  const sx = clamp(x, 0, width - 1);
  const sy = clamp(y, 0, height - 1);
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = sx - x0;
  const ty = sy - y0;
  const at = (px, py) => data[(py * width + px) * 4 + channel];
  const top = at(x0, y0) * (1 - tx) + at(x1, y0) * tx;
  const bottom = at(x0, y1) * (1 - tx) + at(x1, y1) * tx;
  return top * (1 - ty) + bottom * ty;
}

export function addChromaticAberration(imageData, { px = 0.46 } = {}) {
  const source = cloneImageDataLike(imageData);
  const out = cloneImageDataLike(imageData);
  const shift = Math.max(0, Number(px) || 0);
  if (!shift) return out;

  const cx = (out.width - 1) / 2;
  const cy = (out.height - 1) / 2;
  const maxRadius = Math.max(Math.hypot(cx, cy), 1);

  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const radius = Math.hypot(dx, dy);
      const edgeWeight = radius / maxRadius;
      const inv = radius > 0 ? 1 / radius : 0;
      const ox = dx * inv * shift * edgeWeight;
      const oy = dy * inv * shift * edgeWeight;
      const index = (y * out.width + x) * 4;
      out.data[index] = Math.round(clamp(sampleChannel(source.data, out.width, out.height, x - ox, y - oy, 0)));
      out.data[index + 2] = Math.round(clamp(sampleChannel(source.data, out.width, out.height, x + ox, y + oy, 2)));
    }
  }

  return out;
}

export function applyJpegArtifacts(imageData, { quality = 0.94 } = {}) {
  const source = cloneImageDataLike(imageData);
  const out = cloneImageDataLike(imageData);
  const q = clamp(Number(quality), 0.05, 1);
  const severity = 1 - q;
  if (severity <= 0) return out;

  const quantStep = Math.max(1, Math.round(1 + severity * 42));
  const blockBlend = Math.min(0.22, severity * 0.9);
  const blockSize = 8;

  for (let by = 0; by < out.height; by += blockSize) {
    for (let bx = 0; bx < out.width; bx += blockSize) {
      const sums = [0, 0, 0];
      let count = 0;
      const yEnd = Math.min(out.height, by + blockSize);
      const xEnd = Math.min(out.width, bx + blockSize);
      for (let y = by; y < yEnd; y += 1) {
        for (let x = bx; x < xEnd; x += 1) {
          const index = (y * out.width + x) * 4;
          sums[0] += source.data[index];
          sums[1] += source.data[index + 1];
          sums[2] += source.data[index + 2];
          count += 1;
        }
      }
      const means = sums.map((sum) => sum / Math.max(count, 1));
      for (let y = by; y < yEnd; y += 1) {
        for (let x = bx; x < xEnd; x += 1) {
          const index = (y * out.width + x) * 4;
          for (let channel = 0; channel < 3; channel += 1) {
            const blended = source.data[index + channel] * (1 - blockBlend) + means[channel] * blockBlend;
            out.data[index + channel] = Math.round(clamp(Math.round(blended / quantStep) * quantStep));
          }
        }
      }
    }
  }

  return out;
}

export function applyHdrHalo(imageData, { intensity = 0.038 } = {}) {
  const source = cloneImageDataLike(imageData);
  const out = cloneImageDataLike(imageData);
  const amount = clamp(Number(intensity) || 0, 0, 0.25);
  if (!amount) return out;

  const luminanceAt = (x, y) => {
    const sx = clamp(x, 0, source.width - 1);
    const sy = clamp(y, 0, source.height - 1);
    const i = (sy * source.width + sx) * 4;
    return source.data[i] * 0.2126 + source.data[i + 1] * 0.7152 + source.data[i + 2] * 0.0722;
  };

  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const center = luminanceAt(x, y);
      const local = (
        luminanceAt(x - 1, y) + luminanceAt(x + 1, y) +
        luminanceAt(x, y - 1) + luminanceAt(x, y + 1)
      ) / 4;
      const halo = (local - center) * amount;
      const index = (y * out.width + x) * 4;
      out.data[index] = Math.round(clamp(out.data[index] + halo));
      out.data[index + 1] = Math.round(clamp(out.data[index + 1] + halo));
      out.data[index + 2] = Math.round(clamp(out.data[index + 2] + halo));
    }
  }

  return out;
}

function applyWhiteBalanceDrift(imageData, drift = 0.020) {
  const out = cloneImageDataLike(imageData);
  const amount = clamp(Number(drift) || 0, -0.1, 0.1);
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = Math.round(clamp(out.data[i] * (1 + amount)));
    out.data[i + 2] = Math.round(clamp(out.data[i + 2] * (1 - amount)));
  }
  return out;
}

function applySharpnessReduction(imageData, reduction = 0.055) {
  const source = cloneImageDataLike(imageData);
  const out = cloneImageDataLike(imageData);
  const amount = clamp(Number(reduction) || 0, 0, 0.5);
  if (!amount) return out;

  for (let y = 0; y < out.height; y += 1) {
    for (let x = 0; x < out.width; x += 1) {
      const index = (y * out.width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        let sum = 0;
        let count = 0;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const sx = clamp(x + ox, 0, out.width - 1);
            const sy = clamp(y + oy, 0, out.height - 1);
            sum += source.data[(sy * out.width + sx) * 4 + channel];
            count += 1;
          }
        }
        const blurred = sum / count;
        out.data[index + channel] = Math.round(clamp(source.data[index + channel] * (1 - amount) + blurred * amount));
      }
    }
  }
  return out;
}

function normalizeFormat(format, fallbackType = 'image/jpeg') {
  const value = String(format || fallbackType).toLowerCase();
  if (value === 'png' || value === 'image/png') return 'image/png';
  if (value === 'jpg' || value === 'jpeg' || value === 'image/jpg' || value === 'image/jpeg') return 'image/jpeg';
  throw new TypeError(`Unsupported output format: ${format}`);
}

async function decodeBlob(blob) {
  if (!(blob instanceof Blob)) throw new TypeError('processImageBlob expects a Blob.');

  if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined') {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('2D canvas context is unavailable.');
    context.drawImage(bitmap, 0, 0);
    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
    if (typeof bitmap.close === 'function') bitmap.close();
    return { imageData, canvas, context };
  }

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof Image !== 'undefined') {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      if (typeof image.decode === 'function') await image.decode();
      else await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('2D canvas context is unavailable.');
      context.drawImage(image, 0, 0);
      return { imageData: context.getImageData(0, 0, canvas.width, canvas.height), canvas, context };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  throw new Error('Image decoding requires browser canvas APIs (createImageBitmap + OffscreenCanvas, or DOM canvas).');
}

async function encodeCanvas(canvas, type, quality) {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type, quality: type === 'image/jpeg' ? quality : undefined });
  }
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas encoding failed.')), type, type === 'image/jpeg' ? quality : undefined);
    });
  }
  throw new Error('Canvas encoding is unavailable.');
}

export async function processImageBlob(blob, preset = XIAOMI_15_ULTRA_PRESET, { seed = 42, format } = {}) {
  const settings = { ...XIAOMI_15_ULTRA_PRESET, ...(preset || {}) };
  const outputType = normalizeFormat(format, blob?.type || 'image/jpeg');
  const decoded = await decodeBlob(blob);
  const resolvedIso = settings.iso === 'auto' ? 800 : settings.iso;

  let imageData = addSensorNoise(decoded.imageData, {
    iso: resolvedIso,
    luma: settings.lumaNoise,
    chroma: settings.chromaNoise,
    seed
  });
  imageData = applyWhiteBalanceDrift(imageData, settings.wbDrift);
  imageData = applyVignette(imageData, { strength: settings.vignette });
  imageData = addChromaticAberration(imageData, { px: settings.chromaticAberration });
  imageData = applySharpnessReduction(imageData, settings.sharpnessReduction);
  imageData = applyHdrHalo(imageData, { intensity: settings.hdrHalo });
  imageData = applyJpegArtifacts(imageData, { quality: settings.jpegQuality });

  decoded.context.putImageData(imageData, 0, 0);

  // Provenance policy: this module performs only visual camera/ISP simulation. It never
  // fabricates, targets, strips, or spoofs C2PA credentials. Pixel re-encoding changes
  // asset bytes, so any future C2PA integration must re-sign the returned Blob through
  // a dedicated provenance layer after processing, while the original Blob remains untouched.
  return encodeCanvas(decoded.canvas, outputType, settings.jpegQuality);
}
