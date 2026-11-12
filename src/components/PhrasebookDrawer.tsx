import React, { useState } from 'react';
import {
  X,
  Search,
  Volume2,
  Star,
  Clock,
  BookOpen,
  Trash2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { TravelPhrase, TranslationRecord, SpeechSpeed } from '../types';
import { OFFLINE_PHRASEBOOK } from '../data/phrasebook';
import { speakText } from '../services/speech';

interface PhrasebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: TranslationRecord[];
  onSelectPhrase: (source: string, target: string, romaji?: string, langDirection?: 'es-ja' | 'ja-es') => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
  speechSpeed: SpeechSpeed;
  isDark: boolean;
}

type TabType = 'phrasebook' | 'favorites' | 'history';

export const PhrasebookDrawer: React.FC<PhrasebookDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectPhrase,
  onToggleFavorite,
  onClearHistory,
  speechSpeed,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('phrasebook');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'cortesia', label: 'Cortesía' },
    { id: 'restaurante', label: 'Comida' },
    { id: 'transporte', label: 'Tren & Taxi' },
    { id: 'compras', label: 'Compras' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'emergencias', label: 'Emergencia' },
  ];

  const filteredPhrases = OFFLINE_PHRASEBOOK.filter((phrase) => {
    const matchesCat = selectedCategory === 'all' || phrase.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesSearch =
      phrase.es.toLowerCase().includes(q) ||
      phrase.ja.includes(q) ||
      phrase.romaji.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const favorites = history.filter((item) => item.isFavorite);

  const handleSpeak = async (id: string, text: string, lang: 'es' | 'ja') => {
    setSpeakingId(id);
    await speakText(text, lang, speechSpeed, () => {
      setSpeakingId(null);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md h-full flex flex-col pt-safe pb-safe shadow-2xl transition-all ${
          isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-700/50 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-bold tracking-tight">Guía de Frases & Historial</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Cerrar frases"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex p-2 gap-1.5 border-b border-slate-700/30 dark:border-slate-800 bg-slate-950/20">
          <button
            onClick={() => setActiveTab('phrasebook')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'phrasebook'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guía Offline
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'favorites'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Favoritos ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Historial ({history.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {/* TAB 1: OFFLINE PHRASEBOOK */}
          {activeTab === 'phrasebook' && (
            <>
              {/* Search input */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar frase en español o japonés..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Categories Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mb-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat.id
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Offline notice */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Estas frases funcionan 100% sin cobertura ni roaming en Japón.</span>
              </div>

              {/* Phrases List */}
              {filteredPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-300">{phrase.es}</p>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
                      {phrase.category}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 mt-1">
                    <div>
                      <p className="text-lg font-bold text-white font-ja tracking-tight">
                        {phrase.ja}
                      </p>
                      <p className="text-xs font-semibold text-amber-400 tracking-wide mt-0.5">
                        {phrase.romaji}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSpeak(phrase.id, phrase.ja, 'ja')}
                        className={`p-2 rounded-xl transition ${
                          speakingId === phrase.id
                            ? 'bg-amber-500 text-black animate-pulse'
                            : 'bg-slate-700/80 hover:bg-slate-600 text-white'
                        }`}
                        aria-label="Escuchar japonés"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          onSelectPhrase(phrase.es, phrase.ja, phrase.romaji, 'es-ja');
                          onClose();
                        }}
                        className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition active:scale-95"
                        title="Ver en traductor y pantalla completa"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* TAB 2: FAVORITES */}
          {activeTab === 'favorites' && (
            <>
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Star className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">No tienes frases guardadas</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Toca la estrella (★) en cualquier traducción para guardarla y consultarla sin conexión.
                  </p>
                </div>
              ) : (
                favorites.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-slate-300 font-medium">{item.sourceText}</p>
                      <button
                        onClick={() => onToggleFavorite(item.id)}
                        className="text-amber-400 hover:text-amber-300"
                        aria-label="Quitar de favoritos"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 mt-1">
                      <div>
                        <p className="text-lg font-bold text-white font-ja">{item.translatedText}</p>
                        {item.romaji && (
                          <p className="text-xs font-semibold text-amber-400">{item.romaji}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSpeak(item.id, item.translatedText, item.targetLang)}
                          className={`p-2 rounded-xl transition ${
                            speakingId === item.id
                              ? 'bg-amber-500 text-black animate-pulse'
                              : 'bg-slate-700 hover:bg-slate-600 text-white'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onSelectPhrase(
                              item.sourceText,
                              item.translatedText,
                              item.romaji,
                              item.sourceLang === 'es' ? 'es-ja' : 'ja-es'
                            );
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <>
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">El historial está vacío</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tus traducciones recientes se guardarán aquí automáticamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={onClearHistory}
                      className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpiar historial
                    </button>
                  </div>

                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-slate-300 font-medium">{item.sourceText}</p>
                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          className="text-slate-500 hover:text-amber-400 transition"
                          aria-label="Marcar favorito"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              item.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between gap-2 mt-1">
                        <div>
                          <p className="text-lg font-bold text-white font-ja">{item.translatedText}</p>
                          {item.romaji && (
                            <p className="text-xs font-semibold text-amber-400">{item.romaji}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleSpeak(item.id, item.translatedText, item.targetLang)}
                            className={`p-2 rounded-xl transition ${
                              speakingId === item.id
                                ? 'bg-amber-500 text-black animate-pulse'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectPhrase(
                                item.sourceText,
                                item.translatedText,
                                item.romaji,
                                item.sourceLang === 'es' ? 'es-ja' : 'ja-es'
                              );
                              onClose();
                            }}
                            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
