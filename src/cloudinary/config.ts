import { Cloudinary } from '@cloudinary/url-gen';

// Get environment variables - Vite requires VITE_ prefix
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export const isCloudinaryConfigured = Boolean(cloudName);

if (!isCloudinaryConfigured) {
  // Don't throw at import time: that blanks the whole page. The layout shows a banner instead.
  console.error('VITE_CLOUDINARY_CLOUD_NAME is not set. See .env.example.');
}

// Create and export Cloudinary instance
export const cld = new Cloudinary({
  cloud: {
    cloudName: cloudName || 'missing-cloud-name',
  },
});

// Export upload preset for convenience
export const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
