import mongoose, { Document, Model, Schema } from "mongoose";

export type TransactionType =
  | "purchase"
  | "transfer_sent"
  | "transfer_received"
  | "refund";

export interface ITokenTransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  // Purchase fields
  plan?: mongoose.Types.ObjectId;
  amountMoney?: number;
  currency?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  // Transfer fields
  fromUser?: mongoose.Types.ObjectId;
  toUser?: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TokenTransactionSchema = new Schema<ITokenTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "transfer_sent", "transfer_received", "refund"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: "TokenPlan",
    },
    amountMoney: {
      type: Number,
    },
    currency: {
      type: String,
      lowercase: true,
    },
    stripeSessionId: {
      type: String,
    },
    stripePaymentIntentId: {
      type: String,
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const TokenTransaction: Model<ITokenTransaction> =
  mongoose.models.TokenTransaction ||
  mongoose.model<ITokenTransaction>("TokenTransaction", TokenTransactionSchema);

export default TokenTransaction;
