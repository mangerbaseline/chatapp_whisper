import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITokenPlan extends Document {
  name: string;
  description: string;
  price: number;
  currency: string;
  tokens: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TokenPlanSchema = new Schema<ITokenPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },
    tokens: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const TokenPlan: Model<ITokenPlan> =
  mongoose.models.TokenPlan ||
  mongoose.model<ITokenPlan>("TokenPlan", TokenPlanSchema);

export default TokenPlan;
