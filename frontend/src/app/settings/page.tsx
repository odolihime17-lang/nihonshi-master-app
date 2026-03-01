'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { pdfApi, PDFInfo } from '@/lib/api';
import { Navigation } from '@/components/Navigation';
import { Upload, Trash2, Globe, FileText, Plus, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUser } from '@/lib/hooks/useUser';

export default function Settings() {
    const [pdfs, setPdfs] = useState<PDFInfo[]>([]);
    const [driveUrl, setDriveUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const { userId, isLoading: userLoading } = useUser();

    useEffect(() => {
        setMounted(true);
        if (userId) fetchPdfs();
    }, [userId]);

    const fetchPdfs = async () => {
        if (!userId) return;
        try {
            const res = await pdfApi.list(userId);
            setPdfs(res.data);
        } catch (err) {
            console.error('Failed to fetch PDFs:', err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setUploading(true);
        console.log('Uploading file:', file.name, 'size:', file.size);
        try {
            const res = await pdfApi.upload(userId, file);
            console.log('Upload success:', res.data);
            fetchPdfs();
        } catch (err: any) {
            console.error('Upload error details:', err);
            const msg = err.response?.data?.detail || err.message || 'Unknown error';
            alert(`Upload failed: ${msg}`);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            await pdfApi.delete(id);
            fetchPdfs();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleDriveUpload = async () => {
        if (!driveUrl || !userId) return;
        setUploading(true);
        try {
            await pdfApi.uploadDrive(userId, driveUrl);
            setDriveUrl('');
            fetchPdfs();
        } catch (err) {
            alert('Link upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (userLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <main className="min-h-screen p-6 max-w-md mx-auto pb-24">
            <header className="mb-10 pt-4 text-center">
                <h1 className="text-3xl font-black font-title text-slate-800 dark:text-white tracking-tight">教材・設定</h1>
                <p className="text-slate-500 dark:text-indigo-300 font-bold uppercase tracking-[0.15em] text-[10px] mt-2 font-outfit">Learning Materials</p>
            </header>

            {/* Appearance Section */}
            <section className="mb-8">
                <h3 className="text-sm font-black uppercase text-indigo-500 tracking-widest mb-3 px-1">外観の設定</h3>
                <Card className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">ダークモード</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">目に優しい配色に切り替え</p>
                        </div>
                    </div>
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    )}
                </Card>
            </section>

            {/* Upload Methods */}
            <section className="space-y-4 mb-8">
                <Card className="p-0 overflow-hidden">
                    <label className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold text-slate-800 dark:text-slate-100">PDF をアップロード</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">学校のプリントや資料 (各10MB以下)</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                    </label>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-slate-100">Google Drive から読み込み</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="共有リンクを入力"
                            value={driveUrl}
                            onChange={(e) => setDriveUrl(e.target.value)}
                            className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 dark:text-slate-100"
                        />
                        <button
                            onClick={handleDriveUpload}
                            disabled={uploading || !driveUrl}
                            className="bg-slate-800 dark:bg-slate-700 text-white p-3 rounded-xl disabled:opacity-50 active:scale-90 transition-transform"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                </Card>
            </section>

            {/* Saved PDFs */}
            <section>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    保存済みの資料
                </h3>
                <div className="space-y-3">
                    {pdfs.length > 0 ? (
                        pdfs.map((pdf) => (
                            <div key={pdf.id} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate pr-2 text-slate-800 dark:text-slate-100">{pdf.file_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pdf.char_count.toLocaleString()} Chars</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(pdf.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <FileText className="w-12 h-12 mx-auto mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">まだ資料がありません</p>
                        </div>
                    )}
                </div>
            </section>

            {uploading && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-black text-indigo-600">読み込み中...</p>
                    </div>
                </div>
            )}

            <Navigation />
        </main>
    );
}
