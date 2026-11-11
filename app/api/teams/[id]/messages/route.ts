import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { broadcastTeamEvent } from "@/lib/realtime";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id/messages - Fetch team chat history
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: auth.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this team." },
        { status: 403 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { teamId },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("GET /api/teams/:id/messages error:", error);
    return NextResponse.json({ error: "Failed to fetch chat messages" }, { status: 500 });
  }
}

// POST /api/teams/:id/messages - Send a chat message
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: auth.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this team." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        teamId,
        senderId: auth.userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Broadcast live message event to all team members
    await broadcastTeamEvent(teamId, "chat:message", message);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/teams/:id/messages error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
