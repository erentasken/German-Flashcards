'use client';

import { useState, useRef, useEffect } from 'react';
import { Word } from '@/types/word';

interface FlashcardProps {
    word: Word;
    onNext: () => void;
    onPrev: () => void;
    current: number;
    total: number;
    onMarkUnknown: (word: Word) => void;
    onMarkKnown: (word: Word) => void;
    isUnknown: boolean;
}

export default function Flashcard({ word, onNext, onPrev, current, total, onMarkUnknown, onMarkKnown, isUnknown }: FlashcardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    // Cleanup audio when component unmounts or word changes
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }
        };
    }, [word]);

    const speak = async (text: string) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }

        setIsSpeaking(true);

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('TTS request failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioUrlRef.current = audioUrl;
            
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            await new Promise<void>((resolve, reject) => {
                audio.onended = () => {
                    setIsSpeaking(false);
                    if (audioUrlRef.current) {
                        URL.revokeObjectURL(audioUrlRef.current);
                        audioUrlRef.current = null;
                    }
                    audioRef.current = null;
                    resolve();
                };
                audio.onerror = (e) => {
                    reject(e);
                };
                audio.play().catch(reject);
            });
        } catch (error) {
            // Ignore AbortError - it's expected when audio is interrupted
            if (error instanceof Error && error.name === 'AbortError') {
                // Audio was interrupted, this is normal behavior
            } else {
                console.error('TTS error:', error);
            }
            setIsSpeaking(false);
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = null;
            }
            audioRef.current = null;
        }
    };

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        speak(word.word);
    };

    const handleFlip = () => {
        if (!isTransitioning) {
            setIsFlipped(!isFlipped);
        }
    };

    const handleNext = () => {
        if (isTransitioning) return;
        if (isFlipped) {
            setIsTransitioning(true);
            setIsFlipped(false);
            setTimeout(() => {
                onNext();
                setIsTransitioning(false);
            }, 300);
        } else {
            onNext();
        }
    };

    const handlePrev = () => {
        if (isTransitioning) return;
        if (isFlipped) {
            setIsTransitioning(true);
            setIsFlipped(false);
            setTimeout(() => {
                onPrev();
                setIsTransitioning(false);
            }, 300);
        } else {
            onPrev();
        }
    };

    const getArticleColor = (article: string) => {
        switch (article) {
            case 'der':
                return 'text-blue-500';
            case 'die':
                return 'text-pink-500';
            case 'das':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    const renderEnglish = () => {
        if (!word.english) return null;
        return (
            <div className="space-y-1 mb-3">
                <p className="text-sm text-gray-400 uppercase tracking-wide">English</p>
                <p className="text-2xl font-medium text-emerald-400">{word.english}</p>
            </div>
        );
    };

    const renderSentence = () => {
        if (!word.sentence) return null;
        return (
            <div className="mt-3 pt-2 border-t border-slate-700/50">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Example</p>
                <p className="text-sm text-slate-300 italic">&quot;{word.sentence.de}&quot;</p>
                <p className="text-xs text-slate-500 mt-0.5">{word.sentence.en}</p>
            </div>
        );
    };

    // Determine word type from category and properties
    const getWordType = (): string => {
        if (word.category === 'Verben' || word.category === 'Wetter' && word.conjugations) return 'verb';
        if (word.category === 'Adjektive' || word.category === 'Farben' || word.category === 'Gesundheit' && word.komparativ !== undefined) return 'adjective';
        if (word.category === 'Länder') return 'country';
        if (word.category === 'Partikel') return 'particle';
        if (word.category === 'Fragewörter') return 'question_word';
        if (word.category === 'Pronomen') return 'pronoun';
        if (word.category === 'Artikel') return 'article_declension';
        if (word.conjugations) return 'verb';
        if (word.komparativ !== undefined) return 'adjective';
        if (word.article) return 'noun';
        return 'noun';
    };

    const wordType = getWordType();

    const renderBack = () => {
        switch (wordType) {
            case 'noun':
                return (
                    <div className="text-center space-y-3">
                        {renderEnglish()}
                        {word.article && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Article</p>
                                <p className={`text-4xl font-bold ${getArticleColor(word.article)}`}>
                                    {word.article}
                                </p>
                            </div>
                        )}
                        {word.plural && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Plural</p>
                                <p className="text-2xl">
                                    <span className={getArticleColor(word.pluralArticle)}>{word.pluralArticle}</span>{' '}
                                    <span className="text-white">{word.plural}</span>
                                </p>
                            </div>
                        )}
                        {word.feminine && (
                            <div className="space-y-1 pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-500 uppercase">Feminine</p>
                                <p className="text-lg">
                                    <span className="text-pink-500">die</span>{' '}
                                    <span className="text-white">{word.feminine}</span>
                                    {word.femininePlural && (
                                        <span className="text-gray-400 text-sm ml-2">(Pl: {word.femininePlural})</span>
                                    )}
                                </p>
                            </div>
                        )}
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                                {word.category}
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'pronoun':
                return (
                    <div className="text-center space-y-4">
                        {renderEnglish()}
                        <div className="space-y-1">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Pronoun</p>
                            <p className="text-3xl font-bold text-rose-400">{word.word}</p>
                        </div>
                        {word.possessive && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Possessive</p>
                                <p className="text-2xl text-rose-300">{word.possessive}</p>
                            </div>
                        )}
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-rose-900 rounded-full text-sm text-rose-300">
                                Pronomen
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'verb':
                return (
                    <div className="text-center space-y-4">
                        {renderEnglish()}
                        <div className="space-y-1">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Verb</p>
                            <p className="text-3xl font-bold text-purple-400">{word.word}</p>
                        </div>
                        {word.partizip && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Partizip II</p>
                                <p className="text-xl text-orange-400">{word.partizip}</p>
                            </div>
                        )}
                        {word.conjugations && Object.keys(word.conjugations).length > 0 && (
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-400 uppercase tracking-wide">Conjugation</p>
                                <div className="grid grid-cols-2 gap-2 text-left max-w-xs mx-auto">
                                    {Object.entries(word.conjugations).slice(0, 4).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="text-gray-500">{key}: </span>
                                            <span className="text-gray-200">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-purple-900 rounded-full text-sm text-purple-300">
                                Verb
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'adjective':
                return (
                    <div className="text-center space-y-4">
                        {renderEnglish()}
                        <div className="space-y-1">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Adjective</p>
                            <p className="text-3xl font-bold text-yellow-400">{word.word}</p>
                        </div>
                        {word.komparativ && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Komparativ</p>
                                <p className="text-xl text-yellow-300">{word.komparativ}</p>
                            </div>
                        )}
                        {word.superlativ && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Superlativ</p>
                                <p className="text-xl text-yellow-200">{word.superlativ}</p>
                            </div>
                        )}
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-yellow-900 rounded-full text-sm text-yellow-300">
                                Adjective
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'country':
                return (
                    <div className="text-center space-y-4">
                        {renderEnglish()}
                        {word.article && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Article</p>
                                <p className={`text-2xl font-bold ${getArticleColor(word.article)}`}>
                                    {word.article}
                                </p>
                            </div>
                        )}
                        {word.languages && word.languages.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-400 uppercase tracking-wide">Languages</p>
                                <p className="text-xl text-cyan-400">{word.languages.join(', ')}</p>
                            </div>
                        )}
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-cyan-900 rounded-full text-sm text-cyan-300">
                                Country
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'particle':
                return (
                    <div className="text-center space-y-3">
                        {renderEnglish()}
                        {word.partikelType && (
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                                <p className="text-xl text-teal-400">{word.partikelType}</p>
                            </div>
                        )}
                        {word.contractions && word.contractions.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Contractions</p>
                                <div className="space-y-1">
                                    {word.contractions.map((c, idx) => (
                                        <div key={idx} className="bg-slate-800/50 rounded-lg px-2 py-1.5">
                                            <div className="flex items-center justify-center gap-1.5 text-sm">
                                                <span className="text-slate-400">{c.from}</span>
                                                <span className="text-slate-600">→</span>
                                                <span className="text-teal-400 font-semibold">{c.form}</span>
                                            </div>
                                            {c.example && (
                                                <p className="text-xs text-slate-500 mt-0.5">{c.example}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-1">
                            <span className="inline-block px-2 py-0.5 bg-teal-900 rounded-full text-xs text-teal-300">
                                Particle
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'question_word':
                return (
                    <div className="text-center space-y-4">
                        {renderEnglish()}
                        <div className="space-y-1">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">Question Word</p>
                            <p className="text-3xl font-bold text-indigo-400">{word.word}</p>
                        </div>
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-indigo-900 rounded-full text-sm text-indigo-300">
                                Fragewort
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            case 'article_declension':
                return (
                    <div className="text-center space-y-3">
                        {renderEnglish()}
                        <div className="space-y-1">
                            <p className="text-sm text-gray-400 uppercase tracking-wide">
                                {typeof word.kasus === 'string' ? word.kasus : ''} • {word.geschlecht}
                            </p>
                            <p className="text-3xl font-bold text-amber-400">{word.word}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm max-w-xs mx-auto">
                            {word.indefinit && (
                                <div>
                                    <span className="text-gray-500">Indefinit: </span>
                                    <span className="text-gray-200">{word.indefinit}</span>
                                </div>
                            )}
                            {word.negation && (
                                <div>
                                    <span className="text-gray-500">Negation: </span>
                                    <span className="text-gray-200">{word.negation}</span>
                                </div>
                            )}
                            {word.possessiv && (
                                <div>
                                    <span className="text-gray-500">Possessiv: </span>
                                    <span className="text-gray-200">{word.possessiv}</span>
                                </div>
                            )}
                            {word.demonstrativ && (
                                <div>
                                    <span className="text-gray-500">Demonstr.: </span>
                                    <span className="text-gray-200">{word.demonstrativ}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-2">
                            <span className="inline-block px-3 py-1 bg-amber-900 rounded-full text-sm text-amber-300">
                                Artikel
                            </span>
                        </div>
                        {renderSentence()}
                    </div>
                );

            default:
                return <p className="text-xl text-gray-400">No additional info</p>;
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
            {/* Card */}
            <div
                className="relative w-full min-h-80 sm:min-h-96 cursor-pointer perspective-1000"
                onClick={handleFlip}
            >
                <div
                    className={`relative w-full min-h-80 sm:min-h-96 transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                >
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col items-center justify-center p-8">
                        <button
                            onClick={handleSpeak}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isSpeaking ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                            title="Pronounce"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            </svg>
                        </button>
                        <p className="text-3xl sm:text-4xl font-bold text-white text-center leading-tight">{word.word}</p>
                        <p className="text-xs text-slate-500 mt-6 flex items-center gap-1">
                            <span className="inline-block w-4 h-4 border border-slate-600 rounded"></span>
                            Tap to reveal
                        </p>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full min-h-80 sm:min-h-96 backface-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-600/50 p-4 sm:p-6 rotate-y-180 overflow-y-auto max-h-[70vh]">
                        <div className="flex items-center justify-center min-h-full">
                            {renderBack()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{current} of {total}</span>
                    <span>{Math.round((current / total) * 100)}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${(current / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
                <button
                    onClick={handlePrev}
                    disabled={isTransitioning}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95 text-sm font-medium disabled:opacity-50"
                >
                    ← Prev
                </button>
                <button
                    onClick={() => {
                        if (isTransitioning) return;
                        onMarkUnknown(word);
                        handleNext();
                    }}
                    disabled={isTransitioning}
                    className={`flex-1 py-3 ${isUnknown ? 'bg-red-700' : 'bg-red-600 hover:bg-red-500'} text-white rounded-xl transition-all active:scale-95 text-sm font-medium disabled:opacity-50`}
                >
                    ✗ Learn
                </button>
                <button
                    onClick={handleNext}
                    disabled={isTransitioning}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95 text-sm font-medium disabled:opacity-50"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
