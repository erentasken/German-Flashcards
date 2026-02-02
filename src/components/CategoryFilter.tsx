'use client';
 import { useState, useMemo, useEffect } from 'react';
import { Word } from '@/types/word';

interface CategoryFilterProps {
    categories: string[];
    selectedCategories: string[];
    onCategoryChange: (categories: string[]) => void;
    categoryCounts?: Record<string, number>;
    onCreateCategory?: (name: string) => void;
    deletableCategories?: string[];
    onDeleteCategory?: (name: string) => void;
    onBulkDelete?: (names: string[]) => void;
    words?: Word[];
    onAddWordToCategory?: (word: Word, category: string) => void;
    customCategories?: Record<string, Word[]>;
    onRemoveWordFromCategory?: (word: Word, category: string) => void;
}

export default function CategoryFilter({
    categories,
    selectedCategories,
    onCategoryChange,
    categoryCounts,
    onCreateCategory,
    deletableCategories = [],
    onDeleteCategory,
    onBulkDelete,
    words = [],
    onAddWordToCategory,
    customCategories = {},
    onRemoveWordFromCategory,
}: CategoryFilterProps) {
    const [newCategory, setNewCategory] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [addWordCategory, setAddWordCategory] = useState<string | null>(null);
    const [deleteMode, setDeleteMode] = useState(false);
    const [deleteSelected, setDeleteSelected] = useState<string[]>([]);

    const selectedCustomCategories = deletableCategories.filter(c => selectedCategories.includes(c));

    // Keep a local copy of the selected category's words for immediate UI updates
    

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [] as Word[];
        const q = searchQuery.toLowerCase().trim();
        return (words || []).filter((w: Word) =>
            w.word.toLowerCase().includes(q) ||
            (w.english && w.english.toLowerCase().includes(q)) ||
            (w.article && `${w.article} ${w.word}`.toLowerCase().includes(q))
        ).slice(0, 10);
    }, [searchQuery, words]);

    const handleCreate = () => {
        const name = newCategory.trim();
        if (!name) return;
        onCreateCategory?.(name);
        setNewCategory('');
        setShowCreate(false);
    };
    const handleCategoryToggle = (category: string) => {
        if (selectedCategories.includes(category)) {
            onCategoryChange(selectedCategories.filter((c) => c !== category));
        } else {
            onCategoryChange([...selectedCategories, category]);
        }
    };

    const handleSelectAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            onCategoryChange([]);
        } else {
            onCategoryChange([...categories]);
        }
    };

    const toggleDeleteSelect = (category: string) => {
        if (!deletableCategories.includes(category)) return;
        setDeleteSelected((prev) => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    const performBulkDelete = () => {
        if (deleteSelected.length === 0) return;
        if (!confirm(`Delete ${deleteSelected.length} categories? This will not remove words.`)) return;
        if (onBulkDelete) {
            onBulkDelete(deleteSelected);
        } else {
            deleteSelected.forEach((c) => onDeleteCategory?.(c));
        }
        setDeleteSelected([]);
        setDeleteMode(false);
    };

    const totalSelected = selectedCategories.reduce((sum, cat) => sum + (categoryCounts?.[cat] || 0), 0);
    const totalWords = Object.values(categoryCounts || {}).reduce((sum, count) => sum + count, 0);

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Categories Section */}
            <div className="p-4">
                {/* (Create option moved below categories) */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>📂</span> Categories
                        <span className="text-slate-500 font-normal normal-case">
                            ({selectedCategories.length} of {categories.length})
                        </span>
                    </h3>
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleSelectAllCategories}
                            className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            {selectedCategories.length === categories.length ? 'Clear' : 'All'}
                        </button>

                        {!deleteMode && (
                            <button
                                onClick={() => { setDeleteMode((s) => !s); setDeleteSelected([]); setAddWordCategory(null); }}
                                className={`text-xs px-2 py-1 rounded-md transition-colors ${deleteMode ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                title="Delete categories"
                            >
                                Delete categories
                            </button>
                        )}
                    </div>
                {deleteMode && (
                    <div className="mt-2 flex items-center justify-end gap-2">
                        <div className="text-xs text-slate-400">{deleteSelected.length} selected</div>
                        <button
                            onClick={performBulkDelete}
                            disabled={deleteSelected.length === 0}
                            className={`text-xs px-2 py-1 rounded-md ${deleteSelected.length > 0 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                        >
                            Delete selected
                        </button>
                        <button
                            onClick={() => { setDeleteMode(false); setDeleteSelected([]); }}
                            className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {categories.map((category) => {
                        const isSelected = selectedCategories.includes(category);
                        const count = categoryCounts?.[category] || 0;
                        const isDeleteSelected = deleteMode && deleteSelected.includes(category);
                        return (
                            <button
                                key={category}
                                onClick={() => { if (deleteMode) { toggleDeleteSelect(category); } else { handleCategoryToggle(category); } }}
                                className={`group relative rounded-lg text-left transition-all ${isDeleteSelected
                                        ? 'bg-red-500/15 border border-red-500/50 px-4 py-3 shadow-lg'
                                        : isSelected && deletableCategories.includes(category)
                                            ? 'bg-emerald-500/15 border border-emerald-500/50 px-4 py-3 shadow-lg'
                                            : isSelected
                                                ? 'bg-emerald-500/15 border border-emerald-500/50 px-3 py-2'
                                                : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700 px-3 py-2'
                                    }`}
                            >
                                {deletableCategories.includes(category) && null}
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-sm truncate ${isDeleteSelected ? 'text-red-400' : isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                        {category}
                                    </span>
                                    <span className={`text-xs tabular-nums ${isDeleteSelected ? 'text-red-500/70' : isSelected ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                                        {count}
                                    </span>
                                </div>
                                {/* Selection / delete indicator */}
                                {deleteMode ? (
                                    isDeleteSelected && (
                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400" />
                                    )
                                ) : (
                                    isSelected && (
                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    )
                                )}

                                {/* Inline options for newly created (deletable) categories when selected */}
                                {(!deleteMode && isSelected && deletableCategories.includes(category)) && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setAddWordCategory(category); setSearchQuery(''); }}
                                                                    className="w-full px-2 py-1 text-sm bg-emerald-600 rounded text-white"
                                                                >
                                                                    Add word
                                                                </button>
                                        </div>

                                        {/* Add word now opens a modal — handled below */}
                                    </div>
                                )}

                                {/* In delete mode, mark deletable tiles that are selected for deletion */}
                                {deleteMode && deletableCategories.includes(category) && deleteSelected.includes(category) && (
                                    <div className="absolute left-2 bottom-2" aria-hidden />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Create new category option */}
                <div className="mt-3">
                    <button
                        onClick={() => setShowCreate((s) => !s)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700 text-sm text-slate-300 flex items-center justify-between"
                    >
                        <span>➕ Create new category</span>
                        <span className="text-xs text-slate-500">{showCreate ? 'Cancel' : ''}</span>
                    </button>

                    {showCreate && (
                        <div className="mt-2 flex gap-2">
                            <input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder="Category name"
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white outline-none"
                            />
                            <button onClick={handleCreate} className="px-3 py-2 bg-emerald-600 rounded-lg text-sm">Create</button>
                        </div>
                    )}
                </div>

                {/* Quick add by search */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                    {selectedCustomCategories.length > 0 && (
                        <div className="space-y-2">
                            {/* Search moved to View panel */}
                            {/* Category contents moved to a separate view panel (open via View button on category tiles) */}
                        </div>
                    )}
                </div>

                {/* Add-word modal (opens when `addWordCategory` is set) */}
                {addWordCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setAddWordCategory(null)} />
                        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-lg p-4 z-60">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold">Manage words for "{addWordCategory}"</h4>
                                <button onClick={() => setAddWordCategory(null)} className="px-3 py-1 bg-slate-800 rounded">Close</button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        placeholder="Search words to add..."
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm outline-none"
                                    />
                                </div>

                                {searchQuery.trim() && (
                                    <div className="max-h-40 overflow-y-auto bg-slate-900 rounded p-2">
                                        {searchResults.length > 0 ? searchResults.map((w) => (
                                            <div key={`${w.word}-${w.category}`} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-slate-800/50 rounded">
                                                <div>
                                                    <div className="text-white font-medium">{w.article && <span className="text-blue-400">{w.article} </span>}{w.word}</div>
                                                    <div className="text-xs text-slate-400">{w.english || ''}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { onAddWordToCategory?.(w, addWordCategory); setSearchQuery(''); }}
                                                        className="ml-2 px-2 py-1 bg-emerald-600 rounded text-xs text-white"
                                                    >Add</button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-xs text-slate-500">No results</div>
                                        )}
                                    </div>
                                )}

                                <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-900 rounded p-2">
                                    {(customCategories[addWordCategory] || []).length === 0 ? (
                                        <div className="text-sm text-slate-500">No words in this category.</div>
                                    ) : (
                                        (customCategories[addWordCategory] || []).map((cw) => (
                                            <div key={`${cw.word}-${cw.category}`} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-slate-800/50 rounded">
                                                <div>
                                                    <div className="text-white font-medium">{cw.article && <span className="text-blue-400">{cw.article} </span>}{cw.word}</div>
                                                    <div className="text-xs text-slate-400">{cw.english || ''}</div>
                                                </div>
                                                <button
                                                    onClick={() => { onRemoveWordFromCategory?.(cw, addWordCategory); }}
                                                    className="ml-2 px-2 py-1 bg-red-600 rounded text-xs text-white"
                                                >Remove</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        <span className="text-emerald-400 font-medium">{totalSelected}</span> words selected
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                                style={{ width: `${totalWords > 0 ? (totalSelected / totalWords) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">
                            {totalWords > 0 ? Math.round((totalSelected / totalWords) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
