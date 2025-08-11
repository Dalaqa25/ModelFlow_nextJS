import { FaInfoCircle } from "react-icons/fa";
export default function ModelDescription({ description }) { 
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-lg rounded-xl p-6 mb-8">
            <h2 className="flex items-center text-2xl sm:text-3xl font-bold mb-3 border-b-2 border-purple-500/30 pb-2 text-white">
                <FaInfoCircle className="text-purple-400 mr-2" />
                Model Description
            </h2>
            <p className="text-lg text-gray-300">
                {description}
            </p>
        </div>
    );
}