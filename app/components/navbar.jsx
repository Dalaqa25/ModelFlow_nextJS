'use client';
import NavigationLink from "./NavigationLink";
import { useAuth } from "@/lib/supabase-auth-context";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { AiFillHome, AiOutlineRobot, AiOutlinePlus } from 'react-icons/ai';
import { BsClipboardCheck } from 'react-icons/bs';
import { FiSend } from "react-icons/fi";
import { FaDollarSign } from "react-icons/fa";
import { MdPrivacyTip, MdDashboard } from "react-icons/md";
import ProfilePic from "./profilePic";

export default function Navbar() {
    const { isAuthenticated, loading: isLoading, user } = useAuth();
    const pathname = usePathname() || '/'; 
    const [menuOpen, setMenuOpen] = useState(false);
    const [showNavLinks, setShowNavLinks] = useState(false);
    const toggleMenu = () => setMenuOpen(!menuOpen);

    // Conditionally filter out "Home" if authenticated, and add "Profile" if authenticated
    const navLinks = [
        ...(!isAuthenticated
            ? [{ href: '/', title: 'Home' }]
            : [{ href: '/dashboard', title: 'Dashboard' }]
        ),
        { href: '/modelsList', title: 'Models' },
        { href: '/plans', title: 'Plans' },
        { href: '/requests', title: 'Requests' }
    ];

    useEffect(() => {
        if (!isLoading) {
            // Delay to allow skeleton to disappear first
            const timeout = setTimeout(() => setShowNavLinks(true), 50);
            return () => clearTimeout(timeout);
        } else {
            setShowNavLinks(false);
        }
    }, [isLoading]);

    return (
        <header className="flex justify-center py-3 w-full bg-transparent">
            <nav className="w-[85%] max-w-[1800px] fixed z-50 rounded-4xl flex justify-between items-center change-width bg-white/30 backdrop-blur">
                {/* Logo + Brand */}
                <NavigationLink className="flex items-center text-center gap-1 flex-shrink-0" href="/">
                    <img 
                        src="logo.png" 
                        alt="logo.svg" 
                        width={40} 
                        height={40} 
                        className="flex-shrink-0"
                    />
                    <span className="text-3xl -mr-7 xl:text-3xl 2xl:text-4xl font-bold tracking-tight text-gray-900 flex items-baseline">
                        ModelGrow<span className="text-4xl xl:text-5xl 2xl:text-6xl text-purple-500 -mt-2">.</span>
                    </span>
                </NavigationLink>

                {/* Centered Navigation Links for desktop */}
                <div className="flex-1 flex justify-center">
                    <ul className="hidden lg:flex gap-10 text-base items-center py-2.5 px-7 bg-white rounded-4xl">
                        {isLoading ? (
                            // Skeleton loader for nav links
                            Array.from({ length: 4 }).map((_, idx) => (
                                <li key={idx}>
                                    <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                                </li>
                            ))
                        ) : (
                            <div className={`flex gap-10 transition-all duration-500 ${showNavLinks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                {navLinks.map(({ href, title }) => {
                                    const isActive = pathname === href;
                                    return (
                                        <li className="xl:text-xl 2xl:text-2xl flex items-center" key={href}>
                                            <NavigationLink
                                                href={href}
                                                className={`relative transition-colors duration-200 px-1
                                                    ${isActive ? 'text-black' : 'text-[#b6b6b6]'}
                                                    hover:text-purple-800
                                                    group
                                                `}
                                            >
                                                <span className="relative z-10">{title}</span>
                                                <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-lg" />
                                            </NavigationLink>
                                        </li>
                                    );
                                })}
                            </div>
                        )}
                    </ul>
                </div>

                {/* Call to Action */}
                <div className="flex items-center justify-center gap-6 flex-shrink-0">
                    {/* Only show after loading */}
                    {!isLoading && (
                        isAuthenticated ? (
                            <ProfilePic user={user} />
                        ) : (
                            <NavigationLink href="/auth/login" className="hidden sm:inline-block btn-primary cursor-pointer text-white rounded-2xl px-7 py-2.5 text-base xl:text-lg">
                                Sign In
                            </NavigationLink>
                        )
                    )}

                    {/* Mobile burger menu */}
                    <button onClick={toggleMenu} className="lg:hidden bg-gray-100 p-3.5 rounded-xl text-2xl change-padding">
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                {/* Mobile menu */}
                <div
                    className={`absolute text-lg top-16 right-0 bg-white p-5 rounded shadow-md lg:hidden transform transition-all duration-300 ease-in-out ${
                        menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'
                    }`}>
                    <ul className="flex flex-col gap-5 cursor-pointer">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <li key={idx}>
                                    <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse mb-2" />
                                </li>
                            ))
                        ) : (
                            <div className={`flex flex-col gap-5 transition-all duration-500 ${showNavLinks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                {navLinks.map(({ href, title }) => (
                                    <NavigationLink href={href} onClick={toggleMenu} key={href}
                                        className="relative px-1 group">
                                        <li className='flex items-center gap-3 relative'>
                                            <span className="relative z-10 flex items-center gap-3">
                                                {title === 'Home' && <AiFillHome />}
                                                {title === 'Dashboard' && <MdDashboard />}
                                                {title === 'Models' && <AiOutlineRobot />}
                                                {title === 'Plans' && <BsClipboardCheck />}
                                                {title === 'Requests' && <FiSend />}
                                                {title}
                                            </span>
                                            <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-lg" />
                                        </li>
                                    </NavigationLink>
                                ))}
                            </div>
                        )}

                        {isAuthenticated && (
                            <>
                                <hr className="border-gray-200 my-1" />
                                <NavigationLink href="/profile" onClick={toggleMenu}>
                                    <li className='flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2'>
                                        <p className="text-gray-400">Profile</p>
                                        <p className="text-xl">{user?.user_metadata?.name || user?.email || 'User'}</p>
                                    </li>
                                </NavigationLink>
                                <li className='flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2'>
                                    <p className="text-gray-400">Notifications</p>
                                    <p className="text-xl">Inbox (0)</p>
                                </li>
                                <hr className="border-gray-200 my-1" />
                                <NavigationLink href="/upload" onClick={toggleMenu}>
                                    <li className='flex items-center gap-3 hover:bg-gray-100 rounded-lg transition-all p-2'>
                                        <AiOutlinePlus size={20} className="text-gray-400" />
                                        <p className="text-xl">New Model</p>
                                    </li>
                                </NavigationLink>
                                <NavigationLink href="/billing" onClick={toggleMenu}>
                                    <li className='flex items-center gap-3 hover:bg-gray-100 rounded-lg transition-all p-2'>
                                        <FaDollarSign size={20} className="text-gray-400" />
                                        <p className="text-xl">Billing</p>
                                    </li>
                                </NavigationLink>
                                <NavigationLink href="/privacy" onClick={toggleMenu}>
                                    <li className='flex items-center gap-3 hover:bg-gray-100 rounded-lg transition-all p-2'>
                                        <MdPrivacyTip size={20} className="text-gray-400" />
                                        <p className="text-xl">Privacy</p>
                                    </li>
                                </NavigationLink>
                                <hr className="border-gray-200 my-1" />
                                <button onClick={toggleMenu} className="w-full text-left">
                                    <li className='flex items-center hover:bg-gray-100 rounded-lg transition-all p-2 text-gray-500'>
                                        <p className="text-xl">Sign out</p>
                                    </li>
                                </button>
                            </>
                        )}
                    </ul>
                </div>
            </nav>
        </header>
    );
}