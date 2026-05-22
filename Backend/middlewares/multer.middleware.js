import multer from "multer";
import fs from "fs";
import path from "path";
import CustomError from "./error_handler.middleware.js";

export const uploadFile = (dir = "/") => {
  const upload_path = "./uploads" + dir;
  const file_size = 5 * 1024 * 1024; // 5MB
  const allowed_ext = ["png", "jpg", "jpeg", "pdf", "webp", "svg"];

  if (!fs.existsSync(upload_path)) {
    fs.mkdirSync(upload_path, { recursive: true });
  }

  const my_storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, upload_path);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  });

  // file filter

  const file_filter = (req, file, cb) => {
    const file_ext = path.extname(file.originalname).replace(".", "");

    const is_allowed = allowed_ext.includes(file_ext);

    if (is_allowed) {
      cb(null, true);
    } else {
      cb(
        new CustomError(
          `${file_ext} format is not allowed.Only ${allowed_ext.join(
            ","
          )} formats allowed`, 400
        )
       
      );
    }
  };

  // creating multer upload instance
  const upload = multer({
    storage: my_storage,
    limits: { fileSize: file_size },
    fileFilter: file_filter,
  });

  return upload;
};
