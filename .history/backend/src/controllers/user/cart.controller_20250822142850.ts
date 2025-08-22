// src/controllers/user/cart.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { Cart } from '../../models/cart.model.js';
import { Product } from '../../models/product.model.js';
import { Order } from '../../models/order.model.js';
import type { AuthRequest } from '../../middlewares/types.js';

/**
 * Helpers
 */
const badReq = (res: Response, errors: any) => res.status(400).json({ errors: errors.array ? errors.array() : errors });

/**
 * GET /api/user/cart
 */
export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const cartDoc = await Cart.findOne({ user: (user as any)._id ?? user._id })
      .populate({
        path: 'items.product',
        select: 'name images price stock isNewProduct variants',
      })
      .exec();

    if (!cartDoc) return res.json({ items: [], totalQty: 0, totalEstimated: 0 });

    const itemsDetailed = (cartDoc.items || []).map((it: any) => {
      const prod = it.product as any;
      let available = true;
      let price = it.priceSnapshot ?? (prod?.price ?? 0);

      if (it.variant) {
        const variant = (prod?.variants || []).find((v: any) => String(v._id) === String(it.variant));
        if (!variant) {
          available = false;
        } else {
          price = variant.price;
          if ((variant.stock ?? 0) < (it.quantity ?? 0)) available = false;
        }
      } else {
        if ((prod?.stock ?? 0) < (it.quantity ?? 0)) available = false;
      }

      return {
        product: prod?._id ?? it.product,
        name: it.nameSnapshot ?? prod?.name ?? '',
        image: prod?.images?.[0] ?? null,
        sku: it.skuSnapshot ?? null,
        quantity: it.quantity,
        unitPrice: price,
        total: (price || 0) * (it.quantity || 0),
        available,
        isNewProduct: prod?.isNewProduct ?? undefined,
        productStock: prod?.stock ?? undefined,
      };
    });

    const totalQty = itemsDetailed.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
    const totalEstimated = itemsDetailed.reduce((s: number, it: any) => s + (it.total || 0), 0);

    return res.json({ items: itemsDetailed, totalQty, totalEstimated });
  } catch (err) {
    console.error('Get cart error:', err);
    next(err);
  }
};

/**
 * POST /api/user/cart
 */
export const addToCart = [
  body('product').isMongoId().withMessage('product must be a valid id'),
  body('variant').optional().isMongoId(),
  body('quantity').optional().isInt({ min: 1 }).toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const productId = String(req.body.product);
      const variantId = req.body.variant ? String(req.body.variant) : undefined;
      const qty = Math.max(1, Number(req.body.quantity ?? 1));

      const product = await Product.findById(productId).exec();
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      // check stock availability
      if (variantId) {
        const variant = (product.variants || []).find((v: any) => String(v._id) === String(variantId));
        if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể' });
        if ((variant.stock ?? 0) < qty) return res.status(400).json({ message: 'Không đủ tồn kho cho biến thể' });
      } else {
        if ((product.stock ?? 0) < qty) return res.status(400).json({ message: 'Không đủ tồn kho cho sản phẩm' });
      }

      // find or create cart
      let cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).exec();
      if (!cart) {
        cart = await Cart.create({ user: (user as any)._id ?? user._id, items: [] });
      }

      // compute price snapshot
      const priceSnap = variantId
        ? ((product.variants || []).find((v: any) => String(v._id) === String(variantId))?.price ?? product.price)
        : product.price;

      // Build opts object conditionally to avoid exact optional property typing issue
      const optsAny: any = {
        quantity: qty,
        priceSnapshot: priceSnap,
        nameSnapshot: product.name,
        skuSnapshot: undefined,
      };
      if (variantId) optsAny.variant = new Types.ObjectId(String(variantId));

      // call addItem (cast to any to bypass strict exact optional typing mismatch)
      await (cart as any).addItem(new Types.ObjectId(String(productId)), optsAny);

      return res.status(201).json({ message: 'Đã thêm vào giỏ hàng', cart });
    } catch (err) {
      const e = err as any;
      console.error('Add to cart error:', e && (e.stack || e));
      // prefer sending friendly message if available
      if (e && e.message && typeof e.message === 'string') return res.status(400).json({ message: e.message });
      next(err);
    }
  },
];

/**
 * PATCH /api/user/cart/:productId
 */
export const updateCartItemQty = [
  param('productId').isMongoId(),
  body('variant').optional().isMongoId(),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be >= 0').toInt(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const productId = String(req.params.productId);
      const variantId = req.body.variant ? String(req.body.variant) : null;
      const qty = Number(req.body.quantity);

      const prod = await Product.findById(productId).exec();
      if (!prod) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      if (qty > 0) {
        if (variantId) {
          const variant = (prod.variants || []).find((v: any) => String(v._id) === String(variantId));
          if (!variant) return res.status(404).json({ message: 'Không tìm thấy biến thể' });
          if ((variant.stock ?? 0) < qty) return res.status(400).json({ message: 'Không đủ tồn kho cho biến thể' });
        } else {
          if ((prod.stock ?? 0) < qty) return res.status(400).json({ message: 'Không đủ tồn kho cho sản phẩm' });
        }
      }

      const cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).exec();
      if (!cart) return res.status(404).json({ message: 'Giỏ hàng rỗng' });

      await (cart as any).updateItemQty(new Types.ObjectId(String(productId)), variantId ? new Types.ObjectId(String(variantId)) : null, qty);

      return res.json({ message: 'Cập nhật giỏ hàng thành công', cart });
    } catch (err) {
      console.error('Update cart qty error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /api/user/cart/:productId
 */
export const removeFromCart = [
  param('productId').isMongoId(),
  body('variant').optional().isMongoId(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const productId = String(req.params.productId);
      const variantId = req.body.variant ? String(req.body.variant) : null;

      const cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).exec();
      if (!cart) return res.status(404).json({ message: 'Giỏ hàng rỗng' });

      await (cart as any).removeItem(new Types.ObjectId(String(productId)), variantId ? new Types.ObjectId(String(variantId)) : null);

      return res.json({ message: 'Đã xoá sản phẩm khỏi giỏ hàng', cart });
    } catch (err) {
      console.error('Remove from cart error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /api/user/cart
 */
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).exec();
    if (!cart) return res.json({ message: 'Giỏ hàng đã rỗng' });

    await (cart as any).clear();
    return res.json({ message: 'Đã xoá toàn bộ giỏ hàng' });
  } catch (err) {
    console.error('Clear cart error:', err);
    next(err);
  }
};

/**
 * POST /api/user/cart/checkout
 */
export const checkout = [
  body('shippingAddress').trim().notEmpty().withMessage('Địa chỉ giao hàng là bắt buộc'),
  body('phone').trim().notEmpty().withMessage('Phone bắt buộc'),
  body('email').trim().isEmail().withMessage('Email không hợp lệ'),
  body('shippingMethod').optional().isIn(['ghn', 'ghtk', 'viettelpost', 'self']),
  body('paymentMethod').optional().isIn(['vnpay', 'momo', 'paypal', 'cod']),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const cart = await Cart.findOne({ user: (user as any)._id ?? user._id })
        .populate({ path: 'items.product', select: 'name price stock variants' })
        .exec();

      if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Giỏ hàng rỗng' });

      const itemsSnapshot: any[] = [];
      for (const it of cart.items) {
        const prod = it.product as any;
        if (!prod) return res.status(400).json({ message: `Thiếu thông tin sản phẩm trong giỏ` });

        let unitPrice = it.priceSnapshot ?? prod.price ?? 0;
        if (it.variant) {
          const variant = (prod.variants || []).find((v: any) => String(v._id) === String(it.variant));
          if (!variant) return res.status(400).json({ message: `Biến thể không tồn tại cho product ${prod._id}` });
          if ((variant.stock ?? 0) < it.quantity) return res.status(400).json({ message: `Không đủ tồn cho sản phẩm ${prod._id}` });
          unitPrice = variant.price;
        } else {
          if ((prod.stock ?? 0) < it.quantity) return res.status(400).json({ message: `Không đủ tồn cho sản phẩm ${prod._id}` });
        }

        itemsSnapshot.push({
          product: prod._id,
          variant: it.variant || undefined,
          name: it.nameSnapshot || prod.name,
          sku: it.skuSnapshot || null,
          quantity: it.quantity,
          price: unitPrice,
          total: unitPrice * it.quantity,
        });
      }

      const subTotal = itemsSnapshot.reduce((s, it) => s + it.total, 0);
      const shippingFee = Number(req.body.shippingFee ?? 0);
      const discount = Number(req.body.discount ?? 0);
      const totalAmount = Math.max(0, subTotal + shippingFee - discount);

      const orderData: any = {
        user: new Types.ObjectId((user as any)._id ?? user._id),
        items: itemsSnapshot,
        subTotal,
        shippingFee,
        discount,
        totalAmount,
        status: 'pending',
        paymentMethod: req.body.paymentMethod || 'cod',
        paymentStatus: 'unpaid',
        shippingAddress: req.body.shippingAddress,
        phone: req.body.phone,
        email: req.body.email,
        shippingMethod: req.body.shippingMethod || 'self',
        note: req.body.note || '',
      };

      // Prefer model's transaction helper if exists
      let createdOrder;
      try {
        if (typeof (Order as any).createWithTransaction === 'function') {
          createdOrder = await (Order as any).createWithTransaction(orderData);
        } else {
          // fallback transaction
          const session = await (Order as any).db.startSession();
          session.startTransaction();
          try {
            for (const it of itemsSnapshot) {
              const q = it.quantity;
              if (it.variant) {
                const prodRes = await Product.findOneAndUpdate(
                  { _id: it.product, 'variants._id': it.variant, 'variants.stock': { $gte: q } },
                  { $inc: { 'variants.$.stock': -q, sold: q } },
                  { session, new: true }
                ).exec();
                if (!prodRes) throw new Error(`Insufficient stock for product ${it.product}`);
              } else {
                const prodRes = await Product.findOneAndUpdate(
                  { _id: it.product, stock: { $gte: q } },
                  { $inc: { stock: -q, sold: q } },
                  { session, new: true }
                ).exec();
                if (!prodRes) throw new Error(`Insufficient stock for product ${it.product}`);
              }
            }
            const created = await (Order as any).create([orderData], { session });
            createdOrder = created[0];
            await session.commitTransaction();
            session.endSession();
          } catch (errInner) {
            await session.abortTransaction();
            session.endSession();
            throw errInner;
          }
        }
      } catch (errTx) {
        const e = errTx as any;
        console.error('Checkout tx error:', e && (e.stack || e));
        if (e && e.message && /Insufficient|stock/i.test(e.message)) {
          return res.status(400).json({ message: e.message });
        }
        throw errTx;
      }

      await (cart as any).clear();
      return res.status(201).json({ message: 'Tạo đơn hàng thành công', order: createdOrder });
    } catch (err) {
      console.error('Checkout error:', err);
      next(err);
    }
  },
];
