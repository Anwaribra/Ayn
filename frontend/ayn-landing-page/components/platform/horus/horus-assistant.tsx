"use client";

import { useChat } from "@ai-sdk/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread, makeMarkdownText } from "@assistant-ui/react-ui";
import React, { Component, ErrorInfo, ReactNode } from "react";

import "@assistant-ui/react-ui/styles/index.css";
import "@assistant-ui/react-ui/styles/markdown.css";

const MarkdownText = makeMarkdownText();

// --- Simple Error Boundary Component ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HorusAssistant Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full p-4 text-center border border-dashed rounded-xl bg-red-50 text-red-600">
          <div>
            <h3 className="font-bold">Horus Assistant failed to load.</h3>
            <p className="text-sm">Please refresh the page or contact support if the issue persists.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function HorusAssistant() {
  const chat = useChat({
    // @ts-expect-error - Some versions of AI SDK type UseChatOptions differently
    api: "/api-local/horus/chat",
    initialMessages: [
      {
        id: "sys-welcome",
        role: "assistant",
        content:
          "I'm Horus (حورس), the central intelligence of the Ayn (عين) Platform. I'm here to assist you with educational quality assurance, ISO 21001, NAQAAE, and NCAAA. How can I help you today?",
      },
    ],
  });

  const runtime = useChatRuntime(chat);

  if (!runtime) return null;

  return (
    <ErrorBoundary>
      <div className="h-full w-full bg-layer-0 outline-none flex flex-col justify-center items-center py-4">
        <AssistantRuntimeProvider runtime={runtime}>
          <div className="flex-1 w-full max-w-[900px] border border-border shadow-sm rounded-xl overflow-hidden bg-white relative">
            <Thread
              assistantMessage={{ components: { Text: MarkdownText } }}
              welcome={{
                message: "### Horus Intelligence\nAnalyze, extract, and ensure absolute compliance.",
              }}
            />
          </div>
        </AssistantRuntimeProvider>
        <style jsx global>{`
          /* Minimal UI Branding overrides for the generated thread */
          .aui-thread-root {
            height: 100%;
            width: 100%;
          }
          .aui-user-message-root {
            background-color: var(--primary) !important;
            color: white !important;
            border-radius: 16px 16px 0px 16px !important;
          }
          .aui-assistant-message-root {
            background-color: #f7f9fa !important;
            color: var(--foreground) !important;
            border-radius: 16px 16px 16px 0px !important;
            border: 1px solid var(--border-subtle);
          }
          .aui-composer-root {
            border-top: 1px solid var(--border-subtle) !important;
            background: white !important;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
