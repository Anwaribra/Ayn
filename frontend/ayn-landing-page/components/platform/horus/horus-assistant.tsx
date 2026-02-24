"use client";

import { useChat } from "@ai-sdk/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread, makeMarkdownText } from "@assistant-ui/react-ui";

const MarkdownText = makeMarkdownText();

export function HorusAssistant() {
  const chat = useChat({
    // @ts-expect-error - Vercel AI sdk supports api property, but some version mismatches cause type complaints
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

  return (
    <div className="h-full w-full bg-layer-0 outline-none flex flex-col justify-center items-center py-4">
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="flex-1 w-full max-w-[900px] border border-border shadow-sm rounded-xl overflow-hidden bg-white">
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
        .aui-user-message {
          background-color: var(--primary) !important;
          color: white !important;
          border-radius: 16px 16px 0px 16px !important;
        }
        .aui-assistant-message {
          background-color: #f7f9fa !important;
          color: var(--foreground) !important;
          border-radius: 16px 16px 16px 0px !important;
          border: 1px solid var(--border-subtle);
        }
        .aui-composer {
          border-top: 1px solid var(--border-subtle) !important;
          background: white !important;
        }
      `}</style>
    </div>
  );
}
