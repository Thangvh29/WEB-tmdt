import { Schema, model, Document, Types } from 'mongoose';

export interface IVariant {
  _id?: Types.ObjectId;
  sku?: string;                 // mã SKU tuỳ chọn
  price: number;
  compareAtPrice?: number;      // giá gốc (nếu có)
  stock: number;
  images?: string[];            // ảnh riêng cho biến thể (optional)
  attributes: {                 // thuộc tính (color, capacity, version...)
    name: string;
    value: string;
  }[];
  isDefault?: boolean;          // biến thể mặc định (hiển thị ban đầu)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProduct extends Document {
  name: string;
  brand: string;
  type: string;
  images: string[];
  price: number;
  specs: { key: string; value: string }[];
  commitments: string[];
  description?: string;
  isNewProduct: boolean;   // ✅ đổi tên để tránh conflict với Document.isNew
  owner?: Types.ObjectId;
  stock: number;
  sold?: number;
  isApproved: boolean;
  category: Types.ObjectId;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  variants?: IVariant[];
  createdAt: Date;
  updatedAt: Date;

  // helper methods
  getVariantByAttrs(attrs: { name: string; value: string }[]): IVariant | null;
  getMinPrice(): number;
  getMaxPrice(): number;
}

const SpecSchema = new Schema(
  { key: String, value: String },
  { _id: false }
);

const VariantSchema = new Schema<IVariant>(
  {
    sku: { type: String, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
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
    name: { type: String, required: true, trim: true, maxlength: 150 },
    brand: { type: String, required: true, trim: true, maxlength: 80, lowercase: true },
    type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: [
        'laptop','gpu','monitor','mouse','keyboard','cpu','ram','ssd','hdd','accessory','tablet','phone','other'
      ],
      index: true,
    },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    specs: { type: [SpecSchema], default: [] },
    commitments: { type: [String], default: [] },
    description: { type: String, trim: true, maxlength: 5000 },
    isNewProduct: { type: Boolean, default: true, index: true }, // ✅ renamed
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    stock: { type: Number, default: 0, min: 0, index: true },
    sold: { type: Number, default: 0, min: 0 },
    isApproved: { type: Boolean, default: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    condition: { type: String, enum: ['new','like_new','good','fair','poor'] },
    variants: { type: [VariantSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Pre-save logic */
ProductSchema.pre<IProduct>('save', function (next) {
  const product = this as IProduct;

  if (product.variants && product.variants.length > 0) {
    const defaultIndex = product.variants.findIndex(v => v.isDefault);
    if (defaultIndex === -1) {
        const firstVariant = product.variants[0];
  if (firstVariant) {
    firstVariant.isDefault = true;
  }
}


    product.stock = product.variants.reduce((sum: number, v: IVariant) => sum + (v.stock || 0), 0);
    product.price = Math.min(...product.variants.map((v: IVariant) => v.price));
  } else {
    if (product.isNewProduct) {
      product.isApproved = true;
      product.condition = 'new';
    } else {
      if (!product.isApproved) product.isApproved = false;
    }
  }

  if (!product.isNewProduct && !product.owner) {
    return next(new Error('Owner is required for C2C products'));
  }

  next();
});

/** Virtuals */
ProductSchema.virtual('priceRange').get(function (this: IProduct) {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map((v: IVariant) => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  return { min: this.price, max: this.price };
});

/** Methods */
ProductSchema.methods.getVariantByAttrs = function (attrs: { name: string; value: string }[]) {
  if (!this.variants) return null;
  return this.variants.find((v: IVariant) =>
    attrs.every(a => v.attributes.some(x => x.name === a.name && x.value === a.value))
  ) || null;
};

ProductSchema.methods.getMinPrice = function () {
  if (this.variants && this.variants.length > 0) {
    return Math.min(...this.variants.map((v: IVariant) => v.price));
  }
  return this.price;
};

ProductSchema.methods.getMaxPrice = function () {
  if (this.variants && this.variants.length > 0) {
    return Math.max(...this.variants.map((v: IVariant) => v.price));
  }
  return this.price;
};

/** Indexes */
ProductSchema.index({ name: 'text', brand: 'text', type: 'text', description: 'text' });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ 'variants.price': 1 });
ProductSchema.index({ price: 1 });

export const Product = model<IProduct>('Product', ProductSchema);
