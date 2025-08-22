import { Schema, model, Document, Types } from 'mongoose';
import slugify from 'slugify';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 140,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo slug tự động từ name nếu chưa có hoặc khi name thay đổi
CategorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    // slugify options: remove non-ascii, lower, strict
    // đảm bảo slug không rỗng
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Nếu muốn, đảm bảo slug là duy nhất bằng cách thêm hậu tố nếu trùng
CategorySchema.pre('save', async function (next) {
  if (!this.isModified('slug')) return next();

  let slug = this.slug;
  const CategoryModel = model<ICategory>('Category');
  let counter = 0;

  // while có doc khác cùng slug (không phải chính nó) -> tăng hậu tố
  // (cẩn trọng performance nếu nhiều trùng; với số lượng category thường nhỏ là ổn)
  // eslint-disable-next-line no-async-promise-executor
  while (await CategoryModel.exists({ slug, _id: { $ne: this._id } })) {
    counter += 1;
    slug = `${this.slug}-${counter}`;
  }
  this.slug = slug;
  next();
});

// Virtual: children categories (không populate tự động, dùng nếu cần)
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
});

CategorySchema.index({ name: 1 });

// Export model
export const Category = model<ICategory>('Category', CategorySchema);
