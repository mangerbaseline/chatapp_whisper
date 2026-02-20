import mongoose, { Schema, Document, Types } from "mongoose";

export enum EventStatus {
  SCHEDULED = "scheduled",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime?: string;
  organizer: Types.ObjectId;
  participants: Types.ObjectId[];
  color: string;
  status: EventStatus;
  notified: boolean;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, default: "" },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    color: { type: String, default: "#6366f1" },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.SCHEDULED,
    },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Event =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
