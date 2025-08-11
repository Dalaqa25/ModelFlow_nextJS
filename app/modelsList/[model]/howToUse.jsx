import { FaTools } from "react-icons/fa";
export default function HowToUse({setup}) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-lg rounded-xl p-6 mb-8">
            <h2 className="flex items-center text-2xl sm:text-3xl font-bold mb-3 border-b-2 border-purple-500/30 pb-2 text-white">
                <FaTools className="text-purple-400 mr-2" />
                How to use / set up
            </h2>
            <p className="text-lg text-gray-300">
                    {setup}
                </p>
            </div>
    )
}