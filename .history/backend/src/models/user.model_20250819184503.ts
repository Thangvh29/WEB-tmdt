import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  address?: string;
  phone?: string;
  role: 'user' | 'admin';
  socialLogin?: {
    provider: 'google' | 'facebook';
    id: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // methods
  comparePassword(candidate: string): Promise<boolean>;
}

// Schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true, // tạo unique index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8, // tối thiểu 8 ký tự (tuỳ dự án)
      select: false, // không trả về mặc định
    },
    avatar: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10,11}$/, 'Phone must be 10-11 digits'], // VN thường 10 số; để linh hoạt cho 11
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true, // hay lọc theo role ở admin
    },
    socialLogin: {
      provider: { type: String, enum: ['google', 'facebook'] },
      id: { type: String, trim: true },
    },
  },
  {
    timestamps: true, // tự động createdAt/updatedAt
    versionKey: false, // ẩn __v
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password; // đảm bảo không lộ nếu select thủ công
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Index (đảm bảo unique ở mức DB, tránh case-sensitive trùng email)
UserSchema.index({ email: 1 }, { unique: true });

// Hash password trước khi lưu
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10); // cost 10 là hợp lý cho web
    // @ts-ignore - this.password có thể không được select trong 1 số flow
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err as any);
  }
});

// Method so sánh mật khẩu
UserSchema.methods.comparePassword = function (candidate: string) {
  // `this.password` có thể undefined nếu doc được query mà không select password
  // nên khi cần gọi comparePassword, hãy query .select('+password')
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', UserSchema);
