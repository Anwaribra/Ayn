"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { AynLogo } from "@/components/ayn-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, Check } from "lucide-react"

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const passwordStrength = () => {
    const { password } = formData
    if (password.length === 0) return null
    if (password.length < 6) return { label: "Weak", color: "bg-red-500", width: "w-1/4" }
    if (password.length < 10) return { label: "Fair", color: "bg-yellow-500", width: "w-2/4" }
    if (password.length < 14) return { label: "Good", color: "bg-zinc-400", width: "w-3/4" }
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" }
  }

  const strength = passwordStrength()

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center overflow-hidden relative py-12">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Glossy Orbs */}
      <div
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-zinc-700/10 rounded-full blur-3xl animate-pulse"
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
              Create Account
            </span>
          </h1>
          <p className="text-zinc-500 text-sm">Get started with Ayn today</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300 text-sm">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="text-zinc-300 text-sm">
                Organization
              </Label>
              <Input
                id="organization"
                type="text"
                placeholder="Your institution name"
                value={formData.organization}
                onChange={handleChange}
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
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
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
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                  <p className="text-xs text-zinc-500">{strength.label} password</p>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-800/50 text-zinc-100 focus:ring-zinc-500/20"
              />
              <label htmlFor="terms" className="text-sm text-zinc-400 cursor-pointer">
                I agree to the{" "}
                <Link href="#" className="text-zinc-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-zinc-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-100 text-black hover:bg-white hover:scale-[1.02] transition-all duration-300 py-6 text-base font-medium group"
            >
              Create Account
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-3">What you get:</p>
            <div className="space-y-2">
              {["ISO 21001 compliance tools", "NAQAAE standards support", "Horus Engine AI insights"].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-xs text-zinc-400">
                  <Check size={14} className="text-zinc-500" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-300 hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
