import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Copy,
  Check,
  X,
  Maximize2,
  Mic,
  Camera,
  Star,
  Sparkles,
  Clipboard,
  RefreshCw,
  Gauge,
  ArrowRight,
  WifiOff,
} from 'lucide-react';
import { Header } from './components/Header';
import { ShowModeModal } from './components/ShowModeModal';
import { VoiceInputModal } from './components/VoiceInputModal';
import { CameraOCRModal } from './components/CameraOCRModal';
import { PhrasebookDrawer } from './components/PhrasebookDrawer';
import { IOSInstallGuide } from './components/IOSInstallGuide';
import {
  TranslationDirection,
  TranslationRecord,
  SpeechSpeed,
  Language,
} from './types';
import { translateText } from './services/translator';
import { speakText } from './services/speech';
import {
  getStoredHistory,
  saveTranslationToHistory,
  toggleFavoriteRecord,
  clearHistoryStorage,
  getStoredTheme,
  setStoredTheme,
  getStoredSpeed,
  setStoredSpeed,
} from './services/storage';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(getStoredTheme);
  const isDark = theme === 'dark';

  // Language Direction
  const [direction, setDirection] = useState<TranslationDirection>('es-ja');
  const sourceLang: Language = direction === 'es-ja' ? 'es' : 'ja';
  const targetLang: Language = direction === 'es-ja' ? 'ja' : 'es';

  // Input & Translation State
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [romaji, setRomaji] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Speech Speed (1.0x normal or 0.7x slow for clarity)
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>(getStoredSpeed);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);

  // Clipboard Copied toast state
  const [copied, setCopied] = useState(false);

  // Local storage history
  const [history, setHistory] = useState<TranslationRecord[]>(getStoredHistory);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  // Modal visibility states
  const [showFullDisplay, setShowFullDisplay] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPhrasebook, setShowPhrasebook] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // PWA and Online hooks
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Debounced translation timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle theme
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  // Toggle speed
  const handleToggleSpeed = () => {
    const nextSpeed: SpeechSpeed = speechSpeed === 1.0 ? 0.7 : 1.0;
    setSpeechSpeed(nextSpeed);
    setStoredSpeed(nextSpeed);
  };

  // Swap Languages
  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'es-ja' ? 'ja-es' : 'es-ja'));
    // If there is an existing translation, swap source and target!
    if (translatedText.trim()) {
      const oldSource = sourceText;
      const oldTarget = translatedText;
      setSourceText(oldTarget);
      setTranslatedText(oldSource);
      setRomaji(direction === 'ja-es' ? oldSource : undefined);
    } else {
      setSourceText('');
      setTranslatedText('');
      setRomaji(undefined);
    }
  };

  // Execute translation
  const executeTranslation = useCallback(
    async (textToTranslate: string, sLang: Language, tLang: Language) => {
      const clean = textToTranslate.trim();
      if (!clean) {
        setTranslatedText('');
        setRomaji(undefined);
        setErrorMessage(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await translateText(clean, sLang, tLang);
        setTranslatedText(result.translatedText);
        setRomaji(result.romaji);
        setEngineUsed(result.engineUsed);

        // Save to persistent localStorage history
        const saved = saveTranslationToHistory({
          sourceText: clean,
          translatedText: result.translatedText,
          romaji: result.romaji,
          sourceLang: sLang,
          targetLang: tLang,
        });
        setCurrentRecordId(saved.id);
        setHistory(getStoredHistory());
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al traducir');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced auto-translate on user typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sourceText.trim()) {
      setTranslatedText('');
      setRomaji(undefined);
      setErrorMessage(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTranslation(sourceText, sourceLang, targetLang);
    }, 650);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sourceText, sourceLang, targetLang, executeTranslation]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text);
      }
    } catch {
      // If permission prompt denied or blocked, notify user
    }
  };

  // Clear source text
  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setRomaji(undefined);
    setErrorMessage(null);
  };

  // Speak target text
  const handleSpeakTarget = async () => {
    if (!translatedText) return;
    setIsSpeakingTarget(true);
    await speakText(translatedText, targetLang, speechSpeed, () => {
      setIsSpeakingTarget(false);
    });
  };

  // Speak source text
  const handleSpeakSource = async () => {
    if (!sourceText) return;
    setIsSpeakingSource(true);
    await speakText(sourceText, sourceLang, speechSpeed, () => {
      setIsSpeakingSource(false);
    });
  };

  // Favorite toggle
  const handleToggleCurrentFavorite = () => {
    if (!currentRecordId) return;
    const updated = toggleFavoriteRecord(currentRecordId);
    setHistory(updated);
  };

  // Current item favorite status
  const isCurrentFavorite = Boolean(
    history.find((h) => h.id === currentRecordId)?.isFavorite
  );

  // Select phrase from phrasebook drawer
  const handleSelectPhrase = (
    src: string,
    tgt: string,
    rom?: string,
    dir?: 'es-ja' | 'ja-es'
  ) => {
    if (dir && dir !== direction) {
      setDirection(dir);
    }
    setSourceText(src);
    setTranslatedText(tgt);
    setRomaji(rom);
  };

  // Voice dictation completed handler
  const handleVoiceInputFinal = (spokenText: string) => {
    setSourceText(spokenText);
    executeTranslation(spokenText, sourceLang, targetLang);
  };

  // Camera OCR completed handler
  const handleCameraTextExtracted = (extractedText: string) => {
    setSourceText(extractedText);
    executeTranslation(extractedText, sourceLang, targetLang);
  };

  // Handle Install button click
  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <div
      className={`h-safe-screen w-full flex flex-col justify-between overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. TOP HEADER */}
      <Header
        direction={direction}
        onToggleDirection={handleToggleDirection}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenPhrasebook={() => setShowPhrasebook(true)}
        onOpenInstallGuide={handleInstallClick}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isOnline={isOnline}
      />

      {/* 2. MAIN TRANSLATION VIEWPORT (Compact, high-contrast, zero-scroll) */}
      <main className="flex-1 px-4 py-1 flex flex-col gap-2.5 overflow-hidden max-w-lg mx-auto w-full">
        {/* CARD A: SOURCE INPUT CARD */}
        <div
          className={`flex-1 flex flex-col rounded-2xl p-3.5 border transition-all shadow-sm ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 focus-within:border-red-500/60'
              : 'bg-white border-slate-200 focus-within:border-red-500/60'
          }`}
        >
          {/* Card Top Info */}
          <div className="flex items-center justify-between pb-1 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              {sourceLang === 'es' ? '🇪🇸 Español (Texto a traducir)' : '🇯🇵 日本語 (入力)'}
            </span>
            <div className="flex items-center gap-1.5">
              {sourceText && (
                <>
                  <button
                    onClick={handleSpeakSource}
                    disabled={isSpeakingSource}
                    className="p-1 rounded-md text-slate-400 hover:text-white transition"
                    title="Escuchar texto original"
                  >
                    <Volume2
                      className={`w-3.5 h-3.5 ${
                        isSpeakingSource ? 'text-amber-400 animate-pulse' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-1 rounded-md text-slate-400 hover:text-red-400 transition"
                    title="Borrar texto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder={
              sourceLang === 'es'
                ? 'Escribe aquí o pulsa el micrófono para hablar...'
                : 'ここに日本語を入力するか、マイクをタップ...'
            }
            rows={3}
            className={`w-full flex-1 bg-transparent resize-none font-medium leading-relaxed focus:outline-none placeholder:text-slate-500 ${
              sourceLang === 'ja' ? 'font-ja text-lg' : 'text-base'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}
          />

          {/* Quick Paste & Count Footer */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <button
              onClick={handlePaste}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-800 transition active:scale-95 text-slate-400 hover:text-slate-200"
            >
              <Clipboard className="w-3 h-3" />
              <span>Pegar</span>
            </button>
            <span>{sourceText.length} caracteres</span>
          </div>
        </div>

        {/* CARD B: TRANSLATION RESULT CARD (Ultra visible typography + Romaji) */}
        <div
          className={`flex-1 flex flex-col justify-between rounded-2xl p-3.5 border transition-all shadow-md relative overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200 shadow-slate-100'
          }`}
        >
          {/* Card Top Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/40 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-red-500">
                {targetLang === 'ja' ? '🇯🇵 Japonés (Traducción)' : '🇪🇸 Español'}
              </span>
              {engineUsed && (
                <span className="text-[9px] font-semibold text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                  {engineUsed === 'offline' ? 'Offline' : engineUsed === 'mymemory' ? 'Gratis' : 'Lingva'}
                </span>
              )}
            </div>

            {/* Quick Actions (Show Mode, Favorite, Copy) */}
            <div className="flex items-center gap-1">
              {translatedText && (
                <>
                  {/* Star Favorite */}
                  <button
                    onClick={handleToggleCurrentFavorite}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-400 transition"
                    title={isCurrentFavorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isCurrentFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded-md text-slate-400 hover:text-white transition flex items-center gap-1"
                    title="Copiar traducción"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Modo Mostrar (Flashcard Fullscreen) */}
                  <button
                    onClick={() => setShowFullDisplay(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/25 border border-red-500/30 text-[11px] font-bold active:scale-95 transition ml-1"
                    title="Abrir en pantalla completa para enseñar a otra persona"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Mostrar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Translation Content Area */}
          <div className="flex-1 flex flex-col justify-center py-2 overflow-y-auto no-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
                <span className="text-xs font-semibold">Traduciendo al instante...</span>
              </div>
            ) : errorMessage ? (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex flex-col gap-1">
                <span className="font-bold">Aviso:</span>
                <span>{errorMessage}</span>
              </div>
            ) : translatedText ? (
              <div className="space-y-2">
                {/* Large Target Text (Kanji / Kana or Spanish) */}
                <p
                  className={`font-black leading-tight tracking-tight select-text ${
                    targetLang === 'ja'
                      ? 'font-ja text-2xl sm:text-3xl text-white'
                      : 'text-xl sm:text-2xl text-white'
                  }`}
                >
                  {translatedText}
                </p>

                {/* Romaji Phonetics Badge (Large & Ultra Visible) */}
                {romaji && targetLang === 'ja' && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 select-text">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                      Lectura en voz alta (Romaji):
                    </span>
                    <p className="text-sm font-semibold text-slate-200 tracking-wide font-sans">
                      {romaji}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-xs">
                {sourceLang === 'es'
                  ? 'Aquí aparecerá la traducción en japonés y su transcripción en Romaji.'
                  : 'Aquí aparecerá la traducción al español.'}
              </div>
            )}
          </div>

          {/* Translation Footer with Big Speak Button & Speed selector */}
          {translatedText && (
            <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between">
              {/* TTS Speak Trigger */}
              <button
                onClick={handleSpeakTarget}
                disabled={isSpeakingTarget}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md active:scale-95 transition ${
                  isSpeakingTarget
                    ? 'bg-amber-500 text-black animate-pulse'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                title="Escuchar pronunciación nativa"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeakingTarget ? 'Reproduciendo...' : 'Escuchar Voz'}</span>
              </button>

              {/* Speed Selector (1.0x vs 0.7x) */}
              <button
                onClick={handleToggleSpeed}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition"
                title="Cambiar velocidad de reproducción"
              >
                <Gauge className="w-3.5 h-3.5 text-red-400" />
                <span>{speechSpeed === 1.0 ? '1.0x (Normal)' : '0.7x (Lenta)'}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. THUMB-FRIENDLY BOTTOM CONTROLS (Designed for 1-hand iPhone usage) */}
      <footer className="w-full px-4 pt-1 pb-safe shrink-0 max-w-lg mx-auto">
        <div
          className={`p-2 rounded-3xl border flex items-center justify-around gap-2 shadow-xl ${
            isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Cámara OCR Button */}
          <button
            onClick={() => setShowCameraModal(true)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition text-slate-300 hover:text-white"
            title="Escanear menú o cartel con la cámara"
          >
            <Camera className="w-5 h-5 text-red-500 mb-0.5" />
            <span className="text-[11px] font-bold">Cámara OCR</span>
          </button>

          {/* Central Prominent Mic Dictation Button */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex-1.2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold shadow-lg shadow-red-600/30 active:scale-95 transition"
            title="Dictar con el micrófono"
          >
            <Mic className="w-5 h-5" />
            <span className="text-xs">Hablar (Voz)</span>
          </button>

          {/* Frases / Guía Rápida */}
          <button
            onClick={() => setShowPhrasebook(true)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition text-slate-300 hover:text-white"
            title="Guía de frases offline e historial"
          >
            <Sparkles className="w-5 h-5 text-amber-400 mb-0.5" />
            <span className="text-[11px] font-bold">Guía Offline</span>
          </button>
        </div>
      </footer>

      {/* 4. MODALS & OVERLAYS */}

      {/* Modo Mostrar (Full-screen for showing to locals) */}
      <ShowModeModal
        isOpen={showFullDisplay}
        onClose={() => setShowFullDisplay(false)}
        text={translatedText}
        romaji={romaji}
        sourceText={sourceText}
        targetLang={targetLang}
        speechSpeed={speechSpeed}
        isDark={isDark}
      />

      {/* Voice Dictation Modal */}
      <VoiceInputModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        sourceLang={sourceLang}
        onSpeechFinal={handleVoiceInputFinal}
        isDark={isDark}
      />

      {/* Camera OCR Scanner Modal */}
      <CameraOCRModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        sourceLang={sourceLang}
        onTextExtracted={handleCameraTextExtracted}
        isDark={isDark}
      />

      {/* Offline Phrasebook & History Drawer */}
      <PhrasebookDrawer
        isOpen={showPhrasebook}
        onClose={() => setShowPhrasebook(false)}
        history={history}
        onSelectPhrase={handleSelectPhrase}
        onToggleFavorite={(id) => setHistory(toggleFavoriteRecord(id))}
        onClearHistory={() => {
          clearHistoryStorage();
          setHistory(getStoredHistory());
        }}
        speechSpeed={speechSpeed}
        isDark={isDark}
      />

      {/* iOS Safari Home Screen Install Guide */}
      <IOSInstallGuide
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        isDark={isDark}
      />
    </div>
  );
}
