import { getWriter } from '../data/writers';

export default function Layout({ children, phase, activeWork, onGoHome, theme, onToggleTheme }) {
    const writer = activeWork ? getWriter(activeWork.writer_id) : null;

    // Phase labels
    const phaseLabels = {
        0: '📚 本棚',
        0.5: '✨ 作家選択',
        1: '💬 設定すり合わせ',
        2: '✍️ 執筆',
        3: '📖 閲覧',
    };

    const showBackButton = phase > 0;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="app-header">
                <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
                    {/* Back to Bookshelf */}
                    {showBackButton && (
                        <button
                            className="header-back-btn"
                            onClick={onGoHome}
                            title="本棚に戻る"
                        >
                            ←
                        </button>
                    )}

                    {/* Title / Writer Info */}
                    <div className="flex-1 min-w-0">
                        {writer ? (
                            <div className="flex items-center gap-2">
                                <span className="text-lg sm:text-xl">{writer.emoji}</span>
                                <div className="min-w-0">
                                    <h1 className="text-sm sm:text-base font-bold truncate" style={{ color: writer.color }}>
                                        {writer.name}
                                    </h1>
                                    <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] truncate">
                                        {activeWork.title || '無題の物語'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-lg sm:text-xl">🖋️</span>
                                <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                                    気まぐれAI作家と私
                                </h1>
                            </div>
                        )}
                    </div>

                    {/* Phase Badge */}
                    <div className="flex items-center gap-2">
                        <span className="phase-badge">
                            {phaseLabels[phase] || ''}
                        </span>

                        {/* Theme Toggle Button */}
                        <button
                            className="theme-toggle-btn"
                            onClick={onToggleTheme}
                            title={theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
