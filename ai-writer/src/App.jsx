import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getWriter } from './data/writers';
import Layout from './components/Layout';
import Bookshelf from './components/Bookshelf';
import WriterSelect from './components/WriterSelect';
import ChatUI from './components/ChatUI';
import WritingDashboard from './components/WritingDashboard';
import ResultDisplay from './components/ResultDisplay';
import NovelHistory from './components/NovelHistory';
import ReaderView from './components/ReaderView';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function App() {
    // ─── Global state ─────────────────────────────────────────────
    const [phase, setPhase] = useLocalStorage('ai-writer-phase', 0);
    const [works, setWorks] = useLocalStorage('ai-writer-works', []);
    const [activeWorkId, setActiveWorkId] = useLocalStorage('ai-writer-active-work', null);
    const [theme, setTheme] = useLocalStorage('ai-writer-theme', 'dark');
    const [isLoading, setIsLoading] = useState(false);
    const [latestResult, setLatestResult] = useState(null);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, [setTheme]);

    // ─── Derived state ────────────────────────────────────────────
    const activeWork = useMemo(
        () => works.find(w => w.id === activeWorkId) || null,
        [works, activeWorkId]
    );

    // ─── Helper: update current work in works array ───────────────
    const updateWork = useCallback((workId, updater) => {
        setWorks(prev => prev.map(w => w.id === workId ? { ...w, ...updater(w), updated_at: new Date().toISOString() } : w));
    }, [setWorks]);

    // ─── Phase 0: Bookshelf actions ───────────────────────────────
    const handleNewWork = useCallback(() => {
        setPhase(0.5); // Go to writer selection
    }, [setPhase]);

    const handleOpenWork = useCallback((workId) => {
        const work = works.find(w => w.id === workId);
        if (!work) return;
        setActiveWorkId(workId);
        if (work.status === 'completed') {
            setPhase(3); // Reader
        } else if (work.episodes && work.episodes.length > 0) {
            setPhase(2); // Writing phase
        } else {
            setPhase(1); // Chat phase
        }
        setLatestResult(null);
    }, [works, setActiveWorkId, setPhase]);

    const handleDeleteWork = useCallback((workId) => {
        setWorks(prev => prev.filter(w => w.id !== workId));
        if (activeWorkId === workId) {
            setActiveWorkId(null);
            setPhase(0);
        }
    }, [activeWorkId, setWorks, setActiveWorkId, setPhase]);

    // ─── Phase 0.5: Writer selection ──────────────────────────────
    const handleSelectWriter = useCallback((writerId) => {
        const newWork = {
            id: generateId(),
            title: '執筆中...',
            writer_id: writerId,
            status: 'writing',
            summary: null,
            chat_history: [],
            episodes: [],
            full_text: '',
            story_mode: 'normal',
            turns_remaining: 3,
            world_setting: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setWorks(prev => [...prev, newWork]);
        setActiveWorkId(newWork.id);
        setPhase(1);
        setLatestResult(null);
    }, [setWorks, setActiveWorkId, setPhase]);

    // ─── Phase 1: Chat ────────────────────────────────────────────
    const handleSendChatMessage = useCallback(async (text) => {
        if (!activeWork) return;
        const userMsg = { role: 'user', content: text };
        const newHistory = [...(activeWork.chat_history || []), userMsg];

        updateWork(activeWorkId, () => ({ chat_history: newHistory }));
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: newHistory,
                    worldSetting: activeWork.world_setting || '',
                    writerId: activeWork.writer_id,
                }),
            });
            const data = await res.json();
            const aiMsg = { role: 'ai', content: data.reply };

            updateWork(activeWorkId, (w) => ({
                chat_history: [...(w.chat_history || []), aiMsg],
                world_setting: data.worldSetting || w.world_setting,
            }));
        } catch (error) {
            console.error('Chat error:', error);
            const errMsg = { role: 'ai', content: '通信エラーが発生しました…もう一度お試しください。' };
            updateWork(activeWorkId, (w) => ({
                chat_history: [...(w.chat_history || []), errMsg],
            }));
        } finally {
            setIsLoading(false);
        }
    }, [activeWork, activeWorkId, updateWork]);

    const handleProceedToWriting = useCallback(async () => {
        if (!activeWork) {
            setPhase(2);
            return;
        }

        // Automatic determination is now secondary or removed based on user preference, 
        // since we are moving towards explicit selection. We'll keep it as a fallback 
        // if no genre is set.
        if (!activeWork.genre) {
            try {
                const res = await fetch('/api/genre', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: activeWork.chat_history || [] }),
                });
                const data = await res.json();
                if (data.genre) {
                    updateWork(activeWorkId, (w) => ({ genre: data.genre }));
                }
            } catch (error) {
                console.error('Failed to determine genre:', error);
            }
        }

        setPhase(2);
    }, [activeWork, activeWorkId, setPhase, updateWork]);

    const handleSelectGenre = useCallback((genre) => {
        if (!activeWorkId) return;
        updateWork(activeWorkId, () => ({ genre }));
    }, [activeWorkId, updateWork]);

    // ─── Phase 2: Generate ────────────────────────────────────────
    const handleGenerate = useCallback(async ({ topic, chaos, storyMode: requestedMode }) => {
        if (!activeWork) return;
        setIsLoading(true);
        setLatestResult(null);

        const currentMode = requestedMode || activeWork.story_mode || 'normal';
        const currentTurns = activeWork.turns_remaining || 3;
        const recentEpisodes = (activeWork.episodes || []).slice(-2).map(ep => ep.novel_text || '');

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic, chaos,
                    worldSetting: activeWork.world_setting || '',
                    storySummary: activeWork.story_summary, // Fixed key if it was wrong
                    recentEpisodes,
                    storyMode: currentMode,
                    turnsRemaining: currentTurns,
                    genre: activeWork.genre,
                    writerId: activeWork.writer_id,
                }),
            });
            const data = await res.json();
            setLatestResult(data);

            // Update the work with the new episode + summary
            const newEpisode = {
                novel_text: data.novel_text,
                ai_comment: data.ai_comment,
                suggested_options: data.suggested_options,
                topic: data.episode_title || topic, // Use AI-generated title if available
                chaos, storyMode: currentMode,
                timestamp: new Date().toISOString(),
            };

            updateWork(activeWorkId, (w) => {
                const episodes = [...(w.episodes || []), newEpisode];
                const fullText = episodes.map(ep => ep.novel_text).join('\n\n');

                // Formal title update on completion
                let title = data.final_title || w.title;

                let newStoryMode = w.story_mode;
                let newTurnsRemaining = w.turns_remaining;
                let newStatus = w.status;

                if (currentMode === 'ending_soon') {
                    newTurnsRemaining = currentTurns - 1;
                    if (newTurnsRemaining <= 0) {
                        newStatus = 'completed';
                        newStoryMode = 'normal';
                    }
                }
                if (currentMode === 'abrupt_end') {
                    newStatus = 'completed';
                    newStoryMode = 'normal';
                }

                return {
                    episodes,
                    full_text: fullText,
                    title,
                    summary: data.story_summary || w.summary,
                    story_mode: newStoryMode,
                    turns_remaining: newTurnsRemaining,
                    status: newStatus,
                };
            });

        } catch (error) {
            console.error('Generate error:', error);
            setLatestResult({
                novel_text: '（通信エラー）',
                ai_comment: '通信エラーが発生しました。',
                suggested_options: ['もう一度試す'],
            });
        } finally {
            setIsLoading(false);
        }
    }, [activeWork, activeWorkId, updateWork]);

    const handleSelectSuggestion = useCallback((suggestion) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleGenerate({ topic: suggestion, chaos: 5 });
    }, [handleGenerate]);

    const handleStoryModeChange = useCallback((mode) => {
        if (!activeWorkId) return;
        updateWork(activeWorkId, () => ({
            story_mode: mode,
            ...(mode === 'ending_soon' ? { turns_remaining: 3 } : {}),
        }));
    }, [activeWorkId, updateWork]);

    const handleNewStory = useCallback(() => {
        setPhase(0);
        setActiveWorkId(null);
        setLatestResult(null);
    }, [setPhase, setActiveWorkId]);

    const handleGoHome = useCallback(() => {
        setPhase(0);
        setActiveWorkId(null);
        setLatestResult(null);
    }, [setPhase, setActiveWorkId]);

    // ─── Render ───────────────────────────────────────────────────
    return (
        <Layout
            phase={phase}
            activeWork={activeWork}
            onGoHome={handleGoHome}
            theme={theme}
            onToggleTheme={toggleTheme}
        >
            {phase === 0 && (
                <Bookshelf
                    works={works}
                    onOpenWork={handleOpenWork}
                    onNewWork={handleNewWork}
                    onDeleteWork={handleDeleteWork}
                />
            )}

            {phase === 0.5 && (
                <WriterSelect onSelect={handleSelectWriter} />
            )}

            {phase === 1 && activeWork && (
                <ChatUI
                    messages={activeWork.chat_history || []}
                    onSendMessage={handleSendChatMessage}
                    isLoading={isLoading}
                    writerId={activeWork.writer_id}
                    genre={activeWork.genre}
                    onSelectGenre={handleSelectGenre}
                    onProceedToWriting={handleProceedToWriting}
                />
            )}

            {phase === 2 && activeWork && (
                <>
                    <WritingDashboard
                        onGenerate={handleGenerate}
                        isLoading={isLoading}
                        storyMode={activeWork.story_mode || 'normal'}
                        onStoryModeChange={handleStoryModeChange}
                        turnsRemaining={activeWork.turns_remaining || 3}
                        storyEnded={activeWork.status === 'completed'}
                        onNewStory={handleNewStory}
                        episodeCount={(activeWork.episodes || []).length}
                        writerId={activeWork.writer_id}
                    />
                    <ResultDisplay
                        result={latestResult}
                        onSelectSuggestion={handleSelectSuggestion}
                        isLoading={isLoading}
                        writerId={activeWork.writer_id}
                    />
                    <NovelHistory
                        episodes={activeWork.episodes || []}
                        onSelectEpisode={(ep) => setLatestResult(ep)}
                    />
                </>
            )}

            {phase === 3 && activeWork && (
                <ReaderView
                    work={activeWork}
                    onBack={handleGoHome}
                />
            )}
        </Layout>
    );
}
