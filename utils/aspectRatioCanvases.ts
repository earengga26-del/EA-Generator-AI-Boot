import type { ImageInput } from '../types';

const PREVIEW_WIDTH = 512;

/**
 * Creates a base64 encoded transparent image with a specific aspect ratio.
 * @param aspectRatio - The desired aspect ratio, e.g., "16:9" or "1:1".
 * @returns An ImageInput object with the base64 data and mimeType.
 */
export const createAspectRatioCanvas = (aspectRatio: string): ImageInput => {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

  if (isNaN(widthRatio) || isNaN(heightRatio) || widthRatio <= 0 || heightRatio <= 0) {
    throw new Error('Invalid aspect ratio format. Expected format like "16:9".');
  }

  const height = (PREVIEW_WIDTH * heightRatio) / widthRatio;

  const canvas = document.createElement('canvas');
  canvas.width = PREVIEW_WIDTH;
  canvas.height = height;
  
  // The canvas is transparent by default, so we don't need to draw anything.
  
  const dataUrl = canvas.toDataURL('image/png');
  const [mimePart, dataPart] = dataUrl.split(';base64,');
  const mimeType = mimePart.split(':')[1];

  return { data: dataPart, mimeType };
};
