import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRefundRequest extends Document {
  user: mongoose.Types.ObjectId;
  transaction: mongoose.Types.ObjectId;
  reason: string;
  status: "pending" | "approved" | "rejected";
  refundAmount: number;
  percentageCut: number;
  tokensDeducted: number;
  adminNote?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "TokenTransaction",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    percentageCut: {
      type: Number,
      default: 0,
    },
    tokensDeducted: {
      type: Number,
      default: 0,
    },
    adminNote: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

const RefundRequest: Model<IRefundRequest> =
  mongoose.models.RefundRequest ||
  mongoose.model<IRefundRequest>("RefundRequest", RefundRequestSchema);

export default RefundRequest;
