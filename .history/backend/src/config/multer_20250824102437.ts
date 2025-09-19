// src/config/multer.ts
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import type { FileFilterCallback, StorageEngine } from 'multer';
import type { Request } from 'express';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper tạo storage cho folder cụ thể
 */
const createStorage = (folder: string): StorageEngine => {
  const uploadPath = path.join(__dirname, `../upload/${folder}`);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: (
      _req: Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) => {
      cb(null, uploadPath);
    },
    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    },
  });
};

/**
 * File filter: chỉ cho phép ảnh
 */
const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Chỉ cho phép upload file ảnh (image/*)'));
  }
  cb(null, true);
};

/**
 * Exports: multer instances cho từng folder
 */
export const uploadProduct = multer({
  storage: createStorage('product'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadAvatar = multer({
  storage: createStorage('avatar'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB cho avatar
});

export const uploadPost = multer({
  storage: createStorage('post'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
