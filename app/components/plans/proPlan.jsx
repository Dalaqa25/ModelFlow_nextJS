import { FaCheckCircle } from 'react-icons/fa';

export default function ProPlan() {
    return (
        <div className="relative bg-white/60 backdrop-blur-md border-2 border-purple-400/40 rounded-2xl shadow-md p-10 flex flex-col items-center w-full max-w-sm transition-transform transition-shadow duration-300 ease-out transform hover:scale-110 hover:shadow-2xl opacity-0 animate-fade-in">
            <span className="absolute -top-4 right-4 bg-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">Recommended</span>
            <h2 className="text-3xl font-bold mb-4 text-purple-700">Professional</h2>
            <p className="text-5xl font-extrabold mb-6">$14.50<span className="text-2xl font-medium">/mo</span></p>
            <ul className="text-gray-700 text-lg w-full mb-8">
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-purple-700">1 GB</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Active Storage</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-purple-700">500 MB</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Archive Storage</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-purple-700">12</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Models (Active + Archived)</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-purple-700">100 MB</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Max File Size</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-purple-700">50</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Buyers Per Model</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-purple-700">1000</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Downloads/Month</span></li>
            </ul>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-transform transition-colors duration-200 hover:scale-105 hover:bg-purple-700">Upgrade</button>
        </div>
    );
}
