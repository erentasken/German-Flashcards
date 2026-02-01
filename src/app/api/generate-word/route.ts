import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a German language expert assistant that generates flashcard data for German vocabulary learning.

Given a German word, analyze it and return a JSON object with the following structure. Be accurate and educational.

For NOUNS, return:
{
  "word": "the German noun (without article)",
  "article": "der/die/das",
  "plural": "plural form",
  "pluralArticle": "die",
  "category": "one of: Körper & Gesundheit, Orte & Verkehr, Haus & Wohnen, Essen & Trinken, Kleidung, Familie, Zeit, Wetter, Lernen, Verben, Adjektive, Farben, Freizeit, Menschen, Natur & Welt, Technik, Länder, Pronomen, Fragewörter, Partikel, Artikel, Studienfächer",
  "type": "noun",
  "english": "English translation",
  "sentence": {
    "de": "A natural German example sentence using the word",
    "en": "English translation of the sentence"
  }
}

For VERBS, return:
{
  "word": "infinitive form",
  "article": "",
  "plural": "",
  "pluralArticle": "",
  "category": "Verben",
  "type": "verb",
  "english": "English translation",
  "conjugations": {
    "ich": "conjugation",
    "du": "conjugation",
    "er/sie/es": "conjugation",
    "wir": "conjugation",
    "ihr": "conjugation",
    "sie/Sie": "conjugation"
  },
  "partizip": "Partizip II form (e.g., gegangen, gemacht)",
  "sentence": {
    "de": "A natural German example sentence",
    "en": "English translation"
  }
}

For ADJECTIVES, return:
{
  "word": "base form",
  "article": "",
  "plural": "",
  "pluralArticle": "",
  "category": "Adjektive",
  "type": "adjective",
  "english": "English translation",
  "komparativ": "comparative form",
  "superlativ": "superlative form (am ...sten)",
  "sentence": {
    "de": "A natural German example sentence",
    "en": "English translation"
  }
}

For PREPOSITIONS (Präpositionen), include contractions if applicable:
{
  "word": "preposition",
  "article": "",
  "plural": "",
  "pluralArticle": "",
  "category": "Partikel",
  "type": "particle",
  "partikelType": "Präposition",
  "english": "English translation",
  "contractions": [
    {"form": "contracted form", "from": "preposition + article", "example": "example usage"}
  ],
  "sentence": {
    "de": "Example sentence",
    "en": "Translation"
  }
}

For other word types (adverbs, conjunctions, etc.), use appropriate category and type.

IMPORTANT:
- Return ONLY valid JSON, no markdown or explanations
- All German text must use proper German characters (ä, ö, ü, ß)
- Sentences should be natural and useful for learners (A1-B1 level)
- Be accurate with grammar (articles, plurals, conjugations)`;

export async function POST(request: NextRequest) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Grok API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Generate flashcard data for the German word: "${word}"`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', error);
      return NextResponse.json({ error: 'Failed to generate word data' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from Grok' }, { status: 500 });
    }

    // Parse the JSON response
    try {
      // Remove potential markdown code blocks
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const wordData = JSON.parse(jsonStr);

      return NextResponse.json({ success: true, word: wordData });
    } catch (parseError) {
      console.error('Failed to parse Grok response:', content);
      return NextResponse.json({ error: 'Invalid response format', raw: content }, { status: 500 });
    }
  } catch (error) {
    console.error('Generate word error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
