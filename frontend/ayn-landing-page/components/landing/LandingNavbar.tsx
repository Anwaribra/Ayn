"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus_Jakarta_Sans } from "next/font/google"
import { motion, AnimatePresence } from "framer-motion"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] })
import { Menu, X, LogOut, LogIn, LayoutDashboard, ChevronDown, ArrowRight, Home, Sparkles, Calendar, Brain, HelpCircle, Layers, CalendarDays, CreditCard, Workflow, FileCheck, Microscope, Scale, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

export function LandingNavbar({
  onOpenDemo,
}: {
  onOpenDemo?: (type: "demo" | "pricing") => void
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOverDark, setIsOverDark] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("home")
  const isScrollingRef = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      let overDark = false
      setIsCompact(window.scrollY > 72)
      const headerCenterY = 32
      const darkSections = document.querySelectorAll('[data-section-theme="dark"]')

      darkSections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= headerCenterY && rect.bottom >= headerCenterY) {
          overDark = true
        }
      })

      setIsOverDark(overDark)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  useEffect(() => {
    if (pathname !== "/") return

    const handleScrollSpy = () => {
      if (isScrollingRef.current) return

      if (window.scrollY < 100) {
        setActiveSection("home")
        return
      }

      const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120
      if (scrolledToBottom) {
        setActiveSection("faq")
        return
      }

      const sections = [
        { id: "main-content", key: "home" },
        { id: "horus-intelligence", key: "horus" },
        { id: "features", key: "features" },
        { id: "how-it-works", key: "how" },
        { id: "about", key: "about" },
        { id: "landing-faq", key: "faq" },
      ]

      let currentSection = "home"
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          const absoluteTop = rect.top + window.scrollY
          if (window.scrollY + window.innerHeight / 2.5 >= absoluteTop) {
            currentSection = section.key
          }
        }
      }
      setActiveSection(currentSection)
    }

    handleScrollSpy()
    window.addEventListener("scroll", handleScrollSpy, { passive: true })
    return () => window.removeEventListener("scroll", handleScrollSpy)
  }, [pathname])

  const handleLogout = async () => { await logout(); window.location.href = "/" }

  const openDemo = () => {
    if (onOpenDemo) onOpenDemo("demo")
    else window.location.href = "/"
  }

  const scrollToSection = (id: string, key: string) => {
    setActiveSection(key)
    isScrollingRef.current = true

    if (pathname !== "/") {
      window.location.href = `/#${id}`
      return
    }

    const el = document.getElementById(id)
    if (el) {
      const yOffset = -100 // Adjust this value to offset the sticky header
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }

    setTimeout(() => {
      isScrollingRef.current = false
    }, 1000)
  }

  const demoBtnClass = (overDark: boolean) =>
    cn(
      "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]",
      overDark
        ? "border-white bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        : "border-black bg-black text-white hover:bg-[#0A0A0A] shadow-[0_4px_20px_rgba(0,0,0,0.14)]",
    )

  const faqNavHref = pathname === "/" ? "/#landing-faq" : "/faq/"

  type NavLinkItem = {
    label: string
    href: string
    key: string
  }

  const mainNavItems: NavLinkItem[] = [
    { label: "Home", href: "/#main-content", key: "home" },
    { label: "Horus", href: "/#horus-intelligence", key: "horus" },
    { label: "Pricing", href: "/pricing", key: "pricing" },
    { label: "About", href: "/#about", key: "about" },
    { label: "FAQ", href: faqNavHref, key: "faq" },
  ]

  const productNavItems: NavLinkItem[] = [
    { label: "Features", href: "/#features", key: "features" },
    { label: "How it works", href: "/#how-it-works", key: "how" },
    { label: "Evidence Vault", href: "/#evidence-vault", key: "vault" },
    { label: "Gap Analysis", href: "/#gap-analysis", key: "analysis" },
    { label: "Standards Hub", href: "/#standards", key: "standards" },
    { label: "Security", href: "/#security", key: "security" },
  ]

  const productNavIcons: Record<string, typeof Layers> = {
    features: Layers,
    how: Workflow,
    vault: FileCheck,
    analysis: Microscope,
    standards: Scale,
    security: Shield,
  }

  const isNavItemActive = (key: string) => {
    if (key === "pricing") return pathname === "/pricing" || pathname.startsWith("/pricing/")
    if (key === "faq") return pathname === "/faq" || pathname.startsWith("/faq/") || (pathname === "/" && activeSection === "faq")
    if (pathname !== "/") return false
    return activeSection === key
  }

  const isProductGroupActive = productNavItems.some((item) => isNavItemActive(item.key))

  const productDropdownPanelClass = cn(
    "min-w-[11.5rem] rounded-2xl p-1.5 z-[60] !border shadow-none !backdrop-blur-2xl",
    isOverDark
      ? "!border-white/12 !bg-zinc-950/95 !text-white shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
      : "!border-black/[0.08] !bg-white/96 !text-foreground shadow-[0_16px_40px_rgba(0,0,0,0.14)]",
  )

  const productDropdownItemClass = (active: boolean) =>
    cn(
      "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors outline-none",
      isOverDark
        ? active
          ? "!bg-white/15 text-white"
          : "text-white/85 hover:!bg-white/10 hover:text-white focus:!bg-white/10 focus:text-white"
        : active
          ? "!bg-primary/10 text-primary"
          : "text-foreground/85 hover:!bg-black/5 focus:!bg-black/5",
    )

  const navLinkClass = (active: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] md:text-[13px] font-medium transition-colors duration-300 xl:px-3",
      active
        ? isOverDark
          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
          : "bg-primary/10 text-primary ring-1 ring-primary/20"
        : isOverDark
          ? "text-white/75 hover:bg-white/10 hover:text-white"
          : "text-black/75 hover:bg-black/5 hover:text-black",
    )

  const rightSide = !user ? (
    <div className="flex items-center gap-1.5">
      <Link
        href="/login"
        className={cn(
          "px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full hover:bg-black/5 dark:hover:bg-white/10",
          isOverDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"
        )}
      >
        Log in
      </Link>
      <button
        type="button"
        onClick={() => (onOpenDemo ? onOpenDemo("demo") : (window.location.href = "/"))}
        className={cn(demoBtnClass(isOverDark), "hidden md:inline-flex text-sm")}
      >
        Book Demo
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn("h-9 px-2 sm:px-3 rounded-full gap-1.5 sm:gap-2 transition-colors duration-300 cursor-pointer", isOverDark ? "hover:bg-white/10" : "hover:bg-black/5")}>
            <span className={cn("h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300", isOverDark ? "bg-white/10 text-white" : "bg-primary/10 text-primary")}>
              {getInitials(user.name)}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-colors duration-300", isOverDark ? "text-white/60" : "text-black/50")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" sideOffset={10}>
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/platform/dashboard" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="h-4 w-4" /> Go to Platform
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout} className="cursor-pointer">
            <LogOut className="h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link
        href="/platform/dashboard"
        className={cn(
          "hidden md:inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-[1.02]",
          isOverDark
            ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            : "bg-[#0A0A0A] text-white hover:bg-black shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        )}
      >
        Dashboard
      </Link>
    </div>
  )

  const labels = {
    home: "Home",
    features: "Features",
    demo: "Book Demo",
    horus: "Horus AI",
    how: "How",
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <motion.div
          layout
          className={cn(
            "pointer-events-auto relative grid w-full items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "grid-cols-[auto_minmax(0,1fr)_auto] gap-3 lg:gap-5",
            isCompact
              ? "max-w-[900px] p-1.5 pl-5 pr-1.5 rounded-full"
              : "max-w-5xl p-2 pl-6 pr-2 rounded-[2rem]",
            isOverDark
              ? "bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
              : "bg-black/[0.03] border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          )}
        >
          {/* ── Logo (Left) ── */}
          <div className="flex shrink-0 min-w-[3.25rem]">
            <Link href="/" aria-label="Ayn home" className="group block py-0.5">
              <span
                className={cn(
                  "text-[1.5rem] font-bold tracking-tighter leading-none flex items-center",
                  jakarta.className,
                  isOverDark ? "text-white" : "text-black",
                )}
              >
                Ayn<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden lg:flex min-w-0 justify-center px-1">
            <nav
              className={cn(
                "flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full px-1.5 py-1 transition-all duration-500 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                isOverDark
                  ? "bg-white/[0.06] border border-white/[0.08]"
                  : "bg-black/[0.04] border border-black/[0.06]"
              )}
            >
              {mainNavItems.slice(0, 2).map(({ label, href, key }) => {
                const active = isNavItemActive(key)
                const isHash = href.startsWith("/#")
                return (
                  <Link 
                    key={key} 
                    href={href} 
                    className={navLinkClass(active)}
                    onClick={(e) => {
                      if (isHash && pathname === "/") {
                        e.preventDefault()
                        scrollToSection(href.substring(2), key)
                      }
                    }}
                  >
                    {label}
                  </Link>
                )
              })}

              {/* Product dropdown — always on desktop to keep nav compact */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    navLinkClass(isProductGroupActive),
                    "group inline-flex items-center gap-0.5 outline-none cursor-pointer data-[state=open]:bg-black/5 dark:data-[state=open]:bg-white/10",
                  )}
                >
                  Product
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  sideOffset={12}
                  className={productDropdownPanelClass}
                >
                  <DropdownMenuLabel
                    className={cn(
                      "px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      isOverDark ? "text-white/40" : "text-muted-foreground",
                    )}
                  >
                    Explore
                  </DropdownMenuLabel>
                  {productNavItems.map(({ label, href, key }) => {
                    const Icon = productNavIcons[key]
                    const active = isNavItemActive(key)
                    return (
                      <DropdownMenuItem key={key} asChild className="p-0 focus:bg-transparent">
                        <Link href={href} className={productDropdownItemClass(active)}>
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              active
                                ? isOverDark
                                  ? "text-white"
                                  : "text-primary"
                                : isOverDark
                                  ? "text-white/55"
                                  : "text-muted-foreground",
                            )}
                          />
                          {label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {mainNavItems.slice(2).map(({ label, href, key }) => {
                const active = isNavItemActive(key)
                const isHash = href.startsWith("/#")
                return (
                  <Link 
                    key={key} 
                    href={href} 
                    className={navLinkClass(active)}
                    onClick={(e) => {
                      if (isHash && pathname === "/") {
                        e.preventDefault()
                        scrollToSection(href.substring(2), key)
                      }
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* ── Right Side (Buttons) ── */}
          <div className="flex shrink-0 justify-end">
            {rightSide}
          </div>
        </motion.div>
      </motion.header>

      {/* Floating bottom navigation dock for mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden flex items-center pointer-events-auto select-none">
        <div className="px-3 py-2 flex items-center gap-2 shadow-[0_16px_32px_rgba(0,0,0,0.5)] border border-white/[0.08] bg-[#050505]/75 backdrop-blur-2xl rounded-full relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none rounded-full" />
          <BottomTab
            icon={Home}
            label={labels.home}
            active={activeSection === "home"}
            onClick={() => scrollToSection("main-content", "home")}
          />
          <BottomTab
            icon={Brain}
            label={labels.horus}
            active={activeSection === "horus"}
            onClick={() => scrollToSection("horus-intelligence", "horus")}
          />
          <BottomTab
            icon={Layers}
            label={labels.features}
            active={activeSection === "features"}
            onClick={() => scrollToSection("features", "features")}
          />
          <BottomTab
            icon={Workflow}
            label={labels.how || "How"}
            active={activeSection === "how"}
            onClick={() => scrollToSection("how-it-works", "how")}
          />
          <div className="w-px h-8 bg-white/[0.08] mx-1 z-10" aria-hidden />
          <DemoButton
            label={labels.demo}
            onClick={() => openDemo()}
          />
        </div>
      </div>
    </>
  )
}

const BottomTab = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any
  label: string
  active: boolean
  onClick: () => void
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col items-center justify-center shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 800)}
    >
      <button
        onClick={onClick}
        type="button"
        className={cn(
          "transition-all duration-300 flex items-center justify-center relative cursor-pointer outline-none select-none shrink-0 z-10 rounded-full",
          active
            ? "w-10 h-10 text-primary scale-110 drop-shadow-[0_0_8px_rgba(0,122,255,0.4)]"
            : "w-10 h-10 text-white/50 hover:text-white active:scale-90"
        )}
        style={{ WebkitTapHighlightColor: "transparent", borderRadius: "9999px" }}
      >
        <Icon className="w-5 h-5" />
        {active && (
          <motion.span
            layoutId="activeDot"
            className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </button>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[110] px-2.5 py-1.5 text-[11px] font-semibold text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-white/10"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DemoButton = ({ label, onClick }: { label: string; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative flex flex-col items-center justify-center shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setTimeout(() => setHovered(false), 800)}
    >
      <button
        onClick={onClick}
        type="button"
        className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] border border-primary/20 active:scale-95 hover:bg-primary/20 transition-all duration-300 cursor-pointer outline-none select-none shrink-0"
        style={{ WebkitTapHighlightColor: "transparent", borderRadius: "9999px" }}
      >
        <CalendarDays className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,122,255,0.4)]" />
      </button>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute z-[110] px-2.5 py-1.5 text-[11px] font-semibold text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-white/10"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
