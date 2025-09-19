import { Schema, model, Document, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

// Interface cho Variant
export interface IVariant {
  _id?: Types.ObjectId;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images?: string[];
  attributes: { name: string; value: string }[];
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface cho Product document
export interface IProduct extends Document {
  name: string;
  brand: string;
  type: string;
  images: string[];
  price: number;
  specs: { key: string; value: string }[];
  commitments: string[];
  description?: string;
  isNewProduct: boolean;
  owner?: Types.ObjectId;
  stock: number;
  sold: number;
  isApproved: boolean;
  category: Types.ObjectId;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  variants?: IVariant[];
  createdAt: Date;
  updatedAt: Date;
  getVariantByAttrs(attrs: { name: string; value: string }[]): IVariant | null;
  getMinPrice(): number;
  getMaxPrice(): number;
  updateStock(delta: number, variantId?: Types.ObjectId): Promise<IProduct>;
  averageRating?: number;
  reportCount?: number;
}

// Schema cho Spec
const SpecSchema = new Schema(
  { key: String, value: String },
  { _id: false }
);

// Schema cho Variant
const VariantSchema = new Schema<IVariant>(
  {
    sku: { type: String, trim: true, index: true },
    price: { type: Number, required: [true, 'Giá biến thể là bắt buộc'], min: [0, 'Giá không được âm'] },
    compareAtPrice: { type: Number, min: [0, 'Giá gốc không được âm'] },
    stock: { type: Number, required: [true, 'Số lượng tồn kho là bắt buộc'], min: [0, 'Tồn kho không được âm'] },
    images: { type: [String], default: [] },
    attributes: { type: [{ name: String, value: String }], default: [] },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Schema cho Product
const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, 'Tên sản phẩm là bắt buộc'], trim: true, index: 'text' },
    brand: { type: String, required: [true, 'Hãng là bắt buộc'], trim: true, index: 'text' },
    type: { type: String, required: [true, 'Loại là bắt buộc'], trim: true, index: 'text' },
    images: { type: [String], required: [true, 'Ít nhất 1 ảnh'], validate: { validator: (v: string[]) => v.length >= 1 && v.length <= 10, message: 'Ảnh từ 1 đến 10' } },
    price: { type: Number, required: [true, 'Giá là bắt buộc'], min: [0, 'Giá không được âm'] },
    specs: { type: [SpecSchema], default: [] },
    commitments: { type: [String], default: [] },
    description: { type: String, trim: true, index: 'text' },
    isNewProduct: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    stock: { type: Number, default: 0, min: [0, 'Tồn kho không được âm'] },
    sold: { type: Number, default: 0, min: 0 },
    isApproved: { type: Boolean, default: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'Danh mục là bắt buộc'] },
    condition: { type: String, enum: ['new', 'like_new', 'good', 'fair', 'poor'], default: 'new' },
    variants: { type: [VariantSchema], default: [] },
  },
  { timestamps: true }
);

// Pre-save: recompute price/stock from variants
ProductSchema.pre('save', function (this: IProduct, next) {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((s: number, v: IVariant) => s + v.stock, 0);
    this.price = Math.min(...this.variants.map(v => v.price));
    this.isNewProduct = this.condition === 'new';
  } else {
    this.isNewProduct = this.condition === 'new';
  }
  next();
});

// Virtual: averageRating
ProductSchema.virtual('averageRating').get(async function (this: IProduct) {
  const ReviewModel = mongoose.model('Review');
  const agg = await ReviewModel.aggregate([
    { $match: { product: this._id, approved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  return agg.length > 0 ? agg[0].avg : 0;
});

// Virtual: reportCount
ProductSchema.virtual('reportCount').get(async function (this: IProduct) {
  const ReportModel = mongoose.model('Report');
  return await ReportModel.countDocuments({ targetType: 'Product', targetId: this._id }).exec();
});

// Methods
ProductSchema.methods.getVariantByAttrs = function (this: IProduct, attrs: { name: string; value: string }[]): IVariant | null {
  if (!this.variants || this.variants.length === 0) return null;
  const variant = this.variants.find((v: IVariant) =>
    attrs.every(a => v.attributes.some(x => x.name === a.name && x.value === a.value))
  );
  return variant || this.variants.find((v: IVariant) => v.isDefault) || null;
};

ProductSchema.methods.getMinPrice = function (this: IProduct): number {
  if (this.variants && this.variants.length > 0) {
    return Math.min(...this.variants.map((v: IVariant) => v.price));
  }
  return this.price;
};

ProductSchema.methods.getMaxPrice = function (this: IProduct): number {
  if (this.variants && this.variants.length > 0) {
    return Math.max(...this.variants.map((v: IVariant) => v.price));
  }
  return this.price;
};

ProductSchema.methods.updateStock = async function (this: HydratedDocument<IProduct>, delta: number, variantId?: Types.ObjectId): Promise<IProduct> {
  if (variantId && this.variants) {
    const variant = this.variants.find(v => v._id?.equals(variantId));
    if (variant) variant.stock = Math.max(0, variant.stock + delta);
  }
  this.stock = Math.max(0, this.stock + delta);
  await this.save();
  return this;
};

// Indexes
ProductSchema.index({ name: 'text', brand: 'text', type: 'text', description: 'text' });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ 'variants.price': 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ owner: 1 });
ProductSchema.index({ condition: 1 });

export const Product = model<IProduct>('Product', ProductSchema);