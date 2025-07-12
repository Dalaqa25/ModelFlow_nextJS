import { FaCheckCircle } from 'react-icons/fa';

export default function EnterprisePlan({ user }) {
    const isCurrentPlan = user?.subscription?.plan === 'enterprise';
    
    return (
        <div className="bg-white/60 backdrop-blur-md border-2 border-yellow-400/40 rounded-2xl shadow-md p-10 flex flex-col items-center w-full max-w-sm transition-transform transition-shadow duration-300 ease-out transform hover:scale-110 hover:shadow-2xl opacity-0 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-yellow-600">Enterprise</h2>
            <p className="text-5xl font-extrabold mb-6">$24.50<span className="text-2xl font-medium">/mo</span></p>
            <ul className="text-gray-700 text-lg w-full mb-8">
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-yellow-600">2 GB</span> <span className="bg-yellow-100 text-xs px-2 py-0.5 rounded-full ml-1">Active Storage</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-yellow-600">1 GB</span> <span className="bg-yellow-100 text-xs px-2 py-0.5 rounded-full ml-1">Archive Storage</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-yellow-600">Unlimited</span> <span className="bg-yellow-100 text-xs px-2 py-0.5 rounded-full ml-1">Models (Active + Archived)</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-yellow-600">150 MB</span> <span className="bg-yellow-100 text-xs px-2 py-0.5 rounded-full ml-1">Max File Size</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-yellow-600">Unlimited</span> <span className="bg-yellow-100 text-xs px-2 py-0.5 rounded-full ml-1">Buyers Per Model</span></li>
                <li className="flex items-center gap-3 mb-2"><FaCheckCircle className="text-green-500 text-xl" /> <span className="font-bold text-yellow-600">Unlimited</span> <span className="bg-yellow-100 text-xs px-2 py-0.5 rounded-full ml-1">Downloads</span></li>
            </ul>
            <button 
                className={`px-8 py-3 rounded-lg text-lg font-semibold transition-transform transition-colors duration-200 hover:scale-105 ${
                    isCurrentPlan 
                        ? 'bg-yellow-200 text-yellow-700 cursor-default hover:bg-yellow-300' 
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
                disabled={isCurrentPlan}
            >
                {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
            </button>
        </div>
    );
}
