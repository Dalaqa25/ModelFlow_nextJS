import { FaRegUser } from 'react-icons/fa';
import { useState } from 'react';
import RequestCommnetCreateion from './requestCommnetCreateion';
import OtherComments from './otherComments';

export default function RequestInfo() { 
    const [showOtherComments, setShowOtherComments] = useState(false);
    return (
         <div className="fixed cursor-auto top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3 max-w-[700px] w-1/2 min-w-[400px]">
            <div className="p-5 flex flex-col gap-3 max-h-1/2 overflow-y-auto">
                <h1 className="text-2xl font-semibold">Chatpot with Personality</h1>
                <p className="font-light text-gray-600">A AI chatbot can engange users with unique patterns and moods A AI chatbot can engange users with unique patterns and moods A AI chatbot can engange users with unique patterns and moods A AI chatbot can engange users with unique patterns and moods</p>
                <div className="flex gap-2">
                    <p className="text-purple-800 rounded-xl font-light px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">Chatbot</p>
                    <p className="text-purple-800 rounded-xl px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">NLP</p>
                </div>
                <div className=' flex items-center  text-gray-500'>
                    <FaRegUser/>
                    <p>Giorgi Dalakishvili</p>
                </div>
                <hr className='border-gray-200 mt-3'/>
            </div>
            <div
                className={`w-[95%] mx-auto bg-gray-100 overflow-y-auto rounded-xl mb-4 relative transition-all duration-300 ${showOtherComments ? 'h-[300px]' : ''}`}
            >
                <RequestCommnetCreateion/>
                <p onClick={() => setShowOtherComments(true)} className='text-right mr-5 cursor-pointer mb-1 text-sm hover:text-blue-400 transition-all'>Show others comments</p>
                {showOtherComments && <OtherComments onClose={() => setShowOtherComments(false)} />}
            </div>
         </div>
    )
}