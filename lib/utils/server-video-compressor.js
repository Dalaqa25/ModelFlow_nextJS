import ffmpeg from 'fluent-ffmpeg';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Compress a video file on the server using FFmpeg
 * @param {Buffer} fileBuffer - The video file buffer
 * @param {string} originalName - Original filename
 * @param {Object} options - Compression options
 * @param {number} options.targetSizeMB - Target size in MB (default: 40)
 * @returns {Promise<{buffer: Buffer, size: number}>}
 */
export async function compressVideoServer(fileBuffer, originalName, options = {}) {
  const { targetSizeMB = 40 } = options;
  
  const inputPath = join(tmpdir(), `input_${Date.now()}_${originalName}`);
  const outputPath = join(tmpdir(), `output_${Date.now()}.mp4`);

  try {
    console.log('[Server Compression] Starting:', {
      originalSize: (fileBuffer.length / (1024 * 1024)).toFixed(2) + 'MB',
      targetSize: targetSizeMB + 'MB'
    });

    // Write input file to temp directory
    await writeFile(inputPath, fileBuffer);

    // Get video duration to calculate bitrate
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });

    const duration = metadata.format.duration;
    console.log('[Server Compression] Video duration:', duration.toFixed(2) + 's');

    // Calculate target bitrate
    // Formula: bitrate = (targetSize * 8) / duration (in bits per second)
    const targetSizeBytes = targetSizeMB * 1024 * 1024 * 0.85; // 85% to be safe
    const targetBitrate = Math.floor((targetSizeBytes * 8) / duration / 1000); // in kbps

    console.log('[Server Compression] Target bitrate:', targetBitrate + 'kbps');

    // Compress video
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',           // H.264 codec
          '-preset fast',            // Fast encoding
          `-b:v ${targetBitrate}k`,  // Video bitrate
          `-maxrate ${targetBitrate}k`,
          '-bufsize 4000k',
          '-vf scale=-2:720',        // Scale to 720p height
          '-c:a aac',                // AAC audio codec
          '-b:a 128k',               // Audio bitrate
          '-movflags +faststart',    // Optimize for web
          '-y'                       // Overwrite output
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log('[Server Compression] Progress:', progress.percent.toFixed(1) + '%');
          }
        })
        .run();
    });

    // Read compressed file
    const fs = await import('fs/promises');
    const compressedBuffer = await fs.readFile(outputPath);

    console.log('[Server Compression] Complete:', {
      originalSize: (fileBuffer.length / (1024 * 1024)).toFixed(2) + 'MB',
      compressedSize: (compressedBuffer.length / (1024 * 1024)).toFixed(2) + 'MB',
      reduction: ((1 - compressedBuffer.length / fileBuffer.length) * 100).toFixed(1) + '%'
    });

    // Cleanup temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return {
      buffer: compressedBuffer,
      size: compressedBuffer.length
    };

  } catch (error) {
    // Cleanup on error
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    
    console.error('[Server Compression] Error:', error);
    throw error;
  }
}

/**
 * Check if a file needs compression
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean}
 */
export function needsCompression(fileSize, maxSizeMB = 40) {
  return fileSize > maxSizeMB * 1024 * 1024;
}
