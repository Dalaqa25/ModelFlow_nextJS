import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function Step2Details({
  tags, predefinedTags, features, use_cases, errors,
  handleTagToggle, handleChange, addFeature, removeFeature,
  handleUseCaseChange, addUseCase, removeUseCase,
  formData, handleInputChange, handleNext, handleBack
}) {
  return (
    <div className="transition-all duration-300 ease-in-out">
      {/* Tags */}
      <div className="flex flex-col gap-3 mb-6">
        <label className="font-semibold text-slate-300">Tags</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ease-out transform scale-100 opacity-100"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="ml-2 text-purple-400 hover:text-red-400 focus:outline-none transition-colors duration-200"
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
              className={`px-4 py-2 rounded-full border transition-all duration-200 text-slate-300 border-slate-600/50 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/30 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm font-medium ${
                tags.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={tags.length >= 2}
            >
              {tag}
            </button>
          ))}
        </div>
        {errors.tags && <p className="text-red-400 text-sm">{errors.tags}</p>}
      </div>
      
      {/* Features */}
      <div className="flex flex-col gap-3 mb-6">
        <label className="font-semibold text-slate-300">Features</label>
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3 mb-2">
            <input
              type="text"
              value={feature}
              onChange={e => handleChange(index, e.target.value)}
              placeholder={`Feature #${index + 1}`}
              className={`flex-grow px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400 transition-all duration-200 hover:border-slate-500 ${
                errors.features && !feature.trim() ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {features.length > 1 && (
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="p-3 text-red-400 bg-red-500/20 rounded-xl hover:text-red-300 hover:bg-red-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                title="Remove Feature"
              >
                <FaTrash size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addFeature}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium self-start mt-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          <FaPlus size={16} /> Add Another Feature
        </button>
        {errors.features && <p className="text-red-400 text-sm">{errors.features}</p>}
      </div>
      
      {/* Use Cases */}
      <div className="flex flex-col gap-3 mb-6">
        <label className="font-semibold text-slate-300">Use Cases</label>
        {use_cases.map((uc, idx) => (
          <div key={idx} className="flex items-center gap-3 mb-2">
            <input
              type="text"
              value={uc}
              onChange={e => handleUseCaseChange(idx, e.target.value)}
              placeholder={`Case #${idx + 1}`}
              className={`flex-grow px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400 transition-all duration-200 hover:border-slate-500 ${
                errors.use_cases && !uc.trim() ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {use_cases.length > 1 && (
              <button
                type="button"
                onClick={() => removeUseCase(idx)}
                className="p-3 text-red-400 bg-red-500/20 rounded-xl hover:text-red-300 hover:bg-red-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                <FaTrash size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addUseCase}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium self-start mt-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          <FaPlus size={16} /> Add Another Use Case
        </button>
        {errors.use_cases && <p className="text-red-400 text-sm">{errors.use_cases}</p>}
      </div>
      
      {/* Setup Instructions */}
      <div className="flex flex-col gap-3 mb-6">
        <label htmlFor="setup" className="font-semibold text-slate-300">Setup Instructions</label>
        <textarea
          id="setup"
          value={formData.setup}
          onChange={handleInputChange}
          placeholder="Describe how to set up or use the model"
          rows={3}
          className={`px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400 resize-none transition-all duration-200 hover:border-slate-500 ${
            errors.setup ? 'border-red-500 focus:ring-red-500' : ''
          }`}
        />
        {errors.setup && <p className="text-red-400 text-sm">{errors.setup}</p>}
      </div>

      <div className="flex justify-between mt-8">
        <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
        >
            Back
        </button>
        <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold hover:from-purple-700 hover:to-violet-600 transition-colors"
        >
            Next
        </button>
      </div>
    </div>
  );
}