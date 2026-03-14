import { useState, useRef, useEffect } from 'react';
import { getWriter } from '../data/writers';

const GENRES = [
    { id: 'ファンタジー', label: 'ファンタジー', emoji: '🏰' },
    { id: '推理小説', label: '推理小説', emoji: '🔍' },
    { id: '学園もの', label: '学園もの', emoji: '🏫' },
    { id: 'SF・宇宙', label: 'SF・宇宙', emoji: '🚀' },
    { id: '恋愛', label: '恋愛', emoji: '💖' },
    { id: 'ホラー', label: 'ホラー', emoji: '👻' },
    { id: 'コメディ', label: 'コメディ', emoji: '😂' },
    { id: '歴史・ドラマ', label: '歴史・ドラマ', emoji: '🎭' },
];

export default function ChatUI({ messages, onSendMessage, isLoading, writerId, genre, onSelectGenre, onProceedToWriting }) {
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const writer = getWriter(writerId);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isLoading) return;
        onSendMessage(text);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col flex-1 fade-in" style={{ height: 'calc(100dvh - 52px)' }}>
            {/* Genre Badge (If selected) */}
            {genre && (
                <div className="px-4 py-2 bg-[var(--color-bg-glass)] border-b border-[var(--color-border-glass)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-muted)]">現在のジャンル:</span>
                        <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: `${writer.color}22`, color: writer.color, border: `1px solid ${writer.color}44` }}
                        >
                            {genre}
                        </span>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div className="chat-container flex-1 overflow-y-auto">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 py-10 sm:py-16 gap-3 sm:gap-4 px-4">
                        <div className="text-4xl sm:text-5xl">{writer.emoji}</div>
                        <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                            {writer.name}と物語の世界を作ろう
                        </h2>

                        {!genre ? (
                            <>
                                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] text-center max-w-md leading-relaxed">
                                    まずは物語のジャンルを選んでください。
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 sm:mt-4 w-full max-w-lg">
                                    {GENRES.map((g) => (
                                        <button
                                            key={g.id}
                                            className="suggestion-button flex flex-col items-center gap-1 py-3"
                                            onClick={() => onSelectGenre(g.id)}
                                        >
                                            <span className="text-xl">{g.emoji}</span>
                                            <span className="text-[10px] font-bold">{g.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] text-center max-w-md leading-relaxed">
                                次に、具体的な世界観やキャラクター設定を教えてください。<br />
                                （例：剣と魔法の国、探偵と助手、宇宙ステーションの日常など）
                            </p>
                        )}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                        {msg.role === 'ai' && (
                            <div className="ai-label" style={{ color: writer.color }}>
                                {writer.emoji} {writer.name}
                            </div>
                        )}
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                ))}

                {isLoading && (
                    <div className="chat-bubble ai">
                        <div className="ai-label" style={{ color: writer.color }}>
                            {writer.emoji} {writer.name}
                        </div>
                        <div className="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Proceed to Writing Button */}
            {messages.length >= 2 && (
                <div className="px-3 py-2 border-t border-[var(--color-border-glass)]">
                    <button className="proceed-writing-btn" onClick={onProceedToWriting}>
                        ✍️ 執筆フェーズに進む
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    className="chat-input"
                    placeholder="世界観やキャラ設定を入力..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    id="chat-input"
                />
                <button
                    className="send-button"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    id="send-button"
                >
                    ➤
                </button>
            </div>
        </div>
    );
}
