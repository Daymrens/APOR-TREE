"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";
import Skeleton from "@/components/ui/Skeleton";
import {
  subscribeToMessages,
  sendMessage,
} from "@/lib/firestore/messages";
import type { ChatMessage } from "@/lib/types";

const BRANCH_COLORS: Record<string, string> = {
  Apor: "#1E3B2C",
  Jose: "#C23B6E",
  Rosa: "#E8A63D",
  Antonio: "#2E6B62",
};

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const [key, ...rest] = c.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function relativeTime(timestamp: { seconds: number; nanoseconds: number }): string {
  const now = Date.now();
  const then = timestamp.seconds * 1000;
  const diff = now - then;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;

  const date = new Date(then);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorBranch, setAuthorBranch] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [promptName, setPromptName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = getCookie("family-member-name");
    const branch = getCookie("family-member-branch");
    setAuthorName(name);
    setAuthorBranch(branch);
    if (!name) setShowNamePrompt(true);
  }, []);

  useEffect(() => {
    const unsub = subscribeToMessages((msgs) => {
      setMessages(msgs);
      setMessagesLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetName = useCallback(() => {
    const trimmed = promptName.trim();
    if (!trimmed) return;
    document.cookie = `family-member-name=${encodeURIComponent(trimmed)};path=/;max-age=31536000`;
    setAuthorName(trimmed);
    setShowNamePrompt(false);
  }, [promptName]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !authorName || sending) return;
    setSending(true);
    try {
      await sendMessage({
        authorName,
        authorBranch: authorBranch,
        content: inputValue.trim(),
      });
      setInputValue("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [inputValue, authorName, authorBranch, sending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (showNamePrompt) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">
          Family Chat
        </h1>
        <p className="text-soft font-sans text-sm mb-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          Enter your name to join the conversation.
        </p>
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <label className="block text-ink font-sans text-sm mb-2">Your name</label>
          <input
            type="text"
            value={promptName}
            onChange={(e) => setPromptName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSetName();
            }}
            placeholder="e.g. Maria Apor"
            className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/30 font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus transition-all"
            autoFocus
          />
          <button
            onClick={handleSetName}
            disabled={!promptName.trim()}
            className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans text-sm transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-8rem)]">
      <BackButton />
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-balete mb-1 animate-fade-in">Chat</h1>
        <p className="text-soft font-sans text-sm animate-fade-in" style={{ animationDelay: "0.05s" }}>
          The family message board
        </p>
      </div>

      <div className="flex-1 glass-card rounded-2xl p-4 mb-4 overflow-y-auto max-h-[50vh] sm:max-h-[60vh] animate-fade-in">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hibiscus/10 mb-4">
              <svg className="w-8 h-8 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-soft font-sans">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const branchColor = msg.authorBranch
                ? BRANCH_COLORS[msg.authorBranch] || "#C9A876"
                : null;
              return (
                <div
                  key={msg.id}
                  className="bg-white/50 rounded-xl px-4 py-3 animate-slide-up"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {branchColor && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: branchColor }}
                      />
                    )}
                    <span className="font-sans font-semibold text-balete text-sm">
                      {msg.authorName}
                    </span>
                    {msg.authorBranch && (
                      <span className="text-soft/50 text-xs font-mono">
                        {msg.authorBranch}
                      </span>
                    )}
                    <span className="text-soft/40 text-xs font-mono ml-auto">
                      {relativeTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-ink font-sans text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-20 sm:bottom-0 z-10">
        <div className="glass-card rounded-2xl p-3 flex items-center gap-2 animate-slide-up">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/50 border border-white/30 font-sans text-sm text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
