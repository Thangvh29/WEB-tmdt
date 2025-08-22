// src/models/category.model.ts
import { Schema, model, Document, Types, Model } from 'mongoose';
import slugifyPkg from 'slugify';

/**
 * Ensure slugify function works whether the package exposes default or module export.
 * Some TypeScript configs / slugify versions produce a module object; guard for that.
 */
const slugifyFn: (input: string, opts?: Record<string, any>) => string =
  (slugifyPkg as any).default ?? (slugifyPkg as any);

// Interface cho Category document
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: Types.ObjectId | null;
  active: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho static methods trên model
export interface CategoryModel extends Model<ICategory> {
  getTree(): Promise<(ICategory & { children?: ICategory[] })[]>;
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
    image: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo slug tự động (validate hook)
CategorySchema.pre('validate', function (this: ICategory, next) {
  try {
    if ((!this.slug || String(this.slug).trim() === '') && this.name) {
      this.slug = slugifyFn(this.name, { lower: true, strict: true });
    }
    next();
  } catch (err) {
    next(err as any);
  }
});

// Đảm bảo slug unique khi save
CategorySchema.pre('save', async function (this: ICategory, next) {
  try {
    if (!this.isModified('slug')) return next();
    let baseSlug = this.slug;
    if (!baseSlug) baseSlug = slugifyFn(this.name || '', { lower: true, strict: true });
    let slug = baseSlug;
    const CategoryModelLocal = model<ICategory>('Category');
    let counter = 0;
    // vòng lặp nhỏ để tránh collision, OK cho số lượng category không lớn
    while (await CategoryModelLocal.exists({ slug, _id: { $ne: this._id } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
    this.slug = slug;
    next();
  } catch (err) {
    next(err as any);
  }
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

// Static getTree implementation
CategorySchema.statics.getTree = async function thisGetTree(this: CategoryModel) {
  // get all categories as lean objects for faster recursion
  const cats: Array<any> = await this.find().lean().exec();

  const buildTree = (parentId: Types.ObjectId | null): (ICategory & { children?: ICategory[] })[] => {
    return cats
      .filter((cat: any) =>
        (cat.parent && (cat.parent as Types.ObjectId).equals(parentId)) ||
        (!cat.parent && !parentId)
      )
      .map((cat: any) => ({ ...cat, children: buildTree(cat._id as Types.ObjectId) }));
  };

  return buildTree(null);
} as CategoryModel['getTree'];

// Export model
export const Category = model<ICategory, CategoryModel>('Category', CategorySchema);
export default Category;
