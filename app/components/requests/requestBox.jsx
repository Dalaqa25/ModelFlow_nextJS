'use client';
import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/supabase-auth-context';

export default function RequestBox({ onClose, onRequestPublished }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState(['']);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const addTag = () => {
        setTags([...tags, '']);
    };

    const removeTag = (index) => {
        if (tags.length > 1) {
            setTags(tags.filter((_, i) => i !== index));
        }
    };

    const handleTagChange = (index, value) => {
        const newTags = [...tags];
        newTags[index] = value;
        setTags(newTags);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('You must be logged in to publish a request.');
            return;
        }

        setLoading(true);

        const requestData = {
            title: name,
            description,
            tags: tags.filter(tag => tag.trim() !== ''),
            author_email: user.email || 'anonymous@example.com',
        };


        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });


            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to publish request: ${res.status} ${errorText}`);
            }

            const responseData = await res.json();

            toast.success('Request published successfully!');
            setName('');
            setDescription('');
            setTags(['']);
            if (onClose) onClose();
            if (onRequestPublished) onRequestPublished();
        } catch (err) {
            console.error('[RequestBox] Error:', err);
            toast.error(err.message || 'Failed to publish request');
        } finally {
            setLoading(false);
        }
    };

    return (   
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose && onClose();
                }}
            />
            
            {/* Modal */}
            <motion.div
                className="relative bg-slate-800/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose && onClose();
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 z-10"
                >
                    <FaTimes size={16} />
                </button>

                <form className="w-full flex flex-col gap-6 text-left" onSubmit={handleSubmit}>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Request a Model</h2>
                        <p className="text-slate-400 text-sm">Help us understand what you need</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <label htmlFor="name" className="text-sm font-medium text-slate-300 mb-2 block text-left">Expected name*</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Enter expected name for model"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                    </motion.div>

                    <motion.div 
                        className="flex flex-col gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <label htmlFor="description" className="text-sm font-medium text-slate-300 text-left">Description*</label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Write a brief description..."
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                        />
                    </motion.div>

                    <motion.div 
                        className="flex flex-col gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <label className="text-sm font-medium text-slate-300 text-left">Tags</label>
                        {tags.map((tag, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tag}
                                    onChange={(e) => handleTagChange(index, e.target.value)}
                                    required
                                    className="flex-1 p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder={`Tag ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTag(index)}
                                    className="p-3 text-red-400 bg-red-500/20 rounded-xl hover:text-red-300 hover:bg-red-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <FaTrash className="text-sm" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addTag}
                            className="text-sm text-purple-400 flex items-center gap-2 hover:text-purple-300 transition-colors duration-200"
                        >
                            <FaPlus className="text-xs" /> Add Tag
                        </button>
                    </motion.div>

                    <motion.button 
                        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        type="submit"
                        disabled={loading}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        {loading ? 'Publishing...' : 'Publish Request'}
                    </motion.button>              
                </form>
            </motion.div>
        </div>    
    )
}