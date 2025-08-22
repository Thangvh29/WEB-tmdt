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
 * Return cart with populated product info, availability flags and computed totals.
 */
export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    let cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).lean().exec();
    if (!cart) return res.json({ items: [], totalQty: 0, totalEstimated: 0 });

    // populate products for richer info
    // we re-query to populate because the model method may not be applied on lean doc
    const cartDoc = await Cart.findOne({ user: (user as any)._id ?? user._id })
      .populate({
        path: 'items.product',
        select: 'name images price stock isNewProduct variants',
      })
      .exec();

    // compute totals & availability
    const itemsDetailed = (cartDoc?.items || []).map((it: any) => {
      const prod = it.product as any;
      let available = true;
      let price = it.priceSnapshot ?? (prod?.price ?? 0);
      if (it.variant) {
        // try to find variant in populated product
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
 * Add item to cart
 * body: { product: productId, variant?: variantId, quantity?: number }
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

      const productId = req.body.product;
      const variantId = req.body.variant;
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

      // add item using model method; include price & snapshot name/sku
      const priceSnap = variantId
        ? ((product.variants || []).find((v: any) => String(v._id) === String(variantId))?.price ?? product.price)
        : product.price;

      await cart.addItem(new Types.ObjectId(String(productId)), {
        variant: variantId ? new Types.ObjectId(String(variantId)) : undefined,
        quantity: qty,
        priceSnapshot: priceSnap,
        nameSnapshot: product.name,
        skuSnapshot: undefined,
      });

      return res.status(201).json({ message: 'Đã thêm vào giỏ hàng', cart });
    } catch (err) {
      console.error('Add to cart error:', err);
      next(err);
    }
  },
];

/**
 * PATCH /api/user/cart/:productId
 * Update quantity for an item (variant optional as query/body)
 * body: { variant?: id, quantity: number }
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

      const productId = req.params.productId;
      const variantId = req.body.variant ?? null;
      const qty = Number(req.body.quantity);

      const prod = await Product.findById(productId).exec();
      if (!prod) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      // if qty > available -> reject
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

      await cart.updateItemQty(new Types.ObjectId(String(productId)), variantId ? new Types.ObjectId(String(variantId)) : null, qty);

      return res.json({ message: 'Cập nhật giỏ hàng thành công', cart });
    } catch (err) {
      console.error('Update cart qty error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /api/user/cart/:productId
 * Remove item (variant optional via body.query)
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

      const productId = req.params.productId;
      const variantId = req.body.variant ?? null;

      const cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).exec();
      if (!cart) return res.status(404).json({ message: 'Giỏ hàng rỗng' });

      await cart.removeItem(new Types.ObjectId(String(productId)), variantId ? new Types.ObjectId(String(variantId)) : null);

      return res.json({ message: 'Đã xoá sản phẩm khỏi giỏ hàng', cart });
    } catch (err) {
      console.error('Remove from cart error:', err);
      next(err);
    }
  },
];

/**
 * DELETE /api/user/cart
 * Clear cart
 */
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const cart = await Cart.findOne({ user: (user as any)._id ?? user._id }).exec();
    if (!cart) return res.json({ message: 'Giỏ hàng đã rỗng' });

    await cart.clear();
    return res.json({ message: 'Đã xoá toàn bộ giỏ hàng' });
  } catch (err) {
    console.error('Clear cart error:', err);
    next(err);
  }
};

/**
 * POST /api/user/cart/checkout
 * Create order from cart, decrease stock in a transaction.
 * Body: { shippingAddress, phone, email, shippingMethod?, paymentMethod?, shippingFee?, discount? }
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

      // load cart and populate products
      const cart = await Cart.findOne({ user: (user as any)._id ?? user._id })
        .populate({ path: 'items.product', select: 'name price stock variants' })
        .exec();

      if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Giỏ hàng rỗng' });

      // Validate stock again and build order items snapshot
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

      // build orderData
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
        paymentStatus: req.body.paymentMethod === 'cod' ? 'unpaid' : 'unpaid',
        shippingAddress: req.body.shippingAddress,
        phone: req.body.phone,
        email: req.body.email,
        shippingMethod: req.body.shippingMethod || 'self',
        note: req.body.note || '',
      };

      // Use Order.createWithTransaction (model implements stock decrement) if available
      let createdOrder;
      if (typeof (Order as any).createWithTransaction === 'function') {
        try {
          createdOrder = await (Order as any).createWithTransaction(orderData);
        } catch (err: any) {
          // propagate stock errors nicely
          if (err && err.message && err.message.startsWith('Insufficient')) {
            return res.status(400).json({ message: err.message });
          }
          throw err;
        }
      } else {
        // fallback: naive transaction
        const session = await (Order as any).db.startSession();
        session.startTransaction();
        try {
          for (const it of itemsSnapshot) {
            const q = it.quantity;
            // atomically decrement product stock (without variants)
            if (it.variant) {
              // decrement variant inside product doc
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
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          if (err && err.message && err.message.startsWith('Insufficient')) {
            return res.status(400).json({ message: err.message });
          }
          throw err;
        }
      }

      // Clear cart after successful order
      await cart.clear();

      return res.status(201).json({ message: 'Tạo đơn hàng thành công', order: createdOrder });
    } catch (err) {
      console.error('Checkout error:', err);
      next(err);
    }
  },
];
