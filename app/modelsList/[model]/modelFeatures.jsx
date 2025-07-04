import { FaListUl } from "react-icons/fa";
export default function ModelFeatures({ features }) {
    const featureList = typeof features === "string" ? features.split(",") : features;

    return (
        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
            <h2 className="flex items-center text-2xl sm:text-3xl font-bold mb-3 border-b-2 border-purple-100 pb-2">
                <FaListUl className="text-purple-400 mr-2" />
                Key Features
            </h2>
            <ul className="flex flex-col gap-3">
                    {featureList && featureList.map((feature, index) => (
                    <li key={index} className="flex items-center text-lg text-gray-700">
                        <span className="text-purple-500 mr-2">✔️</span>
                            {feature.trim()}
                        </li>
                    ))}
                </ul>
        </div>
    );
}