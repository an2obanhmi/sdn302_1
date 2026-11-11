"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface RealtimeHandlers {
  onChatMessage?: (message: any) => void;
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
  onTaskDeleted?: (payload: { id: string; title?: string }) => void;
  onMemberUpdated?: (payload: any) => void;
  onActivityNew?: (activity: any) => void;
  onTyping?: (payload: { userId: string; userName: string; isTyping: boolean }) => void;
}

export function useTeamRealtime(teamId: string, handlers: RealtimeHandlers) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeMechanism, setActiveMechanism] = useState<string>("Initializing...");
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Track typing timeout
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let sseSource: EventSource | null = null;
    let pusherInstance: any = null;
    let pusherChannel: any = null;
    let supabaseChannel: any = null;

    // 1. Check for Pusher WebSockets
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (pusherKey && pusherCluster) {
      import("pusher-js").then(({ default: Pusher }) => {
        try {
          pusherInstance = new Pusher(pusherKey, {
            cluster: pusherCluster,
          });

          pusherChannel = pusherInstance.subscribe(`team-${teamId}`);

          pusherChannel.bind("chat:message", (data: any) => handlersRef.current.onChatMessage?.(data));
          pusherChannel.bind("task:created", (data: any) => handlersRef.current.onTaskCreated?.(data));
          pusherChannel.bind("task:updated", (data: any) => handlersRef.current.onTaskUpdated?.(data));
          pusherChannel.bind("task:deleted", (data: any) => handlersRef.current.onTaskDeleted?.(data));
          pusherChannel.bind("member:updated", (data: any) => handlersRef.current.onMemberUpdated?.(data));
          pusherChannel.bind("activity:new", (data: any) => handlersRef.current.onActivityNew?.(data));
          pusherChannel.bind("chat:typing", (data: any) => handlersRef.current.onTyping?.(data));

          setIsConnected(true);
          setActiveMechanism("Pusher (WebSockets)");
        } catch (err) {
          console.warn("Pusher connection fallback:", err);
        }
      });
    }

    // 2. Check for Supabase Realtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      import("@supabase/supabase-js").then(({ createClient }) => {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          supabaseChannel = supabase.channel(`team-${teamId}`, {
            config: { broadcast: { self: false } },
          });

          supabaseChannel
            .on("broadcast", { event: "chat:message" }, ({ payload }: any) =>
              handlersRef.current.onChatMessage?.(payload)
            )
            .on("broadcast", { event: "task:created" }, ({ payload }: any) =>
              handlersRef.current.onTaskCreated?.(payload)
            )
            .on("broadcast", { event: "task:updated" }, ({ payload }: any) =>
              handlersRef.current.onTaskUpdated?.(payload)
            )
            .on("broadcast", { event: "task:deleted" }, ({ payload }: any) =>
              handlersRef.current.onTaskDeleted?.(payload)
            )
            .on("broadcast", { event: "member:updated" }, ({ payload }: any) =>
              handlersRef.current.onMemberUpdated?.(payload)
            )
            .on("broadcast", { event: "activity:new" }, ({ payload }: any) =>
              handlersRef.current.onActivityNew?.(payload)
            )
            .on("broadcast", { event: "chat:typing" }, ({ payload }: any) =>
              handlersRef.current.onTyping?.(payload)
            )
            .subscribe((status: string) => {
              if (status === "SUBSCRIBED") {
                setIsConnected(true);
                setActiveMechanism("Supabase Realtime (WebSockets)");
              }
            });
        } catch (err) {
          console.warn("Supabase Realtime fallback:", err);
        }
      });
    }

    // 3. Connect to Built-in Server-Sent Events (SSE) Stream
    // Guaranteed to work across multiple windows/tabs on Vercel and localhost without external keys
    const connectSSE = () => {
      try {
        sseSource = new EventSource(`/api/teams/${teamId}/events`);

        sseSource.addEventListener("connected", () => {
          setIsConnected(true);
          setActiveMechanism((prev) =>
            prev.includes("WebSockets") ? prev : "Real-time Stream (SSE / WebSockets)"
          );
        });

        sseSource.addEventListener("chat:message", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onChatMessage?.(data);
          } catch {}
        });

        sseSource.addEventListener("task:created", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onTaskCreated?.(data);
          } catch {}
        });

        sseSource.addEventListener("task:updated", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onTaskUpdated?.(data);
          } catch {}
        });

        sseSource.addEventListener("task:deleted", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onTaskDeleted?.(data);
          } catch {}
        });

        sseSource.addEventListener("member:updated", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onMemberUpdated?.(data);
          } catch {}
        });

        sseSource.addEventListener("activity:new", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onActivityNew?.(data);
          } catch {}
        });

        sseSource.addEventListener("chat:typing", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handlersRef.current.onTyping?.(data);
          } catch {}
        });

        sseSource.onerror = () => {
          // Automatic retry handled by EventSource browser spec
        };
      } catch (err) {
        console.error("SSE connection error:", err);
      }
    };

    connectSSE();

    return () => {
      if (sseSource) {
        sseSource.close();
      }
      if (pusherInstance && pusherChannel) {
        pusherInstance.unsubscribe(`team-${teamId}`);
        pusherInstance.disconnect();
      }
      if (supabaseChannel) {
        supabaseChannel.unsubscribe();
      }
    };
  }, [teamId]);

  // Send typing event with debounce
  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      fetch(`/api/teams/${teamId}/messages/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      }).catch(() => {});

      if (isTyping) {
        typingTimerRef.current = setTimeout(() => {
          fetch(`/api/teams/${teamId}/messages/typing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isTyping: false }),
          }).catch(() => {});
        }, 3000);
      }
    },
    [teamId]
  );

  return { isConnected, activeMechanism, notifyTyping };
}
