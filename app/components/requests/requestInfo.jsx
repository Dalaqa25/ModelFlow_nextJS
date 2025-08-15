'use client';
import { FaRegUser } from 'react-icons/fa';
import { useState } from 'react';
import RequestCommnetCreateion from './requestCommnetCreateion';
import OtherComments from './otherComments';

export default function RequestInfo({ request }) { 
    const [showOtherComments, setShowOtherComments] = useState(false);
    const [commentsUpdated, setCommentsUpdated] = useState(0);

    const handleCommentAdded = () => {
        setCommentsUpdated(prev => prev + 1);
    };

    return (
         <div className="fixed cursor-auto top-1/2 left-1/2 z-[60] bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl shadow-purple-500/25 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-3 max-w-[700px] w-[95%] sm:w-[85%] md:w-1/2 min-w-[280px]">
            <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 max-h-[50vh] overflow-y-auto">
                <h1 className="text-xl sm:text-2xl font-semibold text-white">{request.title}</h1>
                <p className="text-sm sm:text-base font-light text-slate-300 break-words">
                    {request.description}
                </p>
                <div className="flex flex-wrap gap-2">
                    {request.tags.map((tag, index) => (
                        <span key={index} className="text-sm sm:text-base text-purple-300 rounded-xl font-medium px-2 sm:px-3 py-0.5 bg-purple-500/20 border border-purple-500/30">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className='flex items-center gap-2 text-slate-400'>
                    <FaRegUser className="text-sm sm:text-base"/>
                    <p className="text-sm sm:text-base">{request.author_email}</p>
                </div>
                <hr className='border-slate-600/50 mt-2 sm:mt-3'/>
            </div>
            <div
                className={`w-[95%] overflow-x-hidden mx-auto bg-slate-700/50 overflow-y-auto rounded-xl mb-3 sm:mb-4 relative transition-all duration-300 ${
                    showOtherComments ? 'h-[250px] sm:h-[300px]' : 'h-auto'
                }`}>
                <RequestCommnetCreateion
                    requestId={request.id}
                    onCommentAdded={handleCommentAdded}
                />
                <p
                    onClick={() => setShowOtherComments(true)}
                    className='text-right mr-3 sm:mr-5 cursor-pointer mb-1 text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-all'
                >
                    Show others comments
                </p>
                {showOtherComments && (
                    <OtherComments
                        requestId={request.id}
                        onClose={() => setShowOtherComments(false)}
                        key={commentsUpdated}
                    />
                )}
            </div>
         </div>
    );
}