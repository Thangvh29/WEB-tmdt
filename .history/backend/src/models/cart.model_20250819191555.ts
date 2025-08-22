import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId; // optional: nếu dùng variants/SKU
  quantity: number;
  // optional snapshot fields (useful if you want to snapshot price at add-to-cart time)
  priceSnapshot?: number; // price at time user added (optional)
  skuSnapshot?: string;
  nameSnapshot?: string;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;

  // methods
  addItem(productId: Types.ObjectId, opts?: { variant?: Types.ObjectId; quantity?: number; priceSnapshot?: number; nameSnapshot?: string; skuSnapshot?: string }): Promise<ICart>;
  updateItemQty(productId: Types.ObjectId, variantId: Types.ObjectId | null, qty: number): Promise<ICart>;
  removeItem(productId: Types.ObjectId, variantId?: Types.ObjectId | null): Promise<ICart>;
  clear(): Promise<ICart>;
  getSummary(populate?: boolean): Promise<{ totalQty: number; totalEstimated?: number }>;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, required: false, index: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceSnapshot: { type: Number, min: 0 }, // optional
    skuSnapshot: { type: String, trim: true },
    nameSnapshot: { type: String, trim: true },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }, // one cart per user
    items: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true, // createdAt & updatedAt
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Indexes */
CartSchema.index({ user: 1 }, { unique: true });
CartSchema.index({ 'items.product': 1 });
CartSchema.index({ 'items.variant': 1 });

/** Instance methods */

// Add item: if same product+variant exists -> increment quantity, else push new
CartSchema.methods.addItem = async function (
  productId: Types.ObjectId,
  opts: { variant?: Types.ObjectId; quantity?: number; priceSnapshot?: number; nameSnapshot?: string; skuSnapshot?: string } = {}
) {
  const qty = Math.max(1, opts.quantity ?? 1);
  // find existing
  const matchIndex = this.items.findIndex(it => {
    const sameProduct = it.product.equals(productId);
    const sameVariant = (it.variant && opts.variant) ? it.variant.equals(opts.variant) : (!it.variant && !opts.variant);
    return sameProduct && sameVariant;
  });

  if (matchIndex !== -1) {
    this.items[matchIndex].quantity = Math.max(1, this.items[matchIndex].quantity + qty);
    // optionally update snapshot fields if provided
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

// Update quantity (set). If qty <= 0 then remove item.
CartSchema.methods.updateItemQty = async function (productId: Types.ObjectId, variantId: Types.ObjectId | null, qty: number) {
  const idx = this.items.findIndex(it => {
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
  this.items = this.items.filter(it => {
    const p = !it.product.equals(productId);
    const v = variantId ? !(it.variant && it.variant.equals(variantId)) : true;
    // keep if product differs OR variant differs (if variant specified)
    return p || v;
  });
  await this.save();
  return this;
};

// Clear cart
CartSchema.methods.clear = async function () {
  this.items = [];
  await this.save();
  return this;
};

// get summary: totalQty, optional estimated total (if priceSnapshot available OR populate true)
CartSchema.methods.getSummary = async function (populate: boolean = false) {
  const totalQty = this.items.reduce((s: number, it: ICartItem) => s + (it.quantity || 0), 0);
  let totalEstimated: number | undefined = undefined;

  if (this.items.length === 0) {
    return { totalQty: 0, totalEstimated: 0 };
  }

  // If priceSnapshot present for most items, compute estimated
  const snapshotSum = this.items.reduce((s: number, it: ICartItem) => s + ((it.priceSnapshot ?? 0) * (it.quantity ?? 0)), 0);
  const hasSnapshot = this.items.some(it => typeof it.priceSnapshot === 'number');
  if (hasSnapshot) totalEstimated = snapshotSum;

  // If user asked to populate, compute using current product/variant prices
  if (populate) {
    await this.populate({
      path: 'items.product',
      select: 'price variants name',
      populate: { path: 'variants', select: '_id price sku' },
    }).execPopulate?.();

    // compute using current prices (variants override product price)
    let curSum = 0;
    for (const it of this.items) {
      // find product doc
      const prod = (it as any).product;
      if (!prod) continue;
      if (it.variant) {
        // find variant price if exists
        const variant = (prod.variants || []).find((v: any) => v._id.equals(it.variant));
        if (variant && typeof variant.price === 'number') {
          curSum += variant.price * it.quantity;
          continue;
        }
      }
      // fallback to product price
      curSum += (prod.price ?? 0) * it.quantity;
    }
    totalEstimated = curSum;
  }

  return { totalQty, totalEstimated };
};

export const Cart = model<ICart>('Cart', CartSchema);
