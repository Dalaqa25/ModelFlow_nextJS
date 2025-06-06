"use client"
import { useState } from 'react';
import modelData from 'app/modelsList/modeldata.js'
import Link from 'next/link';
import Filter from './filter';
import { FiDownload } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';

export default function ModelBox({ search = "" }) {
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 10;

    // Add filter state here
    const [selectedTag, setSelectedTag] = useState(null);
    const [price, setPrice] = useState([0, 1000]);

    // Filter models by search, tag, and price
    const filteredModels = modelData.filter(model => {
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
                    {currentModels.map(model => (
                        <Link href={`/modelsList/${model.id}`} key={model.id} className='cutom-shadow p-1 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-50 transition-all max-w-[900px]'>
                            <div className='p-3.5 flex flex-col gap-5'>
                                <div className='flex gap-4'>
                                    {model.image && (
                                    <img src={model.image.src} 
                                        alt={model.image.alt} 
                                        className='w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover' />
                                    )}
                                    <div className='flex flex-col gap-2'>
                                        <h2 className='text-1xl sm:text-2xl font-semibold'>{model.name}</h2>
                                        <span className='flex gap-1 text-gray-500'>
                                            author: <p>{model.author}</p>
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
                                    <p>Uploaded: <span>12.05.2</span></p>
                                    <p className='flex items-center gap-1'><FiDownload/><span>55</span></p>
                                    <p className='flex items-center gap-1'><AiOutlineHeart/><span>55</span></p>
                                </div>
                                <span className='flex gap-1'>
                                    Price: <span className='flex'>$<p>{model.price}</p></span>
                                </span>
                            </div>
                        </Link>
                    ))}
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