import HomeFeatures from 'app/components/homeComponents/homeFeatures'
import Footer from 'app/components/homeComponents/footer'
import { useState } from 'react'

export default function resMainPage() {
    const [isLogin, setIsLogin] = useState(false)
    return (
        <>
            <main className='flex m-auto items-center shadow rounded w-[80%] justify-center min-h-screen mt-15 mb-15'>
                <div className='mt-6 flex flex-col text-center items-center justify-center gap-8'>
                    <img src='logo.png' alt='test.svg' width={100} height={100}/>
                    <h1 className='text-4xl font-bold'>
                        Upload And Sell <br/>
                        You're <span style={{color:'#946dff'}}>AI</span> Models
                    </h1>
                    <p className='text-gray-400'>
                        Pre-trained AI models for businesses
                        <br/>
                        Upload. Host. Buy. Sell. <span className='font-semibold'>Downloads for businesses.</span>
                    </p>
                    <div className='flex  justify-center text-center items-center gap-3'>
                        <button className='bg-black text-white p-3 px-8 rounded-4xl'>Sign up</button>
                        <p className='text-gray-400'>or</p>
                        <a href='/modelsList' className='cursor-pointer border-b'>Explore models</a>
                    </div>
                    <img className='w-[70%]' src='main.png' alt='logo' />
                </div>
            </main>
            {/* Features Section */}
            <HomeFeatures />
            {/* Footer Section */}
            <Footer />
        </>
    )
}