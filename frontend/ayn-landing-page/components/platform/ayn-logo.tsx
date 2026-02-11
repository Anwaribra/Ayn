import * as React from 'react';

const AynLogo = ({ className = "h-12" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 400 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Definitions for Gradients and Filters */}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
            <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky-500 */}
          </linearGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <style>
            {`
              @keyframes orbit {
                0% { stroke-dashoffset: 1000; opacity: 0.6; }
                50% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 0.6; }
              }
              .animate-orbit {
                stroke-dasharray: 1000;
                animation: orbit 4s linear infinite;
              }
            `}
          </style>
        </defs>

        {/* The Orbital Ring with Glow */}
        <path
          d="M 50,120 C 30,80 100,30 250,50 C 380,70 350,150 200,170 C 100,185 60,150 50,120"
          stroke="url(#ringGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#glow)"
          className="animate-orbit"
        />

        {/* The Text AYN */}
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          fill="white"
          style={{
            fontFamily: 'sans-serif',
            fontWeight: '900',
            fontSize: '80px',
            letterSpacing: '4px'
          }}
        >
          AYN
        </text>
      </svg>
    </div>
  );
};

export { AynLogo };
