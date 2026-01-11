'use client';

import { motion } from 'framer-motion';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

const steps = [
    {
        number: '01',
        title: 'Describe Your Task',
        description: 'Tell us what you want to automate in plain English.'
    },
    {
        number: '02',
        title: 'AI Finds the Match',
        description: 'Our AI searches through developer-built automations to find the perfect fit.'
    },
    {
        number: '03',
        title: 'Connect & Run',
        description: 'Link your accounts and let the automation handle the rest.'
    }
];

export default function HowItWorksSection() {
    const { isDarkMode } = useThemeAdaptive();

    return (
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        How It Works
                    </h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Get started in minutes, not hours
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 }}
                            className="text-center"
                        >
                            <div className={`text-5xl sm:text-6xl font-bold mb-4 ${
                                isDarkMode
                                    ? 'text-purple-500/30'
                                    : 'text-purple-200'
                            }`}>
                                {step.number}
                            </div>
                            <h3 className={`text-xl font-semibold mb-3 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                {step.title}
                            </h3>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
