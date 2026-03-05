import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Ticket from "@/models/Ticket";
import User, { UserRole } from "@/models/User";
import { Conversation } from "@/models";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found.");

  let tickets;

  if (user.role === UserRole.ADMIN) {
    tickets = await Ticket.find()
      .populate("user", "firstName lastName email image")
      .sort({ createdAt: -1 });
  } else {
    tickets = await Ticket.find({
      user: userId,
    }).sort({ createdAt: -1 });
  }

  return apiSuccess(200, tickets, "Tickets fetched successfully.");
});

export const POST = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const body = await req.json();
  const { subject } = body;

  if (!subject) throw new ApiError(400, "Subject is required.");

  const conversation = await Conversation.create({
    participants: [userId],
    isGroup: false,
    name: `Ticket: ${subject}`,
  });

  const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

  const ticket = await Ticket.create({
    ticketId,
    user: userId,
    subject,
    conversation: conversation._id,
  });

  return apiSuccess(201, ticket, "Support ticket created successfully.");
});
