// Compress image to reduce localStorage usage
export const compressImage = async (
  imageDataUrl: string,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to compress with decreasing quality until it fits
      let compressedDataUrl = '';
      let currentQuality = quality;
      
      while (currentQuality > 0.1) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        
        // Check if size is reasonable (under 2MB)
        const sizeInBytes = compressedDataUrl.length * 0.75; // Rough estimate
        if (sizeInBytes < 2 * 1024 * 1024) {
          break;
        }
        
        currentQuality -= 0.1;
      }
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataUrl;
  });
};

// Clear localStorage before saving new data
export const clearStorageIfNeeded = () => {
  try {
    // Check localStorage usage
    const used = new Blob(Object.values(localStorage)).size;
    const estimatedMax = 5 * 1024 * 1024; // 5MB estimate
    
    if (used > estimatedMax * 0.8) {
      // Clear old data if using more than 80% of estimated capacity
      localStorage.removeItem('namvas_artwork');
      localStorage.removeItem('namvas_texture');
    }
  } catch (e) {
    // If we can't check, just clear to be safe
    localStorage.removeItem('namvas_artwork');
    localStorage.removeItem('namvas_texture');
  }
};