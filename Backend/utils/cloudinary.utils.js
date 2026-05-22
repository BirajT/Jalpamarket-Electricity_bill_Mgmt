import CustomError from "../middlewares/error_handler.middleware.js";
import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";
import path from "path";

export const uploadToCloud = async (file, dir = "/") => {
  try {
    const folder = "8_am" + dir;
    const { public_id, secure_url } = await cloudinary.uploader.upload(file, {
      folder: folder,
      unique_filename: true,
    });

    // delete local file after successful cloud upload
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }

    return {
      public_id,
      path: secure_url,
    };
  } catch (error) {
    console.log("Cloudinary upload failed, using local file:", error.message);

    // Fallback: serve the file locally
    // file path is like ./uploads/profiles/filename.jpg
    // convert to a URL path like /api/uploads/profiles/filename.jpg
    const normalised = file.replace(/\\/g, "/").replace(/^\.\//, "");
    const apiBase = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
    // Encode each path segment so filenames with spaces/parens are valid URLs
    const encodedPath = normalised.split('/').map(encodeURIComponent).join('/');
    const localPath = `${apiBase}/api/${encodedPath}`;
    const public_id = path.basename(file);

    return {
      public_id,
      path: localPath,
    };
  }
};

// delete file
export const deleteFile = async (public_id) => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    // silently ignore delete errors when using local storage
    console.log("deleteFile skipped (local mode):", error.message);
  }
};