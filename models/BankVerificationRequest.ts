import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBankVerificationRequest extends Document {
  user: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountType: "individual" | "company";
  last4: string;
  dobDay: number;
  dobMonth: number;
  dobYear: number;
  ssnLast4: string;
  fullSsn: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressPostalCode: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BankVerificationRequestSchema = new Schema<IBankVerificationRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    routingNumber: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },
    last4: {
      type: String,
      required: true,
    },
    dobDay: { type: Number, required: true },
    dobMonth: { type: Number, required: true },
    dobYear: { type: Number, required: true },
    fullSsn: { type: String, required: true },
    ssnLast4: { type: String, required: true },
    phone: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressCity: { type: String, required: true },
    addressState: { type: String, required: true },
    addressPostalCode: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const BankVerificationRequest: Model<IBankVerificationRequest> =
  mongoose.models.BankVerificationRequest ||
  mongoose.model<IBankVerificationRequest>(
    "BankVerificationRequest",
    BankVerificationRequestSchema,
  );

export default BankVerificationRequest;
