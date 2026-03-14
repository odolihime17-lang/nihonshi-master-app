export default function NovelHistory({ episodes, onSelectEpisode }) {
    if (!episodes || episodes.length === 0) return null;

    return (
        <div className="p-4 md:p-6 fade-in">
            <div className="glass-card overflow-hidden">
                <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <h3 className="text-sm font-bold text-[var(--color-accent-purple)]">
                        これまでの物語
                    </h3>
                    <span className="text-xs text-[var(--color-text-muted)] ml-auto">
                        {episodes.length} エピソード
                    </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {episodes.map((ep, i) => (
                        <div
                            key={i}
                            className="history-item"
                            onClick={() => onSelectEpisode && onSelectEpisode(ep, i)}
                        >
                            <div className="history-episode">
                                第{i + 1}話 {ep.topic && `— ${ep.topic}`}
                            </div>
                            <div className="history-preview">
                                {ep.novel_text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
