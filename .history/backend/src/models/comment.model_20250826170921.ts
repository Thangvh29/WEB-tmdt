import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: Types.ObjectId;
  post?: Types.ObjectIdz | null;
  product?: Types.ObjectId | null;
  parent?: Types.ObjectId | null;
  rating?: number | null;
  isApproved: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  approve(): Promise<IComment>;
  unapprove(): Promise<IComment>;
  softDelete(): Promise<IComment>;
  restore(): Promise<IComment>;
}

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', default: null, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    rating: { type: Number, min: 1, max: 5, default: null },
    isApproved: { type: Boolean, default: true, index: true }, // default true for product reviews? you can change
    isDeleted: { type: Boolean, default: false, index: true }, // soft delete
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // remove internal flags if desired
        delete ret.isDeleted;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/** Indexes for typical queries */
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ product: 1, rating: -1, createdAt: -1 });
CommentSchema.index({ post: 1, createdAt: -1 });

/** Business rules validation before saving */
CommentSchema.pre<IComment>('validate', function (next) {
  // Must belong to either a post or a product (or be a reply to a comment that already links)
  if (!this.post && !this.product && !this.parent) {
    return next(new Error('Comment must reference a post or a product or be a reply (parent).'));
  }
  // If rating is provided, it must be a product comment
  if (this.rating != null && !this.product) {
    return next(new Error('Rating is only supported for product reviews (product field required).'));
  }
  next();
});

/** Auto-approve logic: optional — approve admin's comments automatically */
CommentSchema.pre<IComment>('save', async function (next) {
  try {
    // If isApproved already explicitly set, keep it
    if (typeof this.isApproved === 'boolean') return next();

    // dynamic require to avoid circular deps; adjust path to your User model
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const UserModel = require('./path/to/userModel').User as any; // <-- chỉnh lại đường dẫn
    if (this.author) {
      const user = await UserModel.findById(this.author).select('role').lean();
      if (user && user.role === 'admin') {
        this.isApproved = true;
      } else {
        // default behavior: if product review, you may want to auto-approve, or set false for moderation
        this.isApproved = true; // change to false if you want manual moderation for all user comments
      }
    }
    next();
  } catch (err) {
    // don't block save on errors in admin check
    next();
  }
});

/** Virtual: replies count (useful for feed) */
CommentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
  count: true,
});

/** Methods */
CommentSchema.methods.approve = async function () {
  this.isApproved = true;
  await this.save();
  return this;
};

CommentSchema.methods.unapprove = async function () {
  this.isApproved = false;
  await this.save();
  return this;
};

CommentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  await this.save();
  return this;
};

CommentSchema.methods.restore = async function () {
  this.isDeleted = false;
  await this.save();
  return this;
};

/**
 * Static helper (optional) to get product reviews with pagination and average rating.
 * Implement in service layer using aggregations if you prefer.
 */

export const Comment = model<IComment>('Comment', CommentSchema);
