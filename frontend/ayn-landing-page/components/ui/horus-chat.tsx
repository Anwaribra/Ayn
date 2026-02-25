"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Copy, RefreshCw } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function HorusChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      role: "assistant", 
      content: "Hi! I am Horus AI, your compliance and quality assurance assistant. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/horus/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textObj = decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, content: msg.content + textObj } : msg
        ));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "An error occurred while communicating with Horus AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4 scrollbar-thin">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-blue-600 text-white"
                }`}
              >
                {message.role === "user" ? <User size={16} /> : "A"}
              </div>
              <div 
                className={`p-4 rounded-2xl ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-layer-1 border border-border shadow-sm rounded-tl-sm text-foreground"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                {message.role === "assistant" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/50 text-muted-foreground">
                    <button className="hover:text-foreground transition-colors p-1" title="Copy">
                      <Copy size={14} />
                    </button>
                    <button className="hover:text-foreground transition-colors p-1" title="Regenerate">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%] flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-600 text-white">
                A
              </div>
              <div className="p-4 rounded-2xl bg-layer-1 border border-border shadow-sm rounded-tl-sm text-foreground flex items-center gap-3">
                <span className="text-sm font-medium animate-pulse text-muted-foreground">Horus يفكّر...</span>
                <div className="flex gap-1.5 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 pt-4 border-t border-border bg-layer-0/50 backdrop-blur-sm sticky bottom-0">
        <form onSubmit={handleSubmit} className="relative flex items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Write a message..."
            disabled={isLoading}
            rows={1}
            className="w-full bg-layer-1 border border-border rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-foreground disabled:opacity-50 transition-shadow resize-none min-h-[50px] max-h-[150px] overflow-y-auto scrollbar-thin"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 bottom-3 p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-transparent border-none cursor-pointer"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
