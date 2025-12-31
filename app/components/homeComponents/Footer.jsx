'use client';

import Link from 'next/link';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function Footer() {
    const { isDarkMode } = useThemeAdaptive();

    const links = [
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Refund', href: '/refund' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Community', href: '/community' },
    ];

    return (
        <footer className={`py-12 px-4 sm:px-6 lg:px-8 border-t ${
            isDarkMode ? 'border-slate-800' : 'border-purple-100'
        }`}>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ModelGrow
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap justify-center gap-6">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm transition-colors ${
                                    isDarkMode
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Copyright */}
                    <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        © {new Date().getFullYear()} ModelGrow
                    </div>
                </div>
            </div>
        </footer>
    );
}
