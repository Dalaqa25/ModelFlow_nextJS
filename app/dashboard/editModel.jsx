'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaLanguage, FaEye, FaComments, FaImage } from 'react-icons/fa';
import { MdTranslate } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const AVAILABLE_TAGS = [
    { label: "NLP", icon: <FaLanguage /> },
    { label: "Computer Vision", icon: <FaEye /> },
    { label: "Chatbot", icon: <FaComments /> },
    { label: "Image Generation", icon: <FaImage /> },
    { label: "Translation", icon: <MdTranslate /> },
];

export default function EditModel({ isOpen, onClose, model, onEditSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        tags: ['', '']
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (model) {
            setFormData({
                name: model.name || '',
                description: model.description || '',
                price: model.price || '',
                tags: model.tags?.slice(0, 2) || ['', '']
            });
        }
    }, [model]);

    const handleTagChange = (index, value) => {
        const updated = [...formData.tags];
        updated[index] = value;
        setFormData(prev => ({ ...prev, tags: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.description.trim()) {
            toast.error('Name and description are required');
            return;
        }

        const toastId = toast.loading('Updating model...');
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/models/${model._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    price: parseFloat(formData.price) || 0,
                    tags: formData.tags.filter(tag => tag.trim())
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update model');
            }

            toast.success('Model updated successfully!', { id: toastId });
            if (onEditSuccess) {
                onEditSuccess();
            }
            onClose();
        } catch (error) {
            console.error('Error updating model:', error);
            toast.error('Failed to update model. Please try again.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black z-50 transition-opacity duration-300 opacity-50"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-[95%] sm:w-1/2 max-w-[600px] min-w-[280px] p-2 sm:p-0">
                <div className="w-full sm:w-[80%] py-4 sm:py-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl sm:text-2xl font-semibold">Edit Model</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
                        <div>
                            <label htmlFor="name" className="text-sm sm:text-base font-medium text-gray-700">Name*</label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter model name"
                                required
                                className="mt-1 placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-300 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="description" className="text-sm sm:text-base font-medium text-gray-700">Description*</label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                placeholder="Write a brief description..."
                                required
                                className="placeholder:text-xs sm:placeholder:text-sm max-h-[200px] placeholder:text-gray-300 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="price" className="text-sm sm:text-base font-medium text-gray-700">Price ($)</label>
                            <input
                                type="number"
                                id="price"
                                value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="Enter price"
                                min="0"
                                step="0.01"
                                className="mt-1 placeholder:text-xs sm:placeholder:text-sm placeholder:text-gray-300 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm sm:text-base font-medium text-gray-700">Tags (select 2)</label>
                            {formData.tags.map((tag, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <select
                                        value={tag}
                                        onChange={(e) => handleTagChange(index, e.target.value)}
                                        className="w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                                    >
                                        <option value="">Select a tag</option>
                                        {AVAILABLE_TAGS.map((tagOption) => (
                                            <option 
                                                key={tagOption.label} 
                                                value={tagOption.label}
                                                disabled={formData.tags.includes(tagOption.label) && tag !== tagOption.label}
                                            >
                                                {tagOption.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm sm:text-base bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
} 