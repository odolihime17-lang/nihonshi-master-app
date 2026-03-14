import { useState } from 'react';

export default function WritingDashboard({
    onGenerate,
    isLoading,
    storyMode,
    onStoryModeChange,
    turnsRemaining,
    storyEnded,
    onNewStory,
    episodeCount,
    writerId,
}) {
    const [topic, setTopic] = useState('');
    const [chaos, setChaos] = useState(5);

    const chaosLabels = [
        '', '穏やか', '安定', '少し冒険', 'バランス', '予測不能',
        'カオス気味', '暴走寸前', '制御不能', 'AI解放', '完全カオス'
    ];

    const chaosEmojis = ['', '🌱', '🌿', '🌊', '⚡', '🌀', '🔥', '💥', '🌋', '👁️', '🃏'];

    const handleGenerate = () => {
        if (isLoading || storyEnded) return;
        onGenerate({ topic, chaos, storyMode });
    };

    const storyModeOptions = [
        { value: 'normal', label: '📖 通常進行', desc: 'いつも通り物語を展開' },
        { value: 'ending_soon', label: '🏁 あと3話で完結', desc: '伏線回収→大団円へ' },
        { value: 'abrupt_end', label: '💀 いきなり打ち切り', desc: '今回で強引に完結' },
    ];

    return (
        <div className="p-3 sm:p-4 md:p-6 fade-in">
            <div className="glass-card-strong p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                    ✍️ 執筆依頼ダッシュボード
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4 sm:mb-6">
                    AI作家に次の展開を依頼しましょう
                    {episodeCount > 0 && (
                        <span className="ml-2 text-xs text-[var(--color-accent-purple)]">
                            （第{episodeCount + 1}話）
                        </span>
                    )}
                </p>

                {/* Story Ended Banner */}
                {storyEnded && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex-1">
                                <p className="font-bold text-sm flex items-center gap-2">
                                    📕 物語は完結しました
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    新しい物語を始めるか、過去のエピソードを振り返りましょう
                                </p>
                            </div>
                            <button
                                className="new-story-button"
                                onClick={onNewStory}
                            >
                                🌟 新しい物語を始める
                            </button>
                        </div>
                    </div>
                )}

                {/* Story Mode Selector */}
                {!storyEnded && (
                    <div className="dashboard-section">
                        <label className="section-label">🎬 物語の進行指示</label>
                        <div className="flex flex-col gap-2 mt-1">
                            {storyModeOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`story-mode-option ${storyMode === opt.value ? 'active' : ''}`}
                                    onClick={() => onStoryModeChange(opt.value)}
                                    disabled={isLoading}
                                >
                                    <span className="story-mode-label">{opt.label}</span>
                                    <span className="story-mode-desc">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                        {storyMode === 'ending_soon' && (
                            <div className="mt-2 p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 text-xs text-amber-300/80 flex items-center gap-2">
                                <span className="text-lg">⏳</span>
                                <span>完結まであと <strong className="text-amber-200">{turnsRemaining}話</strong></span>
                            </div>
                        )}
                        {storyMode === 'abrupt_end' && (
                            <div className="mt-2 p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-xs text-red-300/80 flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <span>次の執筆で物語が <strong className="text-red-200">強制終了</strong> します！</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Topic Input */}
                {!storyEnded && (
                    <div className="dashboard-section">
                        <label className="section-label" htmlFor="topic-input">📝 今日のお題 / 展開の方向性</label>
                        <textarea
                            id="topic-input"
                            className="topic-input"
                            placeholder="例: 主人公が謎の森に迷い込む、はじめての仲間との出会い、裏切り者の正体が明らかに..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Chaos Slider */}
                {!storyEnded && (
                    <div className="dashboard-section">
                        <label className="section-label">🎲 カオス度</label>
                        <div className="glass-card p-4 sm:p-5 mt-2">
                            <div className="chaos-value">
                                <span>{chaosEmojis[chaos]}</span> {chaos} <span className="text-base font-normal text-[var(--color-text-secondary)]">/ 10</span>
                            </div>
                            <p className="text-center text-sm text-[var(--color-text-muted)] mb-4">{chaosLabels[chaos]}</p>
                            <div className="chaos-slider-container">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={chaos}
                                    onChange={(e) => setChaos(Number(e.target.value))}
                                    className="chaos-slider"
                                    id="chaos-slider"
                                    disabled={isLoading}
                                />
                                <div className="chaos-labels">
                                    <span>🌱 穏やか</span>
                                    <span>🃏 完全カオス</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                {!storyEnded && (
                    <button
                        className={`generate-button ${storyMode === 'abrupt_end' ? 'abrupt-mode' : ''}`}
                        onClick={handleGenerate}
                        disabled={isLoading}
                        id="generate-button"
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-quill" style={{ fontSize: '1.2rem', animation: 'quillWrite 1s ease-in-out infinite' }}>🖋️</span>
                                執筆中...
                            </>
                        ) : storyMode === 'abrupt_end' ? (
                            <>💀 打ち切りを宣告する</>
                        ) : storyMode === 'ending_soon' ? (
                            <>🏁 執筆を依頼する（残り{turnsRemaining}話）</>
                        ) : (
                            <>🖋️ 執筆を依頼する</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
