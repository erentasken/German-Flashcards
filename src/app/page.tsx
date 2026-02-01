'use client';

import { useState, useMemo, useEffect } from 'react';
import Flashcard from '@/components/Flashcard';
import CategoryFilter from '@/components/CategoryFilter';
import { Word } from '@/types/word';
import wordsData from '@/data/words.json';

export default function Home() {
  const words = wordsData as Word[];

  // Get unique categories and types
  const categories = useMemo(() =>
    [...new Set(words.map(w => w.category))].sort(),
    [words]
  );

  const wordTypes = useMemo(() =>
    [...new Set(words.map(w => w.type))].sort(),
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(wordTypes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [unknownWords, setUnknownWords] = useState<Word[]>([]);
  const [revisionMode, setRevisionMode] = useState(false);
  const [showUnknownList, setShowUnknownList] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all state from localStorage on mount
  useEffect(() => {
    const savedUnknown = localStorage.getItem('unknownWords');
    const savedCategories = localStorage.getItem('selectedCategories');
    const savedTypes = localStorage.getItem('selectedTypes');
    const savedIndex = localStorage.getItem('currentIndex');
    const savedRevisionMode = localStorage.getItem('revisionMode');
    const savedShowFilter = localStorage.getItem('showFilter');

    if (savedUnknown) {
      try {
        setUnknownWords(JSON.parse(savedUnknown));
      } catch (e) {
        console.error('Failed to load unknown words:', e);
      }
    }
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedCategories(parsed);
        }
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    }
    if (savedTypes) {
      try {
        const parsed = JSON.parse(savedTypes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedTypes(parsed);
        }
      } catch (e) {
        console.error('Failed to load types:', e);
      }
    }
    if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex, 10) || 0);
    }
    if (savedRevisionMode) {
      setRevisionMode(savedRevisionMode === 'true');
    }
    if (savedShowFilter) {
      setShowFilter(savedShowFilter === 'true');
    }
    setIsLoaded(true);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('unknownWords', JSON.stringify(unknownWords));
  }, [unknownWords, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
  }, [selectedCategories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('selectedTypes', JSON.stringify(selectedTypes));
  }, [selectedTypes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('currentIndex', currentIndex.toString());
  }, [currentIndex, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('revisionMode', revisionMode.toString());
  }, [revisionMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('showFilter', showFilter.toString());
  }, [showFilter, isLoaded]);

  // Filter words based on selected categories and types
  const filteredWords = useMemo(() => {
    let filtered: Word[];

    if (revisionMode) {
      // In revision mode, only show unknown words
      filtered = unknownWords;
    } else {
      filtered = words.filter(
        w => selectedCategories.includes(w.category) && selectedTypes.includes(w.type)
      );
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
  }, [words, selectedCategories, selectedTypes, isShuffled, revisionMode, unknownWords]);

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
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4">
        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-xl mb-4 self-center">
          <button
            onClick={() => setRevisionMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!revisionMode
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            📚 All ({words.length})
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
              wordTypes={wordTypes}
              selectedTypes={selectedTypes}
              onTypeChange={setSelectedTypes}
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
