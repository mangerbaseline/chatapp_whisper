import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: connectionId } = params;

    await dbConnect();

    await User.findByIdAndUpdate(userId, {
      $pull: { connections: connectionId },
    });

    await User.findByIdAndUpdate(connectionId, {
      $pull: { connections: userId },
    });

    return NextResponse.json(
      { message: "Connection removed successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error removing connection:", error);
    return NextResponse.json(
      { message: "Failed to remove connection" },
      { status: 500 },
    );
  }
}
