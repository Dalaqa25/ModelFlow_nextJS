import { useState } from "react"
import Image from "next/image"
import Login from 'app/components/SignIn/login'
export default function SignUp() {
    const [isClicked, setIsClicked] = useState(false)
    if (isClicked) { 
        return <Login />
    }

    return (
        <div className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 min-w-[350px] min-h-[400px] flex flex-col items-center">
            {/* Floating image */}
            <div className="absolute -top-23 left-1/2 -translate-x-1/2">
                <Image src='/3dcube.png' alt="logo.png" width={1024} height={1024} className="w-45 h-45" />
            </div>
            <section className="px-5 flex flex-col items-center mt-17">
                <h1 className="text-4xl font-semibold">Sign Up</h1>
                <p className="text-gray-600 font-light text-[18px]">Already have an account? <span className="underline cursor-pointer" onClick={() => setIsClicked(true)}>Log In!</span></p>
            </section>
            <form action="">
                <div className="flex flex-col gap-5 px-5 py-10">
                    <label htmlFor="Email" className="flex flex-col gap-0.5">Username or Email address
                        <input id="Email" type="text" placeholder="Email" className="text-lg w-90 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <label htmlFor="Password" className="flex flex-col gap-0.5">Password
                        <input type="password" placeholder="Password" className="text-lg border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <label htmlFor="Password" className="flex flex-col gap-0.5">Repeat Password
                        <input type="password" placeholder="Password" className="text-lg border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <button type="submit" className="text-lg bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200">Sign Up</button>
                </div>
            </form>
        </div>
    )
}