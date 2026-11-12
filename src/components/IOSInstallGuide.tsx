import React from 'react';
import { Share2, PlusSquare, CheckCircle2, X } from 'lucide-react';

interface IOSInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
          isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-900'
        } pb-safe`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white text-base shadow-md">
              声
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Instalar en iPhone</h3>
              <p className="text-xs text-slate-400">Sin Mac, sin App Store ni Xcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          <div className={`flex items-start gap-3.5 p-3 rounded-xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-50'}`}>
            <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">1. Toca Compartir</p>
              <p className="text-xs text-slate-400 mt-0.5">
                En la barra inferior de Safari en tu iPhone, pulsa el botón de <strong className="text-blue-400">Compartir</strong> (cuadrado con flecha hacia arriba).
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3.5 p-3 rounded-xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-50'}`}>
            <div className="p-2 rounded-lg bg-slate-700 text-white shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">2. Añadir a pantalla de inicio</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Desplaza la lista hacia abajo y selecciona <strong className={isDark ? 'text-white' : 'text-slate-900'}>"Añadir a pantalla de inicio"</strong>.
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3.5 p-3 rounded-xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-50'}`}>
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">3. Pulsa Añadir</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Toca <strong className="text-emerald-400">"Añadir"</strong> en la esquina superior derecha. Se abrirá a pantalla completa como una app nativa.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white shadow-lg transition"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
};
