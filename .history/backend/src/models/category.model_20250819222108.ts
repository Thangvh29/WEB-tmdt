import { Schema, model, Document, Types } from 'mongoose';
const slugify = require('slugify');

// Interface cho Category
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId | null;
  active: boolean;
  image?: string; // Mới: Ảnh danh mục
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
    image: { type: String, trim: true, default: '' }, // Mới
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo slug tự động
CategorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify.default(this.name, { lower: true, strict: true });
  }
  next();
});

// Đảm bảo slug unique
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

// Virtual children
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
});

// Index
CategorySchema.index({ name: 1 });

// Static getTree
// Static getTree
CategorySchema.statics.getTree = async function (): Promise<(ICategory & { children?: ICategory[] })[]> {
  const categories = await this.find().populate('children').lean();

  const buildTree = (parentId: Types.ObjectId | null): (ICategory & { children?: ICategory[] })[] => {
    return categories
      .filter((cat: ICategory) => (cat.parent?._id?.equals(parentId) || (!cat.parent && !parentId)))
      .map((cat: ICategory) => ({ ...cat, children: buildTree(cat._id) }));
  };

  return buildTree(null);
};


export const Category = model<ICategory>('Category', CategorySchema);