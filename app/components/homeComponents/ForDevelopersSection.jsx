'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import { FaDollarSign, FaUsers, FaUpload } from 'react-icons/fa';
import SignUpDialog from '../auth/signup/SignUpDialog';
import SignInDialog from '../auth/login/SignInDialog';

const benefits = [
    {
        icon: FaDollarSign,
        title: 'Earn Passive Income',
        description: 'Get paid every time someone runs your automation.'
    },
    {
        icon: FaUsers,
        title: 'Reach Thousands',
        description: 'Your automations get discovered by users who need them.'
    },
    {
        icon: FaUpload,
        title: 'Simple Upload',
        description: 'Just export from n8n and upload. We handle the rest.'
    }
];

export default function ForDevelopersSection() {
    const { isDarkMode } = useThemeAdaptive();
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);
    const [isSignInOpen, setIsSignInOpen] = useState(false);

    const switchToSignIn = () => {
        setIsSignUpOpen(false);
        setIsSignInOpen(true);
    };

    const switchToSignUp = () => {
        setIsSignInOpen(false);
        setIsSignUpOpen(true);
    };

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
                        Built an Automation? Get Paid.
                    </h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Turn your n8n workflows into a source of income
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={benefit.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-6 rounded-2xl border text-center ${
                                isDarkMode
                                    ? 'bg-slate-800/30 border-slate-700/50'
                                    : 'bg-white/50 border-purple-100'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                            }`}>
                                <benefit.icon className={`w-6 h-6 ${
                                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                }`} />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                {benefit.title}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {benefit.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <button
                        onClick={() => setIsSignUpOpen(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
                    >
                        Start Earning
                    </button>
                </motion.div>
            </div>

            <SignUpDialog
                isOpen={isSignUpOpen}
                onClose={() => setIsSignUpOpen(false)}
                onSwitchToSignIn={switchToSignIn}
            />
            <SignInDialog
                isOpen={isSignInOpen}
                onClose={() => setIsSignInOpen(false)}
                onSwitchToSignUp={switchToSignUp}
            />
        </section>
    );
}
