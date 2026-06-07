"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { 
  LayoutDashboard, 
  FileCheck, 
  Scale, 
  BarChart4, 
  X,
  Microscope,
  Archive,
  Settings,
  ChevronRight,
  ChevronLeft
} from "lucide-react"

import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

export function HorusMobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [localActiveHref, setLocalActiveHref] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { isArabic } = useUiLanguage()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  const navItems = useMemo(() => [
    { id: "dashboard", icon: LayoutDashboard, label: isArabic ? "لوحة التحكم" : "Dashboard", href: "/platform/dashboard" },
    { id: "evidence", icon: FileCheck, label: isArabic ? "الأدلة" : "Evidence", href: "/platform/evidence" },
    { id: "standards", icon: Scale, label: isArabic ? "المعايير" : "Standards", href: "/platform/standards" },
    { id: "gap", icon: Microscope, label: isArabic ? "تحليل الفجوات" : "Gap", href: "/platform/gap-analysis" },
    { id: "analytics", icon: BarChart4, label: isArabic ? "التحليلات" : "Analytics", href: "/platform/analytics" },
    { id: "archive", icon: Archive, label: isArabic ? "الأرشيف" : "Archive", href: "/platform/archive" },
    { id: "settings", icon: Settings, label: isArabic ? "الإعدادات" : "Settings", href: "/platform/settings" },
  ], [isArabic])

  // Reset local active path override when menu closes or page changes
  useEffect(() => {
    if (!isOpen) {
      setLocalActiveHref(null)
    }
  }, [isOpen, pathname])

  const activeHref = localActiveHref || pathname
  const isActive = (href: string) => activeHref === href || activeHref?.startsWith(`${href}/`)

  // Dynamically rotate array items so that the active item is always placed in the center (index 3 of 7 items)
  const rotatedNavItems = useMemo(() => {
    const activeIndex = navItems.findIndex(item => isActive(item.href))
    if (activeIndex === -1) return navItems
    
    const targetIndex = 3 // Middle of 7 items
    const shift = (activeIndex - targetIndex + navItems.length) % navItems.length
    
    return [...navItems.slice(shift), ...navItems.slice(0, shift)]
  }, [navItems, activeHref])

  return (
    <>
      {/* Side Toggle Button */}
      <div className={cn("absolute top-1/3 z-[100] lg:hidden", isArabic ? "right-0" : "left-0")}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-12 w-8 items-center justify-center bg-background/20 backdrop-blur-md border border-border/30 shadow-sm transition-transform duration-300 group",
            isArabic ? "rounded-l-xl border-r-0" : "rounded-r-xl border-l-0",
            isOpen 
              ? (isArabic ? "translate-x-full opacity-0 pointer-events-none" : "-translate-x-full opacity-0 pointer-events-none") 
              : "hover:bg-background/40"
          )}
        >
          <div className="relative flex items-center justify-center">
            {isArabic ? (
              <ChevronLeft className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.8)] transition-transform group-hover:scale-110" />
            ) : (
              <ChevronRight className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.8)] transition-transform group-hover:scale-110" />
            )}
          </div>
        </button>
      </div>

      {/* Side Semi-Circle Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[90] pointer-events-none lg:hidden">
            {/* The Side Semi-Circle (D-shape) */}
            <motion.div
              variants={{
                hidden: { 
                  opacity: 0, 
                  scale: 0.92, 
                  x: isArabic ? "100%" : "-100%" 
                },
                show: { 
                  opacity: 1, 
                  scale: 1, 
                  x: 0,
                  transition: {
                    type: "spring",
                    damping: 30,
                    stiffness: 380, // Snappy & fast
                    staggerChildren: 0.035, // Fast cascade scroll effect
                    delayChildren: 0.05
                  }
                },
                exit: { 
                  opacity: 0, 
                  scale: 0.92, 
                  x: isArabic ? "100%" : "-100%",
                  transition: {
                    duration: 0.18,
                    ease: "easeInOut"
                  }
                }
              }}
              initial="hidden"
              animate="show"
              exit="exit"
              className={cn(
                "absolute top-[22%] bottom-[22%] w-[195px] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-auto flex flex-col",
                isArabic ? "right-0 border-s" : "left-0 border-e",
                isDark 
                  ? "bg-black/15 border-white/5 shadow-black/60" 
                  : "bg-white/80 border-black/5 shadow-black/5"
              )}
              style={{
                borderRadius: isArabic ? "9999px 0 0 9999px" : "0 9999px 9999px 0",
              }}
            >
              {/* Close button inside the menu (always on the straight edge to avoid curve clipping) */}
              <div className="pt-5 pb-2 px-5 flex shrink-0 justify-start">
                 <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground backdrop-blur-sm shadow-sm transition-transform duration-300 hover:scale-105 active:scale-95"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div 
                className="flex-1 overflow-y-auto px-2 pb-6 custom-scrollbar scroll-smooth"
                dir={isArabic ? "rtl" : "ltr"}
              >
                <div className="flex flex-col gap-2">
                  {rotatedNavItems.map((item, index) => {
                    const active = isActive(item.href)
                    
                    const middleIndex = (rotatedNavItems.length - 1) / 2
                    const distance = Math.abs(index - middleIndex)
                    const xOffset = isArabic ? -(12 - distance * 3) : (12 - distance * 3)
                    
                    return (
                      <motion.div
                        layout
                        key={item.id}
                        custom={index}
                        variants={{
                          hidden: { 
                            opacity: 0, 
                            x: isArabic ? 30 : -30 
                          },
                          show: (i: number) => ({
                            opacity: 1,
                            x: xOffset,
                            transition: {
                              type: "spring",
                              stiffness: 500,
                              damping: 24
                            }
                          })
                        }}
                        className="flex justify-center shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (active) {
                              setIsOpen(false)
                              return
                            }
                            
                            // 1. Immediately update active state so wheel rotates
                            setLocalActiveHref(item.href)
                            
                            // 2. Delay navigation so the user sees the liquid wheel spin
                            setTimeout(() => {
                              router.push(item.href)
                              setIsOpen(false)
                            }, 250)
                          }}
                          className={cn(
                            "flex items-center gap-2.5 p-2 w-[135px] rounded-2xl transition-all duration-300 active:scale-95 outline-none",
                            active 
                              ? cn(
                                  "bg-primary/25 border border-primary/40 shadow-sm shadow-primary/5",
                                  isDark ? "text-primary-foreground" : "text-foreground",
                                )
                              : isDark
                                ? "bg-white/5 border border-transparent hover:bg-white/10 text-foreground"
                                : "bg-black/5 border border-transparent hover:bg-black/10 text-foreground"
                          )}
                        >
                          <div className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                            active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" : "bg-foreground/10 text-foreground"
                          )}>
                            <item.icon className="h-3.5 w-3.5" strokeWidth={active ? 2.5 : 2} />
                          </div>
                          <span className={cn(
                            "text-[11px] font-semibold line-clamp-1",
                            active
                              ? isDark ? "text-primary-foreground" : "text-foreground"
                              : "text-foreground",
                            isArabic ? "text-right flex-1" : "text-left flex-1"
                          )}>
                            {item.label}
                          </span>
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[80] lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  )
}
