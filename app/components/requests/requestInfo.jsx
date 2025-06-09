import { FaRegUser } from 'react-icons/fa';
import { useState } from 'react';
import RequestCommnetCreateion from './requestCommnetCreateion';
import OtherComments from './otherComments';

export default function RequestInfo({ request }) { 
    const [showOtherComments, setShowOtherComments] = useState(false);
    return (
         <div className="fixed cursor-auto top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-3 max-w-[700px] w-[95%] sm:w-[85%] md:w-1/2 min-w-[280px]">
            <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 max-h-[50vh] overflow-y-auto">
                <h1 className="text-xl sm:text-2xl font-semibold">{request.title}</h1>
                <p className="text-sm sm:text-base font-light text-gray-600 break-words">
                    {request.description}
                </p>
                <div className="flex flex-wrap gap-2">
                    {request.tags.map((tag, index) => (
                        <p key={index} className="text-sm sm:text-base text-purple-800 rounded-xl font-light px-2 sm:px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">
                            {tag}
                        </p>
                    ))}
                </div>
                <div className='flex items-center gap-2 text-gray-500'>
                    <FaRegUser className="text-sm sm:text-base"/>
                    <p className="text-sm sm:text-base">{request.authorEmail}</p>
                </div>
                <hr className='border-gray-200 mt-2 sm:mt-3'/>
            </div>
            <div
                className={`w-[95%] overflow-x-hidden mx-auto bg-gray-100 overflow-y-auto rounded-xl mb-3 sm:mb-4 relative transition-all duration-300 ${
                    showOtherComments ? 'h-[250px] sm:h-[300px]' : 'h-auto'
                }`}>
                <RequestCommnetCreateion/>
                <p 
                    onClick={() => setShowOtherComments(true)} 
                    className='text-right mr-3 sm:mr-5 cursor-pointer mb-1 text-xs sm:text-sm hover:text-blue-400 transition-all'
                >
                    Show others comments
                </p>
                {showOtherComments && <OtherComments onClose={() => setShowOtherComments(false)} />}
            </div>
         </div>
    )
}