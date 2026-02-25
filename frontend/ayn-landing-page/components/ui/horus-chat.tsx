"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Copy, RefreshCw, Paperclip, Check, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Types ────────────────────────────────────────────────────────────────
export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  base64?: string;
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: MessagePart[];
}

// ─── Helper Functions ─────────────────────────────────────────────────────
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove the data:*/*;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      }
    };
    reader.onerror = error => reject(error);
  });
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="hover:text-foreground transition-colors p-1 rounded hover:bg-black/5" title="Copy">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────
export function HorusChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      role: "assistant", 
      content: [{ text: "Welcome to Horus AI! I am here to assist you with ISO 21001, NAQAAE, NCAAA, and complete educational quality assurance. How can I help you today?" }] 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadingSteps = ["Analyzing context...", "Processing request...", "Generating response..."];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, attachedFiles]);

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 2));
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle file uploads
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = await Promise.all(
      files.slice(0, 3 - attachedFiles.length).map(async (file) => {
        const isImage = file.type.startsWith("image/");
        const base64 = await fileToBase64(file);
        
        return {
          id: crypto.randomUUID(),
          file,
          type: (isImage ? "image" : "document") as "image" | "document",
          preview: isImage ? URL.createObjectURL(file) : undefined,
          base64
        };
      })
    );
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (e.target) e.target.value = "";
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Send message to Gemini
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    // Build the user parts
    const userParts: MessagePart[] = [];
    if (input.trim()) {
      userParts.push({ text: input });
    }
    attachedFiles.forEach(file => {
      if (file.base64) {
        userParts.push({ inlineData: { data: file.base64, mimeType: file.file.type } });
      }
    });

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: userParts };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api-local/horus/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: [{ text: "" }] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textObj = decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            const currentText = msg.content[0]?.text || "";
            return { ...msg, content: [{ text: currentText + textObj }] };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: [{ text: "An error occurred while communicating with Horus AI." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to extract text from message content parts
  const getMessageText = (parts: MessagePart[]) => {
    return parts.find(p => p.text)?.text || "";
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 bg-transparent">
      {/* ─── Messages Area ─── */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4 scrollbar-thin">
        {messages.map((message) => {
          const text = getMessageText(message.content);
          // Get attached files if they are available
          const attachments = message.content.filter(p => !p.text);

          return (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* Avatar */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {message.role === "user" ? <User size={16} /> : "H"}
                </div>
                
                {/* Bubble */}
                <div 
                  className={`px-5 py-4 min-w-[200px] flex flex-col ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md" 
                      : "bg-layer-1 border border-border shadow-sm rounded-2xl rounded-tl-md text-foreground"
                  }`}
                >
                  {/* Attached Render */}
                  {attachments.length > 0 && (
                    <div className="flex gap-2 mb-3 file-attachment-grid">
                       {attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-black/10 rounded-md border border-white/20">
                            <FileText size={16} />
                            <span className="text-xs font-semibold">Attachment</span>
                          </div>
                       ))}
                    </div>
                  )}

                  {/* Markdown content */}
                  <div className={`prose prose-sm max-w-none break-words ${message.role === "user" ? "text-primary-foreground prose-invert" : "dark:prose-invert"}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Actions */}
                  {message.role === "assistant" && text.length > 0 && (
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/50 text-muted-foreground w-full">
                      <CopyButton text={text} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* ─── Loading State ─── */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%] flex-row">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                H
              </div>
              <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-layer-1 border border-border shadow-sm text-foreground flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-semibold animate-pulse tracking-wide text-foreground">
                  {loadingSteps[loadingStep]}
                </span>
                <div className="flex gap-1 pt-1 opacity-60">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ─── Input Area ─── */}
      <div className="mt-4 pt-4 border-t border-border bg-transparent sticky bottom-0">
        <div className="w-full max-w-4xl mx-auto space-y-3">
          
          {/* File Previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="relative flex items-center gap-2 p-2 pr-8 bg-layer-1 border border-border rounded-lg shadow-sm">
                  {file.type === "image" && file.preview ? (
                    <img src={file.preview} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary p-1" />
                  )}
                  <div className="flex flex-col min-w-0 max-w-[120px]">
                    <span className="text-xs font-semibold truncate">{file.file.name}</span>
                    <span className="text-[10px] text-muted-foreground">{(file.file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative flex items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || attachedFiles.length >= 3}
              className="absolute left-3 bottom-3 p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 z-10 bg-transparent rounded-lg hover:bg-black/5"
              title="Attach File"
            >
              <Paperclip size={20} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Message Horus about ISO 21001, NAQAAE, or Evidence..."
              disabled={isLoading}
              rows={1}
              className="w-full bg-layer-1 border border-border rounded-2xl py-3 pl-14 pr-14 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-foreground disabled:opacity-50 transition-all resize-none min-h-[50px] overflow-y-auto scrollbar-thin"
            />
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
              className="absolute right-3 bottom-3 p-2 text-white bg-primary hover:bg-primary/90 rounded-xl transition-all disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground z-10 flex items-center justify-center scale-95 hover:scale-100"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center w-full">
             <span className="text-[10px] text-muted-foreground">Press Enter to send, Shift + Enter for new line. AI generated responses may not be fully complete.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
