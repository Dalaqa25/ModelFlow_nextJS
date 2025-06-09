'use client';
import { useState } from 'react';
import { FaCloudUploadAlt, FaPlus, FaTrash, FaGoogleDrive } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ModelUpload({ onUploadSuccess }) {
    const router = useRouter();
    const [uploadType, setUploadType] = useState('zip'); // 'zip' or 'drive'
    const [features, setFeatures] = useState(['']);
    const [tags, setTags] = useState([]); // Initialize tags as empty array for multi-selection
    const [formData, setFormData] = useState({
        modelName: '',
        description: '',
        useCases: '',
        modelFile: null,
        driveLink: '',
        price: 0, // Add price to form data
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const predefinedTags = [
        "NLP",
        "Computer Vision",
        "Chatbot",
        "Image Generation",
        "Translation",
    ];

    // Tag selection handler
    const handleTagToggle = (tagLabel) => {
        setTags(prevTags => {
            if (prevTags.includes(tagLabel)) {
                // Deselect tag
                return prevTags.filter(t => t !== tagLabel);
            } else {
                // Select tag, but only if less than 2 are already selected
                if (prevTags.length < 2) {
                    return [...prevTags, tagLabel];
                }
                return prevTags; // Do not add if 2 tags are already selected
            }
        });
    };

    const handleChange = (index, value) => {
        const updated = [...features];
        updated[index] = value;
        setFeatures(updated);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === 'price' ? parseFloat(value) : value // Parse price as float
        }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors(prev => ({
                ...prev,
                [id]: ''
            }));
        }
    };

    // Update handleFileChange function
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes

        if (file) {
            if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
                if (file.size > maxSize) {
                    setErrors(prev => ({
                        ...prev,
                        modelFile: 'File size must be less than 100MB'
                    }));
                    e.target.value = '';
                    return;
                }
                setFormData(prev => ({
                    ...prev,
                    modelFile: file
                }));
                setErrors(prev => ({
                    ...prev,
                    modelFile: ''
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    modelFile: 'Only ZIP files are allowed'
                }));
                e.target.value = '';
            }
        }
    };

    const handleDriveLinkChange = (e) => {
        const link = e.target.value;
        setFormData(prev => ({
            ...prev,
            driveLink: link
        }));
        // Basic Google Drive link validation
        if (link && !link.includes('drive.google.com')) {
            setErrors(prev => ({
                ...prev,
                driveLink: 'Please enter a valid Google Drive link'
            }));
        } else {
            setErrors(prev => ({
                ...prev,
                driveLink: ''
            }));
        }
    };

    // Update validateForm to include tags and price validation
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.modelName.trim()) {
            newErrors.modelName = 'Model name is required';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        
        if (!formData.useCases.trim()) {
            newErrors.useCases = 'Use cases are required';
        }
        
        // Validate tags
        if (tags.length === 0) {
            newErrors.tags = 'At least one tag is required';
        }
        if (tags.length > 2) {
            newErrors.tags = 'You can select a maximum of 2 tags';
        }

        // Validate price
        if (formData.price < 0) {
            newErrors.price = 'Price cannot be negative';
        }

        
        if (uploadType === 'zip' && !formData.modelFile) {
            newErrors.modelFile = 'Model file is required';
        }
        
        if (uploadType === 'drive' && !formData.driveLink) {
            newErrors.driveLink = 'Google Drive link is required';
        }
        
        if (features.some(feature => !feature.trim())) {
            newErrors.features = 'All features must be filled out';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Update handleSubmit to handle both upload types
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.modelName);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('useCases', formData.useCases);
            formDataToSend.append('features', features.join(','));
            formDataToSend.append('tags', JSON.stringify(tags)); // Send selected tags
            formDataToSend.append('price', formData.price);
            
            formDataToSend.append('uploadType', uploadType);
            
            if (uploadType === 'zip' && formData.modelFile) {
                formDataToSend.append('modelFile', formData.modelFile);
            } else if (uploadType === 'drive') {
                formDataToSend.append('driveLink', formData.driveLink);
            }

            const response = await fetch('/api/models', {
                method: 'POST',
                body: formDataToSend,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload model');
            }

            toast.success('Model uploaded successfully!');
            onUploadSuccess(); // Call the callback to refresh models in dashboard
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to upload model. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addFeature = () => {
        setFeatures([...features, '']);
    };

    const removeFeature = (index) => {
        if (features.length > 1) {
            const updated = features.filter((_, i) => i !== index);
            setFeatures(updated);
        }
    };

    return (
        <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-xl m-auto p-6 bg-white rounded-2xl">
            <h2 className="text-2xl font-semibold text-center mb-3">Upload Your Model</h2>
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[80vh]">
                <div className="flex flex-col gap-2">
                    <label htmlFor="modelName" className="font-medium text-gray-700">
                        Model Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="modelName"
                        type="text"
                        value={formData.modelName}
                        onChange={handleInputChange}
                        placeholder="Enter model name"
                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            errors.modelName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.modelName && (
                        <p className="text-red-500 text-sm">{errors.modelName}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="font-medium text-gray-700">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Provide a detailed description of the model"
                        rows="4"
                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                    ></textarea>
                    {errors.description && (
                        <p className="text-red-500 text-sm">{errors.description}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="useCases" className="font-medium text-gray-700">
                        Use Cases <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="useCases"
                        value={formData.useCases}
                        onChange={handleInputChange}
                        placeholder="Describe potential applications and use cases"
                        rows="4"
                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            errors.useCases ? 'border-red-500' : 'border-gray-300'
                        }`}
                    ></textarea>
                    {errors.useCases && (
                        <p className="text-red-500 text-sm">{errors.useCases}</p>
                    )}
                </div>

                {/* Features Section */}
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Features <span className="text-red-500">*</span></label>
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={feature}
                                onChange={(e) => handleChange(index, e.target.value)}
                                placeholder="e.g., Real-time processing"
                                className={`flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                    errors.features && !feature.trim() ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {features.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200"
                                >
                                    <FaTrash size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addFeature}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium self-start mt-2"
                    >
                        <FaPlus size={16} /> Add Another Feature
                    </button>
                    {errors.features && (
                        <p className="text-red-500 text-sm">{errors.features}</p>
                    )}
                </div>

                {/* Tags Selection */}
                <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">Tags <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2">
                        {predefinedTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagToggle(tag)}
                                className={`px-4 py-2 rounded-full border transition-all duration-200
                                    ${tags.includes(tag)
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    {errors.tags && (
                        <p className="text-red-500 text-sm">{errors.tags}</p>
                    )}
                </div>

                {/* Price Input */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="price" className="font-medium text-gray-700">
                        Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Enter price (e.g., 29.99)"
                        min="0"
                        step="0.01"
                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.price && (
                        <p className="text-red-500 text-sm">{errors.price}</p>
                    )}
                </div>

                {/* File Upload / Drive Link Section */}
                <div className="flex flex-col gap-4">
                    <label className="font-medium text-gray-700">Model File <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setUploadType('zip')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200
                                ${uploadType === 'zip' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                            `}
                        >
                            <FaCloudUploadAlt size={20} /> Upload ZIP
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadType('drive')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200
                                ${uploadType === 'drive' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                            `}
                        >
                            <FaGoogleDrive size={20} /> Google Drive
                        </button>
                    </div>

                    {uploadType === 'zip' && (
                        <div className="flex flex-col gap-2">
                            <input
                                id="modelFile"
                                type="file"
                                onChange={handleFileChange}
                                accept=".zip,.rar"
                                className={`block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-purple-50 file:text-purple-700
                                    hover:file:bg-purple-100
                                    ${errors.modelFile ? 'border-red-500' : ''}
                                `}
                            />
                            {errors.modelFile && (
                                <p className="text-red-500 text-sm">{errors.modelFile}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">Max file size: 100MB (ZIP only)</p>
                        </div>
                    )}

                    {uploadType === 'drive' && (
                        <div className="flex flex-col gap-2">
                            <input
                                id="driveLink"
                                type="url"
                                value={formData.driveLink}
                                onChange={handleInputChange}
                                placeholder="Enter Google Drive shareable link"
                                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                    errors.driveLink ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.driveLink && (
                                <p className="text-red-500 text-sm">{errors.driveLink}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">Ensure the link is publicly accessible or shared with required permissions.</p>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Uploading...' : 'Upload Model'}
                </button>
            </form>
        </div>
    );
}