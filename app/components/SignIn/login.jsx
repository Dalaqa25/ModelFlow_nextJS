import { useState } from "react"
import Image from "next/image"
import SignUp from "app/components/SignIn/signUp"

export default function Login() {
    const [isClicked, setIsClicked] = useState(false)
    if (isClicked) { 
        return <SignUp />
    }

    return (
        <div className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 w-1/2 max-w-[400px] min-w-[300px] flex flex-col items-center sm:text-lg text-sm">
            {/* Floating image */}
            <div className="absolute -top-13 left-1/2 -translate-x-1/2 sm:-top-20">
                <Image src='/3dcube.png' alt="logo.png" width={1024} height={1024} className="w-35 h-35 sm:w-40 sm:h-40" />
            </div>
            <section className="px-5 flex flex-col items-center mt-17">
                <h1 className="text-2xl sm:text-4xl font-semibold">Log In</h1>
                <p className="text-gray-600 font-light">Don't have a account? <span className="underline cursor-pointer" onClick={() => setIsClicked(true)}>Create One!</span></p>
            </section>
            <form action="">
                <div className="flex flex-col gap-5 px-5 mb-10 mt-5">
                    <label htmlFor="Email" className="flex flex-col gap-0.5">Username or Email address
                        <input id="Email" type="text" placeholder="Email" className="text-lg w-[95%] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <label htmlFor="Password" className="flex flex-col gap-0.5">Password
                        <input type="password" placeholder="Password" className="text-lg w-[95%] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <button type="submit" className="text-lg w-[95%] bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200">Log In</button>
                </div>
            </form>
        </div>
    )
}