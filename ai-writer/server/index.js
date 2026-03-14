import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleChat, handleGenerate, handleDetermineGenre } from './gemini.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', apiKeySet: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here' });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, worldSetting, writerId } = req.body;
        if (!message) return res.status(400).json({ error: 'message is required' });
        const result = await handleChat(message, history || [], worldSetting || '', writerId || 'veteran');
        res.json(result);
    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { topic, chaos, worldSetting, storySummary, recentEpisodes, storyMode, turnsRemaining, genre, writerId } = req.body;
        const result = await handleGenerate({
            topic: topic || '', chaos: chaos || 5, worldSetting: worldSetting || '',
            storySummary: storySummary || null, recentEpisodes: recentEpisodes || [],
            storyMode: storyMode || 'normal', turnsRemaining: turnsRemaining || 0,
            genre: genre || '',
            writerId: writerId || 'veteran',
        });
        res.json(result);
    } catch (error) {
        console.error('Generate endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/genre', async (req, res) => {
    try {
        const { history } = req.body;
        const genre = await handleDetermineGenre(history || []);
        res.json({ genre });
    } catch (error) {
        console.error('Genre endpoint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Only listen if this file is run directly (local dev)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🖋️ AI Writer API server running at http://localhost:${PORT}`);
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
            console.log('⚠️  GEMINI_API_KEY not set. Running in mock mode.');
        } else {
            console.log('✅ Gemini API key detected. AI mode active.');
        }
    });
}

export default app;
