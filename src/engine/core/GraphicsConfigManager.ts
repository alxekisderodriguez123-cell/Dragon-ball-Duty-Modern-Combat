import { GraphicsConfig, GraphicsQuality } from '../../types/engine';

const STORAGE_KEY = 'db_duty_graphics_v1';

export const GRAPHICS_PRESETS: Record<GraphicsQuality, GraphicsConfig> = {
  low: {
    quality: 'low',
    resolution: '0.75',
    targetFps: 30,
    shadows: false,
    effects: false,
    viewDistance: 100,
  },
  medium: {
    quality: 'medium',
    resolution: 'auto',
    targetFps: 60,
    shadows: true,
    effects: true,
    viewDistance: 150,
  },
  high: {
    quality: 'high',
    resolution: '1.0',
    targetFps: 60,
    shadows: true,
    effects: true,
    viewDistance: 210,
  },
};

export class GraphicsConfigManager {
  private config: GraphicsConfig;

  constructor() {
    this.config = this.load();
  }

  public getConfig(): GraphicsConfig {
    return { ...this.config };
  }

  public setConfig(next: GraphicsConfig): void {
    this.config = { ...next };
    this.save();
  }

  public applyPreset(quality: GraphicsQuality): GraphicsConfig {
    this.config = { ...GRAPHICS_PRESETS[quality] };
    this.save();
    return this.getConfig();
  }

  public computePixelRatio(isSoftwareGl: boolean): number {
    if (isSoftwareGl) {
      return 1;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    switch (this.config.resolution) {
      case '0.5':
        return Math.max(0.5, dpr * 0.5);
      case '0.75':
        return Math.max(0.65, dpr * 0.75);
      case '1.0':
        return dpr;
      case 'auto':
      default:
        if (this.config.quality === 'low') return Math.min(dpr, 1.0);
        if (this.config.quality === 'medium') return Math.min(dpr, 1.5);
        return dpr;
    }
  }

  public getShadowMapSize(): number {
    switch (this.config.quality) {
      case 'low':
        return 512;
      case 'medium':
        return 1024;
      case 'high':
        return 2048;
    }
  }

  private load(): GraphicsConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...GRAPHICS_PRESETS.medium };
      }
      const parsed = JSON.parse(raw) as Partial<GraphicsConfig>;
      const preset = GRAPHICS_PRESETS[parsed.quality ?? 'medium'] ?? GRAPHICS_PRESETS.medium;
      return {
        quality: parsed.quality ?? preset.quality,
        resolution: parsed.resolution ?? preset.resolution,
        targetFps: parsed.targetFps === 30 ? 30 : 60,
        shadows: typeof parsed.shadows === 'boolean' ? parsed.shadows : preset.shadows,
        effects: typeof parsed.effects === 'boolean' ? parsed.effects : preset.effects,
        viewDistance:
          typeof parsed.viewDistance === 'number'
            ? Math.min(220, Math.max(60, parsed.viewDistance))
            : preset.viewDistance,
      };
    } catch {
      return { ...GRAPHICS_PRESETS.medium };
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore storage quota errors
    }
  }
}
