"use client";
import Link from "next/link";
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
        <div className='h-fit w-[340px] hidden lg:block rounded-2xl bg-white shadow-lg p-6'>
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Filter by Tag</h3>
                    <div className="flex flex-wrap gap-3">
                {tags.map((tag, i) => (
                            <button
                        key={i}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm border-2
                            ${selectedTag === tag.label
                                        ? "bg-purple-600 text-white border-purple-600 scale-105"
                                        : "bg-gray-100 text-purple-700 border-transparent hover:bg-purple-50 hover:border-purple-300"}
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
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Price Range ($)</h3>
                    <div className="flex items-center gap-3 mb-2">
                        <input
                            type="range"
                            min={0}
                            max={2000}
                            step={500}
                            value={price[0]}
                            onChange={e => setPrice([+e.target.value, price[1]])}
                            className="w-1/2 accent-purple-500"
                        />
                        <input
                            type="range"
                            min={0}
                            max={2000}
                            step={500}
                            value={price[1]}
                            onChange={e => setPrice([price[0], +e.target.value])}
                            className="w-1/2 accent-purple-500"
                        />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>$0</span>
                        <span>$20</span>
                    </div>
                    <div className="text-base font-semibold text-purple-600 bg-purple-50 rounded px-3 py-1 inline-block">
                        ${(price[0] / 100).toFixed(2)} - ${(price[1] / 100).toFixed(2)}
                    </div>
                </div>
                <Link href="/requests" className="block">
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl shadow-md transition-all text-base mt-4">
                        Request a Model
                    </button>
                </Link>
                <p className="text-xs text-gray-400 text-center mt-1">
                    If a specific model doesn't exist, make a request.
                </p>
            </div>
        </div>
    )
}