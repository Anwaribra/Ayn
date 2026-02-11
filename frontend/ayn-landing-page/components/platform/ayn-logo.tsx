"use client"

import Link from "next/link"

export function AynLogo() {
  return (
    <Link 
      href="https://ayn.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group flex items-center justify-center hover:opacity-70 transition-opacity"
    >
      <div className="relative flex items-center justify-center w-14 h-8">
        {/* القوس المحيط بالكلمة - باللون الأبيض للخلفية الداكنة */}
        <svg 
          className="absolute w-full h-full" 
          viewBox="0 0 100 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M15 45 C 5 10, 85 5, 95 35" 
            stroke="white" 
            strokeWidth="4" 
            strokeLinecap="round"
            className="opacity-90"
          />
        </svg>

        {/* النص - باللون الأبيض وخط عريض جداً */}
        <span className="relative font-black text-[13px] tracking-tighter text-white antialiased">
          AYN
        </span>
      </div>
    </Link>
  )
}
