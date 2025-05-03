'use client';
import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();
    return (
        <header className="flex py-8 justify-center w-full bg-transparent">
            <nav style={{backgroundColor:'rgba(255,255,255,0.27)'}} className="w-[93%] max-w-[1500px] fixed z-50 rounded-2xl  flex justify-between items-center change-width">
                {/* Logo + Brand */}
                <Link className='flex items-center text-center gap-3' href="/">
                    <Image className='mb-2' src='logo.svg' alt='logosvg' width={45} height={45}/>
                    <span className="text-3xl font-bold tracking-tight text-gray-900">Modelflow<span className='text-3xl text-purple-500'>.</span></span>
                </Link>

                {/* Navigation Links */}
                <ul style={{color:'#b6b6b6'}} className="hidden lg:flex gap-15 text-base mt-3">
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
                    <button style={{transition:'all 0.3s'}} className="bg-black hover:shadow-xl cursor-pointer text-white rounded-2xl px-12 py-3.5">
                        Sign In
                    </button>
                </div>
            </nav>
        </header>
    )
}