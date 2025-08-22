import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";

// Hàm tạo storage động theo thư mục
const createStorage = (folder: string) => {
  // Đảm bảo thư mục tồn tại
  const uploadPath = path.join(__dirname, `../uploads/${folder}`);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    }
  });
};

// Bộ lọc file chỉ cho phép ảnh
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Chỉ cho phép upload file ảnh"));
  }
  cb(null, true);
};

// Config multer cho từng loại upload
export const uploadProduct = multer({ storage: createStorage("product"), fileFilter: imageFilter });
export const uploadAvatar = multer({ storage: createStorage("avatar"), fileFilter: imageFilter });
export const uploadPost = multer({ storage: createStorage("post"), fileFilter: imageFilter });
