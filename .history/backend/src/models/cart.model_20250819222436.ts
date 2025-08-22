import { Schema, model, Document, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

// Interface cho CartItem
export interface ICartItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId;
  quantity: number;
  priceSnapshot?: number;
  skuSnapshot?: string;
  nameSnapshot?: string;
}

// Interface cho Cart
export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
  addItem(productId: Types.ObjectId, opts?: { variant?: Types.ObjectId; quantity?: number; priceSnapshot?: number; nameSnapshot?: string; skuSnapshot?: string }): Promise<ICart>;
  updateItemQty(productId: Types.ObjectId, variantId: Types.ObjectId | null, qty: number): Promise<ICart>;
  removeItem(productId: Types.ObjectId, variantId?: Types.ObjectId | null): Promise<ICart>;
  clear(): Promise<ICart>;
  getSummary(populate?: boolean): Promise<{ totalQty: number; totalEstimated?: number }>;
  totalItems?: number; // Virtual mới
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, required: false, index: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceSnapshot: { type: Number, min: 0 },
    skuSnapshot: { type: String, trim: true },
    nameSnapshot: { type: String, trim: true },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index
CartSchema.index({ user: 1 }, { unique: true });
CartSchema.index({ 'items.product': 1 });
CartSchema.index({ 'items.variant': 1 });

// Pre-save: Check stock
CartSchema.pre('save', async function (next) {
  const ProductModel = model('Product');
  for (const item of this.items) {
    const product = await ProductModel.findById(item.product).select('stock variants');
    if (!product) return next(new Error(`Product ${item.product} not found`));
    const stock = item.variant
      ? product.variants?.find(v => v._id?.equals(item.variant))?.stock || 0
      : product.stock;
    if (stock < item.quantity) return next(new Error(`Insufficient stock for product ${item.product}`));
  }
  next();
});

// Virtual totalItems
CartSchema.virtual('totalItems').get(function () {
  return this.items.length;
});

// Add item
CartSchema.methods.addItem = async function (
  this: HydratedDocument<ICart>,
  productId: Types.ObjectId,
  opts: { variant?: Types.ObjectId; quantity?: number; priceSnapshot?: number; nameSnapshot?: string; skuSnapshot?: string } = {}
) {
  const qty = Math.max(1, opts.quantity ?? 1);
  const matchIndex = this.items.findIndex((it: ICartItem) => {
    const sameProduct = it.product.equals(productId);
    const sameVariant = (it.variant && opts.variant) ? it.variant.equals(opts.variant) : (!it.variant && !opts.variant);
    return sameProduct && sameVariant;
  });

  if (matchIndex !== -1) {
    this.items[matchIndex].quantity = Math.max(1, this.items[matchIndex].quantity + qty);
    if (opts.priceSnapshot != null) this.items[matchIndex].priceSnapshot = opts.priceSnapshot;
    if (opts.nameSnapshot) this.items[matchIndex].nameSnapshot = opts.nameSnapshot;
    if (opts.skuSnapshot) this.items[matchIndex].skuSnapshot = opts.skuSnapshot;
  } else {
    this.items.push({
      product: productId,
      variant: opts.variant,
      quantity: qty,
      priceSnapshot: opts.priceSnapshot,
      nameSnapshot: opts.nameSnapshot,
      skuSnapshot: opts.skuSnapshot,
    });
  }

  await this.save();
  return this;
};

// Update qty
CartSchema.methods.updateItemQty = async function (productId: Types.ObjectId, variantId: Types.ObjectId | null, qty: number) {
  const idx = this.items.findIndex((it: ICartItem) => {
    const p = it.product.equals(productId);
    const v = (it.variant && variantId) ? it.variant.equals(variantId) : (!it.variant && !variantId);
    return p && v;
  });

  if (idx === -1) throw new Error('Item not found in cart');

  if (qty <= 0) {
    this.items.splice(idx, 1);
  } else {
    this.items[idx].quantity = qty;
  }

  await this.save();
  return this;
};

// Remove item
CartSchema.methods.removeItem = async function (productId: Types.ObjectId, variantId: Types.ObjectId | null = null) {
  this.items = this.items.filter((it: ICartItem) => {
    const p = !it.product.equals(productId);
    const v = variantId ? !(it.variant && it.variant.equals(variantId)) : true;
    return p || v;
  });
  await this.save();
  return this;
};

// Clear
CartSchema.methods.clear = async function () {
  this.items = [];
  await this.save();
  return this;
};

// Summary
CartSchema.methods.getSummary = async function (populate: boolean = false) {
  const totalQty = this.items.reduce((s: number, it: ICartItem) => s + (it.quantity || 0), 0);
  let totalEstimated: number | undefined = undefined;

  if (this.items.length === 0) {
    return { totalQty: 0, totalEstimated: 0 };
  }

  const snapshotSum = this.items.reduce((s: number, it: ICartItem) => s + ((it.priceSnapshot ?? 0) * (it.quantity ?? 0)), 0);
  const hasSnapshot = this.items.some((it: ICartItem) => typeof it.priceSnapshot === 'number');
  if (hasSnapshot) totalEstimated = snapshotSum;

  if (populate) {
    await this.populate({
      path: 'items.product',
      select: 'price variants name',
      populate: { path: 'variants', select: '_id price sku' },
    });

    let curSum = 0;
    for (const it of this.items as any[]) {
      const prod = (it as any).product;
      if (!prod) continue;
      if (it.variant) {
        const variant = (prod.variants || []).find((v: any) => v._id.equals(it.variant));
        if (variant && typeof variant.price === 'number') {
          curSum += variant.price * it.quantity;
          continue;
        }
      }
      curSum += (prod.price ?? 0) * it.quantity;
    }
    totalEstimated = curSum;
  }

  return { totalQty, totalEstimated };
};

export const Cart = model<ICart>('Cart', CartSchema);
