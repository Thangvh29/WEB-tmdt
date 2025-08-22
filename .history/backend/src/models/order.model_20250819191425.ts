import { Schema, model, Document, Types, ClientSession } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  variant?: Types.ObjectId; // optional: nếu dùng variants/SKU
  name?: string;            // snapshot name
  sku?: string;             // snapshot sku
  quantity: number;
  price: number;            // price per unit at purchase time
  total: number;            // price * quantity
}

export interface IStatusHistory {
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'failed' | 'cancelled';
  by?: Types.ObjectId | null;   // who changed (admin/user)
  note?: string | null;
  at: Date;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  subTotal: number;        // sum(items.total)
  shippingFee: number;
  discount: number;
  totalAmount: number;     // subTotal + shippingFee - discount
  status: 'pending' | 'preparing' | 'shipped' | 'delivered' | 'failed' | 'cancelled';
  statusHistory: IStatusHistory[];
  paymentMethod?: 'vnpay' | 'momo' | 'paypal' | 'cod';
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partial';
  note?: string;
  shippingAddress: string;
  phone: string;
  email: string;
  shippingMethod?: 'ghn' | 'ghtk' | 'viettelpost' | 'self';
  trackingId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // methods
  addStatus(status: IStatusHistory): Promise<IOrder>;
  markPaid(txn?: { provider: string; txnId?: string }): Promise<IOrder>;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, required: false },
    name: { type: String, required: true, trim: true }, // snapshot of product name
    sku: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IStatusHistory>(
  {
    status: {
      type: String,
      enum: ['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled'],
      required: true,
    },
    by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], required: true, validate: [(v: IOrderItem[]) => v.length > 0, 'Order must have at least one item'] },
    subTotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'preparing', 'shipped', 'delivered', 'failed', 'cancelled'], default: 'pending', index: true },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    paymentMethod: { type: String, enum: ['vnpay', 'momo', 'paypal', 'cod'], default: 'cod' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded', 'partial'], default: 'unpaid', index: true },
    note: { type: String, trim: true, default: '' },
    shippingAddress: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, match: [/^\d{7,15}$/, 'Invalid phone number'] },
    email: { type: String, required: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    shippingMethod: { type: String, enum: ['ghn', 'ghtk', 'viettelpost', 'self'], default: 'self' },
    trackingId: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Indexes for searching & reporting */
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ 'items.product': 1 });

/** Pre-validate: compute totals from items to avoid mismatch from client */
OrderSchema.pre<IOrder>('validate', function (next) {
  try {
    if (!this.items || this.items.length === 0) {
      return next(new Error('Order must contain at least one item'));
    }
    // compute subTotal from items.total
    const computedSub = this.items.reduce((s, it) => s + (it.total ?? it.price * it.quantity), 0);
    this.subTotal = computedSub;
    // ensure shippingFee/discount default
    this.shippingFee = this.shippingFee || 0;
    this.discount = this.discount || 0;
    // compute total
    this.totalAmount = Math.max(0, this.subTotal + this.shippingFee - this.discount);
    // ensure statusHistory has initial record
    if (!this.statusHistory || this.statusHistory.length === 0) {
      this.statusHistory = [{ status: this.status as any, by: null, note: 'Order created', at: new Date() }];
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

/**
 * Method: addStatus
 * Pushes a status change to history and updates current status
 */
OrderSchema.methods.addStatus = async function (entry: IStatusHistory) {
  this.status = entry.status as any;
  this.statusHistory.push({ ...entry, at: entry.at || new Date() } as any);
  await this.save();
  return this;
};

/**
 * Method: markPaid
 * Mark order as paid (update paymentStatus); optionally accepts txn info
 */
OrderSchema.methods.markPaid = async function (txn?: { provider: string; txnId?: string }) {
  this.paymentStatus = 'paid';
  // push statusHistory entry
  this.statusHistory.push({ status: this.status, by: null, note: `Paid via ${txn?.provider || 'unknown'} ${txn?.txnId || ''}`, at: new Date() } as any);
  await this.save();
  return this;
};

/**
 * Static helper: create order with stock decrement in a transaction
 * Usage: await Order.createWithTransaction(orderData, session)
 */
OrderSchema.statics.createWithTransaction = async function (orderData: Partial<IOrder>, session?: ClientSession) {
  const OrderModel = this as any;
  const mongoose = OrderModel.db;
  const sess = session || (await mongoose.startSession());
  let created: any;
  try {
    if (!session) sess.startTransaction();
    // 1) optionally validate and reserve stock: decrement product stock by item quantities
    for (const it of (orderData.items || []) as IOrderItem[]) {
      // Use atomic update and check
      const res = await mongoose.model('Product').findOneAndUpdate(
        { _id: it.product, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity, sold: it.quantity } },
        { session: sess, new: true }
      );
      if (!res) {
        throw new Error(`Insufficient stock for product ${it.product}`);
      }
      // Optionally snapshot name/sku into item (done at controller level)
    }
    // 2) create order
    created = await OrderModel.create([orderData], { session: sess });
    if (!session) await sess.commitTransaction();
    return created[0];
  } catch (err) {
    if (!session) await sess.abortTransaction();
    throw err;
  } finally {
    if (!session) sess.endSession();
  }
};

export const Order = model<IOrder>('Order', OrderSchema);
