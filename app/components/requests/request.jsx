import { FaRegComment, FaRegUser } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import RequestInfo from './requestInfo';

export default function Request() {
    const [requests, setRequests] = useState([]);
    const [showRequestInfo, setShowRequestInfo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch('/api/requests');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setRequests(data);
                } else {
                    console.warn('Expected array but got:', data);
                    setRequests([]); // fallback
                }
            } catch (error) {
                console.error('Failed to fetch requests:', error);
                setError('Failed to load requests. Please try again later.');
                setRequests([]); // fallback
            } finally {
                setIsLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[200px]">
                <div className="mb-6">
                    <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
                <h1 className="text-xl font-extrabold text-gray-600 drop-shadow-lg tracking-wide animate-pulse">
                    Loading requests...
                </h1>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex justify-center items-center min-h-[200px]">
                <div className="text-red-500 text-center">
                    <p className="text-lg font-semibold">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="w-full flex justify-center items-center min-h-[200px]">
                <div className="text-gray-500 text-center">
                    <p className="text-lg">No requests found</p>
                    <p className="text-sm mt-2">Be the first to create a request!</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${showRequestInfo ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowRequestInfo(false)}
                style={{ transitionProperty: 'opacity' }}
            ></div>

            {requests.map((req) => (
                <div
                    key={req._id}
                    onClick={() => setShowRequestInfo(true)}
                    className="w-[95%] sm:w-[85%] md:w-1/2 max-w-[950px] min-w-[280px] border rounded-2xl border-gray-200 cursor-pointer hover:shadow transition-all duration-300 ease-in-out"
                >
                    {showRequestInfo && <RequestInfo />}
                    <div className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
                        <h1 className="text-xl sm:text-2xl font-semibold">{req.title}</h1>
                        <p className="text-sm sm:text-base font-light text-gray-600">{req.description}</p>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div className="flex flex-wrap gap-2">
                                {req.tags.map((tag, index) => (
                                    <p key={index} className="text-sm sm:text-base text-purple-800 rounded-xl font-light px-2 sm:px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">
                                        {tag}
                                    </p>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center">
                                <FaRegComment className="cursor-pointer text-gray-500 hover:text-blue-500 text-lg sm:text-xl" />
                                <span className="text-sm sm:text-base text-gray-500">{req.commentsCount}</span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-2 sm:gap-0">
                            <div className="flex items-center gap-2 text-gray-500">
                                <FaRegUser className="text-sm sm:text-base" />
                                <p>{req.authorEmail}</p>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 font-light sm:ml-auto">
                                <p>Created on</p>
                                <p className="text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}