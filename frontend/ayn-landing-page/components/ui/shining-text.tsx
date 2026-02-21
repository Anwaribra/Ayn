"use client"
import * as React from "react"
import { motion } from "framer-motion"

interface ShiningTextProps {
    text?: string;
    className?: string;
}

export function ShiningText({
    text = "Horus is thinking...",
    className = ""
}: ShiningTextProps) {
    return (
        <motion.p
            className={`bg-[linear-gradient(110deg,#3b82f6,30%,#93c5fd,50%,#3b82f6,70%,#1d4ed8)] bg-[length:200%_100%] bg-clip-text text-sm font-medium text-transparent select-none ${className}`}
            initial={{ backgroundPosition: "200% 0" }}
            animate={{ backgroundPosition: "-200% 0" }}
            transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "linear",
            }}
        >
            {text}
        </motion.p>
    );
}
