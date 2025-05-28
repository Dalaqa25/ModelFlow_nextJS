'use client';
import { useState } from 'react';
import { FaCloudUploadAlt, FaPlus, FaTrash } from 'react-icons/fa';

export default function ModelUpload() {
const [features, setFeatures] = useState(['']);

  const handleChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const addFeature = () => setFeatures([...features, '']);
  const removeFeature = (index) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated);
  };
    return (
            <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-xl m-auto p-6 bg-white rounded-2xl">
                  <h2 className="text-2xl font-semibold text-center mb-3">Upload Your Model</h2>
                  <form className="space-y-6 overflow-y-auto max-h-[80vh]">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="modelName" className="font-medium text-gray-700">Model Name</label>
                      <input
                        id="modelName"
                        type="text"
                        placeholder="Enter model name"
                        required
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
            
                    <div className="flex flex-col gap-2">
                      <label htmlFor="description" className="font-medium text-gray-700">Description</label>
                      <textarea
                        id="description"
                        rows={4}
                        placeholder="Write a brief description..."
                        required
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="useCases" className="font-medium text-gray-700">Use cases</label>
                      <textarea
                        id="useCases"
                        rows={2}
                        placeholder="Write use cases..."
                        required
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
            
                    <div className="flex flex-col gap-2">
                      <label htmlFor="tags" className="font-medium text-gray-700">Tags</label>
                      <input
                        id="tags"
                        type="text"
                        placeholder="e.g., NLP, Vision, Transformer"
                        required
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
            
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-violet-400 rounded-xl p-8 text-center cursor-pointer hover:bg-violet-50 transition">
                      <label htmlFor="model-upload" className="flex flex-col items-center w-full cursor-pointer">
                        <FaCloudUploadAlt size={40} className="text-violet-500 mb-3" />
                        <p className="text-sm text-gray-600">Click or drag file to upload model</p>
                        <input
                          id="model-upload"
                          type="file"
                          className="hidden"
                          required
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-medium text-gray-700">Key Features</label>
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={feature}
                                onChange={(e) => handleChange(index, e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                        <button
                            type="button"
                            onClick={addFeature}
                            className="mt-2 text-sm text-violet-600 flex items-center gap-1 hover:underline"
                        >
                            <FaPlus /> Add Feature
                        </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-lg transition"
                    >
                      Upload Model
                    </button>
             </form>
    </div>
    )
}