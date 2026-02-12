"use client"

import Link from "next/link"
import Image from "next/image"

export function AynLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Link 
      href="https://ayn.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="group flex items-center justify-center hover:opacity-80 transition-opacity"
    >
      <Image
        src="/ayn_logo_modern_1.png"
        alt="AYN Logo"
        width={120}
        height={40}
        className={className}
        priority
      />
    </Link>
  )
}
