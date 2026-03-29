'use client';
import { HiOutlineUser } from 'react-icons/hi2';
import { FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RequestCommnetCreateion from './requestCommnetCreateion';
import OtherComments from './otherComments';
import { useRouter } from 'next/navigation';

export default function RequestInfo({ request, onClose }) {
    const [commentsUpdated, setCommentsUpdated] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsVisible(true);
        // Prevent body scroll when panel is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleCommentAdded = () => {
        setCommentsUpdated(prev => prev + 1);
    };

    const getInitial = (email) => {
        return email ? email.charAt(0).toUpperCase() : '?';
    };

    const getAvatarColor = (email) => {
        const colors = [
            'from-purple-500 to-indigo-500',
            'from-pink-500 to-rose-500',
            'from-blue-500 to-cyan-500',
            'from-amber-500 to-orange-500',
            'from-emerald-500 to-teal-500',
            'from-violet-500 to-purple-500',
        ];
        const hash = email?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
        return colors[hash % colors.length];
    };

    if (!request) return null;

    return (
        <>
            {/* Side Panel — slides in from right */}
            <div
                className={`fixed top-14 sm:top-0 right-0 h-[calc(100%-3.5rem)] sm:h-full z-50 w-full sm:w-[480px] lg:w-[520px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl shadow-black/50 flex flex-col transition-transform duration-300 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Panel Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-700/40 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span className="text-sm font-medium text-slate-300">Suggestion Details</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Post Content */}
                    <div className="px-5 sm:px-6 py-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                            {request.title}
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5 whitespace-pre-wrap break-words">
                            {request.description}
                        </p>

                        {/* Tags */}
                        {request.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {request.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="text-xs text-purple-300 rounded-lg font-medium px-2.5 py-1 bg-purple-500/12 border border-purple-500/20"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Author Info */}
                        <div className="flex items-center gap-3 p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/30">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(request.author_email)} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-xs font-bold text-white">{getInitial(request.author_email)}</span>
                            </div>
                            <div className="min-w-0">
                                <p
                                    onClick={() => router.push(`/profile/${request.author_email}`)}
                                    className="text-sm font-medium text-purple-300 hover:text-purple-200 cursor-pointer transition-colors truncate"
                                >
                                    {request.author_email}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Date(request.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="border-t border-slate-700/40">
                        <div className="px-5 sm:px-6 py-4">
                            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <span className="w-1 h-4 rounded-full bg-purple-500" />
                                Discussion
                            </h3>

                            {/* Comments list */}
                            <OtherComments
                                requestId={request.id}
                                key={commentsUpdated}
                            />
                        </div>
                    </div>
                </div>

                {/* Comment Input — Pinned to bottom */}
                <div className="flex-shrink-0 border-t border-slate-700/40 bg-slate-900/90 backdrop-blur-sm">
                    <RequestCommnetCreateion
                        requestId={request.id}
                        onCommentAdded={handleCommentAdded}
                    />
                </div>
            </div>
        </>
    );
}