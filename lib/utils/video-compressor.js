'use client';

/**
 * Simple video compression using browser's native MediaRecorder API
 * No external dependencies, works in all modern browsers
 */

/**
 * Compress a video file using MediaRecorder API
 * @param {File} file - The video file to compress
 * @param {Object} options - Compression options
 * @param {number} options.targetSizeMB - Target size in MB (default: 15)
 * @param {number} options.minSizeToCompress - Minimum size to trigger compression in MB (default: 5)
 * @param {function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Compressed video as Blob
 */
export async function compressVideo(file, options = {}) {
  const {
    targetSizeMB = 15, // Target 15MB to save storage
    minSizeToCompress = 5, // Compress anything over 5MB
    onProgress = () => { }
  } = options;

  const fileSizeMB = file.size / (1024 * 1024);

  // If file is already small enough, return as-is
  if (fileSizeMB <= minSizeToCompress) {
    console.log('[Compression] File under minimum threshold, skipping compression');
    onProgress(100);
    return file;
  }

  // If file is already smaller than target, return as-is
  if (fileSizeMB <= targetSizeMB) {
    console.log('[Compression] File already under target size, skipping compression');
    onProgress(100);
    return file;
  }

  console.log('[MediaRecorder] Starting compression:', {
    fileName: file.name,
    originalSize: formatFileSize(file.size),
    targetSize: `${targetSizeMB} MB`
  });

  onProgress(5);

  return new Promise((resolve, reject) => {
    // Create video element to load the file
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = false; // Keep audio
    video.playsInline = true;

    video.onerror = () => {
      reject(new Error('Failed to load video file'));
    };

    video.onloadedmetadata = () => {
      try {
        onProgress(10);

        console.log('[MediaRecorder] Video loaded:', {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration.toFixed(2) + 's'
        });

        // Calculate target bitrate based on target size and duration
        // Formula: bitrate = (targetSize * 8) / duration (in bits per second)
        const targetSizeBytes = targetSizeMB * 1024 * 1024 * 0.85; // 85% of target to be safe
        const targetBitrate = Math.floor((targetSizeBytes * 8) / video.duration);

        console.log('[MediaRecorder] Target bitrate:', (targetBitrate / 1000000).toFixed(2) + ' Mbps');

        // Determine best supported MIME type
        let mimeType;
        const types = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];

        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }

        if (!mimeType) {
          reject(new Error('No supported video format found'));
          return;
        }

        console.log('[MediaRecorder] Using format:', mimeType);

        // Check if browser supports captureStream (Chrome, Firefox)
        const supportsCaptureStream = video.captureStream || video.mozCaptureStream;

        if (supportsCaptureStream) {
          // Use direct stream capture (faster, better quality)
          compressWithCaptureStream();
        } else {
          // Fallback to Canvas method (Safari)
          compressWithCanvas();
        }

        function compressWithCaptureStream() {
          video.play().then(() => {
            onProgress(20);

            // Capture stream from video element
            const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();

            // Create MediaRecorder with calculated bitrate
            const recorder = new MediaRecorder(stream, {
              mimeType,
              videoBitsPerSecond: targetBitrate,
              audioBitsPerSecond: 128000 // 128 kbps audio
            });

            const chunks = [];

            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.push(e.data);
              }
            };

            recorder.onstop = () => {
              const compressedBlob = new Blob(chunks, { type: mimeType });

              console.log('[MediaRecorder] Compression complete:', {
                originalSize: formatFileSize(file.size),
                compressedSize: formatFileSize(compressedBlob.size),
                reduction: ((1 - compressedBlob.size / file.size) * 100).toFixed(1) + '%'
              });

              // Cleanup
              URL.revokeObjectURL(video.src);
              video.remove();

              onProgress(100);
              resolve(compressedBlob);
            };

            recorder.onerror = (e) => {
              console.error('[MediaRecorder] Error:', e);
              reject(new Error('Compression failed'));
            };

            // Update progress during recording
            video.ontimeupdate = () => {
              const progress = 20 + (video.currentTime / video.duration) * 75;
              onProgress(Math.round(progress));
            };

            // Stop recording when video ends
            video.onended = () => {
              recorder.stop();
            };

            // Start recording
            recorder.start();

          }).catch(err => {
            reject(new Error(`Failed to play video: ${err.message}`));
          });
        }

        function compressWithCanvas() {
          // Safari fallback: Use Canvas to capture frames
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');

          video.play().then(() => {
            onProgress(20);

            // Capture stream from canvas at 30fps
            const stream = canvas.captureStream(30);

            // Create MediaRecorder
            const recorder = new MediaRecorder(stream, {
              mimeType,
              videoBitsPerSecond: targetBitrate,
              audioBitsPerSecond: 128000
            });

            const chunks = [];

            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.push(e.data);
              }
            };

            recorder.onstop = () => {
              const compressedBlob = new Blob(chunks, { type: mimeType });

              console.log('[MediaRecorder] Compression complete:', {
                originalSize: formatFileSize(file.size),
                compressedSize: formatFileSize(compressedBlob.size),
                reduction: ((1 - compressedBlob.size / file.size) * 100).toFixed(1) + '%'
              });

              // Cleanup
              URL.revokeObjectURL(video.src);
              video.remove();
              canvas.remove();

              onProgress(100);
              resolve(compressedBlob);
            };

            recorder.onerror = (e) => {
              console.error('[MediaRecorder] Error:', e);
              reject(new Error('Compression failed'));
            };

            // Draw video frames to canvas
            function drawFrame() {
              if (video.paused || video.ended) {
                recorder.stop();
                return;
              }
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawFrame);
            }

            // Update progress
            video.ontimeupdate = () => {
              const progress = 20 + (video.currentTime / video.duration) * 75;
              onProgress(Math.round(progress));
            };

            // Stop recording when video ends
            video.onended = () => {
              recorder.stop();
            };

            // Start recording and drawing
            recorder.start();
            drawFrame();

          }).catch(err => {
            reject(new Error(`Failed to play video: ${err.message}`));
          });
        }

      } catch (error) {
        console.error('[MediaRecorder] Setup error:', error);
        reject(error);
      }
    };

    // Load the video file
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Check if a file needs compression
 * @param {File} file 
 * @param {number} minSizeMB - Minimum size to compress (default: 5)
 * @returns {boolean}
 */
export function needsCompression(file, minSizeMB = 5) {
  return file.size > minSizeMB * 1024 * 1024;
}

/**
 * Format file size for display
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
