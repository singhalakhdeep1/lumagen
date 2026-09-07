/**
 * ObjectDetectionService — TensorFlow.js COCO-SSD integration.
 *
 * Architecture:
 *  - In browser/production: loads the real @tensorflow-models/coco-ssd model
 *    via dynamic import. The model is lazy-loaded on first call.
 *  - In Node/test environments (no DOM): the service accepts an injected
 *    `ModelProvider` so tests can inject a deterministic fake without
 *    needing a real TF.js runtime.
 *
 * Environment detection:
 *  - If `window` is undefined (Node/test), the service cannot load the real
 *    model and will throw unless a provider is injected via `setModelProvider`.
 */

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface CocoSsdPrediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export interface ObjectDetectionModel {
  detect(image: HTMLImageElement | HTMLCanvasElement): Promise<CocoSsdPrediction[]>;
}

export interface ModelProvider {
  load(): Promise<ObjectDetectionModel>;
}

/** Real TF.js COCO-SSD provider — used in browser environments */
class TfjsCocoSsdProvider implements ModelProvider {
  async load(): Promise<ObjectDetectionModel> {
    // Dynamic import keeps TF.js out of the SSR/Node bundle
    const cocoSsd = await import('@tensorflow-models/coco-ssd' as any);
    return cocoSsd.load();
  }
}

export class ObjectDetectionService {
  private model: ObjectDetectionModel | null = null;
  private provider: ModelProvider;
  private loading: Promise<void> | null = null;

  constructor(provider?: ModelProvider) {
    this.provider = provider ?? new TfjsCocoSsdProvider();
  }

  /** Allow test injection of a deterministic model provider */
  setModelProvider(provider: ModelProvider): void {
    this.provider = provider;
    this.model = null;
    this.loading = null;
  }

  /** Lazy-load model — idempotent, concurrent calls are coalesced */
  async loadModel(): Promise<void> {
    if (this.model) return;
    if (!this.loading) {
      this.loading = this.provider.load().then((m) => {
        this.model = m;
        this.loading = null;
      });
    }
    return this.loading;
  }

  async detectObjects(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<Detection[]> {
    await this.loadModel();
    if (!this.model) throw new Error('Model failed to load');

    const raw = await this.model.detect(imageElement);
    return raw
      .filter((d) => d.score > 0.5) // drop low-confidence predictions
      .map((d) => ({
        class: d.class,
        score: Math.round(d.score * 1000) / 1000, // 3dp
        bbox: d.bbox,
      }));
  }

  async detectObjectsFromUrl(imageUrl: string): Promise<Detection[]> {
    if (typeof window === 'undefined') {
      throw new Error('detectObjectsFromUrl requires a browser environment (HTMLImageElement)');
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    });

    return this.detectObjects(img);
  }

  async batchDetect(imageUrls: string[]): Promise<Detection[][]> {
    return Promise.all(imageUrls.map((url) => this.detectObjectsFromUrl(url)));
  }
}

/** Singleton for use in app code */
export const objectDetectionService = new ObjectDetectionService();
