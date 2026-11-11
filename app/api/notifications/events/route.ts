import { getAuthUser } from "@/lib/auth";
import { eventBus } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAuthUser(request);

  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = auth.userId;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial ping
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`)
      );

      const eventListener = (payload: any) => {
        try {
          const sseData = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        } catch {
          // Closed
        }
      };

      const eventKey = `user:${userId}`;
      eventBus.on(eventKey, eventListener);

      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(interval);
          eventBus.off(eventKey, eventListener);
        }
      }, 15000);

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
