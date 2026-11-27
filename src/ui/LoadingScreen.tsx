import React from 'react';
import { CheckCircle2, Cpu, AlertTriangle } from 'lucide-react';
import { LoadingState } from '../types/engine';
import { BrandEmblem } from './BrandEmblem';

interface LoadingScreenProps {
  loading: LoadingState;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ loading, onRetry }) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#090f1d] px-6 py-4 text-slate-100">
      <div className="w-full max-w-xl rounded-xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <BrandEmblem compact />
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
            Fase 01 · Fundación del Motor 3D
          </div>
        </div>

        {loading.error ? (
          <div className="mt-5 rounded-lg border border-red-500/50 bg-red-950/60 p-4 text-sm text-red-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>No se pudo iniciar el motor 3D</span>
            </div>
            <p className="mt-1 text-xs text-red-300">{loading.error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded bg-amber-400 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 hover:bg-amber-300"
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>{loading.stageLabel}</span>
                <span className="tabular-nums text-amber-400">{Math.round(loading.progress)}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(4, loading.progress))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-medium">
              <div
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 ${
                  loading.rendererReady
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {loading.rendererReady ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Cpu className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>WebGL / Three.js</span>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 ${
                  loading.rapierReady
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {loading.rapierReady ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Cpu className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>Físicas Rapier 3D</span>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 ${
                  loading.sceneReady
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                {loading.sceneReady ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Cpu className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>Base Militar 3D</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
