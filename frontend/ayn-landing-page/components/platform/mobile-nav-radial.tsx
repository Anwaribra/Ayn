"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Brain,
  FileCheck,
  Scale,
  Microscope,
  BarChart4,
  Archive,
  Settings,
  Sparkles,
  Shield,
  ChevronLeft,
} from "lucide-react"
import { useUiLanguage } from "@/lib/ui-language-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const ITEM_GAP = 56
const ARC_DEPTH = 24
const ITEM_SIZE = 44
const LABEL_GAP = 10
const FRICTION = 0.995

const SCALES = [1.3, 0.9, 0.65, 0.45, 0.25]
const OPACITIES = [1, 0.85, 0.55, 0.25, 0.08]

interface NavItem {
  id: string
  icon: any
  label: string
  href: string
}

export function MobileNavRadial() {
  const [isOpen, setIsOpen] = useState(false)
  const [phase, setPhase] = useState(0)
  const phaseRef = useRef(0)
  const touchRef = useRef({ startPhase: 0 })
  const rafRef = useRef(0)
  const pathname = usePathname()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  /* ── Close when bottom dock opens ── */
  useEffect(() => {
    if (!isOpen) return
    const handler = () => setIsOpen(false)
    window.addEventListener("dock-nav-open", handler)
    return () => window.removeEventListener("dock-nav-open", handler)
  }, [isOpen])

  /* ── Close when user scrolls the page content ── */
  useEffect(() => {
    if (!isOpen) return
    const el = document.querySelector(".content-scroll-area")
    if (!el) return
    const handler = () => setIsOpen(false)
    el.addEventListener("scroll", handler, { passive: true })
    return () => el.removeEventListener("scroll", handler)
  }, [isOpen])

  /* ── Notify dock to close when wheel opens/closes ── */
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("wheel-nav-open"))
    } else {
      window.dispatchEvent(new CustomEvent("wheel-nav-close"))
    }
  }, [isOpen])

  const open = () => {
    setIsOpen(true)
  }

  const navItems: NavItem[] = useMemo(() => {
    const items = [
      { id: "dashboard", icon: LayoutDashboard, label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/platform/dashboard" },
      { id: "horus-ai", icon: Brain, label: isArabic ? "حورس" : "Horus AI", href: "/platform/horus-ai" },
      { id: "evidence", icon: FileCheck, label: isArabic ? "مخزن الأدلة" : "Evidence Vault", href: "/platform/evidence" },
      { id: "standards", icon: Scale, label: isArabic ? "المعايير" : "Standards Hub", href: "/platform/standards" },
      { id: "gap", icon: Microscope, label: isArabic ? "تحليل الفجوات" : "Gap Analysis", href: "/platform/gap-analysis" },
      { id: "analytics", icon: BarChart4, label: isArabic ? "التحليلات" : "Analytics", href: "/platform/analytics" },
      { id: "archive", icon: Archive, label: isArabic ? "الأرشيف" : "Archive", href: "/platform/archive" },
      { id: "upgrade", icon: Sparkles, label: isArabic ? "ترقية" : "Upgrade", href: "/platform/upgrade" },
      { id: "settings", icon: Settings, label: isArabic ? "الإعدادات" : "Settings", href: "/platform/settings" },
    ]
    if (user?.role === "ADMIN") {
      items.splice(items.length - 1, 0, {
        id: "admin", icon: Shield, label: isArabic ? "لوحة الإدارة" : "Admin Panel", href: "/platform/admin",
      })
    }
    return items
  }, [isArabic, user])

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  const activeIndex = useMemo(() => {
    const idx = navItems.findIndex(item => isActive(item.href))
    return idx >= 0 ? idx : 0
  }, [navItems, pathname])

  /* ── Snap animation ── */
  const snapTo = (target: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const start = phaseRef.current
    const diff = target - start
    if (Math.abs(diff) < 0.01) return
    const duration = Math.min(250, Math.max(100, Math.abs(diff) * 16))
    const t0 = performance.now()

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      phaseRef.current = start + diff * eased
      setPhase(phaseRef.current)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  /* ── Free-spin momentum decay ── */
  const freeSpin = (startVel: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    let vel = startVel

    const tick = () => {
      vel *= FRICTION
      phaseRef.current += vel
      setPhase(phaseRef.current)

      if (Math.abs(vel) > 0.01) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        const nearest = Math.round(phaseRef.current)
        snapTo(nearest)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const onPanStart = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    touchRef.current.startPhase = phaseRef.current
  }

  const onPan = (e: any, info: any) => {
    phaseRef.current = touchRef.current.startPhase - info.offset.y / ITEM_GAP
    setPhase(phaseRef.current)
  }

  const onPanEnd = (e: any, info: any) => {
    // info.velocity.y is pixels per second. Convert to phase per frame (approx 60fps)
    const vel = -info.velocity.y / ITEM_GAP / 60
    
    if (Math.abs(vel) > 0.04) {
      freeSpin(vel * 2.5)
    } else {
      const nearest = Math.round(phaseRef.current)
      if (Math.abs(phaseRef.current - nearest) < 0.1) {
        snapTo(nearest)
      } else {
        freeSpin(vel * 4)
      }
    }
  }

  /* ── Page scale ── */
  useEffect(() => {
    const el = document.querySelector("main")
    if (!el) return
    el.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
    el.style.transform = isOpen ? "scale(0.97)" : "scale(1)"
    el.style.transformOrigin = "center center"
    return () => { el.style.transform = "scale(1)" }
  }, [isOpen])

  /* ── Wrapped orbital position ── */
  const getOrbit = (i: number) => {
    const N = navItems.length
    const raw = i - activeIndex - phase
    let w = raw % N
    if (w > N / 2) w -= N
    if (w < -N / 2) w += N
    const step = Math.round(Math.abs(w))
    const idx = Math.min(step, SCALES.length - 1)
    const norm = Math.min(step, 2) / 2
    const curve = -ARC_DEPTH * Math.cos(norm * Math.PI / 2)
    const pull = step === 0 ? -8 : 0
    return {
      y: -w * ITEM_GAP,
      x: curve + pull,
      s: SCALES[idx],
      o: OPACITIES[idx],
      z: 100 - step * 10,
      center: step === 0,
    }
  }

  const handleNav = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  const activeLabel = navItems[Math.round(activeIndex + phaseRef.current) % navItems.length]?.label
  const activeLabelSafe = navItems[Math.round((activeIndex + phase) % navItems.length + navItems.length) % navItems.length]?.label

  return (
    <>
      {/* ── Arrow handle trigger ── */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : open}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-[100] lg:hidden",
          "flex items-center justify-center",
          "h-14 w-[22px] rounded-l-2xl",
          "right-0 border-y border-l",
          "transition-all duration-300 ease-out cursor-pointer overflow-hidden",
          isOpen
            ? "bg-primary/20 border-primary/30 text-primary"
            : isDark
              ? "bg-white/10 border-white/20 text-white/70 hover:bg-white/15 hover:text-white/90"
              : "bg-white/90 border-black/10 text-black/60 hover:bg-white hover:text-black shadow-sm",
        )}
        style={{
          backdropFilter: "blur(12px)",
          boxShadow: isOpen
            ? "-4px 0 24px rgba(59,130,246,0.25)"
            : isDark
              ? "-4px 0 16px rgba(0,0,0,0.3)"
              : "-4px 0 16px rgba(0,0,0,0.12)",
        }}
        aria-label={isArabic ? "فتح القائمة" : "Open navigation"}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/10 pointer-events-none" />
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative z-10 flex items-center justify-center w-full"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4 mr-0.5" strokeWidth={2.5} />
          ) : (
            <div className="flex items-center justify-center pl-0.5">
              <ChevronLeft className="h-3.5 w-3.5 -mr-0.5 opacity-80" strokeWidth={2.5} />
              <div className="flex flex-col gap-[3px] pr-0.5">
                <div className="w-[3px] h-[3px] rounded-full bg-current opacity-60" />
                <div className="w-[3px] h-[3px] rounded-full bg-current opacity-60" />
              </div>
            </div>
          )}
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/5 backdrop-blur-[2px]"
            />

            {/* Wheel */}
            <motion.div
              className="absolute inset-y-0 right-0 w-[100px] touch-none select-none"
              onPanStart={onPanStart}
              onPan={onPan}
              onPanEnd={onPanEnd}
              onWheel={(e) => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current)
                phaseRef.current += e.deltaY / 300
                setPhase(phaseRef.current)
                
                if ((window as any).wheelSnapTimeout) clearTimeout((window as any).wheelSnapTimeout)
                ;(window as any).wheelSnapTimeout = setTimeout(() => {
                  const nearest = Math.round(phaseRef.current)
                  snapTo(nearest)
                }, 150)
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {navItems.map((item, i) => {
                  const o = getOrbit(i)
                  if (o.o < 0.02) return null
                  const Icon = item.icon

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNav(item.href)}
                      initial={false}
                      animate={{
                        x: o.x,
                        y: o.y,
                        scale: o.s,
                        opacity: o.o,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                      }}
                      className={cn(
                        "absolute flex items-center justify-center rounded-full border outline-none select-none",
                        o.center
                          ? "text-primary bg-primary/15 border-primary/50 shadow-sm"
                          : cn(
                              "bg-foreground/8 border-foreground/10 text-foreground/90",
                              isDark ? "hover:bg-white/15" : "hover:bg-black/15",
                            ),
                      )}
                      style={{
                        width: ITEM_SIZE,
                        height: ITEM_SIZE,
                        zIndex: o.z,
                        willChange: "transform",
                      }}
                      aria-label={item.label}
                    >


                      {/* Active label — left of icon */}
                      {o.center && (
                        <motion.span
                          key={item.id + "-label"}
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 6 }}
                          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                          dir={isArabic ? "rtl" : "ltr"}
                          className={cn(
                            "absolute whitespace-nowrap text-[10px] font-semibold tracking-wider pointer-events-none",
                            "px-2 py-1 rounded-md",
                            isDark
                              ? "bg-white/10 text-white/80 border border-white/8"
                              : "bg-black/10 text-black/80 border border-black/8",
                          )}
                          style={{
                            right: "calc(100% + " + LABEL_GAP + "px)",
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}

                      <Icon
                        className={cn(
                          "transition-[width,height] duration-200",
                          o.center ? "w-6 h-6" : "w-[18px] h-[18px]",
                        )}
                        strokeWidth={o.center ? 2.2 : 1.7}
                        style={o.center ? { filter: "drop-shadow(0 0 8px rgba(59,130,246,0.5))" } : {}}
                      />
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
