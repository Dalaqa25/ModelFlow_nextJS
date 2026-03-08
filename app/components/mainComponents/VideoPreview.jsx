'use client';

import { useState } from 'react';
import { FiPlay, FiX, FiDownload } from 'react-icons/fi';

export default function VideoPreview({ fileName, previewUrl, expiresIn, isDarkMode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Preview Button */}
      <div
        className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all cursor-pointer group ${
          isDarkMode
            ? 'bg-slate-800/60 border-purple-500/30 hover:border-purple-500/60 hover:bg-slate-800/80'
            : 'bg-white/80 border-purple-300/40 hover:border-purple-400/70 hover:bg-white/95'
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
            isDarkMode
              ? 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30'
              : 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
          }`}
        >
          <FiPlay className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div
            className={`font-medium ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            {fileName}
          </div>
          <div
            className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            Click to preview • Expires in {Math.floor(expiresIn / 60)} minutes
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-slate-700/50 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
          title="Download"
        >
          <FiDownload className="w-5 h-5" />
        </button>
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-white">{fileName}</h3>
                <p className="text-sm text-gray-400">
                  Preview expires in {Math.floor(expiresIn / 60)} minutes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
                  title="Download"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
                  title="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
              <video
                src={previewUrl}
                controls
                autoPlay
                className="w-full h-full"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
