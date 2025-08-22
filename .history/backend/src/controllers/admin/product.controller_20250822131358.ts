// controllers/product.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, query, validationResult, param } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Product } from '../../models/product.model.js';
import type { IVariant } from '../../models/product.model.js';

// -- Validations --
export const productValidation = [
  body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Tên sản phẩm phải từ 3 đến 150 ký tự'),
  body('brand').trim().isLength({ min: 2, max: 80 }).withMessage('Hãng là bắt buộc (2-80 ký tự)'),
  body('type').trim().notEmpty().withMessage('Loại sản phẩm là bắt buộc'),
  body('category').optional().isMongoId().withMessage('category phải là ObjectId'),
  body('images').isArray({ min: 3, max: 10 }).withMessage('Hình ảnh phải từ 3 đến 10 URL'),
  body('images.*').isString(),
  body('isNewProduct').optional().isBoolean().toBoolean(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('description').optional().isString().isLength({ max: 5000 }).withMessage('Mô tả tối đa 5000 ký tự'),
  body('specifications').optional().isArray(),
  body('commitments').optional().isArray(),
  // sellPrice: client-side array mapped to variants
  body('sellPrice').optional().isArray(),
  body('sellPrice.*.price').optional().isFloat({ min: 0 }),
  body('sellPrice.*.stock').optional().isInt({ min: 0 }),
  body('sellPrice.*.version').optional().isString(),
  body('sellPrice.*.color').optional().isString(),
];

export const idParamValidation = [param('id').isMongoId().withMessage('id không hợp lệ')];

// -- Helpers --
function toObjectId(id?: string) {
  return id ? new mongoose.Types.ObjectId(id) : undefined;
}

function mapSellPriceToVariants(sellPrice: any[] | undefined): IVariant[] {
  if (!Array.isArray(sellPrice)) return [];
  return sellPrice.map((v) => ({
    price: v.price,
    stock: v.stock,
    version: v.version,
    color: v.color,
    attributes: [
      { name: 'version', value: v.version },
      { name: 'color', value: v.color },
    ],
  }));
}

// -- Create product --
export const createProduct = [
  productValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sellPrice, ...data } = req.body;
      const variants = mapSellPriceToVariants(sellPrice);
      const product = new Product({
        ...data,
        variants,
        category: toObjectId(data.category),
      });
      await product.save();
      return res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
    } catch (err: any) {
      console.error('Create product error:', err);
      if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      next(err);
    }
  },
];

// -- Get products --
export const getProducts = [
  query('isNewProduct').optional().isBoolean().toBoolean(),
  query('brand').optional().trim(),
  query('type').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { isNewProduct, brand, type, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
      const filter: any = {};
      if (isNewProduct !== undefined) filter.isNewProduct = isNewProduct;
      if (brand) filter.brand = { $regex: brand, $options: 'i' };
      if (type) filter.type = { $regex: type, $options: 'i' };
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }

      const products = await Product.find(filter)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Product.countDocuments(filter);

      return res.json({ products, total });
    } catch (err) {
      console.error('Get products error:', err);
      next(err);
    }
  },
];

// -- Get product detail --
export const getProduct = [
  idParamValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      return res.json({ product });
    } catch (err) {
      console.error('Get product error:', err);
      next(err);
    }
  },
];

// -- Update product --
export const updateProduct = [
  idParamValidation,
  productValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sellPrice, ...data } = req.body;
      const variants = mapSellPriceToVariants(sellPrice);
      const updateData = {
        ...data,
        variants,
        category: toObjectId(data.category),
      };

      const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      return res.json({ message: 'Cập nhật sản phẩm thành công', product });
    } catch (err: any) {
      console.error('Update product error:', err);
      if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      next(err);
    }
  },
];

// -- Delete product --
export const deleteProduct = [
  idParamValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      return res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (err) {
      console.error('Delete product error:', err);
      next(err);
    }
  },
];

// -- Add variant --
export const addVariant = [
  idParamValidation,
  body('sku').optional().trim().isLength({ max: 50 }).withMessage('SKU tối đa 50 ký tự'),
  body('price').isFloat({ min: 0 }).withMessage('Giá phải là số không âm'),
  body('compareAtPrice').optional().isFloat({ min: 0 }).withMessage('Giá gốc phải là số không âm'),
  body('stock').isInt({ min: 0 }).withMessage('Tồn kho phải là số không âm'),
  body('images').optional().isArray({ max: 10 }).withMessage('Hình ảnh tối đa 10 URL'),
  body('attributes').isArray({ min: 1 }).withMessage('Attributes là bắt buộc'),
  body('attributes.*.name').trim().notEmpty().withMessage('Tên attribute là bắt buộc'),
  body('attributes.*.value').trim().notEmpty().withMessage('Giá trị attribute là bắt buộc'),
  body('isDefault').optional().isBoolean().toBoolean(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const newVariant: IVariant = {
        sku: req.body.sku,
        price: req.body.price,
        compareAtPrice: req.body.compareAtPrice,
        stock: req.body.stock,
        images: req.body.images,
        attributes: req.body.attributes,
        isDefault: req.body.isDefault,
      };

      product.variants.push(newVariant);
      await product.save();
      return res.json({ message: 'Thêm biến thể thành công', product });
    } catch (err: any) {
      console.error('Add variant error:', err);
      if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      next(err);
    }
  },
];

// -- Update variant --
export const updateVariant = [
  idParamValidation,
  param('variantId').isMongoId().withMessage('variantId không hợp lệ'),
  body('sku').optional().trim().isLength({ max: 50 }).withMessage('SKU tối đa 50 ký tự'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Giá phải là số không âm'),
  body('compareAtPrice').optional().isFloat({ min: 0 }).withMessage('Giá gốc phải là số không âm'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Tồn kho phải là số không âm'),
  body('images').optional().isArray({ max: 10 }).withMessage('Hình ảnh tối đa 10 URL'),
  body('attributes').optional().isArray({ min: 1 }).withMessage('Attributes là bắt buộc'),
  body('attributes.*.name').optional().trim().notEmpty().withMessage('Tên attribute là bắt buộc'),
  body('attributes.*.value').optional().trim().notEmpty().withMessage('Giá trị attribute là bắt buộc'),
  body('isDefault').optional().isBoolean().toBoolean(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const variant = product.variants.find(v => v._id?.equals(req.params.variantId));
      if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể' });

      Object.assign(variant, req.body);
      await product.save();
      return res.json({ message: 'Cập nhật biến thể thành công', product });
    } catch (err: any) {
      console.error('Update variant error:', err);
      if (err.name === 'ValidationError') return res.status(400).json({ message: 'Dữ liệu không hợp lệ', details: mongooseValidationErrors(err) });
      next(err);
    }
  },
];

// -- Delete variant --
export const deleteVariant = [
  idParamValidation,
  param('variantId').isMongoId().withMessage('variantId không hợp lệ'),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const variant = product.variants.find(v => v._id?.equals(req.params.variantId));
      if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể' });

      product.variants = product.variants.filter(v => !v._id?.equals(req.params.variantId));
      await product.save();
      return res.json({ message: 'Xóa biến thể thành công', product });
    } catch (err) {
      console.error('Delete variant error:', err);
      next(err);
    }
  },
];

// -- Patch stock (delta or absolute) --
export const patchStock = [
  idParamValidation,
  body('delta').optional().isInt().withMessage('Delta phải là số nguyên'),
  body('variantId').optional().isMongoId().withMessage('variantId không hợp lệ'),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { delta, variantId } = req.body;
      if (delta === undefined) return res.status(400).json({ message: 'Thiếu trường delta' });

      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      const updated = await product.updateStock(delta, variantId ? new Types.ObjectId(variantId) : undefined);
      return res.json({ message: 'Cập nhật tồn kho thành công', product: updated });
    } catch (err: any) {
      console.error('Patch stock error:', err);
      next(err);
    }
  },
];

// -- Helper: Extract validation errors --
function mongooseValidationErrors(err: any): Record<string, string> {
  const details: Record<string, string> = {};
  for (const key in err.errors) {
    details[key] = err.errors[key].message;
  }
  return details;
}
</parameter
</xai:function_call