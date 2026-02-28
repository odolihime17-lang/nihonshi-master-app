'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { statsApi, UserStats, WeakArea } from '@/lib/api';
import { LayoutDashboard, BookOpen, Settings as SettingsIcon, Award, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { useUser } from '@/lib/hooks/useUser';

export default function Home() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const router = useRouter();
  const { userId, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const statsRes = await statsApi.get(userId);
        setStats(statsRes.data);
        const weakRes = await statsApi.weakAreas(userId);
        setWeakAreas(weakRes.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchData();
  }, [userId]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <header className="mb-10 pt-4 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-fill-transparent inline-block font-title tracking-[0.05em]">
          日本史マスター
        </h1>
        <p className="text-slate-500 dark:text-slate-300 font-medium mt-1">
          今日も一歩、歴史を深めよう
        </p>
      </header>

      {/* Stats Card */}
      <Card className="mb-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-xl shadow-indigo-500/20">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-indigo-100 text-sm font-medium">総回答数</p>
            <h2 className="text-4xl font-bold">{stats?.total || 0}</h2>
          </div>
          <Award className="w-8 h-8 text-indigo-300" />
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1 font-semibold uppercase tracking-wider">
              <span>正答率</span>
              <span>{stats?.accuracy || 0}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${stats?.accuracy || 0}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Menu */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/quiz">
          <Card className="flex flex-col items-center justify-center p-6 text-center h-full active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100">クイック学習</span>
          </Card>
        </Link>
        <Link href="/settings">
          <Card className="flex flex-col items-center justify-center p-6 text-center h-full active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100">教材・設定</span>
          </Card>
        </Link>
      </div>

      {/* Weak Areas */}
      <section className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
          < Award className="w-5 h-5 text-rose-500" />
          苦手分野の克服
        </h3>
        <div className="space-y-3">
          {weakAreas.length > 0 ? (
            weakAreas.map((area, i) => (
              <button
                key={i}
                onClick={() => router.push(`/quiz?era=${encodeURIComponent(area.era)}&field=${encodeURIComponent(area.field)}`)}
                className="w-full flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 group"
              >
                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{area.era}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{area.field}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-rose-500 font-black">{area.error_rate}%</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">ERROR RATE</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-slate-500 text-sm text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              まだ十分なデータがありません
            </p>
          )}
        </div>
      </section>

      <Navigation />
    </main>
  );
}
