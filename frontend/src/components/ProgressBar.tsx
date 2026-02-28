import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0 to 100
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
    return (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            />
        </div>
    );
};
