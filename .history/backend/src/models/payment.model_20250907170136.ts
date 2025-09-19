// src/models/payment.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  order: Types.ObjectId; // tham chiếu tới Order
  user: Types.ObjectId;  // tham chiếu tới User
  items?: Types.ObjectId[]; // optional: lưu cụ thể item nào trong Order được thanh toán
  amount: number;        // số tiền thanh toán
  method: "momo" | "vnpay" | "zalopay" | "paypal" | "bank_transfer";
  status: "pending" | "success" | "failed" | "cancelled";
  transactionId?: string; // ID giao dịch từ cổng thanh toán
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [{ type: Schema.Types.ObjectId }], // có thể lưu order.items đã thanh toán riêng
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
