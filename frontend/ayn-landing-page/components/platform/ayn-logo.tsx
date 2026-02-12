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
      {/* mix-blend-screen makes the black background of the logo blend out so only AYN + blue ring show */}
      <span className="block [&_img]:mix-blend-screen">
        <Image
          src="/ayn_logo_modern_1.png"
          alt="AYN Logo"
          width={120}
          height={40}
          className={className}
          priority
        />
      </span>
    </Link>
  )
}
