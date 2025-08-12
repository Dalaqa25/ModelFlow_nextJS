import React from 'react';

export default function Step1BasicInfo({ formData, errors, handleInputChange, PRICE_TIERS }) {
  return (
    <div className="transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-3 mb-6">
        <label htmlFor="modelName" className="font-semibold text-slate-300">Model Name</label>
        <input
          id="modelName"
          type="text"
          value={formData.modelName}
          onChange={handleInputChange}
          placeholder="Enter model name"
          className={`px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400 transition-all duration-200 ${
            errors.modelName ? 'border-red-500 focus:ring-red-500' : 'hover:border-slate-500'
          }`}
        />
        {errors.modelName && <p className="text-red-400 text-sm">{errors.modelName}</p>}
      </div>
      
      <div className="flex flex-col gap-3 mb-6">
        <label htmlFor="description" className="font-semibold text-slate-300">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide a detailed description of the model"
          rows="3"
          className={`px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder:text-slate-400 resize-none transition-all duration-200 ${
            errors.description ? 'border-red-500 focus:ring-red-500' : 'hover:border-slate-500'
          }`}
        />
        {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
      </div>
      
      <div className="flex flex-col gap-3 mb-6">
        <label htmlFor="price" className="font-semibold text-slate-300">Price Tier</label>
        <select
          id="price"
          value={formData.price}
          onChange={handleInputChange}
          className={`px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-200 ${
            errors.price ? 'border-red-500 focus:ring-red-500' : 'hover:border-slate-500'
          }`}
        >
          {PRICE_TIERS.map(tier => (
            <option key={tier.value} value={tier.value} className="bg-slate-700 text-white">
              {tier.label} - {tier.description}
            </option>
          ))}
        </select>
        <p className="text-slate-400 text-xs">These price tiers are configured to work with our payment system.</p>
        {errors.price && <p className="text-red-400 text-sm">{errors.price}</p>}
      </div>
    </div>
  );
}
