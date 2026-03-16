"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Paperclip, Send, StopCircle } from "lucide-react";
import { motion } from "framer-motion";
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

    const containerVariants = {
        collapsed: {
            boxShadow: "0 4px 12px 0 rgba(0,0,0,0.05)",
            transition: { type: "spring", stiffness: 120, damping: 18 },
        },
        expanded: {
            boxShadow: "0 8px 32px 0 rgba(59,130,246,0.15)",
            transition: { type: "spring", stiffness: 120, damping: 18 },
        },
    };

    return (
        <div className="w-full flex-col flex justify-center items-center pb-8 pt-4">
            <motion.div
                ref={wrapperRef}
                variants={containerVariants}
                animate={isActive || inputValue ? "expanded" : "collapsed"}
                initial="collapsed"
                style={{ overflow: "hidden", borderRadius: 36 }}
                className={cn(
                    "w-full max-w-[900px] backdrop-blur-2xl transition-all duration-300",
                    "bg-[var(--surface)]/80 border border-[var(--border-subtle)] text-foreground shadow-[0_10px_30px_rgba(2,6,23,0.25)]",
                    (isActive || inputValue) && "ring-[1.5px] ring-primary/35 border-primary/35 shadow-[0_0_24px_rgba(59,130,246,0.12),0_0_8px_rgba(59,130,246,0.08)]"
                )}
                onClick={handleActivate}
            >
                <div className="flex flex-col items-stretch w-full h-full">
                    {/* Input Row */}
                    <div className="flex items-center gap-2.5 p-2 rounded-full w-full">
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            className="p-3 ml-1 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
                            title="Attach file"
                            type="button"
                            tabIndex={-1}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={24} />
                        </motion.button>
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
                            <input
                                type="text"
                                value={inputValue}
                                onKeyDown={handleKeyDown}
                                disabled={disabled}
                                placeholder={DEFAULT_PLACEHOLDER}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    if (onChange) onChange(e.target.value);
                                }}
                                className={cn(
                                    "flex-1 w-full font-medium text-[15px] md:text-[16px] py-4 px-2 bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus:border-none tracking-[0.01em]",
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
                            />
                        </div>


                        {isLoading ? (
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                className="flex w-[50px] h-[50px] items-center bg-red-500 hover:bg-red-400 text-white rounded-full font-bold justify-center flex-shrink-0 transition-transform shadow-md min-h-[44px] min-w-[44px]"
                                onClick={onStop}
                                type="button"
                            >
                                <StopCircle size={22} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                whileHover={{ scale: !inputValue.trim() && !hasFiles ? 1 : 1.05 }}
                                className={cn(
                                    "flex w-[50px] h-[50px] items-center bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed justify-center text-white rounded-full font-bold flex-shrink-0 transition-all shadow-md min-h-[44px] min-w-[44px]",
                                    (inputValue.trim() || hasFiles) && "shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                                )}
                                title="Send"
                                type="button"
                                disabled={!inputValue.trim() && !hasFiles}
                                onClick={handleSend}
                                tabIndex={-1}
                            >
                                <Send size={22} className="ml-[-2px] text-white" />
                            </motion.button>
                        )}

                    </div>

                </div>
            </motion.div>
        </div>
    );
};
