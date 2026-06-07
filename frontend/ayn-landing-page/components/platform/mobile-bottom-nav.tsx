"use client"

import { useState, useMemo, useEffect, useRef, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { useTheme } from "next-themes"
import { 
  LayoutDashboard, 
  FileCheck, 
  Scale, 
  BarChart4, 
  Menu,
  Brain,
  Microscope,
  Archive,
  Settings,
  Sparkles,
  Shield,
  X
} from "lucide-react"

import { useUiLanguage } from "@/lib/ui-language-context"
import { useAuth } from "@/lib/auth-context"
import { useScrollCollapse } from "@/hooks/use-scroll-collapse"
import { cn } from "@/lib/utils"

const DOCK_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 34,
  mass: 0.75,
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [wheelActive, setWheelActive] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const prevScrollCollapsed = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true
  const isHorusAi = pathname?.includes("/horus-ai")

  const mainTabs = useMemo(() => [
    { id: "dashboard", icon: LayoutDashboard, label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/platform/dashboard" },
    { id: "evidence", icon: FileCheck, label: isArabic ? "الأدلة" : "Evidence", href: "/platform/evidence" },
  ], [isArabic])

  const mainTabsRight = useMemo(() => [
    { id: "standards", icon: Scale, label: isArabic ? "المعايير" : "Standards", href: "/platform/standards" },
  ], [isArabic])

  const menuItems = useMemo(() => {
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
        id: "admin",
        icon: Shield,
        label: isArabic ? "لوحة الإدارة" : "Admin Panel",
        href: "/platform/admin",
      })
    }

    return items
  }, [isArabic, user?.role])

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)
  useEffect(() => {
    const openHandler = () => { setMenuOpen(false); setWheelActive(true) }
    const closeHandler = () => setWheelActive(false)
    window.addEventListener("wheel-nav-open", openHandler)
    window.addEventListener("wheel-nav-close", closeHandler)
    return () => {
      window.removeEventListener("wheel-nav-open", openHandler)
      window.removeEventListener("wheel-nav-close", closeHandler)
    }
  }, [])

  const scrollCollapsed = useScrollCollapse()
  const dockCollapsed = scrollCollapsed
  const collapsibleCount = mainTabs.length + 1 + mainTabsRight.length
  const menuOnStart = isArabic

  useEffect(() => {
    if (scrollCollapsed && !prevScrollCollapsed.current && menuOpen) {
      setMenuOpen(false)
    }
    prevScrollCollapsed.current = scrollCollapsed
  }, [scrollCollapsed, menuOpen])

  useEffect(() => {
    if (menuOpen && scrollContainerRef.current) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        const container = scrollContainerRef.current
        if (!container) return
        const activeEl = container.querySelector('[data-active="true"]') as HTMLElement
        if (activeEl) {
          const scrollLeft = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2
          container.scrollTo({ left: scrollLeft, behavior: "smooth" })
        }
      }, 50)
    }
  }, [menuOpen])

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[95] bg-black/30 backdrop-blur-md backdrop-saturate-150 lg:hidden"
            style={{ WebkitBackdropFilter: "blur(14px) saturate(150%)" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!wheelActive && (
          <>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={scrollContainerRef}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 480, damping: 32 }}
                  dir={isArabic ? "rtl" : "ltr"}
                  className={cn(
                    "fixed bottom-[96px] left-1/2 -translate-x-1/2 z-[110] flex w-[calc(100vw-24px)] flex-row gap-2 overflow-x-auto overscroll-x-contain pb-2 pt-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  )}
                >
                  {menuItems.map((item, i) => {
                    const active = isActive(item.href)
                    return (
                      <motion.button
                        key={item.id}
                        data-active={active}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, type: "spring", stiffness: 500, damping: 28 }}
                        onClick={() => {
                          setMenuOpen(false)
                          router.push(item.href)
                        }}
                        className={cn(
                          "flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2 shadow-sm backdrop-blur-xl transition-all duration-200",
                          isArabic && "flex-row-reverse",
                          active
                            ? "border-primary/50 bg-primary text-primary-foreground"
                            : cn(
                                "text-foreground hover:bg-muted/80",
                                isDark
                                  ? "border-white/10 bg-black/70"
                                  : "border-black/10 bg-white/80",
                              ),
                        )}
                      >
                        <span className="whitespace-nowrap text-[12px] font-semibold">
                          {item.label}
                        </span>
                        <item.icon className="h-4 w-4 shrink-0" />
                      </motion.button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9, pointerEvents: "none" }}
              transition={DOCK_SPRING}
              className={cn(
                "fixed bottom-6 z-[100] pointer-events-auto select-none lg:hidden transition-all duration-500 ease-out",
                dockCollapsed
                  ? menuOnStart
                    ? "left-6 translate-x-0"
                    : "right-6 translate-x-0"
                  : "left-1/2 -translate-x-1/2",
              )}
            >
              <div className="relative flex flex-col items-center">

          {/* Floating Dock */}
          <LayoutGroup>
            <motion.div
              layout
              transition={DOCK_SPRING}
              className={cn(
                "relative z-50 flex items-end overflow-visible",
                isArabic && "flex-row-reverse",
                dockCollapsed ? "px-1 pb-1 pt-1" : "gap-2 px-3 pb-2.5 pt-5",
              )}
            >
            <motion.div
              layout
              animate={{ opacity: dockCollapsed ? 0 : 1, scale: dockCollapsed ? 0.82 : 1 }}
              transition={DOCK_SPRING}
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 top-2 -z-10 overflow-hidden rounded-full border backdrop-blur-xl",
                isDark
                  ? "border-white/5 bg-black/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                  : "border-black/5 bg-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
              )}
              style={{
                WebkitBackdropFilter: "blur(20px)",
                transform: "translateZ(0)",
              }}
            />

            {mainTabs.map((item, index) => (
              <DockCollapsibleItem
                key={item.id}
                index={index}
                total={collapsibleCount}
                collapsed={dockCollapsed}
                isArabic={isArabic}
              >
                <BottomTab
                  icon={item.icon}
                  active={isActive(item.href)}
                  onClick={() => router.push(item.href)}
                />
              </DockCollapsibleItem>
            ))}

            <DockCollapsibleItem
              index={mainTabs.length}
              total={collapsibleCount}
              collapsed={dockCollapsed}
              isArabic={isArabic}
              className="mx-0.5"
            >
              <div className="relative flex h-12 w-12 flex-col items-center justify-end pb-0.5">
                <motion.button
                  onClick={() => router.push("/platform/horus-ai")}
                  type="button"
                  animate={{
                    scale: isHorusAi ? 1.1 : 1,
                    y: dockCollapsed ? 0 : isHorusAi ? -10 : -8,
                  }}
                  whileTap={{ scale: 0.92 }}
                  transition={DOCK_SPRING}
                  className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_24px_rgba(59,111,217,0.4)] outline-none select-none"
                >
                  <Brain className="h-5 w-5" />
                </motion.button>
                {isHorusAi && !dockCollapsed && (
                  <motion.span
                    layoutId="activeDockDot"
                    className="absolute bottom-0 h-1 w-1 rounded-full bg-primary"
                    transition={DOCK_SPRING}
                  />
                )}
              </div>
            </DockCollapsibleItem>

            {mainTabsRight.map((item, index) => (
              <DockCollapsibleItem
                key={item.id}
                index={mainTabs.length + 1 + index}
                total={collapsibleCount}
                collapsed={dockCollapsed}
                isArabic={isArabic}
              >
                <BottomTab
                  icon={item.icon}
                  active={isActive(item.href)}
                  onClick={() => router.push(item.href)}
                />
              </DockCollapsibleItem>
            ))}

            <motion.div layout transition={DOCK_SPRING} className="relative z-[120] flex shrink-0 flex-col items-center justify-center">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((open) => {
                    if (!open) window.dispatchEvent(new CustomEvent("dock-nav-open"))
                    return !open
                  })
                }}
                type="button"
                aria-expanded={menuOpen}
                aria-label={isArabic ? "فتح قائمة الصفحات" : "Open pages menu"}
                animate={{
                  scale: dockCollapsed && !menuOpen ? 1.08 : menuOpen ? 1.1 : 1,
                }}
                whileTap={{ scale: 0.9 }}
                transition={DOCK_SPRING}
                className={cn(
                  "relative z-[120] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full outline-none select-none transition-colors duration-200",
                  menuOpen
                    ? "bg-destructive text-destructive-foreground"
                    : dockCollapsed
                      ? cn(
                          "shadow-lg",
                          isDark
                            ? "border border-white/10 bg-black/50 text-foreground backdrop-blur-xl"
                            : "border border-black/10 bg-white/80 text-foreground backdrop-blur-xl",
                        )
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {menuOpen ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                      transition={{ duration: 0.16 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
                      transition={{ duration: 0.16 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
            </motion.div>
              </LayoutGroup>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function DockCollapsibleItem({
  children,
  index,
  total,
  collapsed,
  isArabic,
  className,
}: {
  children: ReactNode
  index: number
  total: number
  collapsed: boolean
  isArabic: boolean
  className?: string
}) {
  const collapseDelay = index * 0.022
  const expandDelay = (total - 1 - index) * 0.028

  return (
    <motion.div
      layout
      className={cn("shrink-0 overflow-visible", className)}
      initial={false}
      animate={
        collapsed
          ? {
              opacity: 0,
              scale: 0.35,
              width: 0,
              marginInlineEnd: 0,
              x: isArabic ? -56 : 56,
              pointerEvents: "none",
            }
          : {
              opacity: 1,
              scale: 1,
              width: "auto",
              marginInlineEnd: 0,
              x: 0,
              pointerEvents: "auto",
            }
      }
      transition={{
        ...DOCK_SPRING,
        delay: collapsed ? collapseDelay : expandDelay,
      }}
    >
      {children}
    </motion.div>
  )
}

const BottomTab = ({
  icon: Icon,
  active,
  onClick,
}: {
  icon: any
  active: boolean
  onClick: () => void
}) => {
  return (
    <div className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center">
      <motion.button
        onClick={onClick}
        type="button"
        animate={{
          scale: active ? 1.08 : 1,
          backgroundColor: active ? "rgba(59, 130, 246, 0.15)" : "rgba(0, 0, 0, 0)"
        }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full outline-none select-none transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {active && (
          <motion.span
            layoutId="activeDockDot"
            className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          />
        )}
      </motion.button>
    </div>
  )
}
