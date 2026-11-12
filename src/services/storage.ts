import { TranslationRecord, SpeechSpeed } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'koe_history_v1',
  THEME: 'koe_theme_v1',
  SPEECH_SPEED: 'koe_speech_speed_v1',
};

export function getStoredHistory(): TranslationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read history from localStorage', err);
    return [];
  }
}

export function saveTranslationToHistory(record: Omit<TranslationRecord, 'id' | 'timestamp'>): TranslationRecord {
  const current = getStoredHistory();
  
  // Prevent exact duplicate at the top
  if (
    current.length > 0 &&
    current[0].sourceText.trim() === record.sourceText.trim() &&
    current[0].sourceLang === record.sourceLang
  ) {
    return current[0];
  }

  const newRecord: TranslationRecord = {
    ...record,
    id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
    isFavorite: false,
  };

  const updated = [newRecord, ...current.slice(0, 49)]; // Keep up to 50 records
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to history', err);
  }

  return newRecord;
}

export function toggleFavoriteRecord(id: string): TranslationRecord[] {
  const current = getStoredHistory();
  const updated = current.map((item) =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to toggle favorite', err);
  }
  return updated;
}

export function clearHistoryStorage(): void {
  try {
    // Keep favorites, remove non-favorites
    const current = getStoredHistory();
    const onlyFavorites = current.filter((item) => item.isFavorite);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(onlyFavorites));
  } catch (err) {
    console.error('Failed to clear history', err);
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore
  }
}

export function getStoredSpeed(): SpeechSpeed {
  if (typeof window === 'undefined') return 1.0;
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SPEECH_SPEED);
    return val === '0.7' ? 0.7 : 1.0;
  } catch {
    return 1.0;
  }
}

export function setStoredSpeed(speed: SpeechSpeed): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SPEECH_SPEED, String(speed));
  } catch {
    // ignore
  }
}
