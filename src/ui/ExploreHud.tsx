import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  Pause,
  RotateCcw,
  Settings,
  User,
  Zap,
} from 'lucide-react';
import { CameraMode, EngineTelemetry } from '../types/engine';
import { InputManager } from '../engine/input/InputManager';

interface ExploreHudProps {
  cameraMode: CameraMode;
  telemetry: EngineTelemetry;
  inputManager: InputManager;
  onChangeCamera: (mode: CameraMode) => void;
  onResetPhysics: () => void;
  onOpenSettings: () => void;
  onExitToTitle: () => void;
}

export const ExploreHud: React.FC<ExploreHudProps> = ({
  cameraMode,
  telemetry,
  inputManager,
  onChangeCamera,
  onResetPhysics,
  onOpenSettings,
  onExitToTitle,
}) => {
  const [showStats, setShowStats] = useState(false);
  const [sprintActive, setSprintActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onExitToTitle();
      } else if (e.code === 'KeyV') {
        const order: CameraMode[] = ['fps', 'tps', 'overview'];
        const next = order[(order.indexOf(cameraMode) + 1) % order.length];
        onChangeCamera(next);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cameraMode, onChangeCamera, onExitToTitle]);

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    setKnobOffset({ x: dx, y: dy });
    inputManager.setVirtualJoystick(dx / maxR, -dy / maxR);
  };

  const resetJoystick = () => {
    joyPointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    inputManager.setVirtualJoystick(0, 0);
  };

  const toggleSprint = () => {
    const next = !sprintActive;
    setSprintActive(next);
    inputManager.setTouchSprint(next);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* Top Perimeter Bar */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-left Pause & Settings */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onExitToTitle}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-600 bg-[#0f172a]/90 text-slate-100 hover:border-amber-400 hover:text-amber-300"
            title="Menú Principal (Esc)"
            aria-label="Menú Principal"
          >
            <Pause className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-600 bg-[#0f172a]/90 text-slate-100 hover:border-amber-400 hover:text-amber-300"
            title="Ajustes Gráficos"
            aria-label="Ajustes Gráficos"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Top-center Camera Mode & Reset Physics */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-slate-700/90 bg-[#0f172a]/90 p-1">
          {(
            [
              { id: 'fps', label: 'FPS', icon: Eye },
              { id: 'tps', label: 'TPS', icon: User },
              { id: 'overview', label: 'Orbital', icon: Eye },
            ] as Array<{ id: CameraMode; label: string; icon: React.FC<{ className?: string }> }>
          ).map((item) => {
            const Icon = item.icon;
            const active = cameraMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeCamera(item.id)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider transition-colors ${
                  active
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mx-0.5 h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={onResetPhysics}
            className="flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-200 hover:bg-slate-800 hover:text-amber-300"
            title="Reiniciar cajas dinámicas Rapier"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reiniciar Cajas</span>
          </button>
        </div>

        {/* Top-right compact FPS pill */}
        <div className="pointer-events-auto rounded-md border border-slate-700/80 bg-[#0f172a]/90 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 tabular-nums">
          {telemetry.fps} FPS
        </div>
      </div>

      {/* Center subtle crosshair in FPS mode */}
      {cameraMode === 'fps' && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <div className="relative h-4 w-4">
            <span className="absolute left-1/2 top-0 h-1.5 w-0.5 -translate-x-1/2 bg-white/80" />
            <span className="absolute left-1/2 bottom-0 h-1.5 w-0.5 -translate-x-1/2 bg-white/80" />
            <span className="absolute top-1/2 left-0 h-0.5 w-1.5 -translate-y-1/2 bg-white/80" />
            <span className="absolute top-1/2 right-0 h-0.5 w-1.5 -translate-y-1/2 bg-white/80" />
          </div>
        </div>
      )}

      {/* Bottom area: Touch Controls + Collapsible Engine Verification Strip */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-left Virtual Thumbstick */}
        {cameraMode !== 'overview' ? (
          <div
            ref={joyRef}
            onPointerDown={(e) => {
              e.stopPropagation();
              joyPointerId.current = e.pointerId;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyPointerId.current !== e.pointerId) return;
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (joyPointerId.current === e.pointerId) {
                resetJoystick();
              }
            }}
            onPointerCancel={resetJoystick}
            className="pointer-events-auto relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 border-slate-500/70 bg-[#0f172a]/60 touch-none"
          >
            <div
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-amber-300 bg-amber-400/80 shadow-md"
              style={{
                transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              }}
            />
          </div>
        ) : (
          <div />
        )}

        {/* Bottom-center Collapsible Engine Diagnostics Drawer */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowStats((s) => !s)}
            className="flex items-center gap-1 rounded-t-md border border-b-0 border-slate-700 bg-[#0f172a]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-amber-300"
          >
            {showStats ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            <span>{showStats ? 'Ocultar Motor' : 'Motor 3D & Rapier'}</span>
          </button>

          {showStats && (
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-slate-700 bg-[#0f172a]/95 px-3 py-1.5 text-[11px] font-semibold text-slate-300 tabular-nums">
              <span>
                Draw Calls: <strong className="text-amber-400">{telemetry.drawCalls}</strong>
              </span>
              <span>
                Tris: <strong className="text-amber-400">{telemetry.triangles.toLocaleString()}</strong>
              </span>
              <span>
                Rapier Bodies: <strong className="text-emerald-400">{telemetry.rigidBodies}</strong>
              </span>
              <span>
                Colliders: <strong className="text-emerald-400">{telemetry.colliders}</strong>
              </span>
              <span>
                Render:{' '}
                <strong className="text-sky-300">
                  {telemetry.isSoftwareGl ? 'Software WebGL' : 'GPU Hardware'}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Bottom-right Jump & Sprint Touch Buttons */}
        {cameraMode !== 'overview' ? (
          <div className="pointer-events-auto flex items-end gap-2.5">
            <button
              type="button"
              onClick={toggleSprint}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                sprintActive
                  ? 'border-amber-300 bg-amber-400 text-slate-950'
                  : 'border-slate-500/80 bg-[#0f172a]/80 text-slate-200'
              }`}
              title="Sprint (Shift)"
              aria-label="Sprint"
            >
              <Zap className="h-5 w-5" />
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                inputManager.triggerTouchJump();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400/90 bg-[#0f172a]/85 text-amber-400 active:bg-amber-400 active:text-slate-950"
              title="Saltar (Espacio)"
              aria-label="Saltar"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
