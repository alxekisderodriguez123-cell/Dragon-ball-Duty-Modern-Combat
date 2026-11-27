export type GraphicsQuality = 'low' | 'medium' | 'high';
export type ResolutionMode = 'auto' | '0.5' | '0.75' | '1.0';
export type TargetFps = 30 | 60;

export interface GraphicsConfig {
  quality: GraphicsQuality;
  resolution: ResolutionMode;
  targetFps: TargetFps;
  shadows: boolean;
  effects: boolean;
  viewDistance: number; // 60 to 220 meters
}

export type CameraMode = 'overview' | 'fps' | 'tps';

export type EnginePhase = 'loading' | 'title' | 'exploring';

export interface LoadingState {
  progress: number; // 0 to 100
  stageLabel: string;
  rapierReady: boolean;
  rendererReady: boolean;
  sceneReady: boolean;
  error: string | null;
}

export interface EngineTelemetry {
  fps: number;
  drawCalls: number;
  triangles: number;
  rigidBodies: number;
  colliders: number;
  isSoftwareGl: boolean;
  cameraMode: CameraMode;
  playerGrounded: boolean;
}

export interface ColliderBoxSpec {
  id: string;
  cx: number;
  cy: number;
  cz: number;
  hx: number;
  hy: number;
  hz: number;
}

export interface DynamicPropSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  hx: number;
  hy: number;
  hz: number;
  mass: number;
  variant: 'crate' | 'barrel';
}
