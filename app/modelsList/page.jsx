"use client";
import { useState } from "react";
import { Search } from 'lucide-react';
import ModelBox from '@/app/components/model/modelBox';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function ModelsList() {
    const [search, setSearch] = useState("");

    return (
        <UnifiedBackground variant="content" className="pt-16">
            <div className="pt-24 pb-12 px-6">
                <div className="mx-auto w-[90%] max-w-[1500px]">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                            Explore
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Models</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Browse and discover cutting-edge AI models for your projects
                        </p>
                    </div>
                    
                    <div className="flex w-full mb-12 justify-center">
                        <UnifiedCard variant="solid" className="flex items-center px-6 py-4 w-full max-w-2xl hover:shadow-purple-500/25">
                            <Search className="w-6 h-6 text-purple-400 mr-4 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search for AI models..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-transparent focus:outline-none w-full text-lg text-white placeholder-gray-400"
                            />
                        </UnifiedCard>
                    </div>
                    
                    <div className="relative">
                        <ModelBox search={search} />
                    </div>
                </div>
            </div>
        </UnifiedBackground>
    )
}