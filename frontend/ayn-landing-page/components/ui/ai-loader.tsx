"use client";
import * as React from "react";

interface LoaderProps {
  size?: number;
  text?: string;
}

export const AiLoader: React.FC<LoaderProps> = ({
  size = 160,
  text = "Horus",
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
          className="inline-block text-white/70 font-semibold tracking-widest animate-[loaderLetter_3s_infinite]"
          style={{
            fontSize: size * 0.11,
            animationDelay: `${index * 0.15}s`,
          }}
        >
          {letter}
        </span>
      ))}
      <div className="absolute inset-0 rounded-full animate-[loaderCircle_5s_linear_infinite]" />
    </div>
  );
};
