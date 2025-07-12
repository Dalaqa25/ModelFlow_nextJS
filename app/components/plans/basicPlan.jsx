import { FaCheckCircle } from 'react-icons/fa';

export default function BasicPlan({ user }) {
    const isCurrentPlan = user?.subscription?.plan === 'basic';
    
    return (
        <div className="bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl shadow-md p-10 flex flex-col items-center w-full max-w-sm transition-transform transition-shadow duration-300 ease-out transform hover:scale-105 hover:shadow-2xl opacity-0 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-purple-700">Basic</h2>
            <p className="text-5xl font-extrabold mb-6">$0<span className="text-2xl font-medium">/mo</span></p>
            <ul className="text-gray-700 text-lg w-full mb-8">
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-gray-600">250 MB</span> <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">Active Storage</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-gray-600">100 MB</span> <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">Archive Storage</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-gray-600">4</span> <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">Models (Active + Archived)</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-gray-600">50 MB</span> <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">Max File Size</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-gray-600">10</span> <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">Buyers Per Model</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-gray-600">100</span> <span className="bg-gray-100 text-xs px-2 py-0.5 rounded-full ml-1">Downloads/Month</span></li>
            </ul>
            <button 
                className={`px-8 py-3 rounded-lg text-lg font-semibold transition-transform transition-colors duration-200 hover:scale-105 ${
                    isCurrentPlan 
                        ? 'bg-gray-200 text-gray-700 cursor-default hover:bg-gray-300' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                }`} 
                disabled={isCurrentPlan}
            >
                {isCurrentPlan ? 'Current Plan' : 'Downgrade'}
            </button>
        </div>
    );
}