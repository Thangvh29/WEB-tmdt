import type { Request, Response, NextFunction } from 'express';
import { body, query, validationResult, param } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Product } from '../../models/product.model.js';
import type { AuthRequest } from '../../types.js';

/**
 * NOTE:
 * - This controller assumes you have an auth middleware that sets req.user = { _id, role }.
 * - Replace emitStockChange, saveAuditLog with your real implementations (socket/email/log).
 */

// Placeholder: emit event to websocket clients when stock changes
function emitStockChange(productId: string, payload: any) {
  // e.g., io.to(`product_${productId}`).emit('stockUpdate', payload);
  // implement your socket emission here
  console.log('[emitStockChange]', productId, payload);
}

// Placeholder: save audit log
async function saveAuditLog(userId: string | undefined, productId: string, action: string, meta: any) {
  // implement persistence: Audit.create({user, product, action, meta, at: new Date()})
  console.log('[audit]', { userId, productId, action, meta });
}

// Validation
export const updateStockValidation = [
  param('id').isMongoId().withMessage('product id không hợp lệ'),
  body('stock').isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số không âm'),
  body('variantId').optional().isMongoId().withMessage('variantId phải là ID hợp lệ'),
];

// GET inventory (improved)
export const getInventory = [
  query('name').optional().trim(),
  query('brand').optional().trim(),
  query('type').optional().trim(),
  query('stockStatus')
    .optional()
    .isIn(['inStock', 'outOfStock'])
    .withMessage('Trạng thái tồn kho phải là inStock hoặc outOfStock'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, brand, type, stockStatus } = req.query as any;
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Number(req.query.limit || 10));

      const filter: any = {};
      if (name) filter.name = { $regex: name, $options: 'i' };
      if (brand) filter.brand = { $regex: brand, $options: 'i' };
      if (type) filter.type = { $regex: type, $options: 'i' };
      if (stockStatus) {
        filter.stock = stockStatus === 'inStock' ? { $gt: 0 } : 0;
      }

      const products = await Product.find(filter)
        .select('name brand type images stock variants isNewProduct')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Product.countDocuments(filter);

      const mapped = products.map((product: any) => ({
        _id: product._id,
        name: product.name,
        brand: product.brand,
        type: product.type,
        image: product.images?.[0] ?? null,
        stock: product.stock,
        variants: (product.variants || []).map((v: any) => ({
          _id: v._id,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes,
        })),
        isNewProduct: !!product.isNewProduct,
        status: product.stock > 0 ? 'inStock' : 'outOfStock',
      }));

      return res.json({ products: mapped, total, page, limit });
    } catch (err) {
      console.error('Get inventory error:', err);
      next(err);
    }
  },
];

// UPDATE stock (atomic where possible)
export const updateStock = [
  ...updateStockValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      // Auth: only admin/staff allowed
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (!['admin', 'staff'].includes(user.role)) return res.status(403).json({ message: 'Forbidden' });

      const productId = req.params.id;
      const { stock, variantId } = req.body;

      // Use session for safety
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const product = await Product.findById(productId).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        if (variantId) {
          // find variant by ObjectId equality
          const v = product.variants?.find((x: any) => x._id && x._id.equals(variantId));
          if (!v) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Không tìm thấy biến thể' });
          }
          const oldVariantStock = v.stock ?? 0;
          v.stock = Number(stock);

          // Recompute product.stock
          product.stock = (product.variants || []).reduce((s: number, it: any) => s + (it.stock ?? 0), 0);

          await product.save({ session });

          // audit & emit
          await saveAuditLog(user._id?.toString(), productId, 'update_variant_stock', {
            variantId,
            old: oldVariantStock,
            new: v.stock,
          });
          emitStockChange(productId, { variantId, stock: v.stock, productStock: product.stock });
        } else {
          // Update product-level stock
          const oldStock = product.stock ?? 0;
          product.stock = Number(stock);

          // if variants exist, update default variant as fallback (optional)
          if ((product.variants || []).length > 0) {
            const defaultVariant = product.variants.find((x: any) => x.isDefault) || product.variants[0];
            if (defaultVariant) {
              const oldV = defaultVariant.stock ?? 0;
              defaultVariant.stock = Number(stock);
              // recompute total product.stock
              product.stock = (product.variants || []).reduce((s: number, it: any) => s + (it.stock ?? 0), 0);
              await saveAuditLog(user._id?.toString(), productId, 'update_variant_stock_via_product', {
                variantId: defaultVariant._id,
                old: oldV,
                new: defaultVariant.stock,
              });
            }
          }
          await product.save({ session });

          await saveAuditLog(user._id?.toString(), productId, 'update_product_stock', { old: oldStock, new: product.stock });
          emitStockChange(productId, { productStock: product.stock });
        }

        await session.commitTransaction();
        session.endSession();

        return res.json({
          message: 'Cập nhật tồn kho thành công',
          product: {
            _id: product._id,
            name: product.name,
            stock: product.stock,
            variants: (product.variants || []).map((v: any) => ({ _id: v._id, stock: v.stock, price: v.price })),
            status: product.stock > 0 ? 'inStock' : 'outOfStock',
          },
        });
      } catch (errInner) {
        await session.abortTransaction();
        session.endSession();
        throw errInner;
      }
    } catch (err) {
      console.error('Update stock error:', err);
      next(err);
    }
  },
];
