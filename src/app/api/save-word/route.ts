import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { word } = await request.json();

        if (!word || typeof word !== 'object') {
            return NextResponse.json({ error: 'Word data is required' }, { status: 400 });
        }

        // Path to words.json
        const wordsFilePath = path.join(process.cwd(), 'src', 'data', 'words.json');

        // Read current words
        const fileContent = await fs.readFile(wordsFilePath, 'utf-8');
        const words = JSON.parse(fileContent);

        // Check if word already exists
        const exists = words.some(
            (w: { word: string; category: string }) =>
                w.word.toLowerCase() === word.word.toLowerCase() &&
                w.category === word.category
        );

        if (exists) {
            return NextResponse.json({ error: 'Word already exists in collection' }, { status: 409 });
        }

        // Add new word
        words.push(word);

        // Write back to file
        await fs.writeFile(wordsFilePath, JSON.stringify(words, null, 2), 'utf-8');

        return NextResponse.json({ success: true, message: 'Word added successfully' });
    } catch (error) {
        console.error('Save word error:', error);
        return NextResponse.json({ error: 'Failed to save word' }, { status: 500 });
    }
}
