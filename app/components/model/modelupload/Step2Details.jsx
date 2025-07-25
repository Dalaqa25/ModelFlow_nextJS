import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function Step2Details({
  tags, predefinedTags, features, useCases, errors,
  handleTagToggle, handleChange, addFeature, removeFeature,
  handleUseCaseChange, addUseCase, removeUseCase,
  formData, handleInputChange
}) {
  return (
    <div className="transition-all duration-300 ease-in-out">
      {/* Tags */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="font-semibold text-gray-700">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center bg-purple-100 text-purple-700 border border-purple-300 rounded-full px-3 py-1 text-sm font-medium mr-1 transition-all duration-200 ease-out transform scale-100 opacity-100"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="ml-2 text-purple-500 hover:text-red-500 focus:outline-none"
                title="Remove tag"
              >
                ×
              </button>
            </span>
          ))}
          {predefinedTags.filter(tag => !tags.includes(tag)).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              className={`px-4 py-2 rounded-full border transition-all duration-200 text-gray-700 border-gray-300 hover:bg-purple-50 hover:text-purple-700 focus:ring-2 focus:ring-purple-300 text-sm font-medium ${tags.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={tags.length >= 2}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      {/* Features */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="font-semibold text-gray-700">Features</label>
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <input
              type="text"
              value={feature}
              onChange={e => handleChange(index, e.target.value)}
              placeholder={`Feature #${index + 1}`}
              className={`flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base transition-shadow duration-150 ${errors.features && !feature.trim() ? 'border-red-500' : 'border-gray-300'} hover:shadow-md`}
            />
            {features.length > 1 && (
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200 focus:ring-2 focus:ring-red-300"
                title="Remove Feature"
              >
                <FaTrash size={20} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addFeature}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium self-start mt-2 transition-colors duration-200 focus:ring-2 focus:ring-purple-300"
        >
          <FaPlus size={16} /> Add Another Feature
        </button>
      </div>
      {/* Use Cases */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="font-semibold text-gray-700">Use Cases</label>
        {useCases.map((uc, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1">
            <input
              type="text"
              value={uc}
              onChange={e => handleUseCaseChange(idx, e.target.value)}
              placeholder={`Case #${idx + 1}`}
              className={`flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base ${errors.useCases && !uc.trim() ? 'border-red-500' : 'border-gray-300'}`}
            />
            {useCases.length > 1 && (
              <button
                type="button"
                onClick={() => removeUseCase(idx)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200"
              >
                <FaTrash size={20} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addUseCase}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium self-start mt-2"
        >
          <FaPlus size={16} /> Add Another Use Case
        </button>
      </div>
      {/* Setup Instructions */}
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="setup" className="font-semibold text-gray-700">Setup Instructions</label>
        <textarea
          id="setup"
          value={formData.setup}
          onChange={handleInputChange}
          placeholder="Describe how to set up or use the model"
          rows={3}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base ${errors.setup ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.setup && <p className="text-red-500 text-xs">{errors.setup}</p>}
      </div>
    </div>
  );
}
