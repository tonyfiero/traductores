import * as wanakana from 'wanakana';

// Comprehensive map of common Kanji words and travel terms to their Hiragana reading
const KANJI_READINGS: Record<string, string> = {
  // Saludos & cortesía
  '有難う': 'ありがとう',
  '有り難う': 'ありがとう',
  '有難うございます': 'ありがとうございます',
  '今晩は': 'こんばんは',
  '今日は': 'こんにちは',
  'お早う': 'おはよう',
  'お早うございます': 'おはようございます',
  '御免なさい': 'ごめんなさい',
  '大丈夫': 'だいじょうぶ',
  '願い': 'ねがい',
  'お願いします': 'おねがいします',
  '下さい': 'ください',

  // Lugares & Transporte
  '駅': 'えき',
  '電車': 'でんしゃ',
  '地下鉄': 'ちかてつ',
  '新幹線': 'しんかんせん',
  '空港': 'くうこう',
  '飛行機': 'ひこうき',
  '切符': 'きっぷ',
  '交番': 'こうばん',
  '病院': 'びょういん',
  '薬局': 'やっきょく',
  '店': 'みせ',
  '道': 'みち',
  '地図': 'ちず',
  '住所': 'じゅうしょ',
  '場所': 'ばしょ',
  '出口': 'でぐち',
  '入口': 'いりぐち',
  '改札': 'かいさつ',
  '東京': 'とうきょう',
  '京都': 'きょうと',
  '大阪': 'おおさか',
  '日本': 'にほん',

  // Restaurante & Comida
  '水': 'みず',
  'お冷': 'おひや',
  'お茶': 'おちゃ',
  '料理': 'りょうり',
  '食事': 'しょくじ',
  '朝食': 'ちょうしょく',
  '昼食': 'ちゅうしょく',
  '夕食': 'ゆうしょく',
  '肉': 'にく',
  '魚': 'さかな',
  '野菜': 'やさい',
  '果物': 'くだもの',
  '米': 'こめ',
  'ご飯': 'ごはん',
  '箸': 'はし',
  '会計': 'かいけい',
  '勘定': 'かんじょう',
  '注文': 'ちゅうもん',
  '美味しい': 'おいしい',
  '美味い': 'うまい',
  '辛い': 'からい',
  '甘い': 'あまい',
  '温かい': 'あたたかい',
  '冷たい': 'つめたい',

  // Hotel & Compras
  '予約': 'よやく',
  '部屋': 'へや',
  '荷物': 'にもつ',
  '鍵': 'かぎ',
  'お金': 'おかね',
  '現金': 'げんきん',
  '免税': 'めんぜい',
  '袋': 'ふくろ',
  '値段': 'ねだん',
  '高い': 'たかい',
  '安い': 'やすい',
  '全部': 'ぜんぶ',
  '一つ': 'ひとつ',
  '二つ': 'ふたつ',
  '三つ': 'みっつ',

  // Pronombres & Preguntas
  '私': 'わたし',
  '僕': 'ぼく',
  '貴方': 'あなた',
  '誰': 'だれ',
  '何': 'なに',
  '何時': 'なんじ',
  '幾ら': 'いくら',
  '何処': 'どこ',
  '何故': 'なぜ',
  '如何': 'どう',
  '時間': 'じかん',
  '今': 'いま',
  '今日': 'きょう',
  '明日': 'あした',
  '昨日': 'きのう',

  // Verbos comunes
  '行き': 'いき',
  '行く': 'いく',
  '来': 'き',
  '来る': 'くる',
  '食べ': 'たべ',
  '食べる': 'たべる',
  '飲み': 'のみ',
  '飲む': 'のむ',
  '見': 'み',
  '見る': 'みる',
  '買い': 'かい',
  '買う': 'かう',
  '話': 'はなし',
  '話す': 'はなす',
  '分かり': 'わかり',
  '分かる': 'わかる',
  '知って': 'しって',
  '知る': 'しる',
  '助け': 'たすけ',
  '助けて': 'たすけて',
};

// Sort keys by length descending to match longest Kanji phrases first
const SORTED_KANJI_KEYS = Object.keys(KANJI_READINGS).sort((a, b) => b.length - a.length);

/**
 * Converts Japanese text (Kanji, Hiragana, Katakana) into smooth Romaji phonetics
 */
export function japaneseToRomaji(japaneseText: string): string {
  if (!japaneseText || !japaneseText.trim()) return '';

  let processed = japaneseText.trim();

  // Replace recognized Kanji compound words with their Hiragana pronunciation
  for (const kanji of SORTED_KANJI_KEYS) {
    if (processed.includes(kanji)) {
      processed = processed.replaceAll(kanji, KANJI_READINGS[kanji]);
    }
  }

  // Convert Hiragana / Katakana to Romaji using wanakana
  let romaji = wanakana.toRomaji(processed, {
    customRomajiMapping: {
      'は': 'wa', // As topic marker particle when isolated
      'へ': 'e',  // As direction particle
      'を': 'o',  // Direct object particle
    },
  });

  // Small adjustments for common Japanese pronunciation convention
  romaji = romaji
    .replace(/\bha\b/gi, 'wa')
    .replace(/\bhe\b/gi, 'e')
    .replace(/\bwo\b/gi, 'o')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of sentences
  if (romaji.length > 0) {
    romaji = romaji.charAt(0).toUpperCase() + romaji.slice(1);
  }

  return romaji;
}
