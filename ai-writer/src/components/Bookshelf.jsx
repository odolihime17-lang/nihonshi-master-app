import { useState } from 'react';
import { WRITERS, getWriter } from '../data/writers';

export default function Bookshelf({ works, onOpenWork, onNewWork, onDeleteWork }) {
    const [filter, setFilter] = useState('all');

    const filteredWorks = filter === 'all'
        ? works
        : works.filter(w => w.writer_id === filter);

    const sortedWorks = [...filteredWorks].sort((a, b) =>
        new Date(b.updated_at) - new Date(a.updated_at)
    );

    return (
        <div className="p-3 sm:p-4 md:p-6 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        📚 本棚
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        {works.length}作品
                    </p>
                </div>
                <button className="new-work-button" onClick={onNewWork}>
                    ＋ 新しく書く
                </button>
            </div>

            {/* Writer Filter Tabs */}
            <div className="writer-filter-tabs">
                <button
                    className={`writer-filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    📚 全て
                </button>
                {WRITERS.map(w => (
                    <button
                        key={w.id}
                        className={`writer-filter-tab ${filter === w.id ? 'active' : ''}`}
                        onClick={() => setFilter(w.id)}
                        style={filter === w.id ? { borderColor: w.color, color: w.color } : {}}
                    >
                        {w.emoji} {w.name}
                    </button>
                ))}
            </div>

            {/* Works List */}
            {sortedWorks.length === 0 ? (
                <div className="glass-card-strong p-8 sm:p-12 text-center">
                    <div className="text-4xl mb-4">{filter === 'all' ? '📖' : getWriter(filter).emoji}</div>
                    <p className="text-[var(--color-text-secondary)] text-sm">
                        {filter === 'all' ? 'まだ作品がありません' : `${getWriter(filter).name}の作品がありません`}
                    </p>
                    <button className="new-work-button mt-4" onClick={onNewWork}>
                        ＋ 新しく書く
                    </button>
                </div>
            ) : (
                <div className="works-grid">
                    {sortedWorks.map(work => {
                        const writer = getWriter(work.writer_id);
                        return (
                            <div key={work.id} className="work-card" onClick={() => onOpenWork(work.id)}>
                                <div className="work-card-header">
                                    <div className="flex items-center gap-2">
                                        <span className="work-card-writer" style={{ color: writer.color }}>
                                            {writer.emoji} {writer.name}
                                        </span>
                                        {work.genre && (
                                            <span
                                                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                                                style={{ backgroundColor: `${writer.color}22`, color: writer.color, border: `1px solid ${writer.color}44` }}
                                            >
                                                {work.genre}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`work-card-status ${work.status}`}>
                                        {work.status === 'completed' ? '📕 完結' : '📝 執筆中'}
                                    </span>
                                </div>
                                <h3 className="work-card-title">{work.title || '無題の物語'}</h3>
                                <p className="work-card-preview">
                                    {work.summary?.synopsis || '物語はまだ始まっていません...'}
                                </p>
                                <div className="work-card-footer">
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {work.episodes?.length || 0}話
                                    </span>
                                    <button
                                        className="work-delete-btn"
                                        onClick={(e) => { e.stopPropagation(); onDeleteWork(work.id); }}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
