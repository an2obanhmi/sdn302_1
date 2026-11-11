"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCircle2,
  Users,
  ShieldAlert,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "TASK_ASSIGNED" | "TEAM_INVITED" | "ROLE_UPDATED" | "TASK_UPDATED";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Connect to user's real-time notification stream (SSE)
    let sseSource: EventSource | null = null;
    try {
      sseSource = new EventSource("/api/notifications/events");

      sseSource.addEventListener("notification:new", (e: MessageEvent) => {
        try {
          const newNotif: NotificationItem = JSON.parse(e.data);
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);

          // Audio chime or subtle feedback
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(newNotif.title, { body: newNotif.message });
            }
          } catch {}
        } catch {}
      });
    } catch {}

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (sseSource) sseSource.close();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {}
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "TEAM_INVITED":
        return <Users className="w-4 h-4 text-indigo-400" />;
      case "ROLE_UPDATED":
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case "TASK_UPDATED":
        return <Clock className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl py-2 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mx-auto mb-2" />
                <span className="text-xs text-slate-400">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">No notifications yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  You will be notified when assigned tasks or invited to teams.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 hover:bg-slate-800/50 transition flex items-start gap-3 ${
                    !n.isRead ? "bg-indigo-950/20" : ""
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#0B0F19] border border-slate-800 shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          !n.isRead ? "text-white font-bold" : "text-slate-300"
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id, {} as any);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span />
                      )}

                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
