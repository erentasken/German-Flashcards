export interface Sentence {
    de: string;
    en: string;
}

export interface Contraction {
    form: string;      // e.g., "beim"
    from: string;      // e.g., "bei + dem"
    example?: string;  // e.g., "beim Essen"
}

export interface Word {
    word: string;
    article: string;
    plural: string;
    pluralArticle: string;
    category: string;
    english?: string;
    sentence?: Sentence;
    type?: 'noun' | 'verb' | 'adjective' | 'particle' | 'question_word' | 'country' | 'pronoun' | 'article_declension';
    // Verb specific
    conjugations?: Record<string, string>;
    partizip?: string;
    // Adjective specific
    komparativ?: string;
    superlativ?: string;
    // Country specific
    languages?: string[];
    // Particle specific
    partikelType?: string;
    contractions?: Contraction[];  // For prepositions that contract with articles
    // Person/Profession specific (masculine/feminine pairs)
    feminine?: string;
    femininePlural?: string;
    // Pronoun specific
    possessive?: string;
    // Article declension specific
    kasus?: string;
    geschlecht?: string;
    indefinit?: string;
    negation?: string;
    possessiv?: string;
    demonstrativ?: string;
}
