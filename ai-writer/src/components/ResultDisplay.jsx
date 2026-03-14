export default function ResultDisplay({ result, onSelectSuggestion, isLoading }) {
    if (isLoading) {
        return (
            <div className="p-4 md:p-6 fade-in">
                <div className="glass-card-strong">
                    <div className="loading-container">
                        <div className="loading-quill">🖋️</div>
                        <LoadingMessages />
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="p-4 md:p-6 fade-in">
            {/* Novel Text */}
            <div className="glass-card-strong mb-4 overflow-hidden">
                <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <h3 className="text-sm font-bold text-[var(--color-accent-purple)]">今回のエピソード</h3>
                </div>
                <div className="novel-text-area">{result.novel_text}</div>
            </div>

            {/* AI Comment */}
            {result.ai_comment && (
                <div className="glass-card mb-4 overflow-hidden fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                        <span className="text-lg">💬</span>
                        <h3 className="text-sm font-bold text-[var(--color-text-secondary)]">AI作家のひとこと</h3>
                    </div>
                    <div className="px-5 pb-4">
                        <div className="ai-comment-area">{result.ai_comment}</div>
                    </div>
                </div>
            )}

            {/* Suggested Options */}
            {result.suggested_options && result.suggested_options.length > 0 && (
                <div className="glass-card p-5 fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🔮</span>
                        <h3 className="text-sm font-bold text-[var(--color-accent-purple)]">次の展開の提案</h3>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                        {result.suggested_options.map((option, i) => (
                            <button
                                key={i}
                                className="suggestion-button"
                                onClick={() => onSelectSuggestion(option)}
                                id={`suggestion-${i}`}
                            >
                                <span className="text-xs text-[var(--color-accent-purple)] font-bold">
                                    {['A', 'B', 'C'][i]}.
                                </span>{' '}
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function LoadingMessages() {
    const messages = [
        '作家先生、インスピレーションを待っています...',
        '珈琲を淹れながら構想中...',
        '原稿用紙に向かっています...',
        '「まだ書けない」と言い訳を考え中...',
        'キャラクターと相談中...',
    ];

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    return <div className="loading-text">{randomMsg}</div>;
}
