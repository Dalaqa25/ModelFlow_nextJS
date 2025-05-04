'use client';
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import { useState } from 'react';
import { FaBars, FaTimes  } from 'react-icons/fa';
import { AiFillHome, AiOutlineRobot } from 'react-icons/ai';
import { BsClipboardCheck } from 'react-icons/bs';
import { MdPrivacyTip } from 'react-icons/md';

export default function Navbar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <header className="flex py-8 justify-center w-full bg-transparent">
            <nav style={{backgroundColor:'rgba(255,255,255,0.69)'}} className="w-[93%] max-w-[1500px] fixed z-50 rounded-2xl  flex justify-between items-center change-width">
                {/* Logo + Brand */}
                <Link className='flex items-center text-center gap-3' href="/">
                    <img src='logo.png' alt='test.svg' width={50} height={50}/>
                    <span className="hidden sm:flex text-3xl font-bold tracking-tight text-gray-900">Modelflow<span className='text-3xl text-purple-500'>.</span></span>
                </Link>

                {/* Navigation Links for desktop*/}
                <ul style={{color:'#b6b6b6'}} className="hidden lg:flex gap-15 text-base mt-3">
                    <li><Link href="/"
                              className={pathname === '/' ? 'text-black' : 'text-[#b6b6b6]'}
                    >
                        Home
                    </Link></li>
                    <li><Link href="/plans">Models</Link></li>
                    <li><Link href="/about">Plans</Link></li>
                    <li><Link href="/about">Privacy</Link></li>
                </ul>

                {/* Call to Action */}
                <div className='flex items-center justify-center gap-6'>
                    <button style={{transition:'all 0.3s'}} className="bg-black hover:shadow-xl cursor-pointer text-white rounded-2xl change-padding px-12 py-3.5">
                        Sign In
                    </button>
                    {/* Mobile burger menu */}
                    <button onClick={toggleMenu} className="lg:hidden bg-gray-100 p-3.5 rounded-xl text-2xl change-padding">
                        {menuOpen ?  <FaTimes />: <FaBars />}
                    </button>
                </div>

                <div
                    className={`absolute text-lg top-16 right-0 bg-white p-5 rounded shadow-md lg:hidden transform transition-all duration-300 ease-in-out ${
                        menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'
                    }`}
                >
                    <ul className="flex flex-col gap-5">
                        <li className='flex items-center gap-3'><AiFillHome />Home</li>
                        <li className='flex items-center gap-3'><AiOutlineRobot />Models</li>
                        <li className='flex items-center gap-3'><BsClipboardCheck />Plans</li>
                        <li className='flex items-center gap-3'><MdPrivacyTip />Privacy</li>
                    </ul>
                </div>
            </nav>
        </header>
    )
}