import mongoose, { Document, Model, Schema } from "mongoose";

export enum ActivityStatus {
  ACTIVE = "active",
  IDLE = "idle",
  INACTIVE = "inactive",
}

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface IUser extends Document {
  email: string;
  password?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  address?: string;
  mobileNo?: string;
  otp?: string;
  otpExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  provider?: string;
  googleId?: string;
  githubId?: string;
  image?: string;
  isActive: boolean;
  lastSeen: Date;
  activityStatus: ActivityStatus;
  connections: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
    },
    mobileNo: {
      type: String,
      trim: true,
    },
    otp: {
      type: String,
      trim: true,
    },
    otpExpiry: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
      trim: true,
    },
    resetPasswordExpiry: {
      type: Date,
    },
    provider: {
      type: String,
      enum: ["credentials", "google", "github"],
      default: "credentials",
    },
    googleId: {
      type: String,
    },
    githubId: {
      type: String,
    },
    image: {
      type: String,
    },
    connections: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    activityStatus: {
      type: String,
      enum: Object.values(ActivityStatus),
      default: ActivityStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
