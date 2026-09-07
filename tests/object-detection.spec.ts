/**
 * ObjectDetectionService — unit tests
 *
 * We inject a deterministic ModelProvider so no TF.js runtime is needed.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ObjectDetectionService,
  type Detection,
  type ModelProvider,
  type ObjectDetectionModel,
  type CocoSsdPrediction,
} from '../lib/recognition/object-detection';

// ────────────────────────────────────────────────────────────────────────────
// Test helpers
// ────────────────────────────────────────────────────────────────────────────

function makeProvider(predictions: CocoSsdPrediction[]): ModelProvider {
  const model: ObjectDetectionModel = {
    detect: async () => predictions,
  };
  return { load: async () => model };
}

function fakeImage(): HTMLImageElement {
  return {} as HTMLImageElement; // shape is sufficient for the service
}

// ────────────────────────────────────────────────────────────────────────────
// loadModel()
// ────────────────────────────────────────────────────────────────────────────

describe('ObjectDetectionService — loadModel()', () => {
  it('loads model successfully with injected provider', async () => {
    const provider = makeProvider([]);
    const svc = new ObjectDetectionService(provider);
    await expect(svc.loadModel()).resolves.toBeUndefined();
  });

  it('does not call load() twice on repeated calls (model is cached)', async () => {
    const loadSpy = vi.fn().mockResolvedValue({ detect: async () => [] });
    const provider: ModelProvider = { load: loadSpy };
    const svc = new ObjectDetectionService(provider);

    await svc.loadModel();
    await svc.loadModel();

    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('concurrent loadModel() calls only trigger one load', async () => {
    const loadSpy = vi.fn().mockResolvedValue({ detect: async () => [] });
    const svc = new ObjectDetectionService({ load: loadSpy });

    await Promise.all([svc.loadModel(), svc.loadModel(), svc.loadModel()]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// detectObjects()
// ────────────────────────────────────────────────────────────────────────────

describe('ObjectDetectionService — detectObjects()', () => {
  it('returns high-confidence detections', async () => {
    const svc = new ObjectDetectionService(
      makeProvider([{ class: 'person', score: 0.95, bbox: [10, 20, 100, 200] }]),
    );
    const result = await svc.detectObjects(fakeImage());
    expect(result).toHaveLength(1);
    expect(result[0].class).toBe('person');
  });

  it('filters out detections with score ≤ 0.5', async () => {
    const svc = new ObjectDetectionService(
      makeProvider([
        { class: 'car', score: 0.49, bbox: [0, 0, 50, 50] },
        { class: 'dog', score: 0.50, bbox: [0, 0, 50, 50] }, // boundary — filtered
        { class: 'cat', score: 0.51, bbox: [0, 0, 50, 50] }, // kept
      ]),
    );
    const result = await svc.detectObjects(fakeImage());
    expect(result).toHaveLength(1);
    expect(result[0].class).toBe('cat');
  });

  it('rounds score to 3 decimal places', async () => {
    const svc = new ObjectDetectionService(
      makeProvider([{ class: 'bottle', score: 0.99999, bbox: [0, 0, 10, 10] }]),
    );
    const result = await svc.detectObjects(fakeImage());
    expect(result[0].score).toBe(1); // rounds to 1.000
  });

  it('returns empty array when no detections pass threshold', async () => {
    const svc = new ObjectDetectionService(makeProvider([]));
    const result = await svc.detectObjects(fakeImage());
    expect(result).toEqual([]);
  });

  it('returns correct bbox shape', async () => {
    const bbox: [number, number, number, number] = [5, 10, 200, 150];
    const svc = new ObjectDetectionService(
      makeProvider([{ class: 'laptop', score: 0.88, bbox }]),
    );
    const [det] = await svc.detectObjects(fakeImage());
    expect(det.bbox).toEqual(bbox);
  });

  it('handles multiple objects in one image', async () => {
    const svc = new ObjectDetectionService(
      makeProvider([
        { class: 'person', score: 0.95, bbox: [0, 0, 50, 100] },
        { class: 'car', score: 0.87, bbox: [100, 50, 80, 60] },
        { class: 'dog', score: 0.72, bbox: [200, 10, 40, 40] },
      ]),
    );
    const result = await svc.detectObjects(fakeImage());
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.class)).toEqual(['person', 'car', 'dog']);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// setModelProvider()
// ────────────────────────────────────────────────────────────────────────────

describe('ObjectDetectionService — setModelProvider()', () => {
  it('resets cached model when provider is replaced', async () => {
    const firstLoad = vi.fn().mockResolvedValue({ detect: async (): Promise<CocoSsdPrediction[]> => [] });
    const secondLoad = vi.fn().mockResolvedValue({ detect: async (): Promise<CocoSsdPrediction[]> => [] });

    const svc = new ObjectDetectionService({ load: firstLoad });
    await svc.loadModel();

    svc.setModelProvider({ load: secondLoad });
    await svc.loadModel();

    expect(firstLoad).toHaveBeenCalledTimes(1);
    expect(secondLoad).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// detectObjectsFromUrl() — browser guard
// ────────────────────────────────────────────────────────────────────────────

describe('ObjectDetectionService — detectObjectsFromUrl()', () => {
  it('throws in Node environment where window is undefined', async () => {
    const original = (global as any).window;
    delete (global as any).window;

    const svc = new ObjectDetectionService(makeProvider([]));
    await expect(svc.detectObjectsFromUrl('http://example.com/img.jpg'))
      .rejects.toThrow('browser environment');

    (global as any).window = original;
  });
});
