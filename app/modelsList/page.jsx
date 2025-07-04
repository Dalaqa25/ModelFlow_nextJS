"use client";
import { useState } from "react";
import { Search } from 'lucide-react';
import ModelBox from '@/app/components/model/modelBox';
import Footer from '../components/homeComponents/footer';

export default function ModelsList() {
    const [search, setSearch] = useState("");

    return (
        <>
            <div className="mt-24 mx-auto w-[90%] max-w-[1500px]">
                <h1 className="text-3xl font-bold mb-2 text-center">Explore Models</h1>
                <p className="text-gray-500 text-center mb-8">Browse and discover AI models for your projects.</p>
                <div className="flex w-full mb-10 justify-center">
                    <div className="flex items-center bg-white shadow-lg rounded-full px-4 py-2 w-full max-w-xl">
                        <Search className="w-6 h-6 text-purple-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Search for a model..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent focus:outline-none w-full text-lg text-gray-800 placeholder-gray-400"
                        />
                    </div>
                </div>
                <ModelBox search={search} />
            </div>
            <Footer />
        </>
    )
}