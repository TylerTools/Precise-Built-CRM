"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UserInfo {
  id: string;
  name: string;
  profileImage: string | null;
}

interface MessageRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  read: boolean;
  createdAt: string;
  fromUser: UserInfo;
  toUser: UserInfo;
}

interface Conversation {
  user: UserInfo;
  messages: MessageRecord[];
  unreadCount: number;
}

interface MessagesDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  preSelectUserId?: string | null;
}

export default function MessagesDrawer({
  open,
  onClose,
  currentUserId,
  preSelectUserId,
}: MessagesDrawerProps) {
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [activeConvo, setActiveConvo] = useState<string | null>(preSelectUserId || null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [teamUsers, setTeamUsers] = useState<UserInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setConversations(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      fetchMessages();
      fetch("/api/users")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setTeamUsers(data.filter((u: UserInfo & { id: string }) => u.id !== currentUserId));
          }
        })
        .catch(() => {});
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [open, fetchMessages, currentUserId]);

  useEffect(() => {
    if (preSelectUserId) {
      setActiveConvo(preSelectUserId);
      setShowUserPicker(false);
    }
  }, [preSelectUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo, conversations]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConvo) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConvo]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (!activeConvo || !conversations[activeConvo]) return;
    const unread = conversations[activeConvo].messages.filter(
      (m) => !m.read && m.toUserId === currentUserId
    );
    unread.forEach((m) => {
      fetch(`/api/messages/${m.id}/read`, { method: "PATCH" }).catch(() => {});
    });
  }, [activeConvo, conversations, currentUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvo) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: activeConvo, body: newMessage.trim() }),
    });
    setNewMessage("");
    setSending(false);
    fetchMessages();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const selectUser = (userId: string) => {
    setActiveConvo(userId);
    setShowUserPicker(false);
  };

  if (!open) return null;

  const convoList = Object.entries(conversations).sort(([, a], [, b]) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt || "";
    const bLast = b.messages[b.messages.length - 1]?.createdAt || "";
    return bLast.localeCompare(aLast);
  });

  const activeMessages = activeConvo ? conversations[activeConvo]?.messages || [] : [];
  const activeUser = activeConvo
    ? conversations[activeConvo]?.user || teamUsers.find((u) => u.id === activeConvo) || null
    : null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col" style={{ height: "100vh" }}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-syne font-bold text-white">Messages</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — two panels */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Conversation List */}
          <div className="w-1/3 border-r border-zinc-800 flex flex-col overflow-hidden">
            {/* New Message button */}
            <button
              onClick={() => setShowUserPicker(!showUserPicker)}
              className="shrink-0 flex items-center gap-2 px-3 py-2.5 text-xs font-mono text-[#c47a4f] hover:text-[#d89a6f] border-b border-zinc-800 transition-colors w-full text-left"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Message
            </button>

            {/* User picker dropdown */}
            {showUserPicker && (
              <div className="shrink-0 border-b border-zinc-800 max-h-40 overflow-y-auto bg-zinc-800/50">
                {teamUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u.id)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-white font-semibold shrink-0 overflow-hidden">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        u.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs text-zinc-300 truncate">{u.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {convoList.length === 0 && !showUserPicker ? (
                <p className="text-xs text-zinc-600 text-center py-8 px-2">No conversations yet</p>
              ) : (
                convoList.map(([userId, convo]) => {
                  const lastMsg = convo.messages[convo.messages.length - 1];
                  const isActive = activeConvo === userId;
                  return (
                    <button
                      key={userId}
                      onClick={() => setActiveConvo(userId)}
                      className={`w-full text-left p-3 border-b border-zinc-800/50 transition-colors ${
                        isActive ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white font-semibold shrink-0 overflow-hidden">
                          {convo.user.profileImage ? (
                            <img src={convo.user.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            convo.user.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-200 font-medium truncate">{convo.user.name}</span>
                            {convo.unreadCount > 0 && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            )}
                          </div>
                          {lastMsg && (
                            <p className="text-[10px] text-zinc-500 truncate">{lastMsg.body}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right — Thread */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!activeConvo || !activeUser ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm font-mono">
                Select a conversation
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="shrink-0 p-3 border-b border-zinc-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white font-semibold overflow-hidden">
                    {activeUser.profileImage ? (
                      <img src={activeUser.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeUser.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm text-zinc-200 font-medium">{activeUser.name}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {activeMessages.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-8">No messages yet. Say hello!</p>
                  )}
                  {activeMessages.map((msg) => {
                    const isMine = msg.fromUserId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                            isMine
                              ? "bg-[#c47a4f] text-white"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <p>{msg.body}</p>
                          <p className={`text-[9px] mt-1 ${isMine ? "text-white/60" : "text-zinc-600"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input — always visible at bottom */}
                <div className="shrink-0 p-3 border-t border-zinc-800 bg-zinc-900 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
