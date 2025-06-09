"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Filter from './filter';
import { FiDownload } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';
import DefaultModelImage from './defaultModelImage';

export default function ModelBox({ search = "" }) {
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 10;

    // fetching model data
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchModels() {
            setLoading(true);
            const res = await fetch("/api/models");
            const data = await res.json();
            setModels(data);
            setLoading(false);
        }
        fetchModels();
    }, []);

    // Add filter state here
    const [selectedTag, setSelectedTag] = useState(null);
    const [price, setPrice] = useState([0, 1000]);

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
                    {loading ? (
                        <div className="w-full flex flex-col items-center justify-center min-h-[200px]">
                            <div className="mb-6">
                                <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-extrabold text-gray-600 drop-shadow-lg tracking-wide animate-pulse">
                                Loading models...
                            </h1>
                        </div>
                    ) : (
                        currentModels.map(model => (
                            <Link key={model._id || model.id} href={`/modelsList/${model._id}`} className='cutom-shadow p-1 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-50 transition-all max-w-[900px]'>
                                <div className='p-3.5 flex flex-col gap-5'>
                                    <div className='flex gap-4'>
                                        {model.imgUrl ? (
                                            <img 
                                                src={model.imgUrl} 
                                                alt={model.name} 
                                                className='w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover'
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 sm:w-16 sm:h-16">
                                                <DefaultModelImage />
                                            </div>
                                        )}
                                        <div className='flex flex-col gap-2'>
                                            <h2 className='text-1xl sm:text-2xl font-semibold'>{model.name}</h2>
                                            <span className='flex gap-1 text-gray-500'>
                                                author: <p>{model.authorEmail}</p>
                                            </span>
                                        </div>
                                    </div>
                                    <div className='flex gap-3 flex-wrap'>
                                        {model.tags.map((tag, index) => (
                                            <div key={index} style={{ backgroundColor: '#efe7ff' }} className='font-light p-1 rounded-xl'>
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Revives */}
                                    <div className='flex items-center gap-4 font-light text-sm'>
                                        <p>Uploaded: <span>{new Date(model.createdAt).toLocaleDateString()}</span></p>
                                        <p className='flex items-center gap-1'><FiDownload/><span>{model.downloads}</span></p>
                                        <p className='flex items-center gap-1'><AiOutlineHeart/><span>{model.likes}</span></p>
                                    </div>
                                    <span className='flex gap-1'>
                                        Price: <span className='flex'>$<p>{model.price}</p></span>
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                    <div className="flex justify-center gap-2 mt-4 mb-10">
                        <button
                            onClick={() => {
                                setCurrentPage(prev => {
                                    const newPage = Math.max(prev - 1, 1);
                                    setTimeout(scrollToModelListTop, 0);
                                    return newPage;
                                });
                            }}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentPage(i + 1);
                                    setTimeout(scrollToModelListTop, 0);
                                }}
                                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setCurrentPage(prev => {
                                    const newPage = Math.min(prev + 1, totalPages);
                                    setTimeout(scrollToModelListTop, 0);
                                    return newPage;
                                });
                            }}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}