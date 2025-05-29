import Login from 'app/components/SignIn/login'
import { useState } from 'react'

export default function resMainPage() {
    const [isLogin, setIsLogin] = useState(false)
    return (
        <>
            {/* Overlay with transition */}
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isLogin ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsLogin(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
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
                        <button onClick={() => setIsLogin(true)} className='bg-black text-white p-3 px-8 rounded-4xl'>Sign up</button>
                        { isLogin && <Login/> }
                        <p className='text-gray-400'>or</p>
                        <a href='/modelsList' className='cursor-pointer border-b'>Explore models</a>
                    </div>
                    <img className='w-[70%]' src='main.png' alt='logo' />
                </div>
            </main>
        </>
    )
}