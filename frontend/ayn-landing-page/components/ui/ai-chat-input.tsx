"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { Paperclip, Send, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PLACEHOLDER = "Ask Horus about your compliance…";

interface AIChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    onFileAttach?: (file: File) => void;
    onChange?: (value: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    hasFiles?: boolean;
}

export const AIChatInput = ({
    onSend,
    onStop,
    onFileAttach,
    onChange,
    isLoading = false,
    disabled = false,
    hasFiles = false,
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
        <div className="w-full flex-col flex justify-center items-center pb-6 pt-2">
            <div
                ref={wrapperRef}
                style={{ overflow: "hidden" }}
                className={cn(
                    "w-full max-w-[900px] glass-panel glass-border rounded-3xl horus-input-shell glass-focus-ring",
                    (isActive || inputValue) && "is-active"
                )}
                onClick={handleActivate}
            >
                <div className="flex flex-col items-stretch w-full h-full">
                    {/* Input Row */}
                    <div className="flex items-end gap-2.5 p-2.5 w-full">
                        <button
                            className="p-3 ml-1 rounded-2xl text-muted-foreground glass-button min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Attach file"
                            type="button"
                            tabIndex={-1}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={24} />
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

                        {/* Text Input */}
                        <div className="relative flex-1">
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
                                    "flex-1 w-full font-medium text-[15px] md:text-[16px] py-3 px-2 bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus:border-none tracking-[0.01em] horus-input-field",
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
                        </div>


                        {isLoading ? (
                            <button
                                className="flex w-[50px] h-[50px] items-center rounded-2xl font-bold justify-center flex-shrink-0 transition-transform shadow-md min-h-[44px] min-w-[44px] horus-stop-button"
                                onClick={onStop}
                                type="button"
                            >
                                <StopCircle size={22} />
                            </button>
                        ) : (
                            <button
                                className={cn(
                                    "flex w-[50px] h-[50px] items-center disabled:opacity-30 disabled:cursor-not-allowed justify-center rounded-2xl font-bold flex-shrink-0 transition-all shadow-md min-h-[44px] min-w-[44px] horus-send-button",
                                    (inputValue.trim() || hasFiles) && "shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                                )}
                                title="Send"
                                type="button"
                                disabled={!inputValue.trim() && !hasFiles}
                                onClick={handleSend}
                                tabIndex={-1}
                            >
                                <Send size={22} className="ml-[-2px] text-white" />
                            </button>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
};
