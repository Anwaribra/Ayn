import * as React from "react";

interface LoaderProps {
  size?: number;
  text?: string;
}

export const AiLoader: React.FC<LoaderProps> = ({
  size = 180,
  text = "Generating"
}) => {
  const letters = text.split("");

  return (
    <div className="flex items-center justify-center w-full py-8">
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-slate-500 text-sm font-medium opacity-40 animate-[loaderLetter_3s_infinite]"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
        <div className="absolute inset-0 rounded-full animate-[loaderCircle_5s_linear_infinite]" />
      </div>
    </div>
  );
};
