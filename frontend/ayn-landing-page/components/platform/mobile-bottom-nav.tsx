"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  X
} from "lucide-react"

import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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

  const radialItems = useMemo(() => [
    { id: "gap", icon: Microscope, label: isArabic ? "تحليل الفجوات" : "Gap Analysis", href: "/platform/gap-analysis" },
    { id: "analytics", icon: BarChart4, label: isArabic ? "التحليلات" : "Analytics", href: "/platform/analytics" },
    { id: "archive", icon: Archive, label: isArabic ? "الأرشيف" : "Archive", href: "/platform/archive" },
    { id: "settings", icon: Settings, label: isArabic ? "الإعدادات" : "Settings", href: "/platform/settings" },
  ], [isArabic])

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  // Calculates position for radial items fanning out from the RIGHT side (Menu button)
  // Angles will go from PI/2 (straight up) to PI (straight left) to form a quarter-circle.
  const getRadialPosition = (index: number, total: number) => {
    const radius = 110 // pixels from menu button
    const startAngle = Math.PI // 180 deg (left)
    const endAngle = Math.PI / 2 // 90 deg (up)
    
    // Distribute evenly along the quarter circle
    const angle = total === 1 ? Math.PI * 0.75 : startAngle - (index * ((startAngle - endAngle) / (total - 1)))
    
    const x = Math.cos(angle) * radius
    const y = -Math.sin(angle) * radius 
    
    return { x, y }
  }

  return (
    <>
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] lg:hidden flex flex-col pointer-events-auto select-none",
        isArabic ? "items-start" : "items-end"
      )}>
        
        {/* Floating Menu (Vertical list) */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute bottom-full mb-4 flex flex-col gap-2",
                isArabic ? "left-2 items-start" : "right-2 items-end"
              )}
            >
              {radialItems.map((item, i) => {
                const active = isActive(item.href)
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setMenuOpen(false)
                      router.push(item.href)
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border backdrop-blur-xl transition-all duration-300",
                      active 
                        ? "bg-primary text-primary-foreground border-primary/50 shadow-primary/30" 
                        : cn(
                            "text-foreground hover:bg-muted",
                            isDark 
                              ? "bg-black/70 border-white/10" 
                              : "bg-white/70 border-black/10"
                          )
                    )}
                  >
                    <span className="text-[12px] font-semibold whitespace-nowrap">
                      {item.label}
                    </span>
                    <item.icon className="w-4 h-4 shrink-0" />
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Dock */}
        <div className="relative px-3 py-2 flex items-center gap-2 z-50">
          {/* Glass Background isolated to fix blur bleed on iOS */}
          <div 
            className={cn(
              "absolute inset-0 backdrop-blur-xl border rounded-full overflow-hidden pointer-events-none -z-10",
              isDark 
                ? "bg-black/15 border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" 
                : "bg-white/12 border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            )}
            style={{ 
              WebkitBackdropFilter: "blur(20px)",
              transform: "translateZ(0)"
            }}
          />
          
          {mainTabs.map((item) => (
            <BottomTab 
              key={item.id} 
              icon={item.icon} 
              active={isActive(item.href)} 
              onClick={() => router.push(item.href)} 
            />
          ))}

          {/* Center Horus Navigation Button */}
          <div className="relative flex flex-col items-center justify-center shrink-0 mx-1">
            <motion.button
              onClick={() => router.push("/platform/horus-ai")}
              type="button"
              animate={{
                scale: isHorusAi ? 1.15 : 1,
                y: isHorusAi ? -20 : -16
              }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_6px_24px_rgba(59,111,217,0.4)] bg-primary text-primary-foreground outline-none select-none"
            >
              <Brain className="w-6 h-6" />
            </motion.button>
            {isHorusAi && (
              <motion.span
                layoutId="activeDockDot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </div>

          {mainTabsRight.map((item) => (
            <BottomTab 
              key={item.id} 
              icon={item.icon} 
              active={isActive(item.href)} 
              onClick={() => router.push(item.href)} 
            />
          ))}

          {/* Menu Toggle Button */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              className={cn(
                "transition-all duration-300 flex items-center justify-center relative cursor-pointer outline-none select-none shrink-0 w-10 h-10 rounded-full",
                menuOpen
                  ? "bg-destructive text-destructive-foreground rotate-90 scale-110"
                  : "text-muted-foreground hover:text-foreground active:scale-90"
              )}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Invisible click-catcher overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[90] lg:hidden pointer-events-auto bg-transparent"
          />
        )}
      </AnimatePresence>
    </>
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
    <div className="relative flex flex-col items-center justify-center shrink-0">
      <motion.button
        onClick={onClick}
        type="button"
        animate={{
          scale: active ? 1.12 : 1,
          backgroundColor: active ? "rgba(59, 130, 246, 0.15)" : "rgba(0, 0, 0, 0)"
        }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "w-10 h-10 flex items-center justify-center relative cursor-pointer outline-none select-none transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
        style={{ WebkitTapHighlightColor: "transparent", borderRadius: "9999px" }}
      >
        <Icon className="w-5 h-5" />
        {active && (
          <motion.span
            layoutId="activeDockDot"
            className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          />
        )}
      </motion.button>
    </div>
  )
}
