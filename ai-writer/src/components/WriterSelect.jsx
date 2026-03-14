import { WRITERS } from '../data/writers';

export default function WriterSelect({ onSelect }) {
    return (
        <div className="p-3 sm:p-4 md:p-6 fade-in">
            <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">✨ 作家を選ぶ</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                    どの作家に書いてもらう？
                </p>
            </div>

            <div className="writer-select-grid">
                {WRITERS.map(w => (
                    <button
                        key={w.id}
                        className="writer-select-card"
                        onClick={() => onSelect(w.id)}
                        style={{ '--writer-color': w.color }}
                    >
                        <div className="writer-select-emoji">{w.emoji}</div>
                        <div className="writer-select-name">{w.name}</div>
                        <div className="writer-select-tagline">{w.tagline}</div>
                        <div className="writer-select-desc">{w.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
