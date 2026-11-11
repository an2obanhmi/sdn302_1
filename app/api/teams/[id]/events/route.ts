import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { eventBus } from "@/lib/realtime";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: teamId } = await params;
  const auth = await getAuthUser(request);

  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
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
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connection ping
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", teamId })}\n\n`)
      );

      const eventListener = (payload: any) => {
        try {
          const sseData = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch {
          // Stream might be closed
        }
      };

      const eventKey = `team:${teamId}`;
      eventBus.on(eventKey, eventListener);

      // Keep connection open with heartbeats
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(interval);
          eventBus.off(eventKey, eventListener);
        }
      }, 15000);

      // Handle abort / client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        eventBus.off(eventKey, eventListener);
        try {
          controller.close();
        } catch {
          // Ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
