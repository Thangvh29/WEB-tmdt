// src/utils/urlHelper.ts
import type { Request } from "express";

export function toAbsoluteUrl(req: Request, filePath?: string | null): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath; // đã có full URL thì giữ nguyên
  return `${req.protocol}://${req.get("host")}${filePath}`;
}

export function mapImages(req: Request, images?: string[]): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.map(img => toAbsoluteUrl(req, img) || "");
}
