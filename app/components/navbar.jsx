'use client';
import Link from "next/link";
import Login from "app/components/SignIn/login";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { AiFillHome, AiOutlineRobot } from 'react-icons/ai';
import { BsClipboardCheck } from 'react-icons/bs';
import { MdPrivacyTip } from 'react-icons/md';

export default function Navbar() {
    const pathname = usePathname() || '/'; 
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(!menuOpen);
    const [loginOpen, setLoginOpen] = useState(false);

    const navLinks = [
        {href: '/', title: 'Home'},
        {href: '/modelsList', title: 'Models'},
        {href: '/plans', title: 'Plans'},
        {href: '/privacy', title: 'Privacy'},
    ]

    return (
        <header className="flex justify-center py-3 w-full bg-transparent">
            <nav
                style={{ backgroundColor: loginOpen ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.89)' }}
                className="w-[93%] max-w-[1600px] fixed z-50 rounded-2xl flex justify-between items-center change-width"
            >
                {/* Logo + Brand */}
                <Link className="flex items-center text-center gap-3" href="/">
                    <img src="logo.png" alt="logo.svg" width={50} height={50} />
                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                        Modelflow<span className="text-3xl text-purple-500">.</span>
                    </span>
                </Link>

                {/* Navigation Links for desktop */}
                <ul style={{ color: '#b6b6b6' }} className="hidden lg:flex gap-15 text-base mt-3">
                    {navLinks.map(({ href, title }) => {
                        const isActive = pathname === href;
                        return (
                            <li className='hover:underline xl:text-lg' key={href}>
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
                    <button onClick={() => setLoginOpen(true)} className="hidden sm:inline-block btn-primary cursor-pointer text-white rounded-2xl change-padding px-12 py-3.5 item-hidden">
                        Sign In
                    </button>
                    {/* Overlay and Modal */}
                    {loginOpen && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center"
                            onClick={() => setLoginOpen(false)}
                        >
                            {/* Overlay with smooth transition */}
                            <div
                                className={`absolute inset-0 bg-black transition-opacity duration-300 ${loginOpen ? 'opacity-50' : 'opacity-0'}`}
                                style={{ transitionProperty: 'opacity' }}
                            ></div>
                            {/* Modal */}
                            <div
                                className="relative"
                                onClick={e => e.stopPropagation()}
                            >
                                <Login />
                            </div>
                        </div>
                    )}
                    {/* Mobile burger menu */}
                    <button onClick={toggleMenu} className="lg:hidden bg-gray-100 p-3.5 rounded-xl text-2xl change-padding">
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                <div
                    className={`absolute text-lg top-16 right-0 bg-white p-5 rounded shadow-md lg:hidden transform transition-all duration-300 ease-in-out ${
                        menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'
                    }`}>
                    <ul className="flex flex-col gap-5 cursor-pointer">
                        <Link href='/' onClick={toggleMenu}>
                            <li className='flex items-center gap-3'><AiFillHome />Home</li>
                        </Link>

                        <Link href='/modelsList' onClick={toggleMenu}>
                            <li className='flex items-center gap-3'><AiOutlineRobot />Models</li>
                        </Link>
                        
                        <Link href='/plans' onClick={toggleMenu}>
                            <li className='flex items-center gap-3'><BsClipboardCheck />Plans</li>
                        </Link>
                        
                        <Link href='/privacy' onClick={toggleMenu}>
                            <li className='flex items-center gap-3'><MdPrivacyTip />Privacy</li>
                        </Link>
                    </ul>
                </div>
            </nav>
        </header>
    );
}