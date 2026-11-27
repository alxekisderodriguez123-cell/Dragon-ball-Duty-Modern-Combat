import {
  CameraMode,
  EnginePhase,
  EngineTelemetry,
  GraphicsConfig,
  LoadingState,
} from '../types/engine';
import { GameEngine } from '../engine/core/GameEngine';

export interface ControllerState {
  phase: EnginePhase;
  loading: LoadingState;
  graphics: GraphicsConfig;
  cameraMode: CameraMode;
  telemetry: EngineTelemetry;
}

export class EngineController {
  public readonly engine: GameEngine;
  private phase: EnginePhase = 'loading';
  private loading: LoadingState = {
    progress: 0,
    stageLabel: 'Preparando motor...',
    rapierReady: false,
    rendererReady: false,
    sceneReady: false,
    error: null,
  };
  private telemetry: EngineTelemetry = {
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    rigidBodies: 0,
    colliders: 0,
    isSoftwareGl: false,
    cameraMode: 'overview',
    playerGrounded: true,
  };

  private readonly listeners = new Set<(state: ControllerState) => void>();

  constructor() {
    this.engine = new GameEngine({
      onLoadingUpdate: (loading) => {
        this.loading = loading;
        if (loading.sceneReady && this.phase === 'loading') {
          this.phase = 'title';
        }
        this.emit();
      },
      onTelemetry: (telemetry) => {
        this.telemetry = telemetry;
        this.emit();
      },
    });
  }

  public subscribe(listener: (state: ControllerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): ControllerState {
    return {
      phase: this.phase,
      loading: this.loading,
      graphics: this.engine.configManager.getConfig(),
      cameraMode: this.engine.getCameraMode(),
      telemetry: this.telemetry,
    };
  }

  public async mountCanvas(container: HTMLElement): Promise<void> {
    await this.engine.mount(container);
  }

  public enterTrainingGround(initialCamera: CameraMode = 'fps'): void {
    this.phase = 'exploring';
    this.engine.setExploring(true);
    this.engine.setCameraMode(initialCamera);
    this.emit();
  }

  public returnToTitle(): void {
    this.phase = 'title';
    this.engine.setExploring(false);
    this.engine.setCameraMode('overview');
    this.emit();
  }

  public setCameraMode(mode: CameraMode): void {
    this.engine.setCameraMode(mode);
    this.emit();
  }

  public applyGraphicsConfig(config: GraphicsConfig): void {
    this.engine.applyGraphicsConfig(config);
    this.emit();
  }

  public resetPhysicsProps(): void {
    this.engine.resetPhysicsTestProps();
  }

  public resetPlayerPosition(): void {
    this.engine.resetPlayerPosition();
  }

  public dispose(): void {
    this.listeners.clear();
    this.engine.dispose();
  }

  private emit(): void {
    const snap = this.getState();
    this.listeners.forEach((fn) => fn(snap));
  }
}
