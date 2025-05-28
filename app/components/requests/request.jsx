import { FaRegComment, FaRegUser } from 'react-icons/fa';
import { useState } from 'react';
import RequestInfo from './requestInfo';

export default function Request() { 
    const [showRequestInfo, setShowRequestInfo] = useState(false);
    return (
        <>
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${showRequestInfo ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowRequestInfo(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>

            <div 
                onClick={() => setShowRequestInfo(true)} 
                className="w-[95%] sm:w-[85%] md:w-1/2 max-w-[950px] min-w-[280px] border rounded-2xl border-gray-200 cursor-pointer hover:shadow transition-all duration-300 ease-in-out"
            >
                {showRequestInfo && <RequestInfo/>}
                <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
                    <h1 className="text-xl sm:text-2xl font-semibold">Chatpot with Personality</h1>
                    <p className="text-sm sm:text-base font-light text-gray-600">A AI chatbot can engange users with unique patterns and moods</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex flex-wrap gap-2">
                            <p className="text-sm sm:text-base text-purple-800 rounded-xl font-light px-2 sm:px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">Chatbot</p>
                            <p className="text-sm sm:text-base text-purple-800 rounded-xl px-2 sm:px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">NLP</p>
                        </div>
                        <div className='flex gap-2 items-center'>
                            <FaRegComment className="cursor-pointer text-gray-500 hover:text-blue-500 text-lg sm:text-xl" />
                            <span className='text-sm sm:text-base text-gray-500'>12</span>
                        </div>
                    </div>
                    <div className='flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-2 sm:gap-0'>
                        <div className='flex items-center gap-2 text-gray-500'>
                            <FaRegUser className="text-sm sm:text-base"/>
                            <p>Giorgi Dalakishvili</p>
                        </div>
                        <div className='flex items-center gap-2 text-gray-500 font-light sm:ml-auto'>
                            <p>Created on</p>
                            <p className='text-gray-500'>12/12/2023</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}