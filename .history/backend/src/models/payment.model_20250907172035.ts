import { Schema, model, Document, Types } from "mongoose";
import type { IOrder } from "./order.model.js";  // import interface từ Order
import type { IUser } from "./user.model.js";

export interface IPayment extends Document {
  order: Types.ObjectId | IOrder;   // <--- cho phép populate
  user: Types.ObjectId | IUser;     // <--- tương tự
  items?: Types.ObjectId[];         // optional: lưu item nào được thanh toán
  amount: number;
  method: "momo" | "vnpay" | "zalopay" | "paypal" | "bank_transfer";
  status: "pending" | "success" | "failed" | "cancelled";
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [{ type: Schema.Types.ObjectId }],
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["momo", "vnpay", "zalopay", "paypal", "bank_transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    transactionId: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

export const Payment = model<IPayment>("Payment", PaymentSchema);
