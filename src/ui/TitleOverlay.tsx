import React, { useEffect } from 'react';
import { Play, Settings } from 'lucide-react';
import { BrandEmblem } from './BrandEmblem';

interface TitleOverlayProps {
  onStartExplore: () => void;
  onOpenSettings: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  onStartExplore,
  onOpenSettings,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartExplore();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartExplore]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Left tactical menu stack matching reference layout */}
      <div className="pointer-events-auto flex w-64 sm:w-72 flex-col gap-3">
        <BrandEmblem />

        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={onStartExplore}
            className="flex items-center justify-between rounded-md border-2 border-amber-300 bg-amber-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg hover:bg-amber-300 active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-2.5">
              <Play className="h-4 w-4 fill-slate-950" />
              Explorar Base 3D
            </span>
            <span className="text-[10px] font-extrabold text-slate-900/80">FASE 01</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 rounded-md border border-slate-600/90 bg-[#0f172a]/90 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-100 hover:border-amber-400/70 hover:text-amber-300"
          >
            <Settings className="h-4 w-4 text-amber-400" />
            <span>Ajustes Gráficos</span>
          </button>
        </div>
      </div>

      {/* Single flat bottom control hint */}
      <div className="flex items-center justify-between">
        <div className="rounded-md border border-slate-700/80 bg-[#0f172a]/85 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
          WASD / Joystick Mover · Arrastrar Mirar · Espacio Saltar · Enter Iniciar
        </div>
      </div>
    </div>
  );
};
