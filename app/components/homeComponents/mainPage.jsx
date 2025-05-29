import { useState } from "react"
import Image from "next/image"
import Login from "app/components/SignIn/login"
import HomeFeatures from "app/components/homeComponents/homeFeatures"

export default function mainPage() {
    const [isClicked, setIsClicked] = useState(false)
    return (
        <>
            {/* Overlay with transition */}
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isClicked ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsClicked(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            {/* Main Section */}
            <main className='flex min-h-screen items-center justify-center '>
                <section className='flex justify-between w-[85%] max-w-[1450px]'>
                    <div className='flex flex-col justify-center gap-9'>
                        <div style={{background:'rgba(63,77,223,0.75)', color:'#fff'}} className='py-1.5 px-8 text-sm rounded-2xl w-1/4 text-center xl:text-xl '>HOME</div>
                        <h1 className='text-6xl font-semibold xl:text-7xl'>
                            Upload And  <br/> Sell Pre-Trained <br/>
                            <span style={{color:'#6472ef'}}>AI</span> Models.
                        </h1>
                        <p className='text-gray-400 text-[18px] xl:text-3xl'>Pre-trained AI models for businesses</p>
                        <button 
                            style={{background:'#6472ef'}} 
                            className='py-4 text-white text-sm w-1/3 hover:shadow-xl rounded-2xl xl:text-2xl'
                            onClick={() => setIsClicked(true)}>
                            Get Started
                        </button>
                        {isClicked && <Login />}
                    </div>
                    <Image src='/main.png' alt='main' width={1024} height={1024} className='w-[50%] animate-float'/>
                </section>
            </main>
            {/* Features Section */}
            <HomeFeatures />
        </>
    )
}