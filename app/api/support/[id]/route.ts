import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Ticket from "@/models/Ticket";
import User, { UserRole } from "@/models/User";
import { withApiHandler } from "@/utils/withApiHandler";
import { apiSuccess } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";
import { sendEmail } from "@/lib/mail";
import { getTicketClosedEmailTemplate } from "@/lib/email-templates";

export const GET = withApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await dbConnect();

    const { id: ticketId } = await params;

    const ticket = await Ticket.findById(ticketId)
      .populate("user", "firstName lastName email image")
      .populate("conversation");

    if (!ticket) throw new ApiError(404, "Ticket not found.");

    return apiSuccess(200, ticket, "Ticket fetched successfully.");
  },
);

export const PATCH = withApiHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await dbConnect();
    const userId = req.headers.get("x-user-id");

    if (!userId) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(userId);

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ApiError(403, "Only admins can update ticket statuses");
    }

    const { status } = await req.json();

    const { id: ticketId } = await params;

    if (!["open", "fulfilled"].includes(status)) {
      throw new ApiError(400, "Invalid status provided.");
    }

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true },
    );

    if (!ticket) throw new ApiError(404, "Ticket not found.");

    if (status === "fulfilled") {
      const ticketCreator = await User.findById(ticket.user);
      if (ticketCreator) {
        await sendEmail({
          to: ticketCreator.email,
          subject: `Support Ticket Closed: ${ticket.subject}`,
          text: `Your support ticket has been closed. Ticket ID: ${ticket.ticketId}`,
          html: getTicketClosedEmailTemplate(
            ticketCreator.firstName,
            ticket.ticketId,
            ticket.subject,
          ),
        });
      }
    }

    return apiSuccess(200, ticket, "Ticket updated successfully.");
  },
);
