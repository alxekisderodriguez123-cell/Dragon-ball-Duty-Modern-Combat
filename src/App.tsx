import { useEffect, useRef, useState } from 'react';
import { ControllerState, EngineController } from './game/EngineController';
import { GraphicsSettingsModal } from './ui/GraphicsSettingsModal';
import { LandscapeGuard } from './ui/LandscapeGuard';
import { LoadingScreen } from './ui/LoadingScreen';
import { TitleOverlay } from './ui/TitleOverlay';
import { ExploreHud } from './ui/ExploreHud';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<EngineController | null>(null);
  const [state, setState] = useState<ControllerState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const controller = new EngineController();
    controllerRef.current = controller;

    const unsubscribe = controller.subscribe((next) => {
      setState(next);
    });

    if (mountRef.current) {
      void controller.mountCanvas(mountRef.current);
    }

    return () => {
      unsubscribe();
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const handleRetry = () => {
    if (mountRef.current && controllerRef.current) {
      void controllerRef.current.mountCanvas(mountRef.current);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b1120]">
      {/* Isolated WebGL canvas container: React UI updates never re-create the canvas */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      <LandscapeGuard />

      {state?.phase === 'loading' && (
        <LoadingScreen loading={state.loading} onRetry={handleRetry} />
      )}

      {state?.phase === 'title' && (
        <TitleOverlay
          onStartExplore={() => controllerRef.current?.enterTrainingGround('fps')}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {state?.phase === 'exploring' && controllerRef.current && (
        <ExploreHud
          cameraMode={state.cameraMode}
          telemetry={state.telemetry}
          inputManager={controllerRef.current.engine.input}
          onChangeCamera={(mode) => controllerRef.current?.setCameraMode(mode)}
          onResetPhysics={() => controllerRef.current?.resetPhysicsProps()}
          onOpenSettings={() => setSettingsOpen(true)}
          onExitToTitle={() => controllerRef.current?.returnToTitle()}
        />
      )}

      {settingsOpen && state && (
        <GraphicsSettingsModal
          config={state.graphics}
          onApply={(next) => controllerRef.current?.applyGraphicsConfig(next)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
