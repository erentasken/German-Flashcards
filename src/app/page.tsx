'use client';

import { useState, useMemo, useEffect } from 'react';
import Flashcard from '@/components/Flashcard';
import CategoryFilter from '@/components/CategoryFilter';
import WordGenerator from '@/components/WordGenerator';
import { Word } from '@/types/word';
import wordsData from '@/data/words.json';

export default function Home() {
  const words = wordsData as Word[];

  // Get unique categories
  const categories = useMemo(() =>
    [...new Set(words.map(w => w.category))].sort(),
    [words]
  );

  // Get word counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    words.forEach(w => {
      counts[w.category] = (counts[w.category] || 0) + 1;
    });
    return counts;
  }, [words]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [unknownWords, setUnknownWords] = useState<Word[]>([]);
  const [revisionMode, setRevisionMode] = useState(false);
  const [showUnknownList, setShowUnknownList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [sessionWords, setSessionWords] = useState<Word[]>([]); // Words added this session (not persisted to localStorage)

  // Combine original words with session-added words
  const allWords = useMemo(() => [...words, ...sessionWords], [words, sessionWords]);

  // Normalize German umlauts for search (ä→a, ö→o, ü→u, ß→ss)
  const normalizeGerman = (str: string) => {
    return str
      .toLowerCase()
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/ß/g, 'ss');
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const normalizedQuery = normalizeGerman(query);
    return allWords.filter(w => {
      const wordLower = w.word.toLowerCase();
      const normalizedWord = normalizeGerman(w.word);
      const englishLower = w.english?.toLowerCase() || '';
      const fullWord = w.article ? `${w.article} ${w.word}`.toLowerCase() : '';
      const normalizedFullWord = normalizeGerman(fullWord);
      
      return (
        wordLower.includes(query) ||
        normalizedWord.includes(normalizedQuery) ||
        englishLower.includes(query) ||
        fullWord.includes(query) ||
        normalizedFullWord.includes(normalizedQuery)
      );
    }).slice(0, 10); // Limit to 10 results
  }, [allWords, searchQuery]);

  // Load unknown words from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('unknownWords');
    if (saved) {
      try {
        setUnknownWords(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load unknown words:', e);
      }
    }

  }, []);

  // Save unknown words to localStorage
  useEffect(() => {
    localStorage.setItem('unknownWords', JSON.stringify(unknownWords));
  }, [unknownWords]);

  // Handler for adding generated words - add to session state (already saved to words.json)
  const handleWordGenerated = (word: Word) => {
    setSessionWords(prev => [...prev, word]);
  };

  // Filter words based on selected categories
  const filteredWords = useMemo(() => {
    let filtered: Word[];

    if (revisionMode) {
      // In revision mode, only show unknown words
      filtered = unknownWords;
    } else {
      filtered = allWords.filter(w => selectedCategories.includes(w.category));
    }

    if (isShuffled && filtered.length > 0) {
      // Fisher-Yates shuffle
      filtered = [...filtered];
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
    }

    return filtered;
  }, [allWords, selectedCategories, isShuffled, revisionMode, unknownWords]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategories, revisionMode]);

  // Ensure currentIndex is within bounds
  useEffect(() => {
    if (filteredWords.length > 0 && currentIndex >= filteredWords.length) {
      setCurrentIndex(0);
    }
  }, [filteredWords.length, currentIndex]);

  const handleNext = () => {
    if (filteredWords.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    }
  };

  const handlePrev = () => {
    if (filteredWords.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }
  };

  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
  };

  const handleMarkUnknown = (word: Word) => {
    if (!unknownWords.some(w => w.word === word.word && w.category === word.category)) {
      setUnknownWords(prev => [...prev, word]);
    }
  };

  const handleMarkKnown = (word: Word) => {
    setUnknownWords(prev => prev.filter(w => !(w.word === word.word && w.category === word.category)));
  };

  const isWordUnknown = (word: Word) => {
    return unknownWords.some(w => w.word === word.word && w.category === word.category);
  };

  const clearUnknownWords = () => {
    if (confirm('Are you sure you want to clear all unknown words?')) {
      setUnknownWords([]);
      if (revisionMode) {
        setRevisionMode(false);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredWords.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🇩🇪 Wortschatz - By Tasken
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerator(!showGenerator)}
              className={`p-2 rounded-lg transition-all ${showGenerator
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              title="Generate with AI"
            >
              🤖
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-all ${showSearch
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              title="Search"
            >
              🔍
            </button>
            <button
              onClick={handleShuffle}
              className={`p-2 rounded-lg transition-all ${isShuffled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              title="Shuffle"
            >
              🔀
            </button>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-lg transition-all ${showFilter
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              title="Filter"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="max-w-4xl mx-auto px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search German or English word..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-slate-700">
                    {searchResults.map((word, idx) => (
                      <li
                        key={`${word.word}-${word.category}-${idx}`}
                        className="px-4 py-3 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-medium">
                              {word.article && <span className="text-blue-400">{word.article} </span>}
                              {word.word}
                            </span>
                            {word.plural && (
                              <span className="text-slate-500 text-sm ml-2">
                                (pl: {word.pluralArticle} {word.plural})
                              </span>
                            )}
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full">
                            {word.category}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">{word.english}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-slate-500">No words found for "{searchQuery}"</p>
                    <p className="text-slate-600 text-sm mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4">
        {/* AI Word Generator */}
        {showGenerator && (
          <WordGenerator onWordGenerated={handleWordGenerated} />
        )}

        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-xl mb-4 self-center">
          <button
            onClick={() => setRevisionMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!revisionMode
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            📚 All ({allWords.length})
          </button>
          <button
            onClick={() => setRevisionMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${revisionMode
              ? 'bg-red-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            📝 To Learn ({unknownWords.length})
          </button>
        </div>

        {/* Revision list actions */}
        {unknownWords.length > 0 && (
          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={() => setShowUnknownList(!showUnknownList)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              {showUnknownList ? '▲ Hide words' : '▼ Show words'}
            </button>
            <button
              onClick={clearUnknownWords}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Unknown Words List */}
        {showUnknownList && unknownWords.length > 0 && (
          <div className="mb-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {unknownWords.map((w, i) => (
                <span
                  key={`${w.word}-${w.category}-${i}`}
                  className="px-2.5 py-1 bg-red-950/50 text-red-300 rounded-lg text-xs flex items-center gap-1.5 border border-red-900/30"
                >
                  {w.article && <span className="opacity-60">{w.article}</span>}
                  {w.word}
                  <button
                    onClick={() => handleMarkKnown(w)}
                    className="hover:text-white ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showFilter && !revisionMode && (
          <div className="mb-4">
            <CategoryFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              categoryCounts={categoryCounts}
            />
          </div>
        )}

        {/* Flashcard */}
        <main className="flex-1 flex items-center justify-center py-4">
          {filteredWords[currentIndex] && (
            <Flashcard
              word={filteredWords[currentIndex]}
              onNext={handleNext}
              onPrev={handlePrev}
              current={currentIndex + 1}
              total={filteredWords.length}
              onMarkUnknown={handleMarkUnknown}
              onMarkKnown={handleMarkKnown}
              isUnknown={isWordUnknown(filteredWords[currentIndex])}
            />
          )}
        </main>

        {/* Keyboard hint */}
        <footer className="text-center py-3">
          <p className="text-xs text-slate-600">← → arrows to navigate • tap card to flip</p>
        </footer>
      </div>
    </div>
  );
}
