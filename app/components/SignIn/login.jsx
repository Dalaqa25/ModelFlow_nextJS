import Image from "next/image"

export default function Login() {
    return (
        <div className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 min-w-[350px] min-h-[400px] flex flex-col items-center">
            {/* Floating image */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                <Image src='/3dcube.png' alt="logo.png" width={80} height={80} className="w-40 h-40" />
            </div>
            <section className="px-5 flex flex-col items-center mt-17">
                <h1 className="text-4xl font-semibold">Log In</h1>
                <p className="text-gray-600 font-light text-[18px]">Don't have a account? <span className="underline">Create One!</span></p>
            </section>
            <form action="">
                <div className="flex flex-col gap-5 px-5 py-10">
                    <label htmlFor="Email" className="flex flex-col gap-0.5">Username or Email address
                        <input id="Email" type="text" placeholder="Email" className="text-lg w-90 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <label htmlFor="Password" className="flex flex-col gap-0.5">Password
                        <input type="password" placeholder="Password" className="text-lg border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </label>
                    <button type="submit" className="text-lg bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200">Log In</button>
                </div>
            </form>
        </div>
    )
}