"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AynLogo } from "./ayn-logo"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setIsMobileMenuOpen(false)
  }

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#horus", label: "Horus Engine" },
    { href: "#why", label: "About Ayn" },
  ]

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-zinc-800/50" : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <AynLogo size="sm" withGlow={false} />
            <span className="text-xl font-light tracking-wider text-zinc-100">Ayn</span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-300 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: Login & Sign Up */}
          <div className="flex items-center gap-3 ml-auto">
            <Link 
              href="/login" 
              className="text-sm text-zinc-300 hover:text-white transition-colors duration-300"
            >
              Login
            </Link>
            <Button asChild className="bg-white text-black hover:bg-zinc-100 transition-all duration-300">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden text-zinc-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-zinc-800/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-2">
                <Link 
                  href="/login" 
                  className="text-sm text-zinc-300 hover:text-white transition-colors text-center py-2"
                >
                  Login
                </Link>
                <Button asChild className="bg-white text-black hover:bg-zinc-100 w-full">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
