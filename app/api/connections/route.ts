import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(userId).populate(
      "connections",
      "email firstName lastName image",
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user.connections || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { message: "Failed to fetch connections" },
      { status: 500 },
    );
  }
}
