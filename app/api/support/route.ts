import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Ticket from "@/models/Ticket";
import User, { UserRole } from "@/models/User";
import { Conversation } from "@/models";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import { sendEmail } from "@/lib/mail";
import { getTicketCreatedEmailTemplate } from "@/lib/email-templates";

export const GET = withApiHandler(async (req: NextRequest) => {
  await dbConnect();

  const userId = req.headers.get("x-user-id");

  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found.");

  const { searchParams } = new URL(req.url);
  const filterUserId = searchParams.get("userId");

  let tickets;

  if (user.role === UserRole.ADMIN) {
    const query = filterUserId ? { user: filterUserId } : {};
    tickets = await Ticket.find(query)
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

  const admins = await User.find({ role: UserRole.ADMIN }).select("_id");
  const adminIds = admins.map((admin) => admin._id);

  const conversation = await Conversation.create({
    participants: [userId, ...adminIds],
    isGroup: false,
    isSupportTicket: true,
    name: `Ticket: ${subject}`,
  });

  const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

  const ticket = await Ticket.create({
    ticketId,
    user: userId,
    subject,
    conversation: conversation._id,
  });

  const ticketCreator = await User.findById(userId);
  if (ticketCreator) {
    await sendEmail({
      to: ticketCreator.email,
      subject: `Support Ticket Created: ${subject}`,
      text: `Your support ticket has been created successfully. Ticket ID: ${ticketId}`,
      html: getTicketCreatedEmailTemplate(
        ticketCreator.firstName || "User",
        ticketId,
        subject,
      ),
    });
  }

  return apiSuccess(201, ticket, "Support ticket created successfully.");
});
