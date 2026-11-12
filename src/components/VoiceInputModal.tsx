import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, X, Volume2, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../services/speech';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLang: Language;
  onSpeechFinal: (text: string) => void;
  isDark: boolean;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  sourceLang,
  onSpeechFinal,
  isDark,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);

  const isSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (isOpen && isSupported) {
      startListening();
    } else if (!isOpen) {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen, sourceLang]);

  const startListening = () => {
    setErrorMsg(null);
    setTranscript('');
    setIsListening(true);

    const session = startSpeechRecognition(sourceLang, {
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 0) {
          // Finished dictation
          setTimeout(() => {
            onSpeechFinal(text);
            onClose();
          }, 400);
        }
      },
      onError: (err: string) => {
        setIsListening(false);
        setErrorMsg(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognitionRef.current = session;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleManualDone = () => {
    if (transcript.trim()) {
      onSpeechFinal(transcript.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/85 backdrop-blur-md p-6 pt-safe pb-safe animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest font-semibold text-slate-400">
          Dictado por Voz · {sourceLang === 'es' ? 'Español (es-ES)' : 'Japonés (ja-JP)'}
        </span>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
          aria-label="Cerrar dictado"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Listening Interface */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {!isSupported ? (
          <div className="max-w-sm p-5 rounded-2xl bg-red-900/30 border border-red-700/50 text-red-200">
            <MicOff className="w-10 h-10 mx-auto text-red-400 mb-2" />
            <h4 className="font-bold text-base text-white">Micrófono no soportado</h4>
            <p className="text-xs mt-1 text-slate-300">
              Tu navegador no tiene activada la Web Speech API. Abre esta web en Safari en tu iPhone o Chrome.
            </p>
          </div>
        ) : (
          <>
            {/* Animated Mic Button */}
            <div className="relative mb-8">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-red-600/30 animate-pulse-mic" />
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition active:scale-95 ${
                  isListening
                    ? 'bg-red-600 text-white ring-4 ring-red-400/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-2 ring-slate-600'
                }`}
                aria-label={isListening ? 'Detener escucha' : 'Comenzar a hablar'}
              >
                {isListening ? (
                  <Mic className="w-12 h-12 animate-pulse" />
                ) : (
                  <MicOff className="w-10 h-10" />
                )}
              </button>
            </div>

            <p className="text-base font-semibold text-slate-200 tracking-wide">
              {isListening
                ? sourceLang === 'es'
                  ? 'Habla ahora en español...'
                  : '日本語で話してください...'
                : 'Toca el micrófono para hablar'}
            </p>

            {/* Live Transcript Bubble */}
            <div className="mt-6 w-full max-w-md min-h-24 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-center">
              {transcript ? (
                <p className="text-xl font-bold text-white tracking-wide">
                  "{transcript}"
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Las palabras aparecerán aquí en tiempo real...
                </p>
              )}
            </div>

            {errorMsg && (
              <p className="mt-4 text-xs font-medium text-amber-400 max-w-sm bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-xl">
                {errorMsg}
              </p>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md mx-auto flex gap-3">
        {transcript ? (
          <button
            onClick={handleManualDone}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl active:scale-[0.98] transition"
          >
            Traducir ahora
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-slate-300 hover:text-white transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
