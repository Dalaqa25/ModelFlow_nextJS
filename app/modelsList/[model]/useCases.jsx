import { FaLightbulb } from "react-icons/fa";
export default function useCases({useCases}) {
    const useCaseList = typeof useCases === "string" ? useCases.split(",") : useCases;
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-lg rounded-xl p-6 mb-8">
            <h2 className="flex items-center text-2xl sm:text-3xl font-bold mb-3 border-b-2 border-purple-500/30 pb-2 text-white">
                <FaLightbulb className="text-purple-400 mr-2" />
                Use Cases
            </h2>
            <div className="flex flex-wrap gap-3">
                {useCaseList && useCaseList.map((uc, idx) => (
                    <span key={idx} className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg text-base font-medium shadow-sm">
                        {uc.trim()}
                    </span>
                ))}
                </div>
            </div>
    )
}