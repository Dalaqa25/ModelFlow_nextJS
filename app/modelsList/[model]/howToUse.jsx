import { FaTools } from "react-icons/fa";
export default function HowToUse({setup}) {
    return (
        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
            <h2 className="flex items-center text-2xl sm:text-3xl font-bold mb-3 border-b-2 border-purple-100 pb-2">
                <FaTools className="text-purple-400 mr-2" />
                How to use / set up
            </h2>
            <p className="text-lg text-gray-700">
                    {setup}
                </p>
            </div>
    )
}