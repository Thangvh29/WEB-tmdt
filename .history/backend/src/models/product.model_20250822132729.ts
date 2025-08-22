// src/models/product.model.ts
import { Schema, model, Document, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Variant types
 */
// Base payload type (dùng khi gửi/nhận từ client)
export interface IVariantBase {
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

// Subdocument type (khi nằm trong Product.variants)
// _id là bắt buộc trên subdocument, nên gõ rõ để TypeScript không phàn nàn
export type IVariantSubdoc = Types.Subdocument & IVariantBase & { _id: Types.ObjectId };

// Xuất ra ngoài nếu cần dùng payload kiểu variant (không bắt buộc _id)
export type IVariant = IVariantBase;

/**
 * Product interface
 */
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

  // DocumentArray chứa các subdocument variants
  variants?: Types.DocumentArray<IVariantSubdoc>;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  getVariantByAttrs(attrs: { name: string; value: string }[]): IVariantSubdoc | null;
  getMinPrice(): number;
  getMaxPrice(): number;
  updateStock(delta: number, variantId?: Types.ObjectId): Promise<IProduct>;

  // Async helpers
  getAverageRating(): Promise<number>;
  getReportCount(): Promise<number>;
}

/**
 * Schemas
 */
const SpecSchema = new Schema(
  { key: String, value: String },
  { _id: false }
);

const VariantSchema = new Schema<IVariantBase>(
  {
    sku: { type: String, trim: true, index: true },
    price: { type: Number, required: [true, 'Giá biến thể là bắt buộc'], min: [0, 'Giá không được âm'] },
    compareAtPrice: { type: Number, min: [0, 'Giá gốc không được âm'] },
    stock: { type: Number, required: [true, 'Số lượng tồn kho là bắt buộc'], min: [0, 'Tồn kho không được âm'], default: 0 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: 'Biến thể không được có quá 10 ảnh',
      },
    },
    attributes: [
      {
        name: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
      },
    ],
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true,
      minlength: [3, 'Tên sản phẩm phải có ít nhất 3 ký tự'],
      maxlength: [150, 'Tên sản phẩm không được vượt quá 150 ký tự'],
    },
    brand: {
      type: String,
      required: [true, 'Thương hiệu là bắt buộc'],
      trim: true,
      minlength: [2, 'Thương hiệu phải có ít nhất 2 ký tự'],
      maxlength: [80, 'Thương hiệu không được vượt quá 80 ký tự'],
      lowercase: true,
    },
    type: {
      type: String,
      required: [true, 'Loại sản phẩm là bắt buộc'],
      trim: true,
      lowercase: true,
      enum: [
        'laptop', 'gpu', 'monitor', 'mouse', 'keyboard', 'cpu', 'ram', 'ssd', 'hdd', 'accessory', 'tablet', 'phone', 'other'
      ],
      index: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length >= 3 && v.length <= 10,
        message: 'Sản phẩm phải có từ 3 đến 10 ảnh',
      },
    },
    price: {
      type: Number,
      required: [true, 'Giá sản phẩm là bắt buộc'],
      min: [0, 'Giá không được âm'],
    },
    specs: { type: [SpecSchema], default: [] },
    commitments: { type: [String], default: [] },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Mô tả không được vượt quá 5000 ký tự'],
    },
    isNewProduct: { type: Boolean, default: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    stock: { type: Number, default: 0, min: [0, 'Tồn kho không được âm'], index: true },
    sold: { type: Number, default: 0, min: [0, 'Số lượng đã bán không được âm'] },
    isApproved: { type: Boolean, default: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: [true, 'Danh mục là bắt buộc'], index: true },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      required: [function (this: any) { return !this.isNewProduct; }, 'Trạng thái là bắt buộc cho sản phẩm C2C'],
    },
    variants: { type: [VariantSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Pre-save: tính lại stock & price nếu có variants, kiểm tra default
 */
ProductSchema.pre('save', function (this: HydratedDocument<IProduct>, next) {
  try {
    if (this.variants && this.variants.length > 0) {
      const defaultCount = this.variants.filter(v => v.isDefault).length;
      if (defaultCount > 1) return next(new Error('Chỉ một biến thể được đặt là mặc định'));
      if (defaultCount === 0) {
        // đảm bảo variants[0] tồn tại; sử dụng non-null assertion vì length>0
        this.variants[0]!.isDefault = true;
      }
      // tổng stock từ variants
      this.stock = this.variants.reduce((sum, v: any) => sum + (v.stock || 0), 0);
      // price là min price trong variants
      this.price = Math.min(...this.variants.map((v: any) => v.price));
    } else {
      // không có variants: giữ logic cũ
      if (this.isNewProduct) {
        this.isApproved = true;
        this.condition = 'new';
      } else {
        this.isApproved = false;
      }
    }

    if (!this.isNewProduct && !this.owner) return next(new Error('Chủ sở hữu là bắt buộc cho sản phẩm C2C'));

    next();
  } catch (err) {
    next(err as any);
  }
});

/**
 * Pre 'findOneAndUpdate' để nếu client gửi variants trong update, ta tính lại price & stock.
 * (findOneAndUpdate không chạy pre('save'))
 */
ProductSchema.pre('findOneAndUpdate', function (this: any, next) {
  try {
    const update = this.getUpdate && this.getUpdate();
    if (!update) return next();

    // Nếu update đặt variants (thay thế toàn bộ), tính lại price/stock
    const variants = update.variants || (update.$set && update.$set.variants);
    if (Array.isArray(variants) && variants.length > 0) {
      const totalStock = variants.reduce((s: number, v: any) => s + (Number(v.stock ?? 0)), 0);
      const minPrice = Math.min(...variants.map((v: any) => Number(v.price ?? Infinity)));
      // set trực tiếp vào update (sử dụng $set để an toàn)
      this.set({ 'price': minPrice === Infinity ? 0 : minPrice, 'stock': totalStock });
    }
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Virtual: priceRange (synchronous)
 */
ProductSchema.virtual('priceRange').get(function (this: IProduct) {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map(v => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  return { min: this.price, max: this.price };
});

/**
 * Methods
 */
ProductSchema.methods.getVariantByAttrs = function (this: IProduct, attrs: { name: string; value: string }[]): IVariantSubdoc | null {
  if (!this.variants || this.variants.length === 0) return null;
  const variant = this.variants.find((v: any) =>
    attrs.every(a => v.attributes.some((x: any) => x.name === a.name && x.value === a.value))
  );
  return (variant as IVariantSubdoc) || (this.variants.find((v: any) => v.isDefault) as IVariantSubdoc) || null;
};

ProductSchema.methods.getMinPrice = function (this: IProduct): number {
  if (this.variants && this.variants.length > 0) {
    return Math.min(...this.variants.map((v: any) => v.price));
  }
  return this.price;
};

ProductSchema.methods.getMaxPrice = function (this: IProduct): number {
  if (this.variants && this.variants.length > 0) {
    return Math.max(...this.variants.map((v: any) => v.price));
  }
  return this.price;
};

ProductSchema.methods.updateStock = async function (this: HydratedDocument<IProduct>, delta: number, variantId?: Types.ObjectId): Promise<IProduct> {
  if (variantId && this.variants) {
    // Sử dụng .id() vì variants là DocumentArray
    const v = this.variants.id(variantId) as (IVariantSubdoc | null);
    if (v) v.stock = Math.max(0, (v.stock ?? 0) + delta);
  }
  this.stock = Math.max(0, (this.stock ?? 0) + delta);
  await this.save();
  return this;
};

/**
 * Async helpers (thay cho virtual async)
 */
ProductSchema.methods.getAverageRating = async function (this: IProduct): Promise<number> {
  try {
    const CommentModel = model('Comment');
    const result = await CommentModel.aggregate([
      { $match: { product: this._id, rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]).exec();
    return result[0]?.avgRating || 0;
  } catch (err) {
    // nếu lỗi, trả 0 thay vì văng
    return 0;
  }
};

ProductSchema.methods.getReportCount = async function (this: IProduct): Promise<number> {
  try {
    const ReportModel = model('Report');
    return await ReportModel.countDocuments({ targetType: 'Product', targetId: this._id }).exec();
  } catch (err) {
    return 0;
  }
};

/**
 * Indexes
 */
ProductSchema.index({ name: 'text', brand: 'text', type: 'text', description: 'text' });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ 'variants.price': 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ owner: 1 });

/**
 * Export model
 */
export const Product = model<IProduct>('Product', ProductSchema);
export default Product;
