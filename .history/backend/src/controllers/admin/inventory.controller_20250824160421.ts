import type { Request, Response, NextFunction } from 'express';
import { body, query, validationResult, param } from 'express-validator';
import mongoose, { Types } from 'mongoose';
import { Product } from '../../models/product.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

/**
 * NOTE:
 * - This controller assumes you have an auth middleware that sets req.user = { _id, role }.
 * - Replace emitStockChange, saveAuditLog with your real implementations (socket/email/log).
 */

// Placeholder: emit event to websocket clients when stock changes
function emitStockChange(productId: string, payload: any) {
  console.log('[emitStockChange]', productId, payload);
}

// Placeholder: save audit log
async function saveAuditLog(userId: string | undefined, productId: string, action: string, meta: any) {
  console.log('[audit]', { userId, productId, action, meta });
}

/**
 * Helpers to satisfy TypeScript strictness
 */
function toObjectIdOrUndefined(id?: string | undefined): Types.ObjectId | undefined {
  if (id === undefined || id === null) return undefined;
  return new Types.ObjectId(String(id));
}

function ensureString(val: string | undefined, name = 'value'): string {
  if (val === undefined || val === null) throw new Error(`${name} is required`);
  return String(val);
}

// Validation for GET inventory
export const getInventoryValidation = [
  query('name').optional().trim(),
  query('brand').optional().trim(),
  query('type').optional().trim(),
  query('stockStatus')
    .optional()
    .isIn(['inStock', 'outOfStock', ''])
    .withMessage('stockStatus phải là inStock, outOfStock hoặc rỗng'),
];

// Validation for updating stock
export const updateStockValidation = [
  param('id').isMongoId().withMessage('product id không hợp lệ'),
  body('stock').isInt({ min: 0 }).withMessage('Số lượng tồn kho phải là số không âm'),
  body('variantId').optional().isMongoId().withMessage('variantId phải là ID hợp lệ'),
];

// GET inventory
export const getInventory = [
  ...getInventoryValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, brand, type, stockStatus } = req.query as any;
      const query: any = { isApproved: true };
      if (name) query.name = { $regex: name, $options: 'i' };
      if (brand) query.brand = { $regex: brand, $options: 'i' };
      if (type) query.type = type;
      if (stockStatus) query.stock = stockStatus === 'inStock' ? { $gt: 0 } : { $eq: 0 };

      const products = await Product.find(query)
        .select('name brand type images price stock variants')
        .lean();

      return res.json({
        message: 'Lấy danh sách tồn kho thành công',
        products,
      });
    } catch (err) {
      console.error('Get inventory error:', err);
      next(err);
    }
  },
];

// PATCH /:id/stock
export const updateStock = [
  ...updateStockValidation,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const productId = ensureString(req.params.id, 'product id');
      const stock = Number(req.body.stock);
      const variantId = toObjectIdOrUndefined(req.body.variantId);
      const variantIdStr = variantId ? variantId.toString() : undefined;

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const product = await Product.findById(productId).session(session);
        if (!product) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        if (variantId && product.variants) {
          const variant = product.variants.find((v: any) => v._id?.equals(variantId));
          if (!variant) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Không tìm thấy biến thể' });
          }

          const oldStock = variant.stock ?? 0;
          variant.stock = stock;
          product.stock = (product.variants || []).reduce((s: number, it: any) => s + (it.stock ?? 0), 0);

          await product.save({ session });
          await saveAuditLog(user._id?.toString(), productId, 'update_variant_stock', {
            variantId: variantIdStr,
            old: oldStock,
            new: variant.stock,
          });
          emitStockChange(productId, { variantId: variantIdStr, stock: variant.stock, productStock: product.stock });
        } else {
          const oldStock = product.stock ?? 0;
          product.stock = stock;

          const variants = product.variants ?? [];
          if (variants.length > 0) {
            const defaultVariant = variants.find((x: any) => x.isDefault) || variants[0];
            if (defaultVariant) {
              const oldV = defaultVariant.stock ?? 0;
              defaultVariant.stock = stock;
              product.stock = (product.variants || []).reduce((s: number, it: any) => s + (it.stock ?? 0), 0);
              await saveAuditLog(user._id?.toString(), productId, 'update_variant_stock_via_product', {
                variantId: defaultVariant._id?.toString ? defaultVariant._id.toString() : defaultVariant._id,
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