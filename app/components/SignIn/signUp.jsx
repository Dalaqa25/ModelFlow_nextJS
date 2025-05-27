import { useState } from "react"
import Image from "next/image"
import Login from 'app/components/SignIn/login'
export default function SignUp() {
    const [isClicked, setIsClicked] = useState(false)
    if (isClicked) { 
        return <Login />
    }

    return (
        <div className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 flex flex-col w-1/2 max-w-[400px] min-w-[320px] sm:text-lg text-sm">
            {/* Floating image */}
            <div className="absolute -top-13 left-1/2 -translate-x-1/2 sm:-top-20">
                <Image src='/3dcube.png' alt="logo.png" width={1024} height={1024} className="w-35 h-35 sm:w-40 sm:h-40" />
            </div>
            <section className="px-5 flex flex-col items-center mt-17">
                <h1 className="text-2xl sm:text-4xl font-semibold">Sign Up</h1>
                <p className="text-gray-600 font-light">Already have an account? <span className="underline cursor-pointer" onClick={() => setIsClicked(true)}>Log In!</span></p>
            </section>
            <form action="" className="w-full">
                <div className="flex flex-col gap-5 px-5 mb-10 mt-5 w-full">
                    <label htmlFor="Email" className="flex flex-col gap-0.5 text-left w-full">
                        Email address
                        <input 
                            id="Email" 
                            type="text" 
                            placeholder="Email" 
                            className="text-lg w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>
                    <label htmlFor="text" className="flex flex-col gap-0.5 text-left w-full">
                        Username
                        <input 
                            id="text" 
                            type="text" 
                            placeholder="Username" 
                            className="text-lg w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>
                    <label htmlFor="Password" className="flex flex-col gap-0.5 text-left w-full">
                        Password
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="text-lg border w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>
                    <label htmlFor="RepeatPassword" className="flex flex-col gap-0.5 text-left w-full">
                        Repeat Password
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="text-lg border w-full border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>
                    <button type="submit" className="text-lg bg-blue-500 w-full text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200">
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
    )
}