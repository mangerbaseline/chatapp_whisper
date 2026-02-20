import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { Invitation } from "@/models";
import { InvitationStatus } from "@/models/Invitation";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    await dbConnect();

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let users;
    if (query && query.trim().length >= 2) {
      users = await User.find({
        _id: { $ne: userId },
        $or: [
          { email: { $regex: query, $options: "i" } },
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
        ],
        $and: [
          {
            $or: [{ isActive: true }, { isActive: { $exists: false } }],
          },
        ],
      })
        .select("email firstName lastName image connections")
        .limit(5);
    } else {
      users = await User.find({
        _id: { $ne: userId },
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      })
        .select("email firstName lastName image connections")
        .limit(5);
    }

    const userIds = users.map((u) => u._id);
    const invitations = await Invitation.find({
      $or: [
        { sender: userId, receiver: { $in: userIds } },
        { sender: { $in: userIds }, receiver: userId },
      ],
      status: InvitationStatus.PENDING,
    });

    const usersWithStatus = users.map((user) => {
      const userObj = user.toObject();
      let inviteStatus = "none";
      let invitationId: string | undefined = undefined;

      if (
        currentUser.connections?.some(
          (id) => id.toString() === user._id.toString(),
        )
      ) {
        inviteStatus = "connected";
      } else {
        const sentInvite = invitations.find(
          (inv) =>
            inv.sender.toString() === userId &&
            inv.receiver.toString() === user._id.toString(),
        );
        const receivedInvite = invitations.find(
          (inv) =>
            inv.sender.toString() === user._id.toString() &&
            inv.receiver.toString() === userId,
        );

        if (sentInvite) {
          inviteStatus = "pending_sent";
        } else if (receivedInvite) {
          inviteStatus = "pending_received";
          invitationId = receivedInvite._id.toString();
        }
      }

      return {
        _id: userObj._id,
        email: userObj.email,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        image: userObj.image,
        inviteStatus,
        invitationId,
      };
    });

    return NextResponse.json({ data: usersWithStatus }, { status: 200 });
  } catch (error: any) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { message: "Failed to search users" },
      { status: 500 },
    );
  }
}
