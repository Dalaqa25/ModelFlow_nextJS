import React from 'react';
import { FaCloudUploadAlt, FaTimes, FaFile } from 'react-icons/fa';

export default function Step3FileUpload({
  dragActive,
  formData,
  errors,
  storageLoading,
  getMaxFileSize,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleBrowseClick,
  handleFileChange,
  removeFile,
  isSubmitting,
  handleBack
}) {
  return (
    <div className="transition-all duration-300 ease-in-out">
      <div
        className={`flex flex-col items-center justify-center border-2 ${
          errors.modelFile
            ? 'border-red-500/80 bg-red-500/10'
            : dragActive 
              ? 'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/25' 
              : 'border-dashed border-slate-600/50 bg-slate-700/30'
        } rounded-2xl p-8 text-center relative transition-all duration-200 cursor-pointer min-h-[260px] hover:border-slate-500 hover:bg-slate-700/40`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        style={{ outline: dragActive ? '2px solid #a78bfa' : 'none' }}
      >
        <FaCloudUploadAlt className={`mx-auto mb-4 text-5xl transition-colors duration-200 ${
          errors.modelFile ? 'text-red-400' : dragActive ? 'text-purple-400' : 'text-slate-400'
        }`} />
        
        <p className="text-lg font-medium text-slate-300 mb-2">
          {dragActive ? 'Drop your ZIP file here' : 'You can drag and drop your ZIP file to upload'}
        </p>
        
        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleBrowseClick(); }}
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          Browse Computer
        </button>
        
        <input
          id="modelFile"
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".zip,.rar"
          className="hidden"
        />
        
        {formData.modelFile && (
          <div className="mt-4 p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <FaFile className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate" title={formData.modelFile.name}>
                    {formData.modelFile.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {(formData.modelFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="ml-3 p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex-shrink-0"
                title="Remove file"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {errors.modelFile && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{errors.modelFile}</p>
          </div>
        )}
        
        {storageLoading ? (
          <div className="mt-4 flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Loading file size limit...</p>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl">
            <p className="text-slate-400 text-xs">
              Max file size: <span className="font-semibold text-purple-400">{getMaxFileSize().maxFileSizeStr} (ZIP only)</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
        >
            Back
        </button>
        <button
          type="submit"
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold shadow-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !formData.modelFile}
        >
          {isSubmitting ? 'Uploading...' : 'Publish Model'}
        </button>
      </div>
    </div>
  );
}
