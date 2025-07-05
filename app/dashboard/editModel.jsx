'use client';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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

// Predefined price tiers that match Lemon Squeezy variants
const PRICE_TIERS = [
    { value: 500, label: '$5.00', description: 'Basic tier' },
    { value: 1000, label: '$10.00', description: 'Standard tier' },
    { value: 1500, label: '$15.00', description: 'Premium tier' },
    { value: 2000, label: '$20.00', description: 'Professional tier' },
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
                    price: parseInt(formData.price) || 500,
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

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-100/30 backdrop-blur-md bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                                            Edit Model
                                        </Dialog.Title>
                                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                                                <label htmlFor="price" className="text-sm sm:text-base font-medium text-gray-700">Price Tier</label>
                                                <select
                                                    id="price"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                                                    className="mt-1 w-full p-2 border-2 rounded-lg border-gray-300 text-sm sm:text-base focus:outline-none focus:border-violet-500"
                                                >
                                                    {PRICE_TIERS.map(tier => (
                                                        <option key={tier.value} value={tier.value}>
                                                            {tier.label} - {tier.description}
                                                        </option>
                                                    ))}
                                                </select>
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
} 