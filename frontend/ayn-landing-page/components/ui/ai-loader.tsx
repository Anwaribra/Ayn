"use client";
import * as React from "react";

interface LoaderProps {
    size?: number;
    text?: string;
}

export const AiLoader: React.FC<LoaderProps> = ({
    size = 200,
    text = "Horus AI",
}) => {
    const letters = text.split("");

    return (
        <div
            className="relative flex items-center justify-center select-none"
            style={{ width: size, height: size }}
        >
            {letters.map((letter, index) => (
                <span
                    key={index}
                    className="inline-block font-semibold tracking-widest animate-[loaderLetter_3s_infinite] text-white/80 dark:text-white/80 [.light_&]:text-slate-600"
                    style={{
                        fontSize: size * 0.1,
                        animationDelay: `${index * 0.12}s`,
                    }}
                >
                    {letter === " " ? "\u00A0" : letter}
                </span>
            ))}
            <div className="absolute inset-0 rounded-full animate-[loaderCircle_5s_linear_infinite]" />
        </div>
    );
};
