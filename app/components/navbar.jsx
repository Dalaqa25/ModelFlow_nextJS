'use client';
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();
    return (
        <header className="w-full py-10">
            <nav className="max-w-[93%] mx-auto flex justify-between items-center">
                {/* Logo + Brand */}
                <Link className='flex items-center text-center gap-3' href="/">
                    <Image className='mb-2' src='logo.svg' alt='logosvg' width={45} height={45}/>
                    <span className="hidden md:flex text-3xl font-bold tracking-tight text-gray-900">Modelflow<span className='text-3xl text-purple-500'>.</span></span>
                </Link>

                {/* Navigation Links */}
                <ul style={{color:'#b6b6b6'}} className="hidden md:flex gap-15 text-base mt-3">
                    <li><Link href="/"
                              className={pathname === '/' ? 'text-black' : 'text-[#b6b6b6]'}
                    >
                        Home
                    </Link></li>
                    <li><Link href="/plans">Plans</Link></li>
                    <li><Link href="/about">About</Link></li>
                    <li><Link href="/about">Privacy</Link></li>
                </ul>

                {/* Call to Action */}
                <div>
                    <button style={{transition:'all 0.3s'}} className="bg-black hover:bg-purple-700 cursor-pointer text-white rounded-2xl px-12 py-3.5">
                        Sign In
                    </button>
                </div>
            </nav>
        </header>
    )
}