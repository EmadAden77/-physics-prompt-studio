import test from 'node:test';
import assert from 'node:assert/strict';
import {
  XIAOMI_15_ULTRA_PRESET,
  addSensorNoise,
  applyVignette,
  addChromaticAberration,
  applyJpegArtifacts,
  applyHdrHalo,
  processImageBlob
} from '../core/photo-post-processing.js';

function image(width, height, pixel = () => [128, 128, 128, 255]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rgba = pixel(x, y);
      const i = (y * width + x) * 4;
      data[i] = rgba[0];
      data[i + 1] = rgba[1];
      data[i + 2] = rgba[2];
      data[i + 3] = rgba[3] ?? 255;
    }
  }
  return { width, height, data };
}

function meanAbsoluteDelta(a, b) {
  let total = 0;
  let count = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      total += Math.abs(a.data[i + c] - b.data[i + c]);
      count += 1;
    }
  }
  return total / count;
}

test('Xiaomi preset is frozen and exposes the required deterministic defaults', () => {
  assert.equal(Object.isFrozen(XIAOMI_15_ULTRA_PRESET), true);
  assert.equal(XIAOMI_15_ULTRA_PRESET.iso, 'auto');
  assert.equal(XIAOMI_15_ULTRA_PRESET.lumaNoise, 0.44);
  assert.equal(XIAOMI_15_ULTRA_PRESET.chromaNoise, 0.23);
  assert.equal(XIAOMI_15_ULTRA_PRESET.chromaticAberration, 0.46);
  assert.equal(XIAOMI_15_ULTRA_PRESET.vignette, 0.10);
  assert.equal(XIAOMI_15_ULTRA_PRESET.jpegQuality, 0.94);
  assert.equal(XIAOMI_15_ULTRA_PRESET.hdrHalo, 0.038);
});

test('same seed produces byte-for-byte identical sensor noise', () => {
  const source = image(32, 32);
  const first = addSensorNoise(source, { iso: 800, seed: 42 });
  const second = addSensorNoise(source, { iso: 800, seed: 42 });
  assert.deepEqual(first.data, second.data);
});

test('addSensorNoise with iso=3200 produces more noise than iso=200', () => {
  const source = image(64, 64);
  const lowIso = addSensorNoise(source, { iso: 200, seed: 42 });
  const highIso = addSensorNoise(source, { iso: 3200, seed: 42 });
  assert.ok(meanAbsoluteDelta(source, highIso) > meanAbsoluteDelta(source, lowIso));
});

test('applyVignette makes corners darker than the center', () => {
  const source = image( nine = 9, 9, () => [240, 240, 240, 255]);
  const result = applyVignette(source, { strength: 0.20 });
  const center = ((4 * nine) + 4) * 4;
  const corner = 0;
  assert.ok(result.data[corner] < result.data[center]);
  assert.equal(result.data[center], 240);
});

test('addChromaticAberration separates R and B values near high-contrast frame edges', () => {
  const source = image(9, 1, (x) => {
    const value = x < 4 ? 20 : 230;
    return [value, value, value, 255];
  });
  const result = addChromaticAberration(source, { px: 2 });
  const leftEdge = 0;
  const rightEdge = (8 * 4);
  assert.ok(
    result.data[leftEdge] !== result.data[leftEdge + 2] ||
    result.data[rightEdge] !== result.data[rightEdge + 2]
  );
});

test('JPEG artifact and HDR halo passes remain deterministic', () => {
  const source = image(16, 16, (x, y) => {
    const value = (x + y) % 2 ? 220 : 30;
    return [value, value, value, 255];
  });
  const jpegA = applyJpegArtifacts(source, { quality: 0.82 });
  const jpegB = applyJpegArtifacts(source, { quality: 0.82 });
  assert.deepEqual(jpegA.data, jpegB.data);
  const haloA = applyHdrHalo(source, { intensity: 0.038 });
  const haloB = applyHdrHalo(source, { intensity: 0.038 });
  assert.deepEqual(haloA.data, haloB.data);
});

test('processImageBlob is deterministic for the same seed and returns the requested Blob type', async (t) => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalOffscreenCanvas = globalThis.OffscreenCanvas;

  class FakeOffscreenCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.current = image(width, height, (x, y) => {
        const value = 40 + x * 18 + y * 7;
        return [value, value + 3, value + 6, 255];
      });
      const canvas = this;
      this.context = {
        drawImage() {},
        getImageData() {
          return image(canvas.width, canvas.height, (x, y) => {
            const i = (y * canvas.width + x) * 4;
            return [
              canvas.current.data[i],
              canvas.current.data[i + 1],
              canvas.current.data[i + 2],
              canvas.current.data[i + 3]
            ];
          });
        },
        putImageData(next) {
          canvas.current = { width: next.width, height: next.height, data: new Uint8ClampedArray(next.data) };
        }
      };
    }

    getContext(kind) {
      return kind === '2d' ? this.context : null;
    }

    async convertToBlob({ type }) {
      return new Blob([this.current.data], { type });
    }
  }

  globalThis.createImageBitmap = async () => ({ width: 8, height: 8, close() {} });
  globalThis.OffscreenCanvas = FakeOffscreenCanvas;

  t.after(() => {
    if (originalCreateImageBitmap === undefined) delete globalThis.createImageBitmap;
    else globalThis.createImageBitmap = originalCreateImageBitmap;
    if (originalOffscreenCanvas === undefined) delete globalThis.OffscreenCanvas;
    else globalThis.OffscreenCanvas = originalOffscreenCanvas;
  });

  const source = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' });
  const first = await processImageBlob(source, XIAOMI_15_ULTRA_PRESET, { seed: 77, format: 'jpeg' });
  const second = await processImageBlob(source, XIAOMI_15_ULTRA_PRESET, { seed: 77, format: 'image/jpeg' });
  const png = await processImageBlob(source, XIAOMI_15_ULTRA_PRESET, { seed: 77, format: 'png' });

  assert.equal(first.type, 'image/jpeg');
  assert.equal(second.type, 'image/jpeg');
  assert.equal(png.type, 'image/png');
  assert.deepEqual(new Uint8Array(await first.arrayBuffer()), new Uint8Array(await second.arrayBuffer()));
});
