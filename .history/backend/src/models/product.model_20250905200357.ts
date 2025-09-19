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

  // Methods
  getVariantByAttrs(attrs: { name: string; value: string }[]): IVariant | null;
  getMinPrice(): number;
  getMaxPrice(): number;
  updateStock(delta: number, variantId?: Types.ObjectId): Promise<IProduct>;

  // Virtuals
  averageRating?: number;
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
    price: { type: Number, required: true, min: [0, 'Giá không được âm'] },
    compareAtPrice: { type: Number, min: [0, 'Giá gốc không được âm'] },
    stock: { type: Number, required: true, min: [0, 'Tồn kho không được âm'], default: 0 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: 'Biến thể không được có quá 10 ảnh',
      },
    },
    attributes: [
      { name: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } },
    ],
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

// Schema cho Product
const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    brand: { type: String, required: true, trim: true, minlength: 2, maxlength: 80, lowercase: true },
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: [
        'laptop','gpu','monitor','mouse','keyboard','cpu','ram','ssd','hdd','accessory',
        'tablet','phone','other','mainboard','storage','fan','mousepad','headphone','light'
      ],
      index: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 10,
        message: 'Sản phẩm phải có từ 1 đến 10 ảnh',
      },
    },
    price: { type: Number, required: true, min: [0, 'Giá không được âm'] },
    specs: { type: [SpecSchema], default: [] },
    commitments: { type: [String], default: [] },
    description: { type: String, trim: true, maxlength: 5000 },
    isNewProduct: { type: Boolean, default: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    stock: { type: Number, default: 0, min: 0, index: true },
    sold: { type: Number, default: 0, min: 0 },
    isApproved: { type: Boolean, default: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      required: [function () { return !this.isNewProduct; }, 'Trạng thái là bắt buộc cho sản phẩm C2C'],
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

// Pre-save logic
// Pre-save logic
ProductSchema.pre('save', function (this: HydratedDocument<IProduct>, next) {
  if (this.variants && this.variants.length > 0) {
    const defaultCount = this.variants.filter(v => v.isDefault).length;
    if (defaultCount > 1) return next(new Error('Chỉ một biến thể được đặt là mặc định'));
    if (defaultCount === 0) this.variants[0]!.isDefault = true;
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    this.price = Math.min(...this.variants.map(v => v.price));
  } else {
    if (this.isNewProduct) {
      this.isApproved = true;
      this.condition = 'new';
    } else {
      // 🔥 Giữ nguyên giá trị isApproved nếu đã set từ controller (admin/cửa hàng)
      if (this.isApproved === undefined) {
        this.isApproved = false;
      }
    }
  }

  if (!this.isNewProduct && !this.owner) {
    return next(new Error('Chủ sở hữu là bắt buộc cho sản phẩm C2C'));
  }
  next();
});


// Virtuals
ProductSchema.virtual('priceRange').get(function (this: IProduct) {
  if (this.variants?.length) {
    const prices = this.variants.map(v => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  return { min: this.price, max: this.price };
});

ProductSchema.virtual('averageRating').get(async function (this: IProduct) {
  const CommentModel = model('Comment');
  const result = await CommentModel.aggregate([
    { $match: { product: this._id, rating: { $ne: null } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
  ]).exec();
  return result[0]?.avgRating || 0;
});

// Methods
ProductSchema.methods.getVariantByAttrs = function (this: IProduct, attrs: { name: string; value: string }[]) {
  if (!this.variants?.length) return null;
  return (
    this.variants.find(v => attrs.every(a => v.attributes.some(x => x.name === a.name && x.value === a.value))) ||
    this.variants.find(v => v.isDefault) ||
    null
  );
};

ProductSchema.methods.getMinPrice = function (this: IProduct) {
  return this.variants?.length ? Math.min(...this.variants.map(v => v.price)) : this.price;
};

ProductSchema.methods.getMaxPrice = function (this: IProduct) {
  return this.variants?.length ? Math.max(...this.variants.map(v => v.price)) : this.price;
};

ProductSchema.methods.updateStock = async function (this: HydratedDocument<IProduct>, delta: number, variantId?: Types.ObjectId) {
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

export const Product = model<IProduct>('Product', ProductSchema);
