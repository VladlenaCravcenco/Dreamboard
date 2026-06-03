/**
 * Compress an image to reduce localStorage size
 * @param dataUrl Base64 data URL of the image
 * @param maxWidth Maximum width of the compressed image
 * @param quality JPEG quality (0-1)
 * @returns Promise with compressed base64 data URL
 */
export const compressImage = async (
  dataUrl: string,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with quality compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
};

/**
 * Check if localStorage has enough space for new data
 * @returns Available space estimate in bytes
 */
export const checkLocalStorageSpace = (): number => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  // Typical localStorage limit is 5-10MB, we'll assume 5MB
  const limit = 5 * 1024 * 1024;
  return limit - total;
};

/**
 * Clean up old completion photos if storage is running low
 * Keep only the most recent photos
 */
export const cleanupOldPhotos = (userId: string | null, keepCount: number = 10) => {
  // Use correct key format
  const key = userId 
    ? `dreamboard_${userId}_completionPhotos` 
    : 'dreamboard_guest_completionPhotos';
  
  const stored = localStorage.getItem(key);
  
  if (!stored) return;
  
  try {
    const photos = JSON.parse(stored);
    if (Array.isArray(photos) && photos.length > keepCount) {
      // Keep only the FIRST photos (most recent, since we prepend)
      const trimmed = photos.slice(0, keepCount);
      localStorage.setItem(key, JSON.stringify(trimmed));
      console.log(`Storage quota exceeded, cleaned up old photos. Kept ${keepCount} most recent.`);
      return trimmed;
    }
  } catch (e) {
    console.error('Failed to cleanup photos:', e);
  }
  
  return null;
};