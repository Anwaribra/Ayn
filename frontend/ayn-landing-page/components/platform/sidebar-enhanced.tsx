"use client"

import { useCallback, useMemo, memo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Brain,
  FileCheck,
  Scale,
  Microscope,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  BarChart4,
  Archive,
  PanelLeftOpen,
} from "lucide-react"

import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"
import { AynLogo } from "@/components/ayn-logo"
import { useAuth } from "@/lib/auth-context"
import { AnimatedThemeToggle } from "@/components/platform/animated-theme-toggle"
import { LanguageToggle } from "@/components/platform/language-toggle"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface SidebarProps {
  open: boolean
  onToggle: () => void
  notificationCount?: number
}

function PlatformSidebarComponent({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const { resolvedTheme } = useTheme()
  const { user } = useAuth()
  const [localActiveHref, setLocalActiveHref] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const wheelContainerRef = useRef<HTMLDivElement>(null)
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = user?.role === "ADMIN"
  const isCollapsed = !open
  const logoVariant = resolvedTheme === "light" ? "on-light" : "on-dark"
  const isDark = mounted ? resolvedTheme === "dark" : true

  const navItems = useMemo(() => {
    const items = [
      { id: "dashboard", icon: LayoutDashboard, label: { en: "Dashboard", ar: "لوحة التحكم" }, href: "/platform/dashboard" },
      { id: "horus-ai", icon: Brain, label: { en: "Horus AI", ar: "حورس" }, href: "/platform/horus-ai" },
      { id: "evidence", icon: FileCheck, label: { en: "Evidence Vault", ar: "مخزن الأدلة" }, href: "/platform/evidence" },
      { id: "standards", icon: Scale, label: { en: "Standards Hub", ar: "المعايير" }, href: "/platform/standards" },
      { id: "gap-analysis", icon: Microscope, label: { en: "Gap Analysis", ar: "تحليل الفجوات" }, href: "/platform/gap-analysis" },
      { id: "analytics", icon: BarChart4, label: { en: "Analytics", ar: "التحليلات" }, href: "/platform/analytics" },
      { id: "archive", icon: Archive, label: { en: "Archive", ar: "الأرشيف" }, href: "/platform/archive" },
      { id: "upgrade", icon: Sparkles, label: { en: "Upgrade", ar: "ترقية" }, href: "/platform/upgrade" },
      { id: "settings", icon: Settings, label: { en: "Settings", ar: "الإعدادات" }, href: "/platform/settings" },
    ]

    if (isAdmin) {
      // Insert Admin Panel right before Settings
      items.splice(items.length - 1, 0, {
        id: "admin",
        icon: Shield,
        label: { en: "Admin Panel", ar: "لوحة الإدارة" },
        href: "/platform/admin"
      })
    }

    return items
  }, [isArabic, isAdmin])

  const copy = useMemo(
    () => ({
      settings: isArabic ? "الإعدادات" : "Settings",
      collapseSidebar: isArabic ? "طي الشريط الجانبي" : "Collapse sidebar",
      expandSidebar: isArabic ? "توسيع الشريط الجانبي" : "Expand sidebar",
      homeAria: isArabic ? "الصفحة الرئيسية لعين" : "Ayn home",
    }),
    [isArabic],
  )

  // Reset local override when sidebar is toggled or page changes
  useEffect(() => {
    setLocalActiveHref(null)
  }, [pathname, isCollapsed])

  const activeHref = localActiveHref || pathname
  const isActive = (href: string) => activeHref === href || activeHref?.startsWith(`${href}/`)

  // Dynamically rotate array items so that the active item is always placed in the center
  const rotatedNavItems = useMemo(() => {
    const activeIndex = navItems.findIndex(item => isActive(item.href))
    if (activeIndex === -1) return navItems
    
    const targetIndex = Math.floor((navItems.length - 1) / 2)
    const shift = (activeIndex - targetIndex + navItems.length) % navItems.length
    
    return [...navItems.slice(shift), ...navItems.slice(0, shift)]
  }, [navItems, activeHref])

  const rotateForward = useCallback(() => {
    const currentIndex = navItems.findIndex(item => item.href === activeHref)
    if (currentIndex === -1) return
    const nextIndex = (currentIndex + 1) % navItems.length
    setLocalActiveHref(navItems[nextIndex].href)
  }, [navItems, activeHref])

  const rotateBackward = useCallback(() => {
    const currentIndex = navItems.findIndex(item => item.href === activeHref)
    if (currentIndex === -1) return
    const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length
    setLocalActiveHref(navItems[prevIndex].href)
  }, [navItems, activeHref])

  // Scroll wheel loop navigation with 400ms debounce
  useEffect(() => {
    if (localActiveHref && localActiveHref !== pathname) {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current)
      navTimeoutRef.current = setTimeout(() => {
        router.push(localActiveHref)
      }, 100)
    }
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current)
    }
  }, [localActiveHref, pathname, router])

  // Non-passive wheel event listener setup — desktop only, high threshold to avoid accidental triggers
  useEffect(() => {
    const container = wheelContainerRef.current
    if (!container) return

    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop) return

    const handleWheelEvent = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        e.preventDefault()
        if (e.deltaY > 0) {
          rotateForward()
        } else {
          rotateBackward()
        }
      }
    }

    container.addEventListener("wheel", handleWheelEvent, { passive: false })
    return () => {
      container.removeEventListener("wheel", handleWheelEvent)
    }
  }, [rotateForward, rotateBackward])

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "lg:flex hidden fixed inset-y-0 start-0 z-50 flex-col transition-all duration-300 ease-out lg:relative bg-transparent border-none shadow-none",
        open ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-collapsed)]"
      )}
    >
      {/* Ambient Glow behind the sidebar */}
      <div className="absolute inset-y-4 start-2.5 end-2.5 bg-gradient-to-tr from-primary/20 via-blue-500/5 to-transparent blur-3xl rounded-2xl pointer-events-none -z-10 opacity-70" />


      {/* Floating Curved Glass Sidebar Dock */}
      <div className={cn(
        "relative flex-1 flex flex-col my-4 mx-2.5 backdrop-blur-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 z-10 overflow-hidden",
        isCollapsed ? "rounded-2xl" : isArabic ? "rounded-r-2xl rounded-l-[100px]" : "rounded-l-2xl rounded-r-[100px]",
        isDark 
          ? "bg-black/15 border-white/5 shadow-black/60" 
          : "bg-white/12 border-black/5 shadow-black/5"
      )}>
        {/* Header / Logo */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center justify-between gap-2 z-10",
            isCollapsed ? "justify-center px-1" : "ps-3 pe-12"
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-primary"
              aria-label={copy.expandSidebar}
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          ) : (
            <>
              <Link href="/" className="group flex min-w-0 items-center py-1" aria-label={copy.homeAria}>
                <AynLogo
                  size="nav"
                  withGlow={false}
                  isArabic={isArabic}
                  variant={logoVariant}
                  className={cn(
                    "transition-transform duration-200 group-hover:scale-[1.02] scale-90",
                    isArabic ? "origin-right" : "origin-left"
                  )}
                />
              </Link>
              <button
                type="button"
                onClick={onToggle}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                aria-label={copy.collapseSidebar}
              >
                {isArabic ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
            </>
          )}
        </div>

        <div 
          ref={wheelContainerRef}
          className={cn(
            "flex-1 px-1 py-4 flex flex-col gap-2.5 justify-center select-none z-10",
            isCollapsed 
              ? "overflow-visible" 
              : "overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          <motion.div className="flex flex-col gap-2.5 py-4 w-full">
            {rotatedNavItems.map((item) => {
              const active = isActive(item.href)

              const buttonElement = (
                <button
                  type="button"
                  onClick={() => {
                    if (active) return
                    setLocalActiveHref(item.href)
                  }}
                  className={cn(
                    "flex items-center gap-2.5 p-2 transition-all duration-300 active:scale-95 outline-none border",
                    isCollapsed ? "w-10 h-10 justify-center rounded-full" : "w-[150px] justify-start rounded-2xl",
                    active 
                      ? "bg-primary/25 border-primary/40 shadow-md shadow-primary/10 scale-105" 
                      : "border-transparent hover:bg-foreground/[0.06] dark:hover:bg-white/10"
                  )}>
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    active ? "bg-primary text-white shadow-md shadow-primary/20 scale-110" : "bg-foreground/10 text-foreground"
                  )}>
                    <item.icon className="h-3.5 w-3.5" strokeWidth={active ? 2.25 : 1.75} />
                  </div>
                  {!isCollapsed && (
                    <span className={cn(
                      "text-[12px] font-semibold truncate",
                      active ? "text-primary dark:text-primary-foreground" : "text-foreground",
                      isArabic ? "text-right flex-1" : "text-left flex-1"
                    )}>
                      {isArabic ? item.label.ar : item.label.en}
                    </span>
                  )}
                </button>
              )

              return (
                <motion.div
                  key={item.id}
                  layout
                  className="flex justify-center shrink-0 w-full"
                  transition={{
                    type: "tween",
                    duration: 0.25,
                    ease: "easeInOut"
                  }}
                >
                  {isCollapsed ? (
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        {buttonElement}
                      </TooltipTrigger>
                      <TooltipContent
                        side={isArabic ? "left" : "right"}
                        className="backdrop-blur-md bg-black/80 dark:bg-black/95 text-white border border-white/10 px-3 py-1.5 text-xs rounded-lg shadow-xl"
                      >
                        {isArabic ? item.label.ar : item.label.en}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    buttonElement
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Bottom Toggles */}
        <div className="shrink-0 p-3 flex flex-col gap-2 items-center z-10">
          <div className={cn("flex items-center justify-center gap-1.5", isCollapsed && "flex-col")}>
            <LanguageToggle />
            <AnimatedThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default memo(PlatformSidebarComponent)
