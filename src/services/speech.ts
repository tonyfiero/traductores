import { Language, SpeechSpeed } from '../types';

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
    // Fallback timer if onvoiceschanged doesn't fire
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 250);
  });
}

// Pre-warm voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

/**
 * Finds optimal voice for language
 */
function findBestVoice(lang: Language, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const targetPrefix = lang === 'es' ? 'es' : 'ja';
  
  // Prioritize native/high quality iOS voices (e.g., Kyoko, Otoya, Monica, Jorge)
  const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  if (matches.length === 0) return null;

  // Look for preferred regional voices
  if (lang === 'es') {
    const esES = matches.find((v) => v.lang.toLowerCase() === 'es-es');
    if (esES) return esES;
  } else {
    const jaJP = matches.find((v) => v.lang.toLowerCase() === 'ja-jp');
    if (jaJP) return jaJP;
  }

  return matches[0];
}

/**
 * Speaks text using Web Speech API with selected speed
 */
export async function speakText(
  text: string,
  lang: Language,
  speed: SpeechSpeed = 1.0,
  onEnd?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const cleanText = text.trim();
  if (!cleanText) return false;

  window.speechSynthesis.cancel(); // Stop any pending audio

  const voices = cachedVoices.length > 0 ? cachedVoices : await loadVoices();
  const utterance = new SpeechSynthesisUtterance(cleanText);

  utterance.lang = lang === 'es' ? 'es-ES' : 'ja-JP';
  utterance.rate = speed; // 1.0x normal or 0.7x slow
  utterance.pitch = 1.0;

  const voice = findBestVoice(lang, voices);
  if (voice) {
    utterance.voice = voice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stops any active speech
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Checks if Speech Recognition is supported on this browser (Safari iOS 14.5+ supports webkitSpeechRecognition)
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export interface RecognitionCallbacks {
  onStart: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

/**
 * Creates and starts a Speech Recognition session
 */
export function startSpeechRecognition(
  lang: Language,
  callbacks: RecognitionCallbacks
): { stop: () => void; abort: () => void } | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionClass =
    (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    callbacks.onError('Tu navegador o dispositivo no soporta dictado por voz.');
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang === 'es' ? 'es-ES' : 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      callbacks.onStart();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      callbacks.onResult(text, Boolean(finalTranscript));
    };

    recognition.onerror = (event: any) => {
      let msg = 'Error en el reconocimiento de voz.';
      if (event.error === 'not-allowed') {
        msg = 'Permiso de micrófono denegado. Permite el acceso al micrófono en Ajustes > Safari.';
      } else if (event.error === 'no-speech') {
        msg = 'No se detectó voz. Inténtalo de nuevo acercando el teléfono.';
      } else if (event.error === 'network') {
        msg = 'Se requiere conexión a Internet para el dictado por voz.';
      }
      callbacks.onError(msg);
    };

    recognition.onend = () => {
      callbacks.onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
      abort: () => {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      },
    };
  } catch (err) {
    callbacks.onError('No se pudo iniciar el micrófono: ' + (err instanceof Error ? err.message : String(err)));
    return null;
  }
}
