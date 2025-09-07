'use client';

export default function EmailInput({ value, onChange, validationErrors }) {
  const getBorderColor = () => {
    return validationErrors?.length > 0 ? 'border-red-500' : 'border-slate-600/50';
  };

  return (
    <div>
      <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className={`w-full px-3 sm:px-4 py-3 sm:py-3 bg-slate-700/50 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 text-sm sm:text-base touch-manipulation ${getBorderColor()}`}
        placeholder="Enter your email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {validationErrors?.length > 0 && (
        <div className="mt-1 text-xs sm:text-sm text-red-400">
          {validationErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}