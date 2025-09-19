// src/controllers/public/product.controller.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { query, param, validationResult } from "express-validator";
import { Types } from "mongoose";
import { Product } from "../../models/product.model.js";
import { Comment } from "../../models/comment.model.js";
import { Category } from "../../models/category.model.js";

/** Helpers */
function badReq(res: Response, errors: any) {
  return res.status(400).json({ errors: errors.array ? errors.array() : errors });
}
function toAbsoluteUrl(req: Request, filePath: string | null) {
  if (!filePath) return null;
  if (filePath.startsWith("http")) return filePath;
  return `${req.protocol}://${req.get("host")}${filePath}`;
}
function parseAttrs(attrsRaw: any): { name: string; value: string }[] {
  if (!attrsRaw) return [];
  if (Array.isArray(attrsRaw)) {
    return attrsRaw.map((a: any) => ({ name: String(a.name), value: String(a.value) }));
  }
  if (typeof attrsRaw === "object") {
    return Object.keys(attrsRaw).map((k) => ({ name: k, value: String(attrsRaw[k]) }));
  }
  return [];
}

const coreListProductsHandler: RequestHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    // --- Lấy query params ---
    const q = (req.query.q as string | undefined) || undefined;
    const isNewRaw = req.query.isNew;
    const brand = (req.query.brand as string | undefined) || undefined;
    const type = (req.query.type as string | undefined) || undefined;
    const category = (req.query.category as string | undefined) || undefined;

    // Chỉ parse giá nếu người dùng gửi giá thực sự
    const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== "" ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : undefined;

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(60, Number(req.query.limit || 12));
    const sort = (req.query.sort as string | undefined) || "newest";
    const skip = (page - 1) * limit;

    const filter: any = { isApproved: true };

    // --- Filters ---
    if (q) filter.$text = { $search: q };
    if ((req as any).forceNew) filter.isNewProduct = true;
    else if ((req as any).forceOld) filter.isNewProduct = false;
    else if (isNewRaw !== undefined) {
      const isNewStr = String(isNewRaw).toLowerCase();
      if (isNewStr === "true") filter.isNewProduct = true;
      else if (isNewStr === "false") filter.isNewProduct = false;
    }
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (type) filter.type = { $regex: type, $options: "i" };
    if (category) {
      try { filter.category = new Types.ObjectId(category); } 
      catch { filter.category = null; }
    }

    // --- Price filter chỉ khi có giá ---
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceCond: any = {};
      if (minPrice !== undefined) priceCond.$gte = minPrice;
      if (maxPrice !== undefined) priceCond.$lte = maxPrice;
      filter.$or = [{ price: priceCond }, { "variants.price": priceCond }];
    }

    // --- Sort ---
    let sortObj: any = { createdAt: -1 };
    if (sort === "priceAsc") sortObj = { price: 1, createdAt: -1 };
    else if (sort === "priceDesc") sortObj = { price: -1, createdAt: -1 };
    else if (sort === "popular") sortObj = { sold: -1, createdAt: -1 };

    // --- Log debug ---
    console.log("🔎 [ProductFilter] Filter object:", JSON.stringify(filter, null, 2));
    console.log(`🔎 [ProductFilter] page=${page}, limit=${limit}, sort=${sort}`);

    // --- Query database ---
    const products = await Product.find(filter)
      .select("name brand type images price variants stock isNewProduct category sold")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log(`✅ [ProductResult] Number of products found: ${products.length}`);

    // --- Map result ---
    const mapped = (products || []).map((p: any) => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const priceRange =
        variants.length > 0
          ? { min: Math.min(...variants.map((v: any) => v.price)), max: Math.max(...variants.map((v: any) => v.price)) }
          : { min: p.price, max: p.price };
      const inStock = (p.stock ?? 0) > 0 || variants.some((v: any) => (v.stock ?? 0) > 0);

      return {
        _id: p._id,
        name: p.name,
        brand: p.brand,
        type: p.type,
        image: Array.isArray(p.images) && p.images.length > 0 ? toAbsoluteUrl(req, p.images[0]) : null,
        imagesCount: Array.isArray(p.images) ? p.images.length : 0,
        priceRange,
        priceDisplay: priceRange.min === priceRange.max ? priceRange.min : priceRange.min,
        stock: p.stock ?? 0,
        inStock,
        isNewProduct: !!p.isNewProduct,
        hasVariants: variants.length > 0,
        category: p.category,
        sold: p.sold ?? 0,
      };
    });

    const total = await Product.countDocuments(filter).exec();
    console.log("ℹ️ [ProductResult] Total matching products:", total);

    return res.json({ products: mapped, total, page, limit });
  } catch (err) { next(err); }
};



/** LIST PUBLIC */
export const listProducts = [
  query("q").optional({ checkFalsy: true }).trim(),
  query("isNew").optional({ checkFalsy: true }),
  query("brand").optional({ checkFalsy: true }).trim(),
  query("type").optional({ checkFalsy: true }).trim(),
  query("category").optional({ checkFalsy: true }).isMongoId().withMessage("Category phải là ObjectId hợp lệ"),
  query("minPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  query("maxPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  query("page").optional({ checkFalsy: true }).isInt({ min: 1 }).toInt(),
  query("limit").optional({ checkFalsy: true }).isInt({ min: 1 }).toInt(),
  query("sort").optional({ checkFalsy: true }).isIn(["newest", "priceAsc", "priceDesc", "popular"]),
  coreListProductsHandler,
];
export const listNewProducts = [(req: Request, res: Response, next: NextFunction) => { (req as any).forceNew = true; return coreListProductsHandler(req, res, next); }];
export const listOldProducts = [(req: Request, res: Response, next: NextFunction) => { (req as any).forceOld = true; return coreListProductsHandler(req, res, next); }];

/** GET /filters */
export const getProductFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandsAgg: any[] = await Product.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).exec();
    const typesAgg: any[] = await Product.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec();
    const priceAgg: any[] = await Product.aggregate([
      { $match: { isApproved: true } },
      { $project: { minPrice: { $cond: [{ $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] }, { $min: "$variants.price" }, "$price"] }, maxPrice: { $cond: [{ $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] }, { $max: "$variants.price" }, "$price"] } } },
      { $group: { _id: null, overallMin: { $min: "$minPrice" }, overallMax: { $max: "$maxPrice" } } },
    ]).exec();
    const categories = await Category.find({ active: true }).select("name slug").lean().exec();
    return res.json({
      brands: brandsAgg.map(b => ({ brand: b._id, count: b.count })),
      types: typesAgg.map(t => ({ type: t._id, count: t.count })),
      categories,
      priceRange: priceAgg[0] ? { min: priceAgg[0].overallMin || 0, max: priceAgg[0].overallMax || 0 } : { min: 0, max: 0 },
    });
  } catch (err) { next(err); }
};

/** GET /:id */
export const getProductDetail = [
  param("id").isMongoId(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);

      const id = req.params.id;
      const product = await Product.findById(id).populate("category", "name slug").lean().exec();
      if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const priceRange = variants.length > 0
        ? { min: Math.min(...variants.map((v: any) => v.price)), max: Math.max(...variants.map((v: any) => v.price)) }
        : { min: product.price, max: product.price };

      const inStock = (product.stock ?? 0) > 0 || variants.some((v: any) => (v.stock ?? 0) > 0);

      const variantSummary = variants.map((v: any) => ({
        _id: v._id,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.stock,
        images: v.images || [],
        attributes: v.attributes,
        isDefault: !!v.isDefault,
      }));

      const ratingAgg: any[] = await Comment.aggregate([
        { $match: { product: new Types.ObjectId(id), rating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]).exec();
      const avgRating = ratingAgg[0]?.avgRating || 0;
      const ratingCount = ratingAgg[0]?.count || 0;

      return res.json({
        product: {
          _id: product._id,
          name: product.name,
          brand: product.brand,
          type: product.type,
          images: product.images.map((i: string) => toAbsoluteUrl(req, i)) || [],
          description: product.description,
          specs: product.specs || [],
          commitments: product.commitments || [],
          isNewProduct: !!product.isNewProduct,
          owner: product.owner,
          category: product.category,
          condition: product.condition,
          priceRange,
          price: product.price,
          stock: product.stock,
          sold: product.sold,
          variants: variantSummary,
          canBuy: inStock,
          avgRating,
          ratingCount,
        },
      });
    } catch (err) { next(err); }
  },
];

/** GET /:id/related */
export const getRelatedProducts = [
  param("id").isMongoId(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);

      const id = req.params.id;
      const limit = Math.min(12, Number(req.query.limit || 6));
      const base = await Product.findById(id).select("category brand").lean().exec();
      if (!base) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

      const filter: any = { _id: { $ne: base._id }, isApproved: true };
      if (base.category) filter.category = base.category;
      else if (base.brand) filter.brand = base.brand;

      const related = await Product.find(filter)
        .select("name images price variants stock")
        .limit(limit)
        .lean()
        .exec();

      const mapped = related.map((p: any) => ({
        _id: p._id,
        name: p.name,
        image: Array.isArray(p.images) && p.images.length > 0 ? toAbsoluteUrl(req, p.images[0]) : null,
        price: p.price,
        hasVariants: Array.isArray(p.variants) && p.variants.length > 0,
        inStock: (p.stock ?? 0) > 0,
      }));

      return res.json({ related: mapped });
    } catch (err) { next(err); }
  },
];

/** GET /:id/reviews */
export const getProductReviews = [
  param("id").isMongoId(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return badReq(res, errors);

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Number(req.query.limit || 10));
      const skip = (page - 1) * limit;
      const productId = req.params.id;

      const reviews = await Comment.find({ product: productId, isDeleted: { $ne: true }, rating: { $ne: null } })
        .sort({ createdAt: -1 })
        .populate("author", "name avatar")
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await Comment.countDocuments({ product: productId, isDeleted: { $ne: true }, rating: { $ne: null } }).exec();

      return res.json({ reviews, page, limit, total });
    } catch (err) { next(err); }
  },
];

/** POST /:id/check-variant */
export const checkVariant = [
  param("id").isMongoId(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId).lean().exec();
      if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

      const attrs = parseAttrs(req.body.attributes);
      if (!attrs || attrs.length === 0) return res.status(400).json({ message: "Thiếu attributes để kiểm tra" });

      const variant = (product.variants || []).find((v: any) =>
        attrs.every(a => v.attributes.some((x: any) => String(x.name) === String(a.name) && String(x.value) === String(a.value)))
      );

      if (!variant) return res.json({ found: false, variant: null });

      return res.json({
        found: true,
        variant: {
          _id: variant._id,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stock: variant.stock,
          images: variant.images || [],
          attributes: variant.attributes,
          isDefault: !!variant.isDefault,
        },
      });
    } catch (err) { next(err); }
  },
];
