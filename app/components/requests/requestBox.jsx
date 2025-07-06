'use client';
import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function RequestBox({ onClose, onRequestPublished }) { 
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState(['']);
    const [loading, setLoading] = useState(false);
    const { user } = useKindeBrowserClient();

    const handleTagChange = (index, value) => {
        const updated = [...tags];
        updated[index] = value;
        setTags(updated);
    };

    const addTag = () => setTags([...tags, '']);
    const removeTag = (index) => {
        const updated = tags.filter((_, i) => i !== index);
        setTags(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.email) {
            toast.error('You must be logged in to publish a request.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: name,
                    description,
                    tags: tags.filter(tag => tag.trim() !== ''),
                    authorEmail: user.email,
                }),
            });
            if (!res.ok) throw new Error('Failed to publish request');
            toast.success('Request published successfully!');
            setName('');
            setDescription('');
            setTags(['']);
            if (onClose) onClose();
            if (onRequestPublished) onRequestPublished();
        } catch (err) {
            toast.error(err.message || 'Failed to publish request');
        } finally {
            setLoading(false);
        }
    };

    return (   
        <div className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-[95%] sm:w-1/2 max-w-[600px] min-w-[280px] p-2 sm:p-0">
            <form className="w-full sm:w-[80%] py-4 sm:py-6 flex flex-col gap-4 sm:gap-5" onSubmit={handleSubmit}>
                <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2 sm:mb-3">Request a Model</h2>
                {/* Toast notifications will show instead of in-modal messages */}
                <div>
                    <label htmlFor="name" className="text-sm sm:text-base font-medium text-gray-700">Expected name*</label>
                    <input
                        type="text"
                        id="name"
                        placeholder="Enter expected name for model"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="mt-1 placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-300 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="description" className="text-sm sm:text-base font-medium text-gray-700">Description*</label>
                    <textarea
                        id="description"
                        rows={4}
                        placeholder="Write a brief description..."
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="placeholder:text-xs sm:placeholder:text-sm max-h-[200px] placeholder:text-gray-300 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm sm:text-base font-medium text-gray-700">Tags</label>
                    {tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => handleTagChange(index, e.target.value)}
                                required
                                className="placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-300 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                                placeholder={`Tag ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="text-red-500 p-1.5 sm:p-2 bg-gray-100 rounded-full hover:text-red-700 hover:bg-gray-200 transition-colors">
                                <FaTrash className="text-sm sm:text-base" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTag}
                        className="mt-1 text-xs sm:text-sm text-violet-600 flex items-center gap-1 hover:underline">
                        <FaPlus /> Add Tag
                    </button>
                </div>

                <button 
                    className="btn-primary text-white py-2 sm:py-3 text-base sm:text-lg w-full sm:w-1/3 rounded-lg mx-auto mt-2 disabled:opacity-50"
                    type="submit"
                    disabled={loading || !user}
                >
                    {loading ? 'Publishing...' : 'Publish'}
                </button>              
            </form>
        </div>    
    )
}