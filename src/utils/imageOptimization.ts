import sharp from 'sharp';
import fs from 'fs';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  format: 'webp',
  generateThumbnail: false,
  thumbnailSize: 300,
};

/**
 * Optimize an image file
 * @param inputPath - Path to the input image file
 * @param outputPath - Path to save the optimized image
 * @param options - Optimization options
 * @returns Path to the optimized image
 */
export async function optimizeImage(
  inputPath: string,
  outputPath?: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const finalOutputPath = outputPath || inputPath;
  const isSameFile = inputPath === finalOutputPath;

  try {
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();

    // Determine if resizing is needed
    const needsResize =
      metadata.width && metadata.width > opts.maxWidth
        ? true
        : metadata.height && metadata.height > opts.maxHeight
          ? true
          : false;

    // Create sharp instance
    let pipeline = sharp(inputPath);

    // Resize if needed (maintain aspect ratio)
    if (needsResize) {
      pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert format and optimize
    switch (opts.format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: opts.quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 9 });
        break;
    }

    // If same file, write to temp file first, then replace
    if (isSameFile) {
      const tempPath = `${finalOutputPath}.tmp`;
      await pipeline.toFile(tempPath);
      // Replace original with optimized version
      await fs.promises.rename(tempPath, finalOutputPath);
    } else {
      // Save optimized image to different path
      await pipeline.toFile(finalOutputPath);
    }

    return finalOutputPath;
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Optimize avatar image with specific settings
 * @param inputPath - Path to the input image file
 * @param outputPath - Path to save the optimized image
 * @returns Path to the optimized image
 */
export async function optimizeAvatar(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  return optimizeImage(inputPath, outputPath, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 90,
    format: 'webp',
  });
}

/**
 * Optimize post media image with specific settings
 * @param inputPath - Path to the input image file
 * @param outputPath - Path to save the optimized image
 * @returns Path to the optimized image
 */
export async function optimizePostMedia(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  return optimizeImage(inputPath, outputPath, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: 'webp',
  });
}

/**
 * Generate a thumbnail from an image
 * @param inputPath - Path to the input image file
 * @param outputPath - Path to save the thumbnail
 * @param size - Thumbnail size (square)
 * @returns Path to the thumbnail
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  size: number = 300
): Promise<string> {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get image dimensions
 * @param imagePath - Path to the image file
 * @returns Image dimensions
 */
export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate image file
 * @param filePath - Path to the image file
 * @returns True if valid image, false otherwise
 */
export async function validateImage(filePath: string): Promise<boolean> {
  try {
    const metadata = await sharp(filePath).metadata();
    return !!metadata.format;
  } catch {
    return false;
  }
}

/**
 * Clean up original file if optimization was successful
 * @param originalPath - Path to the original file
 * @param optimizedPath - Path to the optimized file
 */
export function cleanupOriginalFile(
  originalPath: string,
  optimizedPath: string
): void {
  // Only delete original if it's different from optimized
  if (originalPath !== optimizedPath && fs.existsSync(originalPath)) {
    try {
      fs.unlinkSync(originalPath);
    } catch (error) {
      // Log error but don't throw - cleanup is not critical
      console.error(`Failed to cleanup original file: ${error}`);
    }
  }
}

