'use client';
import { useState } from 'react';
import { FaCloudUploadAlt, FaPlus, FaTrash } from 'react-icons/fa';

export default function ModelUpload() {
    const [features, setFeatures] = useState(['']);
    const [tags, setTags] = useState(['']); // Add tags state
    const [formData, setFormData] = useState({
        modelName: '',
        description: '',
        useCases: '',
        modelFile: null
    });
    const [errors, setErrors] = useState({});

    // Add tag handlers
    const handleTagChange = (index, value) => {
        const updated = [...tags];
        updated[index] = value.toUpperCase(); // Capitalize tags
        setTags(updated);
    };

    // Update addTag to check for maximum limit
    const addTag = () => {
        if (tags.length < 2) {
            setTags([...tags, '']);
        }
    };

    const removeTag = (index) => {
        if (tags.length > 1) {
            const updated = tags.filter((_, i) => i !== index);
            setTags(updated);
        }
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
            [id]: value
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

    // Update validateForm to include tags validation
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
        
        if (tags.some(tag => !tag.trim())) {
            newErrors.tags = 'All tags must be filled out';
        }
        
        if (!formData.modelFile) {
            newErrors.modelFile = 'Model file is required';
        }
        
        if (features.some(feature => !feature.trim())) {
            newErrors.features = 'All features must be filled out';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Update handleSubmit to include tags
    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Process form submission
            console.log('Form submitted:', { ...formData, features, tags });
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
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Write a brief description..."
                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.description && (
                        <p className="text-red-500 text-sm">{errors.description}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="useCases" className="font-medium text-gray-700">
                        Use cases <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="useCases"
                        rows={2}
                        value={formData.useCases}
                        onChange={handleInputChange}
                        placeholder="Write use cases..."
                        className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                            errors.useCases ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.useCases && (
                        <p className="text-red-500 text-sm">{errors.useCases}</p>
                    )}
                </div>

                <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-violet-50 transition ${
                    errors.modelFile ? 'border-red-500' : 'border-violet-400'
                }`}>
                    <label htmlFor="model-upload" className="flex flex-col items-center w-full cursor-pointer">
                        <FaCloudUploadAlt size={40} className={errors.modelFile ? 'text-red-500' : 'text-violet-500'} />
                        <p className="text-sm text-gray-600 mb-2">Click or drag ZIP file to upload model <span className="text-red-500">*</span></p>
                        <div className="space-y-1.5">
                            <p className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded-lg">
                                Make sure your ZIP does not contain executable or script files
                            </p>
                            <p className="text-xs text-gray-500">
                                Maximum file size: <span className="font-medium">100MB</span>
                            </p>
                        </div>
                        <input
                            id="model-upload"
                            type="file"
                            onChange={handleFileChange}
                            accept=".zip"
                            className="hidden"
                        />
                    </label>
                    {formData.modelFile && (
                        <p className="text-sm text-green-600 mt-2">
                            Selected file: {formData.modelFile.name} ({(formData.modelFile.size / (1024 * 1024)).toFixed(2)}MB)
                        </p>
                    )}
                    {errors.modelFile && (
                        <p className="text-red-500 text-sm mt-2">{errors.modelFile}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">
                        Key Features <span className="text-red-500">*</span>
                    </label>
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={feature}
                                onChange={(e) => handleChange(index, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                    errors.features ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={`Feature ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    {errors.features && (
                        <p className="text-red-500 text-sm">{errors.features}</p>
                    )}
                    <button
                        type="button"
                        onClick={addFeature}
                        className="mt-2 text-sm text-violet-600 flex items-center gap-1 hover:underline"
                    >
                        <FaPlus /> Add Feature
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="font-medium text-gray-700">
                        Tags <span className="text-red-500">*</span>
                        <span className="text-sm text-gray-500 ml-2">(Maximum 2)</span>
                    </label>
                    {tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => handleTagChange(index, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                    errors.tags ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={`Tag ${index + 1} (e.g., NLP, VISION)`}
                            />
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    {errors.tags && (
                        <p className="text-red-500 text-sm">{errors.tags}</p>
                    )}
                    {tags.length < 2 && (
                        <button
                            type="button"
                            onClick={addTag}
                            className="mt-2 text-sm text-violet-600 flex items-center gap-1 hover:underline"
                        >
                            <FaPlus /> Add Tag
                        </button>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-lg transition"
                >
                    Upload Model
                </button>
            </form>
        </div>
    );
}