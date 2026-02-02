import axios from 'axios';

const getEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch {
    return {};
  }
};

const env = getEnv();
const CLOUD_NAME = env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const UPLOAD_PRESET = env.VITE_CLOUDINARY_UPLOAD_PRESET || 'demo';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (CLOUD_NAME === 'demo') {
      console.warn("Cloudinary not configured. Returning fake URL.");
      // Return a fake URL for demo purposes so app doesn't crash
      return URL.createObjectURL(file);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Failed to upload image');
  }
};