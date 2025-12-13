"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { AynLogo } from "@/components/ayn-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Glossy Orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-zinc-700/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <AynLogo size="lg" withGlow />
          </Link>
          <h1 className="text-3xl font-light mb-2">
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              Welcome Back
            </span>
          </h1>
          <p className="text-zinc-500 text-sm">Sign in to your Ayn account</p>
        </div>

        {/* Login Form */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800/50 text-zinc-100 focus:ring-zinc-500/20"
                />
                <span className="text-zinc-400">Remember me</span>
              </label>
              <Link href="#" className="text-zinc-400 hover:text-zinc-200 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-100 text-black hover:bg-white hover:scale-[1.02] transition-all duration-300 py-6 text-base font-medium group"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-zinc-300 hover:text-white transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
