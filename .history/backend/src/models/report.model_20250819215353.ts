import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  reporter: Types.ObjectId; // Người báo cáo
  targetType: 'Product' | 'Post' | 'Comment';
  targetId: Types.ObjectId;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: Types.ObjectId | null;
  reviewNote?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  markReviewed(adminId: Types.ObjectId, note?: string): Promise<IReport>;
  isPending(): boolean;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['Product', 'Post', 'Comment'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, trim: true, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index để tránh spam report cùng một user cho cùng một đối tượng
ReportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });

// Methods
ReportSchema.methods.markReviewed = async function (
  adminId: Types.ObjectId,
  note?: string
): Promise<IReport> {
  this.status = 'reviewed';
  this.reviewedBy = adminId;
  this.reviewNote = note || null;
  await this.save();
  return this;
};

ReportSchema.methods.isPending = function (): boolean {
  return this.status === 'pending';
};

export const Report = model<IReport>('Report', ReportSchema);
