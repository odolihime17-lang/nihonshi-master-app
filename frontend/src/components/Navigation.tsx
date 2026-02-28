import { LayoutDashboard, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export const Navigation = () => {
    const pathname = usePathname();

    const navItems = [
        { label: 'HOME', icon: LayoutDashboard, href: '/' },
        { label: 'QUIZ', icon: BookOpen, href: '/quiz' },
        { label: 'SETTING', icon: SettingsIcon, href: '/settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md glass h-20 px-10 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            "flex flex-col items-center transition-all duration-300",
                            isActive ? "text-indigo-600 dark:text-indigo-400 scale-110" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <Icon className={clsx("w-6 h-6", isActive && "stroke-[2.5px]")} />
                        <span className="text-[10px] mt-1 font-bold tracking-tighter">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};
