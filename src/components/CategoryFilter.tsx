'use client';

interface CategoryFilterProps {
    categories: string[];
    selectedCategories: string[];
    onCategoryChange: (categories: string[]) => void;
    wordTypes: string[];
    selectedTypes: string[];
    onTypeChange: (types: string[]) => void;
    categoryCounts?: Record<string, number>;
}

export default function CategoryFilter({
    categories,
    selectedCategories,
    onCategoryChange,
    wordTypes,
    selectedTypes,
    onTypeChange,
    categoryCounts,
}: CategoryFilterProps) {
    const handleCategoryToggle = (category: string) => {
        if (selectedCategories.includes(category)) {
            onCategoryChange(selectedCategories.filter((c) => c !== category));
        } else {
            onCategoryChange([...selectedCategories, category]);
        }
    };

    const handleTypeToggle = (type: string) => {
        if (selectedTypes.includes(type)) {
            onTypeChange(selectedTypes.filter((t) => t !== type));
        } else {
            onTypeChange([...selectedTypes, type]);
        }
    };

    const handleSelectAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            onCategoryChange([]);
        } else {
            onCategoryChange([...categories]);
        }
    };

    const handleSelectAllTypes = () => {
        if (selectedTypes.length === wordTypes.length) {
            onTypeChange([]);
        } else {
            onTypeChange([...wordTypes]);
        }
    };

    const getTypeStyle = (type: string, selected: boolean) => {
        const colors: Record<string, { bg: string; border: string; text: string }> = {
            noun: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
            verb: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
            adjective: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400' },
            country: { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
            particle: { bg: 'bg-teal-500/20', border: 'border-teal-500', text: 'text-teal-400' },
            question_word: { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-400' },
            pronoun: { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-400' },
            article_declension: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
        };
        const style = colors[type] || { bg: 'bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-400' };
        return selected
            ? `${style.bg} ${style.border} ${style.text} border-2`
            : 'bg-slate-800/50 border-2 border-transparent text-slate-500 hover:text-slate-400 hover:border-slate-700';
    };

    const getTypeEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            noun: '📦',
            verb: '⚡',
            adjective: '🎨',
            country: '🌍',
            particle: '✨',
            question_word: '❓',
            pronoun: '👤',
            article_declension: '📝',
        };
        return emojis[type] || '📄';
    };

    const formatTypeName = (type: string) => {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const totalSelected = selectedCategories.reduce((sum, cat) => sum + (categoryCounts?.[cat] || 0), 0);
    const totalWords = Object.values(categoryCounts || {}).reduce((sum, count) => sum + count, 0);

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Word Types Section */}
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>🏷️</span> Word Types
                    </h3>
                    <button
                        onClick={handleSelectAllTypes}
                        className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        {selectedTypes.length === wordTypes.length ? 'Clear' : 'All'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {wordTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleTypeToggle(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${getTypeStyle(type, selectedTypes.includes(type))}`}
                        >
                            <span>{getTypeEmoji(type)}</span>
                            <span>{formatTypeName(type)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Categories Section */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>📂</span> Categories
                        <span className="text-slate-500 font-normal normal-case">
                            ({selectedCategories.length} of {categories.length})
                        </span>
                    </h3>
                    <button
                        onClick={handleSelectAllCategories}
                        className="text-xs px-2 py-1 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        {selectedCategories.length === categories.length ? 'Clear' : 'All'}
                    </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {categories.map((category) => {
                        const isSelected = selectedCategories.includes(category);
                        const count = categoryCounts?.[category] || 0;
                        return (
                            <button
                                key={category}
                                onClick={() => handleCategoryToggle(category)}
                                className={`group relative px-3 py-2 rounded-lg text-left transition-all ${isSelected
                                        ? 'bg-emerald-500/15 border border-emerald-500/50'
                                        : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-sm truncate ${isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                        {category}
                                    </span>
                                    <span className={`text-xs tabular-nums ${isSelected ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                                        {count}
                                    </span>
                                </div>
                                {/* Selection indicator */}
                                {isSelected && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                            </button>
                        );
                    })}
                </div>

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
