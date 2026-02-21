"use client"
import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Paperclip, Send, StopCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
    isLoading?: boolean;
    disabled?: boolean;
}

export const AIChatInput = ({
    onSend,
    onStop,
    onFileAttach,
    isLoading = false,
    disabled = false,
}: AIChatInputProps) => {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                if (!inputValue) setIsActive(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [inputValue]);

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;
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
            height: 64,
            boxShadow: "0 2px 16px 0 rgba(0,0,0,0.18)",
            transition: { type: "spring", stiffness: 120, damping: 18 },
        },
        expanded: {
            height: 64,
            boxShadow: "0 4px 32px 0 rgba(59,130,246,0.15)",
            transition: { type: "spring", stiffness: 120, damping: 18 },
        },
    };

    const letterVariants = {
        initial: { opacity: 0, filter: "blur(8px)", y: 6 },
        animate: {
            opacity: 1, filter: "blur(0px)", y: 0,
            transition: {
                opacity: { duration: 0.2 }, filter: { duration: 0.3 },
                y: { type: "spring", stiffness: 80, damping: 20 }
            },
        },
        exit: {
            opacity: 0, filter: "blur(8px)", y: -6,
            transition: { opacity: { duration: 0.15 }, filter: { duration: 0.2 } },
        },
    };

    return (
        <div className="w-full flex flex-col items-center px-4 pb-2">
            <motion.div
                ref={wrapperRef}
                className="w-full max-w-3xl"
                variants={containerVariants}
                animate={isActive || inputValue ? "expanded" : "collapsed"}
                initial="collapsed"
                style={{
                    overflow: "hidden",
                    borderRadius: 32,
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                }}
                onClick={() => setIsActive(true)}
            >
                <div className="flex items-center gap-2 px-4 h-16">
                    {/* Attach button */}
                    <button
                        className="p-2 rounded-full hover:bg-white/10 transition text-white/50 
              hover:text-white/90 flex-shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        tabIndex={-1}
                    >
                        <Paperclip size={18} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onFileAttach) onFileAttach(file);
                        }}
                    />

                    {/* Input + animated placeholder */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsActive(true)}
                            disabled={disabled}
                            className="w-full bg-transparent border-0 outline-none text-white 
                text-sm py-2 placeholder-transparent"
                            style={{ position: "relative", zIndex: 1 }}
                        />
                        <AnimatePresence mode="wait">
                            {showPlaceholder && !inputValue && !isActive && (
                                <motion.span
                                    key={placeholderIndex}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 
                    text-white/30 text-sm pointer-events-none select-none whitespace-nowrap"
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ staggerChildren: 0.025 }}
                                >
                                    {PLACEHOLDERS[placeholderIndex].split("").map((char, i) => (
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

                    {/* Send / Stop button */}
                    {isLoading ? (
                        <button
                            className="w-9 h-9 flex items-center justify-center bg-red-500 
                hover:bg-red-400 rounded-full transition flex-shrink-0"
                            onClick={onStop}
                            type="button"
                        >
                            <StopCircle size={18} className="text-white" />
                        </button>
                    ) : (
                        <button
                            className="w-9 h-9 flex items-center justify-center bg-blue-600 
                hover:bg-blue-500 rounded-full transition flex-shrink-0 
                disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            type="button"
                        >
                            <Send size={16} className="text-white" />
                        </button>
                    )}
                </div>
            </motion.div>

            <p className="text-white/25 text-[11px] mt-2">
                Horus can make mistakes. Verify important data.
            </p>
        </div>
    );
};
