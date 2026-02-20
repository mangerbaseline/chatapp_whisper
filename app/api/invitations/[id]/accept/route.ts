import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Invitation, User } from "@/models";
import { InvitationStatus } from "@/models/Invitation";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 },
      );
    }

    if (invitation.receiver.toString() !== userId) {
      return NextResponse.json(
        { message: "Not authorized to accept this invitation" },
        { status: 403 },
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json(
        { message: "Invitation is not pending" },
        { status: 400 },
      );
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await invitation.save();

    await User.findByIdAndUpdate(invitation.sender, {
      $addToSet: { connections: invitation.receiver },
    });

    await User.findByIdAndUpdate(invitation.receiver, {
      $addToSet: { connections: invitation.sender },
    });

    const populatedInvitation = await invitation.populate([
      { path: "sender", select: "email firstName lastName image" },
      { path: "receiver", select: "email firstName lastName image" },
    ]);

    return NextResponse.json({ data: populatedInvitation }, { status: 200 });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { message: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
