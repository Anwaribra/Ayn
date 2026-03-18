"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Paperclip, Send, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PLACEHOLDER = "Ask Horus…";

interface AIChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    onFileAttach?: (file: File) => void;
    onChange?: (value: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    hasFiles?: boolean;
    footer?: ReactNode;
}

export const AIChatInput = ({
    onSend,
    onStop,
    onFileAttach,
    onChange,
    isLoading = false,
    disabled = false,
    hasFiles = false,
    footer,
}: AIChatInputProps) => {
    const [isActive, setIsActive] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Close input when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                if (!inputValue) setIsActive(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [inputValue]);

    const handleActivate = () => setIsActive(true);

    const handleSend = () => {
        if ((!inputValue.trim() && !hasFiles) || isLoading) return;
        onSend(inputValue.trim());
        setInputValue("");
        setIsActive(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const resizeTextarea = useCallback((value: string) => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const next = Math.min(el.scrollHeight, 140);
        el.style.height = `${Math.max(next, 44)}px`;
    }, []);

    useEffect(() => {
        resizeTextarea(inputValue);
    }, [inputValue, resizeTextarea]);

    return (
        <div className="flex w-full flex-col items-center justify-center pb-3 pt-1 sm:pb-6 sm:pt-2">
            <div
                ref={wrapperRef}
                style={{ overflow: "hidden" }}
                className={cn(
                    "horus-input-shell glass-panel glass-border glass-focus-ring w-full max-w-[900px] rounded-[var(--radius-xl)] sm:rounded-3xl",
                    (isActive || inputValue) && "is-active"
                )}
                onClick={handleActivate}
            >
                <div className="flex h-full w-full flex-col items-stretch">
                    <div className="relative w-full px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
                        <textarea
                            value={inputValue}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                            placeholder={DEFAULT_PLACEHOLDER}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                resizeTextarea(e.target.value);
                                if (onChange) onChange(e.target.value);
                            }}
                            className={cn(
                                "horus-input-field w-full bg-transparent border-none pr-11 text-[14px] font-medium tracking-[0.01em] outline-none focus:border-none focus:outline-none focus:ring-0 sm:pr-12 sm:text-[15px] md:text-[16px]",
                                "text-foreground placeholder:text-muted-foreground/70"
                            )}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                color: "var(--foreground)",
                                WebkitTextFillColor: "var(--foreground)",
                                caretColor: "var(--foreground)",
                            }}
                            onFocus={handleActivate}
                            ref={textareaRef}
                            rows={1}
                        />

                        {isLoading ? (
                            <button
                                className="horus-stop-button absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full font-bold shadow-md transition-transform sm:right-4 sm:h-9 sm:w-9"
                                onClick={onStop}
                                type="button"
                            >
                                <StopCircle size={16} className="sm:h-[18px] sm:w-[18px]" />
                            </button>
                        ) : (
                            <button
                                className={cn(
                                    "horus-send-button absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full font-bold shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:right-4 sm:h-9 sm:w-9",
                                    (inputValue.trim() || hasFiles) && "shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                                )}
                                title="Send"
                                type="button"
                                disabled={!inputValue.trim() && !hasFiles}
                                onClick={handleSend}
                                tabIndex={-1}
                            >
                                <Send size={16} className="ml-[-1px] text-white sm:h-[18px] sm:w-[18px]" />
                            </button>
                        )}
                    </div>

                    <div className="flex min-h-[44px] items-center gap-2 border-t border-white/6 px-3 py-2 sm:px-4">
                        <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:text-foreground sm:h-8 sm:w-8"
                            title="Attach file"
                            type="button"
                            tabIndex={-1}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={16} className="sm:h-[18px] sm:w-[18px]" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.txt,image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onFileAttach) onFileAttach(file);
                            }}
                        />
                        <div className="min-w-0 flex-1 text-muted-foreground">
                            {footer}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
