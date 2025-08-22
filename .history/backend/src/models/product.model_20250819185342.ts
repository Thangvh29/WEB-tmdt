import { Schema, model, Document, Types } from 'mongoose';

export interface IVariant {
  _id?: Types.ObjectId;
  sku?: string;                 // mã SKU tuỳ chọn
  price: number;
  compareAtPrice?: number;      // giá gốc (nếu có)
  stock: number;
  images?: string[];            // ảnh riêng cho biến thể (optional)
  attributes: {                 // thuộc tính (color, capacity, version...)
    name: string;               // e.g. 'color' or 'capacity'
    value: string;              // e.g. 'space gray' or '256GB'
  }[];
  isDefault?: boolean;          // biến thể mặc định (hiển thị ban đầu)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProduct extends Document {
  name: string;
  brand: string;
  type: string;
  images: string[]; // chung
  price: number;    // fallback price nếu không có variants
  specs: { key: string; value: string }[];
  commitments: string[];
  description?: string;
  isNew: boolean;
  owner?: Types.ObjectId;
  stock: number;    // tổng stock (optional / computed)
  isApproved: boolean;
  category: Types.ObjectId;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  variants?: IVariant[]; // Mảng biến thể
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
    images: { type: [String], default: [] }, // chung
    price: { type: Number, required: true, min: 0 }, // fallback
    specs: { type: [SpecSchema], default: [] },
    commitments: { type: [String], default: [] },
    description: { type: String, trim: true, maxlength: 5000 },
    isNew: { type: Boolean, default: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    stock: { type: Number, default: 0, min: 0, index: true }, // tổng stock hoặc fallback
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

/** Pre-save logic: set defaults and validate variants */
ProductSchema.pre('save', function (next) {
  // Nếu có variants, ensure at least one default variant
  if (this.variants && this.variants.length > 0) {
    // ensure prices/stocks valid
    const defaultIndex = this.variants.findIndex(v => v.isDefault);
    if (defaultIndex === -1) {
      // set first as default
      this.variants[0].isDefault = true;
    }
    // compute aggregate stock if not explicitly set (optional)
    let totalStock = 0;
    this.variants.forEach(v => {
      totalStock += (v.stock || 0);
    });
    this.stock = totalStock;
    // Optionally set fallback price as min variant price
    const prices = this.variants.map(v => v.price);
    this.price = Math.min(...prices);
  } else {
    // no variants: keep stock/price as defined; for B2C set approved true
    if (this.isNew) {
      this.isApproved = true;
      this.condition = 'new';
    } else {
      if (!this.isApproved) this.isApproved = false;
    }
  }

  // for C2C check owner
  if (!this.isNew && !this.owner) {
    return next(new Error('Owner is required for C2C products'));
  }

  next();
});

/** Virtuals for price range */
ProductSchema.virtual('priceRange').get(function (this: IProduct) {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map(v => v.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }
  return { min: this.price, max: this.price };
});

/** Methods */
ProductSchema.methods.getVariantByAttrs = function (attrs: { name: string; value: string }[]) {
  if (!this.variants) return null;
  // find variant which has all attributes matching
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

/** Indexes for search and filtering */
ProductSchema.index({ name: 'text', brand: 'text', type: 'text', description: 'text' });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ 'variants.price': 1 });
ProductSchema.index({ price: 1 });

export const Product = model<IProduct>('Product', ProductSchema);
