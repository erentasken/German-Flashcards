export interface KasusDeklination {
    nominativ?: string;
    akkusativ?: string;
    dativ?: string;
    nominativPlural?: string;
    akkusativPlural?: string;
    dativPlural?: string;
}

export interface Word {
    word: string;
    article: string;
    plural: string;
    pluralArticle: string;
    category: string;
    english?: string;
    // Noun case declensions
    kasus?: KasusDeklination | string;  // string for Artikel entries (Nominativ/Akkusativ/Dativ)
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
    // Person/Profession specific (masculine/feminine pairs)
    feminine?: string;
    femininePlural?: string;
    // Pronoun specific
    possessive?: string;
    // Article declension specific
    geschlecht?: string;
    indefinit?: string;
    negation?: string;
    possessiv?: string;
    demonstrativ?: string;
}
