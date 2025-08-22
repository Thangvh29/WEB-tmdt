import { Schema, model, Document, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

// Interface cho Post
export interface IPost extends Document {
  content?: string;
  images: string[];
  author: Types.ObjectId;
  product?: Types.ObjectId;
  likes: Types.ObjectId[];
  isApproved: boolean;
  isDeleted: boolean; // Mới: Soft delete
  views: number; // Mới: Lượt xem
  createdAt: Date;
  updatedAt: Date;
  like(userId: Types.ObjectId): Promise<IPost>;
  unlike(userId: Types.ObjectId): Promise<IPost>;
  hasLiked(userId: Types.ObjectId): boolean;
  likeCount?: number;
  softDelete(): Promise<IPost>; // Mới
}

const PostSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    images: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (arr: string[]) => arr.length >= 0 && arr.length <= 6,
          message: 'Images array must contain between 0 and 6 URLs',
        },
      ],
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    isApproved: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true }, // Mới
    views: { type: Number, default: 0, min: 0 }, // Mới
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

// Pre-save: Auto-approve if author is admin
PostSchema.pre('save', async function (next) {
  if (this.isModified('isApproved')) return next();
  const UserModel = model('User');
  const user = await UserModel.findById(this.author).select('role');
  if (user && user.role === 'admin') this.isApproved = true;
  next();
});

// Pre-save: Kiểm tra product tồn tại nếu C2C
PostSchema.pre('save', async function (next) {
  if (this.product) {
    const ProductModel = model('Product');
    const exists = await ProductModel.exists({ _id: this.product, isNewProduct: false });
    if (!exists) return next(new Error('Product must exist and be C2C for post'));
  }
  next();
});

// Virtual likeCount
PostSchema.virtual('likeCount').get(function () {
  return this.likes?.length || 0;
});

// Methods
PostSchema.methods.hasLiked = function (userId: Types.ObjectId): boolean {
  return this.likes.some((id: Types.ObjectId) => id.equals(userId));
};

PostSchema.methods.like = async function (this: HydratedDocument<IPost>, userId: Types.ObjectId): Promise<IPost> {
  if (!this.likes.some((id: Types.ObjectId) => id.equals(userId))) {
    this.likes.push(userId);
    await this.save();
  }
  return this;
};

PostSchema.methods.unlike = async function (this: HydratedDocument<IPost>, userId: Types.ObjectId): Promise<IPost> {
  this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  await this.save();
  return this;
};

PostSchema.methods.softDelete = async function (this: HydratedDocument<IPost>): Promise<IPost> {
  this.isDeleted = true;
  await this.save();
  return this;
};

export const Post = model<IPost>('Post', PostSchema);