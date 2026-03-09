'use client';

/**
 * Generic client-side file compressor.
 * Auto-detects file type and applies the appropriate compression strategy:
 *   - Images → Canvas API (resize + quality reduction)
 *   - Videos → MediaRecorder API (re-encode at lower bitrate)
 *   - Other  → Pass through unchanged
 */

import { compressVideo, needsCompression as videoNeedsCompression } from './video-compressor';

// ─── File type detection ──────────────────────────────────────────

const IMAGE_MIMES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/bmp', 'image/tiff', 'image/heic', 'image/heif'
]);

const VIDEO_MIMES = new Set([
    'video/mp4', 'video/quicktime', 'video/webm',
    'video/x-msvideo', 'video/x-matroska', 'video/avi'
]);

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|bmp|tiff?|heic|heif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|avi|mkv)$/i;

function detectFileType(file) {
    const mime = (file.type || '').toLowerCase();
    const name = file.name || '';

    if (IMAGE_MIMES.has(mime) || IMAGE_EXTENSIONS.test(name)) return 'image';
    if (VIDEO_MIMES.has(mime) || VIDEO_EXTENSIONS.test(name)) return 'video';
    return 'other';
}

// ─── Image compression (Canvas API) ──────────────────────────────

/**
 * Compress an image using the Canvas API.
 * Resizes to fit within maxDimension and re-encodes at the given quality.
 */
async function compressImage(file, options = {}) {
    const {
        maxDimension = 1920,    // Max width or height in px
        quality = 0.8,          // Output quality (0-1), applies to JPEG/WebP
        outputFormat = null,    // Force output format ('image/webp', etc.) or null to auto-detect
        onProgress = () => { }
    } = options;

    onProgress(10);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));

        img.onload = () => {
            try {
                onProgress(30);

                let { width, height } = img;

                // Scale down if larger than maxDimension
                if (width > maxDimension || height > maxDimension) {
                    const ratio = Math.min(maxDimension / width, maxDimension / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Draw to canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                onProgress(60);

                // Determine output mime type
                // Convert PNGs without transparency to JPEG for better compression
                // Keep WebP as WebP, and everything else to JPEG
                let outMime = outputFormat;
                if (!outMime) {
                    if (file.type === 'image/webp') {
                        outMime = 'image/webp';
                    } else if (file.type === 'image/png') {
                        // Check if image has transparency (alpha channel)
                        const hasAlpha = checkAlpha(ctx, width, height);
                        outMime = hasAlpha ? 'image/png' : 'image/jpeg';
                    } else {
                        outMime = 'image/jpeg';
                    }
                }

                // Use quality for lossy formats (JPEG, WebP), ignore for PNG
                const useQuality = (outMime === 'image/png') ? undefined : quality;

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas compression failed'));
                            return;
                        }

                        // If compressed version is larger, return original
                        if (blob.size >= file.size) {
                            console.log('[Compressor] Compressed image is larger than original, keeping original');
                            onProgress(100);
                            resolve(file);
                            return;
                        }

                        // Determine file extension
                        const extMap = { 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/png': '.png' };
                        const newExt = extMap[outMime] || '.jpg';
                        const baseName = file.name.replace(/\.[^.]+$/, '');
                        const newName = baseName + newExt;

                        const compressedFile = new File([blob], newName, { type: outMime });

                        console.log('[Compressor] Image compressed:', {
                            original: formatSize(file.size),
                            compressed: formatSize(compressedFile.size),
                            reduction: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%',
                            dimensions: `${width}x${height}`,
                            format: outMime
                        });

                        onProgress(100);
                        resolve(compressedFile);
                    },
                    outMime,
                    useQuality
                );
            } catch (err) {
                reject(err);
            }
        };

        img.src = URL.createObjectURL(file);
    });
}

/**
 * Quick check if an image has any transparent pixels.
 * Samples a grid of pixels rather than checking every single one.
 */
function checkAlpha(ctx, width, height) {
    try {
        // Sample a grid of up to 100 points
        const stepX = Math.max(1, Math.floor(width / 10));
        const stepY = Math.max(1, Math.floor(height / 10));

        for (let x = 0; x < width; x += stepX) {
            for (let y = 0; y < height; y += stepY) {
                const pixel = ctx.getImageData(x, y, 1, 1).data;
                if (pixel[3] < 255) return true;
            }
        }
        return false;
    } catch {
        // If getImageData fails (CORS), assume no alpha
        return false;
    }
}

// ─── Main entry point ────────────────────────────────────────────

/**
 * Compress a file using the best available strategy for its type.
 *
 * @param {File} file - The file to compress
 * @param {Object} options
 * @param {number}   options.targetSizeMB       - Target size for videos (default: 15)
 * @param {number}   options.minSizeToCompress   - Minimum file size in MB to bother compressing (default: 1)
 * @param {number}   options.maxImageDimension   - Max width/height for images in px (default: 1920)
 * @param {number}   options.imageQuality        - JPEG/WebP quality 0-1 (default: 0.8)
 * @param {function} options.onProgress          - Progress callback (0-100)
 * @returns {Promise<{file: File, compressed: boolean, originalSize: number, compressedSize: number}>}
 */
export async function compressFile(file, options = {}) {
    const {
        targetSizeMB = 15,
        minSizeToCompress = 1,
        maxImageDimension = 1920,
        imageQuality = 0.8,
        onProgress = () => { }
    } = options;

    const fileSizeMB = file.size / (1024 * 1024);
    const fileType = detectFileType(file);

    console.log('[Compressor] Processing file:', {
        name: file.name,
        size: formatSize(file.size),
        type: fileType,
        mime: file.type
    });

    // Skip compression for very small files
    if (fileSizeMB <= minSizeToCompress) {
        console.log('[Compressor] File under minimum threshold, skipping');
        onProgress(100);
        return { file, compressed: false, originalSize: file.size, compressedSize: file.size };
    }

    try {
        switch (fileType) {
            case 'image': {
                const compressedFile = await compressImage(file, {
                    maxDimension: maxImageDimension,
                    quality: imageQuality,
                    onProgress
                });
                return {
                    file: compressedFile,
                    compressed: compressedFile !== file,
                    originalSize: file.size,
                    compressedSize: compressedFile.size
                };
            }

            case 'video': {
                if (!videoNeedsCompression(file, Math.min(targetSizeMB, 5))) {
                    console.log('[Compressor] Video under target, skipping compression');
                    onProgress(100);
                    return { file, compressed: false, originalSize: file.size, compressedSize: file.size };
                }

                const compressedBlob = await compressVideo(file, {
                    targetSizeMB,
                    minSizeToCompress: Math.min(targetSizeMB, 5),
                    onProgress
                });

                const compressedFile = new File([compressedBlob], file.name, {
                    type: compressedBlob.type || file.type || 'video/mp4'
                });

                return {
                    file: compressedFile,
                    compressed: compressedFile.size < file.size,
                    originalSize: file.size,
                    compressedSize: compressedFile.size
                };
            }

            default: {
                // No browser-native compression available for this type
                console.log('[Compressor] No compression strategy for type:', fileType);
                onProgress(100);
                return { file, compressed: false, originalSize: file.size, compressedSize: file.size };
            }
        }
    } catch (err) {
        console.warn('[Compressor] Compression failed, using original:', err.message);
        onProgress(100);
        return { file, compressed: false, originalSize: file.size, compressedSize: file.size };
    }
}

// ─── Utilities ───────────────────────────────────────────────────

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
