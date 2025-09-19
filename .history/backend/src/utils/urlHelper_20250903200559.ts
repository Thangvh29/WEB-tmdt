// utils/urlHelper.js
export function toAbsoluteUrl(req, filePath) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath; // đã full URL thì giữ nguyên
  return `${req.protocol}://${req.get("host")}${filePath}`;
}

export function mapImages(req, images = []) {
  if (!Array.isArray(images)) return [];
  return images.map(img => toAbsoluteUrl(req, img));
}
