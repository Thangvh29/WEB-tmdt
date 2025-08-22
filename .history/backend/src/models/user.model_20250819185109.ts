import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional để tương thích với toJSON
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
  comparePassword(candidate: string): Promise<boolean>;
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
      required: [true, 'Mật khẩu là bắt buộc cho người dùng không đăng nhập bằng mạng xã hội'],
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

// Index để đảm bảo email là duy nhất
UserSchema.index({ email: 1 }, { unique: true });

// Hash mật khẩu trước khi lưu
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

// So sánh mật khẩu
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', UserSchema);