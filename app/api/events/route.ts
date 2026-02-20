import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Event } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const monthParam = searchParams.get("month");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      $or: [{ organizer: userId }, { participants: userId }],
      status: "scheduled",
    };

    if (dateParam) {
      const start = new Date(dateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const events = await Event.find(query)
      .populate("organizer", "email firstName lastName image")
      .populate("participants", "email firstName lastName image")
      .sort({ date: 1, startTime: 1 });

    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { message: "Failed to fetch events" },
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
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      participants,
      color,
    } = body;

    if (!title || !date || !startTime) {
      return NextResponse.json(
        { message: "Title, date, and start time are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const event = await Event.create({
      title,
      description: description || "",
      date: new Date(date),
      startTime,
      endTime: endTime || "",
      organizer: userId,
      participants: participants || [],
      color: color || "#6366f1",
    });

    const populatedEvent = await event.populate([
      { path: "organizer", select: "email firstName lastName image" },
      { path: "participants", select: "email firstName lastName image" },
    ]);

    return NextResponse.json({ data: populatedEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { message: "Failed to create event" },
      { status: 500 },
    );
  }
}
