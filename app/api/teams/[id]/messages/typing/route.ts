import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { broadcastTeamEvent } from "@/lib/realtime";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isTyping } = body;

    await broadcastTeamEvent(teamId, "chat:typing", {
      userId: auth.userId,
      userName: auth.name,
      isTyping: !!isTyping,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to broadcast typing" }, { status: 500 });
  }
}
