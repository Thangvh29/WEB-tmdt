import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  content?: string;
  images: string[];
  author: Types.ObjectId;
  product?: Types.ObjectId;
  likes: Types.ObjectId[];
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  like(userId: Types.ObjectId): Promise<IPost>;
  unlike(userId: Types.ObjectId): Promise<IPost>;
  hasLiked(userId: Types.ObjectId): boolean;
  likeCount?: number; // virtual
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
          validator: (arr: string[]) => Array.isArray(arr) && arr.length >= 0 && arr.length <= 6,
          message: 'Images array must contain between 0 and 6 URLs',
        },
      ],
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    isApproved: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // tidy up output if needed
        // ret.id = ret._id; delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/** Indexes to speed up common queries */
PostSchema.index({ createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

/** Auto-approve if author is admin (controller could also handle this).
 * Use dynamic require to avoid potential circular dependency at import time.
 */
PostSchema.pre<IPost>('save', async function (next) {
  try {
    // If already set explicitly, keep it
    if (typeof this.isApproved === 'boolean' && this.isApproved === true) return next();

    // If author is admin, auto-approve
    // require inside hook to avoid circular import issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const UserModel = require('./path/to/userModel').User as any; // <-- adjust path if needed
    if (this.author) {
      const user = await UserModel.findById(this.author).select('role').lean();
      if (user && user.role === 'admin') {
        this.isApproved = true;
      }
    }
    next();
  } catch (err) {
    // don't block save on error checking admin; fallback to default behavior
    return next();
  }
});

/** Virtual: likeCount (convenient for response) */
PostSchema.virtual('likeCount').get(function (this: IPost) {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

/** Helper methods: like/unlike/hasLiked */
PostSchema.methods.hasLiked = function (userId: Types.ObjectId) {
  if (!this.likes) return false;
  return this.likes.some((id: Types.ObjectId) => id.equals(userId));
};

PostSchema.methods.like = async function (userId: Types.ObjectId) {
  // avoid duplicates
  if (!this.likes) this.likes = [];
  if (!this.likes.some((id: Types.ObjectId) => id.equals(userId))) {
    this.likes.push(userId);
    await this.save();
  }
  return this;
};

PostSchema.methods.unlike = async function (userId: Types.ObjectId) {
  if (!this.likes) return this;
  this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  await this.save();
  return this;
};

export const Post = model<IPost>('Post', PostSchema);
