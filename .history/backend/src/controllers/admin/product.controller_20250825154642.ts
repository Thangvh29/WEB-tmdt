// controllers/product.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, query, validationResult, param } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Product } from '../../models/product.model.js';
import type { IVariant } from '../../models/product.model.js';

// ID cố định đại diện của hàng/admin
const STORE_OWNER_ID = "64f0abcd1234567890abcdef";

// -- Validations --
export const productValidation = [
  body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Tên sản phẩm phải từ 3 đến 150 ký tự'),
  body('brand').trim().isLength({ min: 2, max: 80 }).withMessage('Hãng là bắt buộc (2-80 ký tự)'),
  body('type').trim().notEmpty().withMessage('Loại sản phẩm là bắt buộc'),
  body('category').optional().isMongoId().withMessage('category phải là ObjectId'),
  body('images').isArray({ min: 1, max: 10 }).withMessage('Hình ảnh phải từ 1 đến 10 URL'),
  body('images.*').isString(),
  body('isNewProduct').optional().isBoolean().toBoolean(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('description').optional().isString().isLength({ max: 5000 }).withMessage('Mô tả tối đa 5000 ký tự'),
  body('specifications').optional().isArray(),
  body('commitments').optional().isArray(),
  body('condition').optional().isIn(['new', 'like_new', 'good', 'fair', 'poor']).withMessage('Tình trạng phải là new, like_new, good, fair, hoặc poor'),
  // sellPrice: client-side array mapped to variants
  body('sellPrice').optional().isArray(),
  body('sellPrice.*.price').optional().isFloat({ min: 0 }),
  body('sellPrice.*.stock').optional().isInt({ min: 0 }),
  body('sellPrice.*.version').optional().isString(),
  body('sellPrice.*.color').optional().isString(),
];

export const productOldValidation = [
  body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Tên sản phẩm phải từ 3 đến 150 ký tự'),
  body('brand').trim().isLength({ min: 2, max: 80 }).withMessage('Hãng là bắt buộc (2-80 ký tự)'),
  body('type').trim().notEmpty().withMessage('Loại sản phẩm là bắt buộc'),
  body('category').optional().isMongoId().withMessage('category phải là ObjectId'),
  body('images').isArray({ min: 1, max: 10 }).withMessage('Hình ảnh phải từ 1 đến 10 URL'),
  body('images.*').isString(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('specifications').optional().isArray(),
  body('commitments').optional().isArray(),
  body('condition').isIn(['like_new', 'good', 'fair', 'poor']).withMessage('Tình trạng phải là like_new, good, fair, hoặc poor'),
  body('sellPrice').optional().isArray(),
  body('sellPrice.*.price').optional().isFloat({ min: 0 }),
  body('sellPrice.*.stock').optional().isInt({ min: 0 }),
  body('sellPrice.*.version').optional().isString(),
  body('sellPrice.*.color').optional().isString(),
];

// --- Helpers ---
function withAbsoluteImageUrls(req: Request, product: any) {
  if (!product) return product;

  const base = `${req.protocol}://${req.get("host")}`;

  const fixImages = (imgs: string[]) =>
    (imgs || []).map(img =>
      img.startsWith("http") ? img : `${base}${img.startsWith("/") ? "" : "/"}${img}`
    );

  const obj = product.toObject ? product.toObject() : product;

  // ảnh product
  if (Array.isArray(obj.images)) {
    obj.images = fixImages(obj.images);
  }

  // ảnh variants (nếu có)
  if (Array.isArray(obj.variants)) {
    obj.variants = obj.variants.map((v: any) => ({
      ...v,
      images: fixImages(v.images || []),
    }));
  }

  return obj;
}

export const idParamValidation = [param('id').isMongoId().withMessage('id không hợp lệ')];

// -- Helpers --
function toObjectId(id?: string) {
  return id ? new mongoose.Types.ObjectId(id) : undefined;
}

function mapSellPriceToVariants(sellPrice: any[] | undefined): IVariant[] {
  if (!Array.isArray(sellPrice)) return [];
  return sellPrice.map((s: any) => {
    const attrs: { name: string; value: string }[] = [];
    if (s.version) attrs.push({ name: 'version', value: String(s.version) });
    if (s.color) attrs.push({ name: 'color', value: String(s.color) });
    // copy images and cap at 10
    const images = Array.isArray(s.images) ? s.images.slice(0, 10) : [];
    return {
      _id: s._id ? new Types.ObjectId(s._id) : undefined,
      sku: s.sku,
      price: Number(s.price ?? 0),
      compareAtPrice: s.compareAtPrice !== undefined ? Number(s.compareAtPrice) : undefined,
      stock: Number(s.stock ?? 0),
      images,
      attributes: attrs,
      isDefault: !!s.isDefault,
    } as IVariant;
  });
}

function mongooseValidationErrors(err: any) {
  if (!err || !err.errors) return [];
  return Object.keys(err.errors).map(k => ({ field: k, message: err.errors[k].message }));
}

// -- Controllers --

// Create product
export const createProduct = [
  ...productValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const body = req.body;
      
      // Nếu có file từ multer, thêm URLs vào images array
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadedUrls = req.files.map((file: any) => `/uploads/product/${file.filename}`);
        body.images = [...(body.images || []), ...uploadedUrls];
      }

      const variants = mapSellPriceToVariants(body.sellPrice);

      const productData: any = {
        name: body.name,
        brand: body.brand.toLowerCase(),
        type: body.type.toLowerCase(),
        images: body.images || [],
        specs: Array.isArray(body.specifications) ? body.specifications : [],
        commitments: Array.isArray(body.commitments) ? body.commitments : [],
        description: body.description,
        isNewProduct: typeof body.isNewProduct === 'boolean' ? body.isNewProduct : true,
        owner: body.owner ? toObjectId(body.owner) : undefined,
        category: body.category ? toObjectId(body.category) : undefined,
      };

      if (variants.length > 0) {
        productData.variants = variants;
      } else {
        // no variants: product-level price & stock required
        productData.price = body.price !== undefined ? Number(body.price) : 0;
        productData.stock = body.stock !== undefined ? Number(body.stock) : 0;
      }

      // If product is C2C and owner/condition missing -> reject
      if (productData.isNewProduct === false && (!productData.owner && !body.owner)) {
        return res.status(400).json({ message: 'Sản phẩm cũ cần owner' });
      }

      const product = new Product(productData);
      await product.save();
      return res.status(201).json({ message: 'Thêm sản phẩm thành công', product });
    } catch (err: any) {
      console.error('Create product error:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      }
      next(err);
    }
  },
];


// Get new products only
export const getNewProducts = [
  query("brand").optional().trim(),
  query("type").optional().trim(),
  query("minPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1 }).toInt(),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const q = req.query as any;
      const filter: any = { isNewProduct: true };

      if (q.brand) filter.brand = { $regex: q.brand, $options: "i" };
      if (q.type) filter.type = { $regex: q.type, $options: "i" };

      if (q.minPrice !== undefined || q.maxPrice !== undefined) {
        const priceCond: any = {};
        if (q.minPrice !== undefined) priceCond.$gte = Number(q.minPrice);
        if (q.maxPrice !== undefined) priceCond.$lte = Number(q.maxPrice);
        filter.$or = [{ price: priceCond }, { "variants.price": priceCond }];
      }

      const page = Math.max(1, Number(q.page || 1));
      const limit = Math.min(100, Number(q.limit || 12));
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Product.countDocuments(filter),
      ]);

      const result = products.map((p) => withAbsoluteImageUrls(req, p));

      return res.json({
        products: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("Get new products error:", err);
      next(err);
    }
  },
];


// Get product detail
export const getProductDetail = [
  ...idParamValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const productDoc = await Product.findById(req.params.id).populate(
        "category",
        "name"
      );
      if (!productDoc)
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

      const product = withAbsoluteImageUrls(req, productDoc);
      return res.json(product);
    } catch (err) {
      console.error("Get product detail error:", err);
      next(err);
    }
  },
];

// Update product
export const updateProduct = [
  ...idParamValidation,
  ...productValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const body = req.body;
      
      // Nếu có file từ multer, thêm URLs vào images array
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadedUrls = req.files.map((file: any) => `/uploads/product/${file.filename}`);
        body.images = [...(body.images || []), ...uploadedUrls];
      }

      const update: any = {
        name: body.name,
        brand: body.brand ? body.brand.toLowerCase() : undefined,
        type: body.type ? body.type.toLowerCase() : undefined,
        images: body.images,
        specs: Array.isArray(body.specifications) ? body.specifications : undefined,
        commitments: Array.isArray(body.commitments) ? body.commitments : undefined,
        description: body.description,
        isNewProduct: typeof body.isNewProduct === 'boolean' ? body.isNewProduct : undefined,
        owner: body.owner ? toObjectId(body.owner) : undefined,
        category: body.category ? toObjectId(body.category) : undefined,
        condition: body.condition,
      };

      const variants = mapSellPriceToVariants(body.sellPrice);
      if (variants.length > 0) {
        update.variants = variants;
        update.price = undefined; // let pre-save compute price from variants
        update.stock = undefined;
      } else {
        if (body.price !== undefined) update.price = Number(body.price);
        if (body.stock !== undefined) update.stock = Number(body.stock);
      }

      const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      return res.json({ message: 'Cập nhật thành công', product });
    } catch (err: any) {
      console.error('Update product error:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      }
      next(err);
    }
  },
];

// Delete product
export const deleteProduct = [
  ...idParamValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const p = await Product.findByIdAndDelete(req.params.id);
      if (!p) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      return res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (err) {
      console.error('Delete product error:', err);
      next(err);
    }
  },
];

// --- Variant routes ---
// Create variant
export const addVariant = [
  ...idParamValidation,
  body('price').isFloat({ min: 0 }).withMessage('price phải >= 0'),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('attributes').isArray().withMessage('attributes phải là mảng'),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const v: any = {
        sku: req.body.sku,
        price: Number(req.body.price),
        compareAtPrice: req.body.compareAtPrice !== undefined ? Number(req.body.compareAtPrice) : undefined,
        stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
        images: Array.isArray(req.body.images) ? req.body.images.slice(0, 10) : [],
        attributes: Array.isArray(req.body.attributes) ? req.body.attributes : [],
        isDefault: !!req.body.isDefault,
      };

      // ensure uniqueness of attribute combos
      const exists = (product.variants || []).some(existing =>
        v.attributes.every((a: any) => existing.attributes.some((ea: any) => ea.name === a.name && ea.value === a.value))
      );
      if (exists) return res.status(400).json({ message: 'Biến thể với tổ hợp attributes này đã tồn tại' });

      product.variants = product.variants || [];
      product.variants.push(v);
      await product.save();
      return res.status(201).json({ message: 'Thêm biến thể thành công', product });
    } catch (err: any) {
      console.error('Add variant error:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      }
      next(err);
    }
  },
];

// Update variant
export const updateVariant = [
  param('id').isMongoId(),
  param('variantId').isMongoId(),
  body('price').optional().isFloat({ min: 0 }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      // Convert variantId into ObjectId and find variant by _id
      const variantObjectId = new Types.ObjectId(req.params.variantId);
      // find returns the subdoc at runtime; cast to any to satisfy TS
      const v: any = product.variants?.find(x => x._id?.equals(variantObjectId));

      if (!v) return res.status(404).json({ message: 'Không tìm thấy biến thể' });

      // cập nhật các field tùy gửi
      if (req.body.price !== undefined) v.price = Number(req.body.price);
      if (req.body.compareAtPrice !== undefined) v.compareAtPrice = Number(req.body.compareAtPrice);
      if (req.body.stock !== undefined) v.stock = Number(req.body.stock);
      if (req.body.sku !== undefined) v.sku = req.body.sku;
      if (req.body.images !== undefined && Array.isArray(req.body.images)) v.images = req.body.images.slice(0, 10);
      if (req.body.attributes !== undefined && Array.isArray(req.body.attributes)) v.attributes = req.body.attributes;
      if (req.body.isDefault !== undefined) {
        if (req.body.isDefault) {
          // unset other defaults
          product.variants?.forEach((x: any) => (x.isDefault = false));
        }
        v.isDefault = !!req.body.isDefault;
      }

      // Mark variants as modified to be safe for TS + Mongoose change detection
      product.markModified('variants');

      await product.save();
      return res.json({ message: 'Cập nhật biến thể thành công', product });
    } catch (err: any) {
      console.error('Update variant error:', err);
      if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      next(err);
    }
  },
];
// Delete variant
export const deleteVariant = [
  param('id').isMongoId(),
  param('variantId').isMongoId(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const variantObjectId = new Types.ObjectId(req.params.variantId);
      const vIndex = product.variants?.findIndex(x => x._id?.equals(variantObjectId)) ?? -1;
      if (vIndex < 0) return res.status(404).json({ message: 'Không tìm thấy biến thể' });

      // Xóa bằng splice (an toàn hơn so với v.remove() để tránh lỗi typing)
      product.variants?.splice(vIndex, 1);

      // Recompute tổng stock và (nếu cần) price tại đây hoặc rely on pre-save
      // Nhưng để an toàn, ta tính lại tổng stock & price nếu còn variants
      if (product.variants && product.variants.length > 0) {
        product.stock = product.variants.reduce((s: number, vv: any) => s + (Number(vv.stock ?? 0)), 0);
        product.price = Math.min(...product.variants.map((vv: any) => Number(vv.price ?? Infinity)));
        if (!isFinite(product.price)) product.price = 0;
      } else {
        // không còn biến thể -> giữ nguyên price/stock nếu client sẽ cập nhật, hoặc set về 0
        product.stock = 0;
      }

      product.markModified('variants');
      await product.save();
      return res.json({ message: 'Xóa biến thể thành công', product });
    } catch (err) {
      console.error('Delete variant error:', err);
      next(err);
    }
  },
];
// Patch stock (delta or absolute)
export const patchStock = [
  param('id').isMongoId(),
  body('delta').optional().isInt(),
  body('variantId').optional().isMongoId(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const delta = req.body.delta !== undefined ? Number(req.body.delta) : undefined;
      const variantId = req.body.variantId ? new Types.ObjectId(req.body.variantId) : undefined;

      if (delta === undefined) return res.status(400).json({ message: 'Thiếu trường delta' });

      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const updated = await product.updateStock(delta, variantId);
      return res.json({ message: 'Cập nhật tồn kho thành công', product: updated });
    } catch (err: any) {
      console.error('Patch stock error:', err);
      next(err);
    }
  },
];

export const createProductOld = [
  ...productOldValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const body = req.body;
      const variants = mapSellPriceToVariants(body.sellPrice);

      const productData: any = {
        name: body.name,
        brand: body.brand.toLowerCase(),
        type: body.type.toLowerCase(),
        images: body.images,
        specs: Array.isArray(body.specifications) ? body.specifications : [],
        commitments: Array.isArray(body.commitments) ? body.commitments : [],
        description: body.description,
        isNewProduct: false,              // luôn là sản phẩm cũ
        owner: toObjectId(STORE_OWNER_ID), // admin/cửa hàng là chủ sở hữu
        category: body.category ? toObjectId(body.category) : undefined,
        condition: body.condition,
      };

      if (variants.length > 0) {
        productData.variants = variants;
        // tự động tính tổng stock và giá min
        productData.stock = variants.reduce((sum: number, v: IVariant) => sum + (v.stock ?? 0), 0);
        productData.price = Math.min(...variants.map((v: IVariant) => v.price ?? Infinity)) || 0;
      } else {
        // Nếu không có variants, dùng price/stock từ body
        productData.price = body.price !== undefined ? Number(body.price) : 0;
        productData.stock = body.stock !== undefined ? Number(body.stock) : 0;
      }

      const product = new Product(productData);
      await product.save();

      return res.status(201).json({ message: 'Thêm sản phẩm cũ thành công', product });
    } catch (err: any) {
      console.error('Create product old error:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      }
      next(err);
    }
  },
];

export const getOldProducts = [
  // validations query params
  query('brand').optional().trim(),
  query('type').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const q = req.query as any;
      const filter: any = { isNewProduct: false }; // chỉ lấy sản phẩm cũ

      if (q.brand) filter.brand = { $regex: q.brand, $options: 'i' };
      if (q.type) filter.type = { $regex: q.type, $options: 'i' };

      if (q.minPrice !== undefined || q.maxPrice !== undefined) {
        const priceCond: any = {};
        if (q.minPrice !== undefined) priceCond.$gte = Number(q.minPrice);
        if (q.maxPrice !== undefined) priceCond.$lte = Number(q.maxPrice);
        filter.$or = [{ price: priceCond }, { 'variants.price': priceCond }];
      }

      const page = Math.max(1, Number(q.page || 1));
      const limit = Math.min(100, Number(q.limit || 12));
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Product.countDocuments(filter),
      ]);

      return res.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('Get old products error:', err);
      next(err);
    }
  }
];