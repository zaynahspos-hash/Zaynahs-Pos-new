/**
 * Smart Image Compression Service
 * Converts images to WebP and compresses them to target ~20-40kb size
 * for fast uploads and optimized web delivery.
 */

export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. Validation
    if (!file.type.match(/image.*/)) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // 2. Calculate new dimensions (Max 800px width/height for file size control)
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // 3. Draw to Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // High quality smoothing for resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 4. Export as WebP with compression
        // Quality 0.65 usually lands a 800px image between 20-40kb
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with .webp extension
              const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const compressedFile = new File([blob], newName, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              
              console.log(`[SmartCompress] Original: ${(file.size/1024).toFixed(2)}kb -> Compressed: ${(compressedFile.size/1024).toFixed(2)}kb`);
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/webp',
          0.65 
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};