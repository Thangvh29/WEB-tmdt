import { Schema, model, Document, Types } from 'mongoose';
const slugify = require('slugify');

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

// Tạo slug tự động từ name
CategorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify.default(this.name, { lower: true, strict: true });
  }
  next();
});

// Đảm bảo slug là duy nhất
CategorySchema.pre('save', async function (next) {
  if (!this.isModified('slug')) return next();

  let slug = this.slug;
  const CategoryModel = model<ICategory>('Category');
  let counter = 0;

  while (await CategoryModel.exists({ slug, _id: { $ne: this._id } })) {
    counter += 1;
    slug = `${this.slug}-${counter}`;
  }
  this.slug = slug;
  next();
});

// Virtual: children categories
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
});

CategorySchema.index({ name: 1 });

export const Category = model<ICategory>('Category', CategorySchema);
