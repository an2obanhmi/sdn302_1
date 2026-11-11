import Pusher from "pusher";
import { EventEmitter } from "events";

// Global event bus for server-sent events / in-memory pub-sub
declare global {
  // eslint-disable-next-line no-var
  var __app_event_emitter__: EventEmitter | undefined;
}

export const eventBus: EventEmitter =
  global.__app_event_emitter__ || (global.__app_event_emitter__ = new EventEmitter());
eventBus.setMaxListeners(100);

// Initialize Pusher if environment variables are set
let pusherServer: Pusher | null = null;
if (
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  try {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  } catch (err) {
    console.error("Failed to initialize Pusher server:", err);
  }
}

export interface RealtimeEventPayload {
  teamId?: string;
  userId?: string;
  event: string;
  data: any;
  timestamp: string;
}

/**
 * Broadcast an event to all members of a team.
 * Dispatches via:
 * 1. Internal EventBus (powers Server-Sent Events / SSE)
 * 2. Pusher (if configured)
 * 3. Supabase Realtime channel (if configured)
 */
export async function broadcastTeamEvent(teamId: string, event: string, data: any) {
  const payload: RealtimeEventPayload = {
    teamId,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  // 1. Emit on internal SSE event bus
  eventBus.emit(`team:${teamId}`, payload);

  // 2. Broadcast via Pusher if configured
  if (pusherServer) {
    try {
      await pusherServer.trigger(`team-${teamId}`, event, data);
    } catch (err) {
      console.error(`Pusher trigger error on team-${teamId}:`, err);
    }
  }

  // 3. Broadcast to Supabase Realtime via REST Broadcast API if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      // Supabase Realtime broadcast REST endpoint
      fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              topic: `realtime:team-${teamId}`,
              event,
              payload: data,
            },
          ],
        }),
      }).catch(() => {
        // Silently catch network errors if Realtime REST endpoint is unavailable
      });
    } catch {
      // Ignore
    }
  }
}

/**
 * Broadcast an event to a specific user (e.g. In-App Notifications).
 */
export async function broadcastUserEvent(userId: string, event: string, data: any) {
  const payload: RealtimeEventPayload = {
    userId,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  // Emit on internal SSE event bus
  eventBus.emit(`user:${userId}`, payload);

  // Pusher user channel
  if (pusherServer) {
    try {
      await pusherServer.trigger(`user-${userId}`, event, data);
    } catch (err) {
      console.error(`Pusher trigger error on user-${userId}:`, err);
    }
  }
}
