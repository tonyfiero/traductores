export type Language = 'es' | 'ja';

export type TranslationDirection = 'es-ja' | 'ja-es';

export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  romaji?: string;
  sourceLang: Language;
  targetLang: Language;
  timestamp: number;
  isFavorite?: boolean;
}

export interface TravelPhrase {
  id: string;
  category: 'cortesia' | 'restaurante' | 'transporte' | 'compras' | 'hotel' | 'emergencias';
  categoryLabel: string;
  es: string;
  ja: string;
  romaji: string;
}

export type InputMode = 'text' | 'voice' | 'camera';

export type SpeechSpeed = 1.0 | 0.7;
