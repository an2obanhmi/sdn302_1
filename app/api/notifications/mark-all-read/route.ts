import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: auth.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ message: "All notifications marked as read" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read error:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}
