"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import { SparklesCore } from "@/components/ui/sparkles"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Pure Black Background - No gradients */}
      <div className="absolute inset-0 bg-black" />

      {/* Content Container */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto w-full">
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight text-white">
          Ayn
        </h1>

        {/* Sparkles Animation Area - Like Sparkles Demo */}
        <div className="w-full max-w-[40rem] mx-auto h-40 relative mb-8">
          {/* Subtle Gradient Line (white/zinc only, no blue) */}
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-white/30 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-white/50 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-white/40 to-transparent h-px w-1/4" />

          {/* SparklesCore - Pure white particles on black */}
          <SparklesCore
            id="hero-sparkles-gradient"
            background="transparent"
            particleColor="#FFFFFF"
            minSize={0.4}
            maxSize={1}
            particleDensity={1200}
            speed={2}
            className="w-full h-full"
          />

          {/* Radial Gradient Mask for smooth edges */}
          <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
        </div>

        {/* Subtitle */}
        <h2 className="text-xl md:text-2xl lg:text-3xl text-zinc-400 mb-4 font-light tracking-wide">
          The Education Quality & Accreditation Platform
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base text-zinc-500 mb-12 max-w-2xl mx-auto">
          Powered by Horus Engine for ISO 21001 & NAQAAE Standards
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-zinc-100 hover:scale-105 transition-all duration-300 px-8 py-6 text-base font-medium"
          >
            <Link href="/signup">
              Sign Up
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-500 transition-all duration-300 px-8 py-6 text-base bg-transparent"
          >
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>
      </div>

    </section>
  )
}
