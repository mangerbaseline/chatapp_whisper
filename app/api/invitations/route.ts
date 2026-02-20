import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Invitation, User } from "@/models";
import { InvitationStatus } from "@/models/Invitation";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "received";
    const status = searchParams.get("status") || "pending";

    await dbConnect();

    let query: any = { status };

    if (type === "received") {
      query.receiver = userId;
    } else if (type === "sent") {
      query.sender = userId;
    }

    const invitations = await Invitation.find(query)
      .populate("sender", "email firstName lastName image")
      .populate("receiver", "email firstName lastName image")
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: invitations }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { message: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        { message: "Receiver ID is required" },
        { status: 400 },
      );
    }

    if (userId === receiverId) {
      return NextResponse.json(
        { message: "Cannot send invitation to yourself" },
        { status: 400 },
      );
    }

    await dbConnect();

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const sender = await User.findById(userId);
    if (sender?.connections?.includes(receiverId)) {
      return NextResponse.json(
        { message: "Already connected with this user" },
        { status: 400 },
      );
    }

    const existingInvitation = await Invitation.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    });

    if (existingInvitation) {
      if (existingInvitation.status === InvitationStatus.PENDING) {
        return NextResponse.json(
          { message: "Invitation already sent" },
          { status: 400 },
        );
      } else if (existingInvitation.status === InvitationStatus.REJECTED) {
        existingInvitation.status = InvitationStatus.PENDING;
        existingInvitation.sender = userId as any;
        existingInvitation.receiver = receiverId;
        await existingInvitation.save();

        const populated = await existingInvitation.populate([
          { path: "sender", select: "email firstName lastName image" },
          { path: "receiver", select: "email firstName lastName image" },
        ]);

        return NextResponse.json({ data: populated }, { status: 200 });
      }
    }

    const invitation = await Invitation.create({
      sender: userId,
      receiver: receiverId,
      status: InvitationStatus.PENDING,
    });

    const populatedInvitation = await invitation.populate([
      { path: "sender", select: "email firstName lastName image" },
      { path: "receiver", select: "email firstName lastName image" },
    ]);

    return NextResponse.json({ data: populatedInvitation }, { status: 201 });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { message: "Failed to send invitation" },
      { status: 500 },
    );
  }
}
