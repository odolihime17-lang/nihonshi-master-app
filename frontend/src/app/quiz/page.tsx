'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Navigation } from '@/components/Navigation';
import { quizApi, pdfApi, PDFInfo, QuizQuestion } from '@/lib/api';
import { ERAS, FIELDS, QUIZ_TYPES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw, Zap, Home as HomeIcon, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import { Suspense } from 'react';

function QuizContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState<'config' | 'loading' | 'quiz' | 'results'>('config');
    const [pdfs, setPdfs] = useState<PDFInfo[]>([]);
    const [config, setConfig] = useState({
        era: ERAS[0],
        field: FIELDS[0],
        quizType: QUIZ_TYPES[0],
        selectedPdfs: [] as number[],
    });
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
    const [userTextAnswer, setUserTextAnswer] = useState('');
    const { userId, isLoading: userLoading } = useUser();

    useEffect(() => {
        if (!userId) return;
        pdfApi.list(userId).then(res => setPdfs(res.data));

        const eraParam = searchParams.get('era');
        const fieldParam = searchParams.get('field');

        if (eraParam || fieldParam) {
            const newConfig = {
                ...config,
                era: eraParam || ERAS[0],
                field: fieldParam || FIELDS[0],
            };
            setConfig(newConfig);

            // Auto-start if parameters are provided
            const autoStart = async () => {
                setStep('loading');
                try {
                    const res = await quizApi.generate({
                        user_id: userId,
                        era: eraParam || ERAS[0],
                        field: fieldParam || FIELDS[0],
                        quiz_type: config.quizType,
                        pdf_ids: [],
                    });
                    setQuestions(res.data);
                    setStep('quiz');
                } catch {
                    alert('Generation failed');
                    setStep('config');
                }
            };
            autoStart();
        }
    }, [searchParams, userId]);

    if (userLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const handleStart = async () => {
        setStep('loading');
        try {
            const res = await quizApi.generate({
                user_id: userId || 'anonymous',
                era: config.era,
                field: config.field,
                quiz_type: config.quizType,
                pdf_ids: config.selectedPdfs,
            });
            setQuestions(res.data);
            setCurrentIndex(0);
            setScore(0);
            setStep('quiz');
        } catch (err) {
            alert('Generation failed');
            setStep('config');
        }
    };

    const handleAnswer = async (index: number | string) => {
        if (answered) return;

        const q = questions[currentIndex];
        let isCorrect = false;

        const submitResult = async (user_ans: string, correct_ans: string, correct: boolean) => {
            if (userId) {
                await quizApi.submit({
                    user_id: userId,
                    question_text: q.question || `文a: ${q.statement_a}, 文b: ${q.statement_b}`,
                    user_answer: user_ans,
                    correct_answer: correct_ans,
                    is_correct: correct,
                    era: q.era,
                    field: q.field,
                });
            }
        };

        if (config.quizType === '一問一答') {
            isCorrect = String(index).trim() === q.answer?.trim();
            setUserTextAnswer(String(index));
            setAnswered(true);
            if (isCorrect) setScore(s => s + 1);
            await submitResult(String(index), q.answer || '', isCorrect);
        } else {
            isCorrect = index === q.answer_index;
            setSelectedChoice(Number(index));
            setAnswered(true);
            if (isCorrect) setScore(s => s + 1);
            await submitResult(q.choices[Number(index)], q.choices[q.answer_index], isCorrect);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setAnswered(false);
            setSelectedChoice(null);
            setUserTextAnswer('');
        } else {
            setStep('results');
        }
    };

    if (step === 'config') return (
        <main className="min-h-screen p-6 max-w-md mx-auto pb-24">
            <header className="mb-10 pt-4 text-center">
                <h1 className="text-3xl font-black font-title text-slate-800 dark:text-white tracking-tight">クイズ設定</h1>
                <p className="text-slate-500 dark:text-indigo-300 font-bold uppercase tracking-[0.15em] text-[10px] mt-2 font-outfit">Quiz Configuration</p>
            </header>

            <div className="space-y-6">
                <section>
                    <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 block">資料を選択</label>
                    <div className="flex flex-wrap gap-2">
                        {pdfs.map(pdf => (
                            <button
                                key={pdf.id}
                                onClick={() => setConfig(c => ({
                                    ...c,
                                    selectedPdfs: c.selectedPdfs.includes(pdf.id)
                                        ? c.selectedPdfs.filter(id => id !== pdf.id)
                                        : [...c.selectedPdfs, pdf.id]
                                }))}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${config.selectedPdfs.includes(pdf.id)
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                {pdf.file_name}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 block">時代</label>
                    <select
                        value={config.era}
                        onChange={(e) => setConfig({ ...config, era: e.target.value })}
                        className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                        {ERAS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </section>

                <section>
                    <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 block">分野</label>
                    <select
                        value={config.field}
                        onChange={(e) => setConfig({ ...config, field: e.target.value })}
                        className="w-full p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                        {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </section>

                <section>
                    <label className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 block">出題形式</label>
                    <div className="grid grid-cols-1 gap-2">
                        {QUIZ_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setConfig({ ...config, quizType: type })}
                                className={`p-4 rounded-2xl text-left font-bold border-2 transition-all ${config.quizType === type
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </section>

                <button
                    onClick={handleStart}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
                >
                    <Zap className="w-6 h-6 fill-current" />
                    クイズを開始する
                </button>
            </div>

            <Navigation />
        </main>
    );

    if (step === 'loading') return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mb-8"
            />
            <h2 className="text-xl font-black text-slate-800">問題を生成中...</h2>
            <p className="text-slate-500 font-medium">Gemini AIがあなた専用の問題を作成しています</p>
        </div>
    );

    if (step === 'quiz') {
        const q = questions[currentIndex];
        const isCorrect = config.quizType === '一問一答'
            ? userTextAnswer === q.answer
            : selectedChoice === q.answer_index;

        return (
            <main className="min-h-screen p-6 max-w-md mx-auto">
                <header className="flex justify-between items-center mb-6 pt-4">
                    <Link href="/">
                        <button className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <HomeIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                    </Link>
                    <div className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-black text-xs tracking-tighter">
                        QUESTION {currentIndex + 1} / {questions.length}
                    </div>
                    <div className="w-10" />
                </header>

                <ProgressBar progress={((currentIndex + 1) / questions.length) * 100} />

                <div className="mt-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {config.quizType === '共通テスト形式（正誤判定）' ? (
                                <div className="space-y-4">
                                    <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl">
                                        <p className="text-[10px] font-black text-blue-500 uppercase mb-1">文 a</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{q.statement_a}</p>
                                    </div>
                                    <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 rounded-r-xl">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">文 b</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{q.statement_b}</p>
                                    </div>
                                </div>
                            ) : (
                                <Card className="min-h-[160px] flex items-center justify-center text-center px-6">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                        {q.question}
                                    </h2>
                                </Card>
                            )}

                            <div className="space-y-3">
                                {config.quizType === '一問一答' ? (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={userTextAnswer}
                                            onChange={(e) => setUserTextAnswer(e.target.value)}
                                            disabled={answered}
                                            placeholder="解答を入力"
                                            className="w-full p-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-lg outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                                        />
                                        {!answered && (
                                            <button
                                                onClick={() => handleAnswer(userTextAnswer)}
                                                className="w-full p-5 bg-indigo-600 text-white rounded-2xl font-black text-lg"
                                            >
                                                回答を確定
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    q.choices.map((choice, i) => (
                                        <button
                                            key={i}
                                            disabled={answered}
                                            onClick={() => handleAnswer(i)}
                                            className={`w-full p-5 rounded-2xl text-left font-bold transition-all relative overflow-hidden ${answered
                                                ? i === q.answer_index
                                                    ? 'bg-emerald-500 text-white border-emerald-500 z-10'
                                                    : i === selectedChoice
                                                        ? 'bg-rose-500 text-white border-rose-500'
                                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 grayscale border-slate-100'
                                                : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 active:scale-95'
                                                }`}
                                        >
                                            {choice}
                                            {answered && i === q.answer_index && (
                                                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6" />
                                            )}
                                            {answered && i === selectedChoice && i !== q.answer_index && (
                                                <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            {answered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className={`p-6 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                                        <h4 className="font-black text-sm uppercase tracking-widest mb-2">
                                            {isCorrect ? '正解です！' : '残念、不正解です'}
                                        </h4>
                                        <p className="text-sm font-medium leading-relaxed opacity-80">{q.explanation}</p>
                                    </div>
                                    <button
                                        onClick={nextQuestion}
                                        className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 group"
                                    >
                                        次の問題へ
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        );
    }

    if (step === 'results') return (
        <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col items-center justify-center">
            <Card className="w-full p-10 text-center shadow-2xl shadow-indigo-500/10">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">学習完了！</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">お疲れ様でした。実力アップ！</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">SCORE</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{score} / {questions.length}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">ACCURACY</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round((score / questions.length) * 100)}%</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => setStep('config')}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        もう一度挑戦
                    </button>
                    <Link href="/" className="block">
                        <button className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black">
                            ホームへ戻る
                        </button>
                    </Link>
                </div>
            </Card>
        </main>
    );

    return null;
}

export default function Quiz() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <QuizContent />
        </Suspense>
    );
}
