import React, { useState } from 'react';
import { ArrowLeft, Monitor, Sliders } from 'lucide-react';
import { GraphicsConfig, GraphicsQuality, ResolutionMode, TargetFps } from '../types/engine';
import { GRAPHICS_PRESETS } from '../engine/core/GraphicsConfigManager';

interface GraphicsSettingsModalProps {
  config: GraphicsConfig;
  onApply: (next: GraphicsConfig) => void;
  onClose: () => void;
}

export const GraphicsSettingsModal: React.FC<GraphicsSettingsModalProps> = ({
  config,
  onApply,
  onClose,
}) => {
  const [draft, setDraft] = useState<GraphicsConfig>({ ...config });

  const selectQuality = (quality: GraphicsQuality) => {
    setDraft({ ...GRAPHICS_PRESETS[quality] });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#060b16]/80 p-3 sm:p-6">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-amber-500/45 bg-[#0f172a] text-slate-100 shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-700/80 bg-[#162036] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400 hover:text-amber-300"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
              Ajustes Gráficos
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Monitor className="h-3.5 w-3.5" />
            <span>Optimización Android / WebGL</span>
          </div>
        </div>

        {/* Settings rows */}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {/* Calidad Gráfica */}
          <div className="rounded-lg border border-slate-700/70 bg-[#131d33] p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-300">
              Calidad Gráfica
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'low', label: 'Baja' },
                  { id: 'medium', label: 'Media' },
                  { id: 'high', label: 'Alta' },
                ] as const
              ).map((item) => {
                const active = draft.quality === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectQuality(item.id)}
                    className={`rounded py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                      active
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolución */}
          <div className="rounded-lg border border-slate-700/70 bg-[#131d33] p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-300">
              Escala de Resolución
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'auto', label: 'Auto' },
                  { id: '0.5', label: '50%' },
                  { id: '0.75', label: '75%' },
                  { id: '1.0', label: '100%' },
                ] as Array<{ id: ResolutionMode; label: string }>
              ).map((item) => {
                const active = draft.resolution === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, resolution: item.id }))}
                    className={`rounded py-1.5 text-xs font-extrabold uppercase transition-colors ${
                      active
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Límite FPS */}
          <div className="rounded-lg border border-slate-700/70 bg-[#131d33] p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-300">
              Tasa de Fotogramas
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {([30, 60] as TargetFps[]).map((fps) => {
                const active = draft.targetFps === fps;
                return (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, targetFps: fps }))}
                    className={`rounded py-1.5 text-xs font-extrabold uppercase tabular-nums transition-colors ${
                      active
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {fps} FPS
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sombras & Efectos */}
          <div className="rounded-lg border border-slate-700/70 bg-[#131d33] p-3 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-300">
                Sombras Dinámicas
              </span>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, shadows: !d.shadows }))}
                className={`w-14 rounded-full py-1 text-[11px] font-extrabold uppercase transition-colors ${
                  draft.shadows
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {draft.shadows ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-300">
                Niebla Atmosférica
              </span>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, effects: !d.effects }))}
                className={`w-14 rounded-full py-1 text-[11px] font-extrabold uppercase transition-colors ${
                  draft.effects
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {draft.effects ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Distancia de Vista */}
          <div className="sm:col-span-2 rounded-lg border border-slate-700/70 bg-[#131d33] p-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                Distancia de Vista
              </span>
              <span className="tabular-nums text-amber-400">{draft.viewDistance} m</span>
            </div>
            <input
              type="range"
              min={60}
              max={220}
              step={10}
              value={draft.viewDistance}
              onChange={(e) =>
                setDraft((d) => ({ ...d, viewDistance: Number(e.target.value) }))
              }
              className="tactical-slider mt-3 w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-700/80 bg-[#162036] px-4 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-amber-400 px-6 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 hover:bg-amber-300"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
