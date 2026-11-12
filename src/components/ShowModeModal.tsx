import React, { useState } from 'react';
import { RotateCw, Volume2, X, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { Language, SpeechSpeed } from '../types';
import { speakText } from '../services/speech';

interface ShowModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  romaji?: string;
  sourceText: string;
  targetLang: Language;
  speechSpeed: SpeechSpeed;
  isDark: boolean;
}

export const ShowModeModal: React.FC<ShowModeModalProps> = ({
  isOpen,
  onClose,
  text,
  romaji,
  sourceText,
  targetLang,
  speechSpeed,
  isDark,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen || !text) return null;

  const handleSpeak = async () => {
    setIsSpeaking(true);
    await speakText(text, targetLang, speechSpeed, () => {
      setIsSpeaking(false);
    });
  };

  const handleZoomIn = () => setScaleFactor((prev) => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setScaleFactor((prev) => Math.max(prev - 0.2, 0.7));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black text-white p-6 pb-safe pt-safe select-none animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold tracking-wide border transition active:scale-95 ${
              isFlipped
                ? 'bg-amber-500 border-amber-400 text-black'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 transition-transform ${isFlipped ? 'rotate-180' : ''}`} />
            {isFlipped ? 'Girar Normal' : 'Girar 180° (Enseñar)'}
          </button>

          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-full px-2 py-1">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-red-400 active:scale-90 transition"
              aria-label="Reducir texto"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-red-400 active:scale-90 transition"
              aria-label="Aumentar texto"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:text-white active:scale-95 transition"
          aria-label="Cerrar modo mostrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Display Card */}
      <div
        className={`flex-1 flex flex-col items-center justify-center text-center px-4 my-auto transition-transform duration-300 ${
          isFlipped ? 'rotate-180' : ''
        }`}
      >
        <p className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-3">
          {targetLang === 'ja' ? 'JAPONÉS / 日本語' : 'ESPAÑOL'}
        </p>

        {/* Large Kanji / Kana or Spanish Text */}
        <h1
          style={{ fontSize: `clamp(2rem, ${7 * scaleFactor}vw, ${4.5 * scaleFactor}rem)` }}
          className={`font-black leading-tight tracking-tight max-w-full break-words text-white drop-shadow-md ${
            targetLang === 'ja' ? 'font-ja' : ''
          }`}
        >
          {text}
        </h1>

        {/* Romaji Transcription if Japanese */}
        {romaji && targetLang === 'ja' && (
          <div className="mt-5 max-w-xl mx-auto px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-0.5">
              Pronunciación (Romaji)
            </p>
            <p
              style={{ fontSize: `clamp(1.1rem, ${4 * scaleFactor}vw, ${2 * scaleFactor}rem)` }}
              className="font-medium text-slate-200 tracking-wide"
            >
              {romaji}
            </p>
          </div>
        )}

        {/* Original phrase for reference */}
        <p className="mt-6 text-sm text-slate-400 line-clamp-2 max-w-md">
          "{sourceText}"
        </p>
      </div>

      {/* Bottom Big Thumb Controls */}
      <div className="flex items-center gap-3 w-full max-w-md mx-auto">
        <button
          onClick={handleSpeak}
          disabled={isSpeaking}
          className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition ${
            isSpeaking
              ? 'bg-amber-500 text-black animate-pulse'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          <Volume2 className="w-6 h-6" />
          {isSpeaking ? 'Reproduciendo...' : 'Escuchar Voz Alta'}
        </button>

        <button
          onClick={onClose}
          className="py-4 px-6 rounded-2xl font-semibold text-base bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-[0.98] transition"
        >
          Volver
        </button>
      </div>
    </div>
  );
};
