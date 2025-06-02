import Logo from "../components/logo"

export default function LogIn() {
    return (
        <>
            <Logo />
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                <h1 className="text-2xl font-semibold text-center">Welcome back</h1>

                <form className="space-y-4">
                <div>
                    <label htmlFor="email" className="sr-only">
                    Email address
                    </label>
                    <input
                    type="email"
                    id="email"
                    placeholder="Email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="sr-only">
                    Email address
                    </label>
                    <input
                    type="password"
                    id="password"
                    placeholder="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full btn-primary hover:bg-green-700 text-white py-2 rounded-md font-medium transition"
                >
                    Continue
                </button>
                </form>

                <div className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <a href="/signup" className=" hover:underline">
                    Sign up
                </a>
                </div>

                <div className="flex items-center gap-4">
                <hr className="flex-grow border-gray-300" />
                <span className="text-sm text-gray-500">OR</span>
                <hr className="flex-grow border-gray-300" />
                </div>

                <div className="space-y-2">
                
                </div>

                <div className="text-xs text-gray-500 text-center mt-6">
                <a href="#" className="hover:underline">
                    Terms of Use
                </a>{' '}
                |{' '}
                <a href="#" className="hover:underline">
                    Privacy Policy
                </a>
                </div>
            </div>
        </div>
        </>
    )
}