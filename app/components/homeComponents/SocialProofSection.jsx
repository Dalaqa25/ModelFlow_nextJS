'use client';

import { motion } from 'framer-motion';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

const stats = [
    { value: '50+', label: 'Developers' },
    { value: '100+', label: 'Automations' },
    { value: '1000+', label: 'Tasks Automated' }
];

export default function SocialProofSection() {
    const { isDarkMode } = useThemeAdaptive();

    return (
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-3 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 ${
                                isDarkMode
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400'
                                    : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600'
                            }`}>
                                {stat.value}
                            </div>
                            <div className={`text-sm sm:text-base ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
