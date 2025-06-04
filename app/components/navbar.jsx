'use client';
import Link from "next/link";
import { useKindeAuth, LoginLink } from "@kinde-oss/kinde-auth-nextjs";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { AiFillHome, AiOutlineRobot } from 'react-icons/ai';
import { BsClipboardCheck } from 'react-icons/bs';
import { FiSend } from "react-icons/fi";

import ProfilePic from "./profilePic";

export default function Navbar() {
    const { isAuthenticated, isLoading, user } = useKindeAuth();
    const pathname = usePathname() || '/'; 
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(!menuOpen);

    // Conditionally filter out "Home" if authenticated, and add "Profile" if authenticated
    const navLinks = [
        ...(!isAuthenticated
            ? [{ href: '/', title: 'Home' }]
            : [{ href: '/profile', title: 'Deashboeard' }]
        ),
        { href: '/modelsList', title: 'Models' },
        { href: '/plans', title: 'Plans' },
        { href: '/requests', title: 'Requests' }
    ];

    useEffect(() => {
        console.log("isAuthenticated:", isAuthenticated, "user:", user);
    }, [isAuthenticated, user]);

    return (
        <header className="flex justify-center py-3 w-full bg-transparent">
            <nav className="w-[85%] max-w-[1800px] fixed z-50 rounded-2xl flex justify-between items-center change-width bg-white/30 backdrop-blur">
                {/* Logo + Brand */}
                <Link className="flex items-center text-center gap-3" href="/">
                    <img src="logo.png" alt="logo.svg" width={50} height={50} />
                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                        Modelflow<span className="text-3xl text-purple-500">.</span>
                    </span>
                </Link>

                {/* Navigation Links for desktop */}
                <ul style={{ color: '#b6b6b6' }} className="hidden lg:flex gap-10 text-base items-center bg-white py-2 px-7 rounded-xl">
                    {navLinks.map(({ href, title }) => {
                        const isActive = pathname === href;
                        return (
                            <li className=' xl:text-lg flex items-center' key={href}>
                                <Link
                                    href={href}
                                    className={`transition-colors duration-200 ${
                                        isActive ? 'text-black' : 'text-[#b6b6b6]'
                                    }`}>
                                    {title}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Call to Action */}
                <div className="flex items-center justify-center gap-6">
                    {/* Only show after loading */}
                    {!isLoading && (
                        isAuthenticated ? (
                            <ProfilePic user={user} />
                        ) : (
                            <LoginLink className="hidden sm:inline-block btn-primary cursor-pointer text-white rounded-2xl change-padding px-8 py-2.5 item-hidden text-lg">
                                Sign In
                            </LoginLink>
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
                        {navLinks.map(({ href, title }) => (
                            <Link href={href} onClick={toggleMenu} key={href}>
                                <li className='flex items-center gap-3'>
                                    {title === 'Home' && <AiFillHome />}
                                    {title === 'Models' && <AiOutlineRobot />}
                                    {title === 'Plans' && <BsClipboardCheck />}
                                    {title === 'Requests' && <FiSend />}
                                    {title}
                                </li>
                            </Link>
                        ))}
                    </ul>
                </div>
            </nav>
        </header>
    );
}