import React from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';

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
  handleFileChange
}) {
  return (
    <div className="transition-all duration-300 ease-in-out">
      <div
        className={`flex flex-col items-center justify-center border-2 ${dragActive ? 'border-purple-400 bg-purple-50' : 'border-dashed border-purple-300 bg-purple-50'} rounded-2xl p-8 text-center relative transition-colors duration-200 cursor-pointer min-h-[260px]`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        style={{ outline: dragActive ? '2px solid #a78bfa' : 'none' }}
      >
        <FaCloudUploadAlt className="mx-auto mb-4 text-5xl text-purple-500" />
        <p className="text-lg font-medium text-gray-700 mb-2">You can drag and drop your ZIP file to upload</p>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleBrowseClick(); }}
          className="mt-2 px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition-colors"
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
          <div className="mt-4 text-sm text-gray-600">
            Selected file: <span className="font-semibold text-gray-800">{formData.modelFile.name}</span>
          </div>
        )}
        {errors.modelFile && <p className="text-red-500 text-sm mt-2">{errors.modelFile}</p>}
        {storageLoading ? (
          <p className="text-gray-400 text-xs mt-1 animate-pulse">Loading file size limit...</p>
        ) : (
          <p className="text-gray-500 text-xs mt-1">Max file size: <span className='font-semibold text-purple-600'>{getMaxFileSize().maxFileSizeStr} (ZIP only)</span></p>
        )}
      </div>
    </div>
  );
}
