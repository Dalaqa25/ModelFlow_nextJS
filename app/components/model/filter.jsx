"use client";

import { useState } from "react";
import { FaLanguage, FaEye, FaComments, FaImage } from "react-icons/fa";
import { MdTranslate } from "react-icons/md";


export default function Filter() { 
    const tags = [
        { label: "NLP", icon: <FaLanguage /> },
        { label: "Computer Vision", icon: <FaEye /> },
        { label: "Chatbot", icon: <FaComments /> },
        { label: "Image Generation", icon: <FaImage /> },
        { label: "Translation", icon: <MdTranslate /> },
    ];

    const [price, setPrice] = useState([0, 1000]);

    return (
        <div className='h-1/2 w-[400px] hidden lg:block rounded-lg cutom-shadow'>
            <div className="grid gap-2 p-4">
                {tags.map((tag, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-100 p-3 rounded-md cursor-pointer hover:bg-blue-100">
                        <span className="text-purple-700 text-lg">{tag.icon}</span>
                        <span className="text-lg font-medium">{tag.label}</span>
                    </div>
                ))}
                {/* Price Range Filter */}
                <div className="mt-6">
                    <label className="block text-gray-700 font-semibold mb-2">Price Range ($)</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            value={price[0]}
                            onChange={e => setPrice([+e.target.value, price[1]])}
                            className="w-1/2 accent-purple-500"
                        />
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            value={price[1]}
                            onChange={e => setPrice([price[0], +e.target.value])}
                            className="w-1/2 accent-purple-500"
                        />
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                        ${price[0]} - ${price[1]}
                    </div>
                </div>
                {/* Add the button here */}
                <button className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition">
                    Request a Model
                </button>
                <p className="mt-1 text-xs text-gray-500 text-center">
                    If a specific model doesn't exist, make a request.
                </p>
            </div>
        </div>
    )
}