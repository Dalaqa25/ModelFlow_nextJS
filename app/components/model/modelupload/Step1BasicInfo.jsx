import React from 'react';

export default function Step1BasicInfo({ formData, errors, handleInputChange, PRICE_TIERS }) {
  return (
    <div className="transition-all duration-300 ease-in-out">
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="modelName" className="font-semibold text-gray-700">Model Name</label>
        <input
          id="modelName"
          type="text"
          value={formData.modelName}
          onChange={handleInputChange}
          placeholder="Enter model name"
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base ${errors.modelName ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="description" className="font-semibold text-gray-700">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Provide a detailed description of the model"
          rows="3"
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
        ></textarea>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="price" className="font-semibold text-gray-700">Price Tier</label>
        <select
          id="price"
          value={formData.price}
          onChange={handleInputChange}
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
        >
          {PRICE_TIERS.map(tier => (
            <option key={tier.value} value={tier.value}>
              {tier.label} - {tier.description}
            </option>
          ))}
        </select>
        <p className="text-gray-500 text-xs">These price tiers are configured to work with our payment system.</p>
      </div>
    </div>
  );
}
