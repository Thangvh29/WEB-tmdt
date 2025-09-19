// src/utils/imageUrl.js
import { backendURL } from "../services/axios";

export const toImageURL = (src) => {
  if (!src) return "/default-product.png";
  if (src.startsWith("http")) return src;
  // đảm bảo chỉ có 1 dấu /
  return `${backendURL}${src.startsWith("/") ? "" : "/"}${src}`;
};
