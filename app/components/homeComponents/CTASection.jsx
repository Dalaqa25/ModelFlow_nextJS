'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import SignUpDialog from '../auth/signup/SignUpDialog';
import SignInDialog from '../auth/login/SignInDialog';

export default function CTASection() {
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto text-center"
            >
                <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    Ready to Automate?
                </h2>
                <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Join developers and users who are saving hours every week.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => setIsSignUpOpen(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
                    >
                        Get Started Free
                    </button>
                    <button
                        onClick={() => setIsSignInOpen(true)}
                        className={`px-8 py-4 font-semibold rounded-xl border-2 transition-all hover:scale-105 ${
                            isDarkMode
                                ? 'border-slate-600 text-white hover:bg-slate-800'
                                : 'border-purple-200 text-purple-700 hover:bg-purple-50'
                        }`}
                    >
                        Sign In
                    </button>
                </div>

                <p className={`mt-6 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    No credit card required
                </p>
            </motion.div>

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
