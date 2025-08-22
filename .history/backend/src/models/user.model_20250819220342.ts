import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  address?: string;
  phone?: string;
  role: 'user' | 'admin';
  socialLogin?: {
    provider: 'google' | 'facebook';
    id: string;
  };
  isActive: boolean; // Mới: Để khóa user
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  generateAuthToken(): string; // Mới: Tạo JWT token
}

// Schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Tên là bắt buộc'],
      trim: true,
      minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
      maxlength: [80, 'Tên không được vượt quá 80 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Định dạng email không hợp lệ'],
    },
    password: {
      type: String,
      required: [function () { return !this.socialLogin; }, 'Mật khẩu là bắt buộc nếu không dùng đăng nhập xã hội'], // Cải tiến
      minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
      select: false,
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: [255, 'Địa chỉ không được vượt quá 255 ký tự'],
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'],
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    socialLogin: {
      provider: { type: String, enum: ['google', 'facebook'] },
      id: { type: String, trim: true },
    },
    isActive: { type: Boolean, default: true, index: true }, // Mới
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Index
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'socialLogin.id': 1 });

// Hash mật khẩu
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

// Compare password
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidate, this.password);
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function (): string {
  return jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

export const User = model<IUser>('User', UserSchema);