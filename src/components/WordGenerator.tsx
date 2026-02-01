'use client';

import React, { useState } from 'react';
import { Word } from '@/types/word';

interface WordGeneratorProps {
  onWordGenerated: (word: Word) => void;
}

export default function WordGenerator({ onWordGenerated }: WordGeneratorProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedWord, setGeneratedWord] = useState<Word | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedWord(null);

    try {
      const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate word');
      }

      setGeneratedWord(data.word);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!generatedWord) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: generatedWord }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save word');
      }

      onWordGenerated(generatedWord);
      setGeneratedWord(null);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save word');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🤖</span> Generate Flashcard with AI
      </h3>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleGenerate()}
          placeholder="Enter a German word..."
          className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⚙️</span>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {generatedWord && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-bold text-white">
                {generatedWord.article && (
                  <span className="text-blue-400">{generatedWord.article} </span>
                )}
                {generatedWord.word}
              </h4>
              <p className="text-gray-300">{generatedWord.english}</p>
            </div>
            <span className="px-3 py-1 bg-gray-600 text-gray-200 text-sm rounded-full">
              {generatedWord.category}
            </span>
          </div>

          {generatedWord.plural && (
            <p className="text-gray-400 text-sm">
              Plural: {generatedWord.pluralArticle} {generatedWord.plural}
            </p>
          )}

          {generatedWord.conjugations && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              {Object.entries(generatedWord.conjugations).map(([pronoun, form]) => (
                <div key={pronoun} className="text-gray-300">
                  <span className="text-gray-500">{pronoun}:</span> {form}
                </div>
              ))}
            </div>
          )}

          {generatedWord.partizip && (
            <p className="text-gray-400 text-sm">Partizip II: {generatedWord.partizip}</p>
          )}

          {generatedWord.komparativ && generatedWord.superlativ && (
            <p className="text-gray-400 text-sm">
              {generatedWord.komparativ} → {generatedWord.superlativ}
            </p>
          )}

          {generatedWord.contractions && generatedWord.contractions.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="font-semibold">Contractions: </span>
              {generatedWord.contractions.map((c, i) => (
                <span key={i}>
                  {c.from} → {c.form}
                  {i < generatedWord.contractions!.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}

          {generatedWord.sentence && (
            <div className="bg-gray-800 rounded p-3 mt-2">
              <p className="text-white italic">&ldquo;{generatedWord.sentence.de}&rdquo;</p>
              <p className="text-gray-400 text-sm mt-1">{generatedWord.sentence.en}</p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Saving...
                </>
              ) : (
                <>✓ Add to Collection</>
              )}
            </button>
            <button
              onClick={() => setGeneratedWord(null)}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
