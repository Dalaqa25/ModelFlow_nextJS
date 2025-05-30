export default function Footer() { 
    return (
        <footer className="mt-30">
            <hr className="border-gray-300 mb-15" />
            <div className="w-[70%] max-w-[1400px] mx-auto flex items-start justify-between">
                <div className="flex flex-col min-h-[200px]">
                    <h2 className="text-2xl font-semibold h-[40px] flex items-center mb-4">WebSite</h2>
                    <ul className="text-gray-600">
                        <li className="mb-2"><a href="/about">Models</a></li>
                        <li className="mb-2"><a href="/contact">Requests</a></li>
                        <li className="mb-2"><a href="/privacy">Privacy Policy</a></li>
                        <li className="mb-2"><a href="/terms">Plans</a></li>
                    </ul>
                </div>
                <div className="flex flex-col min-h-[200px]">
                    <h2 className="text-2xl font-semibold h-[40px] flex items-center mb-4">Company</h2>
                    <ul className="text-gray-600">
                        <li className="mb-2"><a href="/about">About</a></li>
                        <li className="mb-2"><a href="/contact">Jobs</a></li>
                        <li className="mb-2"><a href="/privacy">Press</a></li>
                    </ul>
                </div>
                <div className="flex flex-col min-h-[200px]">
                    <h2 className="text-2xl font-semibold h-[40px] flex items-center mb-4">Resources</h2>
                    <ul className="text-gray-600">
                        <li className="mb-2"><a href="/about">Learn</a></li>
                        <li className="mb-2"><a href="/contact">Documentation</a></li>
                    </ul>
                </div>
                <div className="flex flex-col min-h-[200px]">
                    <h2 className="text-2xl font-semibold h-[40px] flex items-center mb-4">Social</h2>
                    <ul className="text-gray-600">
                        <li className="mb-2"><a href="/about">LinkedIn</a></li>
                        <li className="mb-2"><a href="/contact">Facebook</a></li>
                        <li className="mb-2"><a href="/contact">Discord</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    )
}