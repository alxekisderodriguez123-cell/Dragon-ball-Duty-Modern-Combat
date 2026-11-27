import * as THREE from 'three';
import {
  CameraMode,
  EngineTelemetry,
  GraphicsConfig,
  LoadingState,
} from '../../types/engine';
import { ModelLoader } from '../assets/ModelLoader';
import { CameraRig } from '../graphics/CameraRig';
import { LightingRig } from '../graphics/LightingRig';
import { createProceduralTextures, ProceduralTextureSet } from '../graphics/ProceduralTextures';
import {
  afterDrawFence,
  createStudioEnvironment,
  detectSoftwareWebGL,
  disposeObject3D,
} from '../graphics/WebGLUtils';
import { InputManager, InputSnapshot } from '../input/InputManager';
import { RapierWorld } from '../physics/RapierWorld';
import { buildTrainingBase, BuiltTrainingBase } from '../world/TrainingBaseBuilder';
import { GraphicsConfigManager } from './GraphicsConfigManager';

export interface GameEngineCallbacks {
  onLoadingUpdate: (state: LoadingState) => void;
  onTelemetry: (telemetry: EngineTelemetry) => void;
}

export class GameEngine {
  public readonly configManager = new GraphicsConfigManager();
  public readonly input = new InputManager();
  public readonly modelLoader = new ModelLoader();
  public readonly rapier = new RapierWorld();

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private envTexture: THREE.Texture | null = null;
  private textures: ProceduralTextureSet | null = null;
  private lighting: LightingRig | null = null;
  private cameraRig: CameraRig | null = null;
  private baseWorld: BuiltTrainingBase | null = null;

  private mountEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private isSoftwareGl = false;
  private disposed = false;
  private isExploring = false;

  private rafId = 0;
  private timeoutId = 0;
  private lastTickTime = 0;
  private lastRenderTime = 0;
  private lastTelemetryTime = 0;
  private frameCounter = 0;
  private currentFps = 60;

  // Pre-allocated scratch buffers (zero GC in loop)
  private readonly _inputSnapshot: InputSnapshot = {
    moveX: 0,
    moveZ: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    zoomDelta: 0,
    sprint: false,
    jumpPressed: false,
  };
  private readonly _playerPos = new THREE.Vector3();

  constructor(private readonly callbacks: GameEngineCallbacks) {}

  public async mount(container: HTMLElement): Promise<void> {
    this.mountEl = container;
    this.disposed = false;

    const report = (patch: Partial<LoadingState>, base: LoadingState): LoadingState => {
      const next = { ...base, ...patch };
      this.callbacks.onLoadingUpdate(next);
      return next;
    };

    let loading: LoadingState = {
      progress: 8,
      stageLabel: 'Inicializando WebGL y entorno 3D...',
      rapierReady: false,
      rendererReady: false,
      sceneReady: false,
      error: null,
    };
    this.callbacks.onLoadingUpdate(loading);

    try {
      this.isSoftwareGl = detectSoftwareWebGL();

      const width = Math.max(container.clientWidth, 320);
      const height = Math.max(container.clientHeight, 200);

      const renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.className = 'touch-none-canvas';

      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      this.renderer = renderer;

      const scene = new THREE.Scene();
      this.scene = scene;
      this.envTexture = createStudioEnvironment(renderer, scene);
      this.lighting = new LightingRig(scene);
      this.cameraRig = new CameraRig(width / height);

      loading = report(
        {
          progress: 32,
          rendererReady: true,
          stageLabel: 'Inicializando motor de físicas Rapier 3D...',
        },
        loading,
      );

      await this.rapier.init();
      if (this.disposed) return;

      loading = report(
        {
          progress: 62,
          rapierReady: true,
          stageLabel: 'Construyendo base militar de entrenamiento...',
        },
        loading,
      );

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      this.textures = createProceduralTextures(maxAniso);
      this.baseWorld = buildTrainingBase(this.textures, this.rapier);
      scene.add(this.baseWorld.root);

      this.applyGraphicsConfig(this.configManager.getConfig());

      if (!this.isSoftwareGl) {
        renderer.compile(scene, this.cameraRig.camera);
      }

      this.input.attach(renderer.domElement);
      this.setupResizeHandling(container);

      loading = report(
        {
          progress: 100,
          sceneReady: true,
          stageLabel: 'Motor 3D listo para despliegue',
        },
        loading,
      );

      this.lastTickTime = performance.now();
      this.lastRenderTime = this.lastTickTime;
      this.lastTelemetryTime = this.lastTickTime;
      this.scheduleNextFrame();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al inicializar motor 3D';
      this.callbacks.onLoadingUpdate({
        ...loading,
        error: msg,
        stageLabel: 'Error en inicialización',
      });
    }
  }

  public applyGraphicsConfig(config: GraphicsConfig): void {
    this.configManager.setConfig(config);
    if (!this.renderer || !this.lighting || !this.cameraRig) return;

    const pixelRatio = this.configManager.computePixelRatio(this.isSoftwareGl);
    this.renderer.setPixelRatio(pixelRatio);

    const allowShadows = config.shadows && !this.isSoftwareGl;
    this.renderer.shadowMap.enabled = allowShadows;
    this.lighting.applyGraphicsConfig(
      config,
      this.configManager.getShadowMapSize(),
      this.isSoftwareGl,
    );
    this.cameraRig.setFarPlane(config.viewDistance);

    if (this.mountEl) {
      const w = Math.max(this.mountEl.clientWidth, 320);
      const h = Math.max(this.mountEl.clientHeight, 200);
      this.renderer.setSize(w, h, false);
    }
  }

  public setCameraMode(mode: CameraMode): void {
    if (!this.cameraRig) return;
    this.cameraRig.setMode(mode);
  }

  public getCameraMode(): CameraMode {
    return this.cameraRig?.getMode() ?? 'overview';
  }

  public setExploring(exploring: boolean): void {
    this.isExploring = exploring;
    if (!exploring && this.cameraRig) {
      this.cameraRig.setMode('overview');
    }
  }

  public resetPhysicsTestProps(): void {
    this.rapier.resetDynamicProps();
  }

  public resetPlayerPosition(): void {
    this.rapier.resetPlayerSpawn();
  }

  private setupResizeHandling(container: HTMLElement): void {
    const onResize = () => {
      if (!this.renderer || !this.cameraRig || !this.mountEl) return;
      const w = Math.max(this.mountEl.clientWidth, 1);
      const h = Math.max(this.mountEl.clientHeight, 1);
      this.cameraRig.setAspect(w / h);
      this.renderer.setSize(w, h, false);
    };

    this.resizeObserver = new ResizeObserver(onResize);
    this.resizeObserver.observe(container);
    window.addEventListener('resize', onResize);
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      afterDrawFence(
        this.renderer!,
        () => {
          this.rafId = requestAnimationFrame(this.tick);
        },
        (id) => {
          this.timeoutId = id;
        },
        80,
      );
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private readonly tick = (now: number): void => {
    if (this.disposed || !this.renderer || !this.scene || !this.cameraRig || !this.baseWorld) {
      return;
    }

    const config = this.configManager.getConfig();
    if (!this.isSoftwareGl && config.targetFps === 30) {
      const elapsedSinceRender = now - this.lastRenderTime;
      if (elapsedSinceRender < 31.5) {
        this.rafId = requestAnimationFrame(this.tick);
        return;
      }
    }

    const rawDt = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    this.lastRenderTime = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    const snap = this.input.consumeSnapshot(this._inputSnapshot);
    const camMode = this.cameraRig.getMode();

    let moveWorldX = 0;
    let moveWorldZ = 0;

    if (this.isExploring && camMode !== 'overview') {
      const speed = snap.sprint ? 10.5 : 6.4;
      const yaw = this.cameraRig.getYaw();
      const forwardX = -Math.sin(yaw);
      const forwardZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);

      moveWorldX = (forwardX * snap.moveZ + rightX * snap.moveX) * speed;
      moveWorldZ = (forwardZ * snap.moveZ + rightZ * snap.moveX) * speed;
    }

    this.rapier.step(dt, moveWorldX, moveWorldZ, this.isExploring && snap.jumpPressed);
    this.rapier.getPlayerPosition(this._playerPos);

    this.baseWorld.update(dt, now * 0.001);
    this.cameraRig.update(dt, snap, this._playerPos, this.baseWorld.tpsProxy, this.isExploring);

    this.renderer.render(this.scene, this.cameraRig.camera);

    // Throttled telemetry emission (~2Hz) so React stays quiet
    this.frameCounter++;
    if (now - this.lastTelemetryTime >= 500) {
      const elapsedSec = (now - this.lastTelemetryTime) / 1000;
      this.currentFps = Math.round(this.frameCounter / Math.max(0.1, elapsedSec));
      this.frameCounter = 0;
      this.lastTelemetryTime = now;

      const physStats = this.rapier.getStats();
      this.callbacks.onTelemetry({
        fps: this.currentFps,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        rigidBodies: physStats.rigidBodies,
        colliders: physStats.colliders,
        isSoftwareGl: this.isSoftwareGl,
        cameraMode: camMode,
        playerGrounded: this.rapier.isPlayerGrounded(),
      });
    }

    this.scheduleNextFrame();
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.clearTimeout(this.timeoutId);

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.input.detach();
    this.lighting?.dispose();
    this.modelLoader.dispose();
    this.textures?.dispose();
    this.envTexture?.dispose();

    if (this.scene) {
      disposeObject3D(this.scene);
      this.scene.clear();
    }

    this.rapier.dispose();
    this.renderer?.dispose();

    if (this.mountEl) {
      this.mountEl.innerHTML = '';
    }

    this.renderer = null;
    this.scene = null;
    this.baseWorld = null;
  }
}
