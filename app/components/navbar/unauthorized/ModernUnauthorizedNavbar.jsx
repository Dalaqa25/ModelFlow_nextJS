'use client';
import NavigationLink from "../../NavigationLink";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { AiFillHome } from 'react-icons/ai';
import { BsClipboardCheck, BsGearWideConnected } from 'react-icons/bs';
import { FiSend } from "react-icons/fi";
import { motion } from 'framer-motion';

export default function ModernUnauthorizedNavbar() {
    
    const pathname = usePathname() || '/'; 
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(!menuOpen);

    // Static nav links for unauthorized users
    const navLinks = [
        { href: '/', title: 'Home' },
        { href: '/plans', title: 'Plans' },
        { href: '/requests', title: 'Community' }
    ];

    return (
        <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 px-6 pt-6"
        >
            <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg">
                {/* Logo + Brand */}
                <NavigationLink className="flex items-center gap-3 flex-shrink-0" href="/">
                    <img
                        src="logo.png"
                        alt="logo.svg"
                        width={40}
                        height={40}
                        className="flex-shrink-0"
                    />
                    <span className="text-2xl font-bold text-white">
                        ModelGrow<span className="text-purple-400">.</span>
                    </span>
                </NavigationLink>

                {/* Centered Navigation Links for desktop */}
                <div className="hidden lg:flex items-center gap-8">
                    {navLinks.map(({ href, title }) => {
                        const isActive = pathname === href;
                        return (
                            <NavigationLink
                                key={href}
                                href={href}
                                className={`relative px-4 py-2 rounded-xl transition-all duration-300 ${
                                    isActive
                                        ? 'text-white bg-purple-500/20 border border-purple-500/30'
                                        : 'text-gray-200 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span className="relative z-10">{title}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </NavigationLink>
                        );
                    })}
                </div>

                {/* Call to Action */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Sign In button for unauthorized users */}
                    <NavigationLink 
                        href="/auth/login" 
                        className="hidden sm:inline-block px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                    >
                        Sign In
                    </NavigationLink>

                    {/* Mobile burger menu */}
                    <button
                        onClick={toggleMenu}
                        className="lg:hidden p-3 bg-white/10 hover:bg-white/20 rounded-xl text-gray-200 hover:text-white transition-all duration-300"
                    >
                        {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <motion.div
                    initial={false}
                    animate={menuOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-full right-0 mt-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl lg:hidden ${
                        menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                    style={{ minWidth: '200px' }}
                >
                    <div className="p-4">
                        <ul className="flex flex-col gap-2">
                            {navLinks.map(({ href, title }) => {
                                const isActive = pathname === href;
                                return (
                                    <NavigationLink 
                                        href={href} 
                                        onClick={toggleMenu} 
                                        key={href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                            isActive
                                                ? 'text-white bg-purple-500/20 border border-purple-500/30'
                                                : 'text-gray-300 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {title === 'Home' && <AiFillHome size={18} />}
                                        {title === 'Plans' && <BsClipboardCheck size={18} />}
                                        {title === 'Requests' && <FiSend size={18} />}
                                        {title}
                                    </NavigationLink>
                                );
                            })}
                            <div className="border-t border-slate-700/50 mt-2 pt-2">
                                <NavigationLink 
                                    href="/auth/login"
                                    onClick={toggleMenu}
                                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                                >
                                    Sign In
                                </NavigationLink>
                            </div>
                        </ul>
                    </div>
                </motion.div>
            </nav>
        </motion.header>
    );
}