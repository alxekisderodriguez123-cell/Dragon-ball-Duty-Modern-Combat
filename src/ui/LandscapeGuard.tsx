import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export const LandscapeGuard: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitMobile(portrait);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isPortraitMobile || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090f1d] p-6 text-center text-slate-100">
      <div className="max-w-xs rounded-xl border border-amber-500/50 bg-[#0f172a] p-6">
        <RotateCw className="mx-auto h-10 w-10 text-amber-400" />
        <h2 className="mt-3 text-base font-extrabold uppercase tracking-wide text-white">
          Modo Horizontal Recomendado
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Gira tu teléfono a orientación horizontal para disfrutar de la interfaz táctica y los
          controles de combate 3D.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-4 w-full rounded bg-slate-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 border border-slate-700"
        >
          Continuar de todos modos
        </button>
      </div>
    </div>
  );
};
