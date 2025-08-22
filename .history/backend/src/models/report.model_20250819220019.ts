import { Schema, model, Document, Types, Model } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

// Attributes khi tạo Report
export interface IReportAttrs {
  reporter: Types.ObjectId;
  targetType: 'Product' | 'Post' | 'Comment';
  targetId: Types.ObjectId;
  reason: string;
  status?: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: Types.ObjectId | null;
  reviewNote?: string | null;
}

// Document trong MongoDB
export interface IReportDoc extends Document {
  reporter: Types.ObjectId;
  targetType: 'Product' | 'Post' | 'Comment';
  targetId: Types.ObjectId;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: Types.ObjectId | null;
  reviewNote?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  markReviewed(adminId: Types.ObjectId, note?: string): Promise<IReportDoc>;
  isPending(): boolean;
}

// Model type (cho static methods)
export interface IReportModel extends Model<IReportDoc> {
  // Optional static method: find reports by target
  findByTarget(targetType: 'Product' | 'Post' | 'Comment', targetId: Types.ObjectId): Promise<IReportDoc[]>;
}

const ReportSchema = new Schema<IReportDoc>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['Product', 'Post', 'Comment'], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: [500, 'Lý do không được vượt quá 500 ký tự'] },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, trim: true, default: null, maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự'] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique index tránh spam
ReportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });

// Thêm index cho tìm kiếm theo targetType và targetId
ReportSchema.index({ targetType: 1, targetId: 1, status: 1 });

// Pre-validate: Đảm bảo targetId tồn tại trong model tương ứng
ReportSchema.pre('validate', async function (next) {
  try {
    const { targetType, targetId } = this;
    let Model;
    if (targetType === 'Product') Model = model('Product');
    else if (targetType === 'Post') Model = model('Post');
    else if (targetType === 'Comment') Model = model('Comment');
    else return next(new Error('Invalid targetType'));

    const exists = await Model.exists({ _id: targetId });
    if (!exists) {
      return next(new Error(`Target ${targetType} with ID ${targetId} does not exist`));
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Methods
ReportSchema.methods.markReviewed = async function (
  this: HydratedDocument<IReportDoc>,
  adminId: Types.ObjectId,
  note?: string
): Promise<IReportDoc> {
  this.status = 'reviewed';
  this.reviewedBy = adminId;
  this.reviewNote = note || null;
  await this.save();
  return this;
};

ReportSchema.methods.isPending = function (this: IReportDoc): boolean {
  return this.status === 'pending';
};

// Static method: Tìm report theo targetType và targetId
ReportSchema.statics.findByTarget = async function (
  targetType: 'Product' | 'Post' | 'Comment',
  targetId: Types.ObjectId
): Promise<IReportDoc[]> {
  return this.find({ targetType, targetId }).exec();
};

// Export model
export const Report = model<IReportDoc, IReportModel>('Report', ReportSchema);