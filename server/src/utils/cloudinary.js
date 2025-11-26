import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and removes the local file afterwards (if present).
 * Returns the Cloudinary response object, or throws an error.
 */
const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) throw new Error("File path not provided to uploadOnCloudinary");

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    return response;
  } catch (error) {
    // rethrow so caller can handle
    throw error;
  } finally {
    try {
      if (localFilePath && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (e) {
      // don't crash the app if cleanup fails; log for debugging
      console.warn("Failed to remove temp file:", localFilePath, e);
    }
  }
};

export { uploadOnCloudinary };
