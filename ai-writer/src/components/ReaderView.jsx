import { useState } from 'react';
import { getWriter } from '../data/writers';

export default function ReaderView({ work, onBack }) {
    const [copied, setCopied] = useState(false);

    if (!work) return null;

    const writer = getWriter(work.writer_id);
    const title = work.title || '無題の物語';

    // Assemble full text for downloading/copying
    const assembleText = () => {
        let text = `${title}\n`;
        text += `作家: ${writer.name}\n`;
        text += `完結日: ${new Date(work.updated_at).toLocaleDateString()}\n`;
        text += `==============================\n\n`;

        (work.episodes || []).forEach((ep, i) => {
            text += `第${i + 1}話: ${ep.topic || '無題'}\n\n`;
            text += `${ep.novel_text}\n\n`;
            text += `----------\n\n`;
        });

        return text;
    };

    const handleDownload = () => {
        const text = assembleText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        const text = assembleText();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('コピーに失敗しました。');
        }
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 pb-24 fade-in">
            {/* Back Button */}
            <button className="reader-back-btn" onClick={onBack}>
                ← 本棚に戻る
            </button>

            {/* Title Header */}
            <div className="glass-card-strong p-4 sm:p-6 mb-4 text-center">
                <span className="text-xs font-bold" style={{ color: writer.color }}>
                    {writer.emoji} {writer.name}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold mt-1 mb-2">
                    {title}
                </h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                    全{work.episodes?.length || 0}話
                    {work.status === 'completed' && ' ・ 完結'}
                </p>
            </div>

            {/* Reading Area */}
            <div className="glass-card-strong reader-body">
                {(work.episodes || []).length === 0 ? (
                    <p className="text-center text-[var(--color-text-muted)] py-12">
                        まだ本文がありません
                    </p>
                ) : (
                    (work.episodes || []).map((ep, i) => (
                        <div key={i} className="reader-episode border-b border-white/5 last:border-0 pb-8 mb-8">
                            <div className="reader-episode-header text-sm font-bold opacity-50 mb-4">
                                第{i + 1}話
                                {ep.topic && <span className="reader-episode-topic ml-2"> — {ep.topic}</span>}
                            </div>
                            <div className="reader-episode-text leading-loose">
                                {ep.novel_text.split('\n').map((line, idx) => (
                                    <p key={idx} className={line.trim() ? "mb-4" : "h-4"}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Fixed Action Bar at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg)] to-transparent z-50">
                <div className="max-w-[800px] mx-auto flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 glass-card-strong p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
                    >
                        <span className="text-lg">💾</span>
                        <span className="text-sm font-bold">テキスト保存</span>
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`flex-1 glass-card-strong p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all ${copied ? 'border-green-500/50 text-green-400' : ''}`}
                    >
                        <span className="text-lg">{copied ? '✅' : '📋'}</span>
                        <span className="text-sm font-bold">
                            {copied ? 'コピー完了！' : '全文をコピー'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
