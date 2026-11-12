import React from 'react';
import { ArrowLeftRight, Moon, Sun, Download, BookOpen, WifiOff } from 'lucide-react';
import { TranslationDirection } from '../types';

interface HeaderProps {
  direction: TranslationDirection;
  onToggleDirection: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenPhrasebook: () => void;
  onOpenInstallGuide: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  direction,
  onToggleDirection,
  isDark,
  onToggleTheme,
  onOpenPhrasebook,
  onOpenInstallGuide,
  isInstallable,
  isInstalled,
  isIOS,
  isOnline,
}) => {
  const isEsToJa = direction === 'es-ja';

  return (
    <header className="w-full px-4 pt-safe pb-2 flex flex-col gap-2 shrink-0">
      {/* Top bar with logo and utility icons */}
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-base shadow-sm">
            声
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block leading-none">
              Koe <span className="text-red-500 font-semibold text-xs">PWA</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Español ⇄ 日本語</span>
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1.5">
          {/* Offline warning badge */}
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}

          {/* Install Button (Suppressed if already installed standalone) */}
          {!isInstalled && (
            <button
              onClick={onOpenInstallGuide}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold active:scale-95 transition"
              title="Instalar en pantalla de inicio de iPhone"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* Phrasebook & History trigger */}
          <button
            onClick={onOpenPhrasebook}
            className={`p-2 rounded-xl transition active:scale-95 ${
              isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700'
            }`}
            aria-label="Abrir guía de frases e historial"
            title="Frases e Historial"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl transition active:scale-95 ${
              isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700'
            }`}
            aria-label="Cambiar tema claro/oscuro"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Prominent Center Language Direction Switcher */}
      <div className="w-full flex items-center justify-center my-1">
        <div
          className={`w-full max-w-sm flex items-center justify-between p-1 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200 shadow-sm'
          }`}
        >
          {/* Left language */}
          <div
            className={`flex-1 py-2 text-center text-xs font-extrabold tracking-wide uppercase transition ${
              isEsToJa ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {isEsToJa ? '🇪🇸 Español' : '🇯🇵 日本語'}
          </div>

          {/* Switch Touch Button */}
          <button
            onClick={onToggleDirection}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-90 text-white shadow-md transition-all flex items-center justify-center mx-1"
            aria-label="Invertir dirección de traducción"
            title="Invertir idiomas"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* Right language */}
          <div
            className={`flex-1 py-2 text-center text-xs font-extrabold tracking-wide uppercase transition ${
              !isEsToJa ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {isEsToJa ? '🇯🇵 日本語' : '🇪🇸 Español'}
          </div>
        </div>
      </div>
    </header>
  );
};
