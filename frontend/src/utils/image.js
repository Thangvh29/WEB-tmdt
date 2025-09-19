// frontend/src/utils/imageUrl.js
import { backendURL } from "../services/axios";

// Hàm chuẩn hoá URL ảnh
export const toImageURL = (path) => {
  if (!path) return "/placeholder.png";

  // Nếu path đã là URL đầy đủ thì giữ nguyên
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Nếu path đã bao gồm "uploads/product"
  if (path.startsWith("uploads/product")) {
    return `${backendURL}/${path}`;
  }

  // Nếu chỉ lưu tên file (vd: "abc.jpg")
  return `${backendURL}/uploads/product/${path}`;
};
