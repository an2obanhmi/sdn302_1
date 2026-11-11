"use client";

import { useEffect, useState, useRef } from "react";
import { Send, MessageSquare, Loader2, Sparkles, User, Wifi, WifiOff } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  teamId: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamChatProps {
  teamId: string;
  currentUserId: string;
  realtimeMessages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  typingUser: string | null;
  onTyping: (isTyping: boolean) => void;
  isConnected: boolean;
  connectionMechanism: string;
}

export default function TeamChat({
  teamId,
  currentUserId,
  realtimeMessages,
  onSendMessage,
  typingUser,
  onTyping,
  isConnected,
  connectionMechanism,
}: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat history
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [teamId]);

  // Synchronize new incoming realtime messages
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      const latest = realtimeMessages[realtimeMessages.length - 1];
      setMessages((prev) => {
        if (prev.some((m) => m.id === latest.id)) return prev;
        return [...prev, latest];
      });
    }
  }, [realtimeMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    onTyping(false);
    setSending(true);

    try {
      await onSendMessage(text);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim().length > 0) {
      onTyping(true);
    } else {
      onTyping(false);
    }
  };

  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0F172A]/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Team Live Chat</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {messages.length} messages
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Instant communication across all online members
            </p>
          </div>
        </div>

        {/* Real-time Connection Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B0F19] border border-slate-800 text-[11px]">
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-medium">Live</span>
              <span className="text-slate-500 hidden sm:inline">• {connectionMechanism}</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-400 font-medium">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#0B0F19]/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mb-2" />
            <span className="text-xs text-slate-400">Loading chat history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No messages yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Say hello to kick off team communication! All messages appear live instantly.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-800 ${
                    isMe
                      ? "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white"
                      : "bg-[#1E293B] text-slate-200 border border-slate-700/60"
                  }`}
                >
                  {msg.sender.name ? msg.sender.name.charAt(0).toUpperCase() : "U"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm text-xs ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : "bg-[#1E293B]/90 text-slate-100 border border-slate-800 rounded-tl-xs"
                  }`}
                >
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-200 text-[11px]">
                        {msg.sender.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{msg.sender.email}</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>

                  <div
                    className={`mt-1 text-[10px] text-right ${
                      isMe ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
            <span>{typingUser} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-slate-800 bg-[#111827]">
        <div className="flex items-end gap-2 bg-[#0B0F19] rounded-xl border border-slate-800 p-2 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500 transition">
          <textarea
            rows={2}
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Press Enter to send, Shift+Enter for new line)..."
            className="flex-1 bg-transparent border-0 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none px-2 py-1"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition shrink-0 shadow-md shadow-indigo-600/25 active:scale-95"
            title="Send Message"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
