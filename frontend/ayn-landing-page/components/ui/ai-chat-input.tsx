"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Paperclip, Send, StopCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
    "Ask about your compliance gaps...",
    "Upload a document for analysis...",
    "What are my ISO 21001 requirements?",
    "Summarize my evidence status...",
    "How do I improve my compliance score?",
    "Check my NAQAAE readiness...",
];

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
    isLoading = false,
    disabled = false,
    hasFiles = false,
    onChange,
}: AIChatInputProps) => {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cycle placeholder text when input is inactive
    useEffect(() => {
        if (isActive || inputValue) return;

        const interval = setInterval(() => {
            setShowPlaceholder(false);
            setTimeout(() => {
                setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
                setShowPlaceholder(true);
            }, 400);
        }, 3000);

        return () => clearInterval(interval);
    }, [isActive, inputValue]);

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

    const placeholderContainerVariants = {
        initial: {},
        animate: { transition: { staggerChildren: 0.025 } },
        exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
    };

    const letterVariants = {
        initial: {
            opacity: 0,
            filter: "blur(12px)",
            y: 10,
        },
        animate: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: {
                opacity: { duration: 0.25 },
                filter: { duration: 0.4 },
                y: { type: "spring", stiffness: 80, damping: 20 },
            },
        },
        exit: {
            opacity: 0,
            filter: "blur(12px)",
            y: -10,
            transition: {
                opacity: { duration: 0.2 },
                filter: { duration: 0.3 },
                y: { type: "spring", stiffness: 80, damping: 20 },
            },
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
                    "w-full max-w-[900px] backdrop-blur-3xl transition-colors duration-300",
                    "bg-white/95 border border-black/10", // Light mode
                    "dark:bg-[rgba(255,255,255,0.07)] dark:border-white/10" // Dark mode
                )}
                onClick={handleActivate}
            >
                <div className="flex flex-col items-stretch w-full h-full">
                    {/* Input Row */}
                    <div className="flex items-center gap-3 p-2 rounded-full w-full">
                        <button
                            className="p-3 ml-1 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
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

                        {/* Text Input & Placeholder */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={inputValue}
                                onKeyDown={handleKeyDown}
                                disabled={disabled}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    if (onChange) onChange(e.target.value);
                                }}
                                className={cn(
                                    "flex-1 w-full font-medium text-[16px] py-4 px-2 placeholder-transparent bg-transparent border-none outline-none focus:ring-0 focus:outline-none focus:border-none !text-gray-900 dark:!text-white",
                                    "placeholder-gray-400 dark:placeholder-gray-500"
                                )}
                                style={{ position: "relative", zIndex: 1 }}
                                onFocus={handleActivate}
                            />
                            <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-2">
                                <AnimatePresence mode="wait">
                                    {showPlaceholder && !isActive && !inputValue && (
                                        <motion.span
                                            key={placeholderIndex}
                                            className={cn(
                                                "absolute left-2 top-1/2 -translate-y-1/2 text-[16px] font-medium select-none pointer-events-none",
                                                "text-zinc-500 dark:text-white/40"
                                            )}
                                            style={{
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                zIndex: 0,
                                            }}
                                            variants={placeholderContainerVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                        >
                                            {PLACEHOLDERS[placeholderIndex]
                                                .split("")
                                                .map((char, i) => (
                                                    <motion.span
                                                        key={i}
                                                        variants={letterVariants}
                                                        style={{ display: "inline-block" }}
                                                    >
                                                        {char === " " ? "\u00A0" : char}
                                                    </motion.span>
                                                ))}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>


                        {isLoading ? (
                            <button
                                className="flex w-[50px] h-[50px] items-center bg-red-500 hover:bg-red-400 text-white rounded-full font-bold justify-center flex-shrink-0 transition-transform active:scale-95 shadow-md"
                                onClick={onStop}
                                type="button"
                            >
                                <StopCircle size={22} />
                            </button>
                        ) : (
                            <button
                                className="flex w-[50px] h-[50px] items-center bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed justify-center text-white rounded-full font-bold flex-shrink-0 transition-transform active:scale-95 shadow-md"
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
            </motion.div>
        </div>
    );
};
