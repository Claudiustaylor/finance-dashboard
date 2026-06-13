"use client";

import { useEffect, useState, useRef } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AiChatDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AiChatDrawer({ open: openProp, onOpenChange }: AiChatDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi Claudius. I’m Titan AI. Ask me anything about your books — cash flow, expenses, anomalies, or revenue recognition.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const userId = localStorage.getItem("titan_user_id") || crypto.randomUUID();
      localStorage.setItem("titan_user_id", userId);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-titan-user-id": userId },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (data.message?.content) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message.content }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "I had trouble responding. Try again?" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-[#0071c5] text-white shadow-lg transition hover:bg-[#005fa6] hover:scale-105 sm:bottom-8 sm:right-8"
          aria-label="Open AI assistant"
        >
          <Bot className="size-5" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#0071c5]/10">
                  <Sparkles className="size-4 text-[#0071c5]" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Titan AI</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-[#0071c5] text-white"
                      : "bg-slate-100 text-slate-800"
                  )}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="w-fit rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                  Titan AI is thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Ask about your books…"
                  className="flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="size-8 rounded-full bg-[#0071c5]"
                >
                  <Send className="size-3.5 text-white" />
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">Powered by Ollama Pro · kimi-k2.7-code</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
