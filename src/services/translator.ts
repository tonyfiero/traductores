import { Language, TranslationRecord } from '../types';
import { japaneseToRomaji } from './romaji';
import { OFFLINE_PHRASEBOOK } from '../data/phrasebook';

// List of free fallback translation endpoints
const LINGVA_INSTANCES = [
  'https://lingva.ml/api/v1',
  'https://translate.plausibility.cloud/api/v1',
  'https://lingva.lunar.icu/api/v1',
];

interface TranslationResult {
  translatedText: string;
  romaji?: string;
  engineUsed: 'mymemory' | 'lingva' | 'offline';
}

/**
 * Searches offline phrasebook for an exact or high-confidence match
 */
function searchOfflinePhrasebook(text: string, fromLang: Language, toLang: Language): { text: string; romaji?: string } | null {
  const normalized = text.trim().toLowerCase().replace(/[¿?¡!.,]/g, '');
  if (!normalized) return null;

  for (const item of OFFLINE_PHRASEBOOK) {
    if (fromLang === 'es' && toLang === 'ja') {
      const esClean = item.es.toLowerCase().replace(/[¿?¡!.,]/g, '');
      if (esClean === normalized || esClean.includes(normalized) || normalized.includes(esClean)) {
        return { text: item.ja, romaji: item.romaji };
      }
    } else if (fromLang === 'ja' && toLang === 'es') {
      const jaClean = item.ja.replace(/[¿?¡!.,]/g, '');
      const romajiClean = item.romaji.toLowerCase().replace(/[¿?¡!.,]/g, '');
      if (jaClean.includes(text.trim()) || text.trim().includes(jaClean) || romajiClean === normalized) {
        return { text: item.es };
      }
    }
  }

  return null;
}

/**
 * Calls MyMemory Translated API (Free, no API key required)
 */
async function translateWithMyMemory(text: string, fromLang: Language, toLang: Language): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`MyMemory HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      const result = data.responseData.translatedText;
      // Filter out MyMemory quota exceeded or error responses
      if (result.startsWith('MYMEMORY WARNING:')) {
        throw new Error('MyMemory quota warning');
      }
      return result;
    }
    throw new Error('Empty response from MyMemory');
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Calls a public Lingva instance (Free Google Translate front-end)
 */
async function translateWithLingva(text: string, fromLang: Language, toLang: Language): Promise<string> {
  for (const instance of LINGVA_INSTANCES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `${instance}/${fromLang}/${toLang}/${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.translation) {
          return data.translation;
        }
      }
    } catch {
      clearTimeout(timeoutId);
      // Try next instance
      continue;
    }
  }

  throw new Error('All fallback Lingva instances unavailable');
}

/**
 * Main translation dispatcher with offline checks, primary MyMemory, and Lingva fallback
 */
export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language
): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: '', engineUsed: 'offline' };
  }

  // 1. Check offline phrasebook first (lightning fast!)
  const offlineMatch = searchOfflinePhrasebook(trimmed, fromLang, toLang);

  // If navigator is offline, return offline match or friendly notice
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (offlineMatch) {
      return {
        translatedText: offlineMatch.text,
        romaji: offlineMatch.romaji || (toLang === 'ja' ? japaneseToRomaji(offlineMatch.text) : undefined),
        engineUsed: 'offline',
      };
    }
    throw new Error('Sin conexión a Internet. Consulta la guía de frases sin conexión.');
  }

  // 2. Try primary free engine: MyMemory
  try {
    const translated = await translateWithMyMemory(trimmed, fromLang, toLang);
    let romaji: string | undefined;
    if (toLang === 'ja') {
      romaji = offlineMatch?.romaji || japaneseToRomaji(translated);
    }
    return {
      translatedText: translated,
      romaji,
      engineUsed: 'mymemory',
    };
  } catch (myMemoryError) {
    console.warn('MyMemory failed, trying Lingva fallback...', myMemoryError);
  }

  // 3. Try secondary free engine: Lingva
  try {
    const translated = await translateWithLingva(trimmed, fromLang, toLang);
    let romaji: string | undefined;
    if (toLang === 'ja') {
      romaji = offlineMatch?.romaji || japaneseToRomaji(translated);
    }
    return {
      translatedText: translated,
      romaji,
      engineUsed: 'lingva',
    };
  } catch (lingvaError) {
    console.warn('Lingva failed, checking offline dictionary...', lingvaError);
  }

  // 4. Final offline fallback if available
  if (offlineMatch) {
    return {
      translatedText: offlineMatch.text,
      romaji: offlineMatch.romaji || (toLang === 'ja' ? japaneseToRomaji(offlineMatch.text) : undefined),
      engineUsed: 'offline',
    };
  }

  throw new Error('No se pudo traducir. Comprueba tu conexión o usa la guía rápida sin conexión.');
}
