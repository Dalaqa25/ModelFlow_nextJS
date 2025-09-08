"use client"
import { useState } from 'react';
import NavigationLink from '../NavigationLink';
import Filter from './filter';
import { FiDownload } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';
import DefaultModelImage from './defaultModelImage';
import { useQuery } from '@tanstack/react-query';
import { FaTag } from 'react-icons/fa';
import React from 'react'; // Added missing import for React.useEffect

export default function ModelBox({ search = "" }) {
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 10;

    // Use React Query for data fetching
    const { data: models = [], isLoading, error } = useQuery({
        queryKey: ['models'],
        queryFn: async () => {
            const res = await fetch("/api/models");
            if (!res.ok) {
                throw new Error('Failed to fetch models');
            }
            const data = await res.json();
            return data;
        },
        // Balanced cache configuration for public model listings
        staleTime: 2 * 60 * 1000, // Data considered fresh for 2 minutes (shorter for public data)
        gcTime: 5 * 60 * 1000, // Cache garbage collected after 5 minutes
        refetchOnWindowFocus: false, // Don't refetch when tab becomes active
        refetchOnReconnect: true, // Refetch when reconnecting (good for public data)
        refetchOnMount: false, // Don't refetch when component remounts if data is still fresh
    });

    // Add filter state here
    const [selectedTag, setSelectedTag] = useState(null);
    const [price, setPrice] = useState([0, 5000]); // Price in cents

    // Filter models by search, tag, and price
    const filteredModels = models.filter(model => {
        const matchesSearch =
            model.name.toLowerCase().includes(search.toLowerCase()) ||
            model.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
        const matchesTag = !selectedTag || model.tags.includes(selectedTag);
        const matchesPrice = model.price >= price[0] && model.price <= price[1];
        
        return matchesSearch && matchesTag && matchesPrice;
    });

    const totalPages = Math.ceil(filteredModels.length / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = filteredModels.slice(indexOfFirstModel, indexOfLastModel);

    const scrollToModelListTop = () => {
        const element = document.getElementById('model-list-top');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedTag, price, search]);

    return (
        <>
            <div id="model-list-top" className='flex gap-7 w-full'>
                <Filter
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    price={price}
                    setPrice={setPrice}
                />
                <div className='w-full flex flex-col gap-7'>
                    {isLoading && (
                        <div className="w-full flex flex-col items-center justify-center min-h-[200px]">
                            <div className="mb-6">
                                <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-extrabold text-white drop-shadow-lg tracking-wide animate-pulse">
                                Loading models...
                            </h1>
                        </div>
                    )}

                    {error && (
                        <div className="w-full flex justify-center items-center min-h-[200px]">
                            <div className="text-red-400 text-center">
                                <p className="text-lg font-semibold">{error.message || 'Failed to load models'}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && currentModels.length === 0 && (
                        <div className="w-full flex justify-center items-center min-h-[200px]">
                            <div className="text-gray-300 text-center">
                                <p className="text-lg">No models found</p>
                                <p className="text-sm mt-2">Try adjusting your search or filters</p>
                                <button
                                    onClick={() => {
                                        setSelectedTag(null);
                                        setPrice([0, 5000]);
                                    }}
                                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && currentModels.length > 0 && (
                        <>
                            {currentModels.map(model => (
                                <NavigationLink key={model.id} href={`/modelsList/${model.id}`} className='bg-slate-800/90 backdrop-blur-md border border-slate-700/50 shadow-2xl p-1 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.015] hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all max-w-[900px]'>
                                    <div className='p-4 flex flex-col gap-5'>
                                        <div className='flex gap-4'>
                                            {model.imgUrl ? (
                                                <img
                                                    src={model.imgUrl}
                                                    alt={model.name}
                                                    className='w-14 h-14 sm:w-20 sm:h-20 rounded-lg object-cover'
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 sm:w-20 sm:h-20">
                                                    <DefaultModelImage />
                                                </div>
                                            )}
                                            <div className='flex flex-col gap-1'>
                                                <h2 className='text-2xl font-bold text-white'>{model.name}</h2>
                                                <span className='flex gap-1 text-gray-300 text-sm font-light'>
                                                    author: <p>{model.authorEmail}</p>
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex gap-2 flex-wrap'>
                                            {model.tags.map((tag, index) => (
                                                <span key={index} className='bg-purple-500 text-white px-3 py-1 rounded-full shadow text-xs font-medium tracking-wide flex items-center gap-1'>
                                                    <FaTag className="text-white text-[0.9em] mr-1" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className='flex items-center gap-4 font-light text-sm text-gray-300'>
                                            <p>Uploaded: <span>{new Date(model.createdAt).toLocaleDateString()}</span></p>
                                            <p className='flex items-center gap-1'><FiDownload/><span>{model.downloads}</span></p>
                                            <p className='flex items-center gap-1'><AiOutlineHeart/><span>{model.likes}</span></p>
                                        </div>
                                        <span className='flex gap-1 text-base font-semibold text-purple-400'>
                                            Price: <span className='flex'>$<p>{(model.price / 100).toFixed(2)}</p></span>
                                        </span>
                                    </div>
                                </NavigationLink>
                            ))}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-4 mb-10">
                                    <button
                                        onClick={() => {
                                            setCurrentPage(prev => Math.max(prev - 1, 1));
                                            scrollToModelListTop();
                                        }}
                                        disabled={currentPage === 1}
                                        className={`${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600/50'} bg-slate-700/50 border border-slate-600/50 text-gray-300 px-3 py-1 rounded`}
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setCurrentPage(i + 1);
                                                scrollToModelListTop();
                                            }}
                                            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-purple-600 text-white border border-purple-500' : 'bg-slate-700/50 border border-slate-600/50 text-gray-300 hover:bg-slate-600/50'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                            scrollToModelListTop();
                                        }}
                                        disabled={currentPage === totalPages}
                                        className={`${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600/50'} bg-slate-700/50 border border-slate-600/50 text-gray-300 px-3 py-1 rounded`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}