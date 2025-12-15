"use client";
import NavigationLink from "../NavigationLink";
import { FaLanguage, FaEye, FaComments, FaImage } from "react-icons/fa";
import { MdTranslate } from "react-icons/md";

export default function Filter({ selectedTag, setSelectedTag, price, setPrice }) { 
    const tags = [
        { label: "NLP", icon: <FaLanguage /> },
        { label: "Computer Vision", icon: <FaEye /> },
        { label: "Chatbot", icon: <FaComments /> },
        { label: "Image Generation", icon: <FaImage /> },
        { label: "Translation", icon: <MdTranslate /> },
    ];

    return (
        <div className='h-fit w-[340px] hidden lg:block rounded-2xl bg-slate-800/80 backdrop-blur-md border border-slate-700/50 shadow-2xl p-6'>
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-3">Filter by Tag</h3>
                    <div className="flex flex-wrap gap-3">
                {tags.map((tag, i) => (
                            <button
                        key={i}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm border-2
                            ${selectedTag === tag.label
                                        ? "bg-purple-600 text-white border-purple-600 scale-105"
                                        : "bg-slate-700/50 text-purple-300 border-transparent hover:bg-purple-500/20 hover:border-purple-400/50"}
                        `}
                                onClick={() => setSelectedTag(selectedTag === tag.label ? null : tag.label)}
                    >
                                <span className="text-lg">{tag.icon}</span>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Price Range Filter */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-3">Price Range ($)</h3>
                    <div className="flex items-center gap-3 mb-2">
                        <input
                            type="range"
                            min={0}
                            max={2000}
                            step={500}
                            value={price[0]}
                            onChange={e => setPrice([+e.target.value, price[1]])}
                            className="w-1/2 accent-purple-400"
                        />
                        <input
                            type="range"
                            min={0}
                            max={2000}
                            step={500}
                            value={price[1]}
                            onChange={e => setPrice([price[0], +e.target.value])}
                            className="w-1/2 accent-purple-400"
                        />
                    </div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>$0</span>
                        <span>$20</span>
                    </div>
                    <div className="text-base font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/30 rounded px-3 py-1 inline-block">
                        ${(price[0] / 100).toFixed(2)} - ${(price[1] / 100).toFixed(2)}
                    </div>
                </div>
                <NavigationLink href="/community" className="block">
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 rounded-xl shadow-md transition-all text-base mt-4">
                        Request a Model
                    </button>
                </NavigationLink>
                <p className="text-xs text-gray-400 text-center mt-1">
                    If a specific model doesn't exist, make a request.
                </p>
            </div>
        </div>
    )
}