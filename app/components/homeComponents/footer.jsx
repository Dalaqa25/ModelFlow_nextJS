export default function Footer() { 
    return (
        <footer className="mt-15 sm:mt-20 md:mt-30">
            <hr className="border-gray-300 mb-8 sm:mb-10 md:mb-15" />
            <div className="w-[95%] sm:w-[85%] md:w-[70%] max-w-[1400px] mx-auto">
                <div className="grid grid-cols-2 md:flex md:items-center md:justify-between gap-8 md:gap-4">
                    <div className="flex flex-col min-h-[150px] md:min-h-[200px]">
                        <h2 className="text-xl sm:text-2xl font-semibold h-[40px] flex items-center mb-2 sm:mb-4">WebSite</h2>
                        <ul className="text-gray-600 text-sm sm:text-base">
                            <li className="mb-2"><a href="/about" className="hover:text-gray-900">Models</a></li>
                            <li className="mb-2"><a href="/contact" className="hover:text-gray-900">Requests</a></li>
                            <li className="mb-2"><a href="/privacy" className="hover:text-gray-900">Privacy Policy</a></li>
                            <li className="mb-2"><a href="/terms" className="hover:text-gray-900">Plans</a></li>
                        </ul>
                    </div>
                    <div className="flex flex-col min-h-[150px] md:min-h-[200px]">
                        <h2 className="text-xl sm:text-2xl font-semibold h-[40px] flex items-center mb-2 sm:mb-4">Company</h2>
                        <ul className="text-gray-600 text-sm sm:text-base">
                            <li className="mb-2"><a href="/about" className="hover:text-gray-900">About</a></li>
                            <li className="mb-2"><a href="/contact" className="hover:text-gray-900">Jobs</a></li>
                            <li className="mb-2"><a href="/privacy" className="hover:text-gray-900">Press</a></li>
                        </ul>
                    </div>
                    <div className="flex flex-col min-h-[150px] md:min-h-[200px]">
                        <h2 className="text-xl sm:text-2xl font-semibold h-[40px] flex items-center mb-2 sm:mb-4">Resources</h2>
                        <ul className="text-gray-600 text-sm sm:text-base">
                            <li className="mb-2"><a href="/about" className="hover:text-gray-900">Learn</a></li>
                            <li className="mb-2"><a href="/contact" className="hover:text-gray-900">Documentation</a></li>
                        </ul>
                    </div>
                    <div className="flex flex-col min-h-[150px] md:min-h-[200px]">
                        <h2 className="text-xl sm:text-2xl font-semibold h-[40px] flex items-center mb-2 sm:mb-4">Social</h2>
                        <ul className="text-gray-600 text-sm sm:text-base">
                            <li className="mb-2"><a href="/about" className="hover:text-gray-900">LinkedIn</a></li>
                            <li className="mb-2"><a href="/contact" className="hover:text-gray-900">Facebook</a></li>
                            <li className="mb-2"><a href="/contact" className="hover:text-gray-900">Discord</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
}