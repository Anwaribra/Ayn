"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion"
import {
  Brain,
  FileCheck,
  Shield,
  BarChart3,
  Zap,
  Users,
  ArrowRight,
  ChevronDown,
  Upload,
  Sparkles,
  FileText,
  Award,
  School,
  GraduationCap,
  Library,
  ShieldCheck,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { SparklesCore } from "@/components/ui/sparkles"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useTheme } from "@/lib/theme-context"
import Safari_01 from "@/components/ui/safari-01"
import { Lock } from "lucide-react"

// ============================================
// ANIMATION UTILITIES
// ============================================

// Cursor Glow Component - Subtle spotlight effect
function CursorGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }
    const handleLeave = () => setIsVisible(false)

    window.addEventListener("mousemove", handleMouse)
    window.addEventListener("mouseleave", handleLeave)
    return () => {
      window.removeEventListener("mousemove", handleMouse)
      window.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <motion.div
      className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0"
      style={{
        background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(120,120,120,0.02) 30%, transparent 70%)",
      }}
      animate={{
        x: mousePos.x - 300,
        y: mousePos.y - 300,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
    />
  )
}

// Text Split Animation Component
function SplitText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ")

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.08,
            ease: [0.25, 0.4, 0.25, 1]
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// Magnetic Button Component
function MagneticButton({ children, className = "", ...props }: React.ComponentProps<typeof Button>) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      <Button ref={ref} className={className} {...props}>
        {children}
      </Button>
    </motion.div>
  )
}

// Shiny Button Component - magnetic effect with shimmer (use as wrapper, not with asChild)
function ShinyButton({
  children,
  className = "",
  href,
  size = "lg",
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'asChild'> & { href?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.15)
    y.set((e.clientY - centerY) * 0.15)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const buttonContent = (
    <>
      {/* Shimmer effect */}
      <span className="absolute inset-0 overflow-hidden rounded-md">
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"
          style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}
        />
      </span>
      <span className="relative z-10 flex items-center">{children}</span>
    </>
  )

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="relative inline-block"
    >
      {href ? (
        <Link href={href}>
          <Button size={size} className={`relative overflow-hidden ${className}`} {...props}>
            {buttonContent}
          </Button>
        </Link>
      ) : (
        <Button size={size} className={`relative overflow-hidden ${className}`} {...props}>
          {buttonContent}
        </Button>
      )}
    </motion.div>
  )
}

// 3D Tilt Card Component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setRotateX(-y * 12)
    setRotateY(x * 12)
  }

  const handleLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }
  }
}

// ============================================
// FEATURE DATA
// ============================================

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Horus Engine provides intelligent gap analysis and recommendations for your institution",
    gradient: "from-purple-500/20 to-blue-500/20",
    borderGradient: "from-purple-500 via-blue-500 to-purple-500",
    size: "large"
  },
  {
    icon: FileCheck,
    title: "ISO 21001 & NAQAAE",
    description: "Full compliance with international education standards",
    gradient: "from-emerald-500/20 to-teal-500/20",
    borderGradient: "from-emerald-500 via-teal-500 to-emerald-500",
    size: "normal"
  },
  {
    icon: Shield,
    title: "Evidence Management",
    description: "Centralized document repository with smart organization",
    gradient: "from-amber-500/20 to-orange-500/20",
    borderGradient: "from-amber-500 via-orange-500 to-amber-500",
    size: "normal"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track progress with live dashboards and insights",
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderGradient: "from-blue-500 via-cyan-500 to-blue-500",
    size: "normal"
  },
  {
    icon: Zap,
    title: "Automated Workflows",
    description: "Streamlined assessment and review processes",
    gradient: "from-pink-500/20 to-rose-500/20",
    borderGradient: "from-pink-500 via-rose-500 to-pink-500",
    size: "normal"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Role-based access with seamless teamwork",
    gradient: "from-indigo-500/20 to-violet-500/20",
    borderGradient: "from-indigo-500 via-violet-500 to-indigo-500",
    size: "normal"
  }
]

// How It Works Steps
const workflowSteps = [
  {
    icon: Upload,
    title: "Upload Evidence",
    description: "Collect and organize your documentation"
  },
  {
    icon: Sparkles,
    title: "AI Analysis",
    description: "Horus Engine analyzes your data"
  },
  {
    icon: FileText,
    title: "Generate Reports",
    description: "Get detailed insights and recommendations"
  },
  {
    icon: Award,
    title: "Achieve Accreditation",
    description: "Meet standards with confidence"
  }
]

// ============================================
// COMPONENTS
// ============================================

// Feature Card with 3D Tilt and Animated Border
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <TiltCard
      className={`${feature.size === "large" ? "md:col-span-2 md:row-span-2" : ""}`}
    >
      <motion.div
        variants={scaleIn}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative h-full overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm"
      >
        {/* Animated gradient border - always visible with subtle glow */}
        <div className={`absolute inset-0 rounded-2xl p-[1px] overflow-hidden transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-30"}`}>
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `linear-gradient(90deg, ${feature.borderGradient.replace("from-", "").replace("via-", ", ").replace("to-", ", ").replace(/-500/g, "")})`.replace(/purple|blue|emerald|teal|amber|orange|cyan|pink|rose|indigo|violet/g, (m) => {
                const colors: Record<string, string> = {
                  purple: "#a855f7", blue: "#3b82f6", emerald: "#10b981",
                  teal: "#14b8a6", amber: "#f59e0b", orange: "#f97316",
                  cyan: "#06b6d4", pink: "#ec4899", rose: "#f43f5e",
                  indigo: "#6366f1", violet: "#8b5cf6"
                }
                return colors[m] || m
              }),
              animation: "gradient-rotate 3s linear infinite",
              backgroundSize: "200% 200%"
            }}
          />
        </div>

        {/* Inner content */}
        <div className="relative z-10 h-full rounded-2xl border border-border/50 bg-card/90 p-6 transition-all duration-300 hover:border-border card-elevated">
          {/* Gradient background - subtle at rest, more visible on hover */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-30"}`} />

          {/* Content */}
          <div className="relative z-10">
            <motion.div
              className={`mb-4 inline-flex items-center justify-center rounded-xl bg-muted/50 border border-border/30 
                ${feature.size === "large" ? "w-16 h-16" : "w-12 h-12"}`}
              animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <feature.icon className={`text-muted-foreground ${feature.size === "large" ? "w-8 h-8" : "w-6 h-6"}`} />
            </motion.div>

            <h3 className={`font-semibold text-foreground mb-2 ${feature.size === "large" ? "text-2xl" : "text-lg"}`}>
              {feature.title}
            </h3>

            <p className={`text-muted-foreground ${feature.size === "large" ? "text-base" : "text-sm"}`}>
              {feature.description}
            </p>

            {feature.size === "large" && (
              <motion.div
                className="mt-6 flex items-center gap-2 text-sm text-emerald-500 dark:text-emerald-400"
                animate={isHovered ? { x: 5 } : { x: 0 }}
              >
                <span>Powered by AI</span>
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </TiltCard>
  )
}

// Workflow Step Component
function WorkflowStep({ step, index, isActive }: { step: typeof workflowSteps[0]; index: number; isActive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Connector line */}
      {index < workflowSteps.length - 1 && (
        <div className="absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-1rem)] h-[2px] bg-muted hidden md:block">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.3 + 0.5, duration: 0.8 }}
            style={{ originX: 0 }}
          />
        </div>
      )}

      {/* Step number badge */}
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-20">
        {index + 1}
      </div>

      {/* Step icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
          ${isActive
            ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
            : "bg-muted/80 border border-border hover:border-primary/30"}`}
      >
        <step.icon className={`w-7 h-7 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
      </motion.div>

      {/* Step info */}
      <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
      <p className="text-sm text-muted-foreground max-w-[180px]">{step.description}</p>
    </motion.div>
  )
}

// Nav Link with underline animation
function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 py-1 group"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-emerald-400 to-emerald-300 group-hover:w-full transition-all duration-300" />
    </button>
  )
}

// Landing Navbar - Minimal Floating Glass
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true)
      } else {
        setHidden(false)
      }

      // Glass effect after scrolling
      setScrolled(currentScrollY > 50)
      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y: hidden ? -100 : 0
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`
          flex items-center justify-between gap-8 px-4 py-2.5 
          rounded-full border transition-all duration-500
          ${scrolled
            ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-lg shadow-black/10 dark:shadow-black/20"
            : "bg-background/50 backdrop-blur-md border-border/30"
          }
        `}
        style={{ maxWidth: "720px", width: "100%" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <AynLogo size="sm" withGlow={false} />
          </motion.div>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink href="#features" onClick={() => scrollToSection("features")}>
            Features
          </NavLink>
          <NavLink href="#how-it-works" onClick={() => scrollToSection("how-it-works")}>
            How It Works
          </NavLink>
        </div>

        {/* Right Side - Theme Toggle & Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="w-px h-4 bg-border/50" />
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 px-2 py-1.5"
          >
            Login
          </Link>
          <MagneticButton
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-4 py-1.5 h-auto rounded-full"
          >
            <Link href="/signup">Get Started</Link>
          </MagneticButton>
        </div>
      </nav>
    </motion.div>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }

  // Particle color based on theme - monochrome
  const particleColor = resolvedTheme === "dark" ? "#FFFFFF" : "#333333"

  return (
    <div ref={containerRef} className="bg-background text-foreground">
      {/* Cursor Glow Effect */}
      <CursorGlow />

      <LandingNavbar />

      {/* ===================== SECTION 1: HERO WITH DASHBOARD PREVIEW ===================== */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 pb-16">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,transparent_0%,hsl(var(--background))_70%)] pointer-events-none" />

        {/* Main Content - Split Layout */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Side - Text Content */}
            <div className="text-center lg:text-left">
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
                <span className="inline-block bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
                  Ayn
                </span>
              </h1>

              {/* Subtitle */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 text-foreground/90 tracking-tight">
                The primary Education Quality & Accreditation Platform
              </h2>

              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground/80 mb-8 max-w-md mx-auto lg:mx-0">
                Streamline your ISO 21001 & NAQAAE compliance with AI-powered analysis, evidence management, and automated workflows.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                <ShinyButton
                  href="/signup"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-6 py-5 text-sm font-medium w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ShinyButton>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-300 px-6 py-5 text-sm bg-transparent w-full sm:w-auto"
                >
                  See Features
                </Button>
              </div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>ISO 21001</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-primary" />
                  <span>NAQAAE</span>
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span>AI Analysis</span>
                </div>
              </motion.div>
            </div>

            {/* Right Side - Dashboard Preview with Safari Mockup */}
            <div className="relative hidden lg:block">
              {/* Glow effect behind the mockup */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl scale-110" />

              <Safari_01 className="relative z-10 glass-card">
                {/* Unlock / Beta Overlay - Simplified */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-[2px] bg-background/5 transition-all duration-500 hover:backdrop-blur-0 group/overlay">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl flex items-center justify-center group-hover/overlay:scale-110 transition-transform duration-500">
                      <Lock className="w-8 h-8 text-primary/80" />
                    </div>
                  </div>

                  {/* Corner Tag */}
                  <div className="absolute top-4 right-4 text-[10px] text-muted-foreground flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Coming Soon
                  </div>
                </div>
              </Safari_01>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={scrollToFeatures}
            className="text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-widest font-medium opacity-50">Discover</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </section>

      {/* Section Divider */}
      <div className="relative h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ===================== SECTION 2: FEATURES ===================== */}
      <section id="features" className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-14"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4"
            >
              Platform
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
            >
              Powerful Features
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground max-w-xl text-base"
            >
              Comprehensive tools for educational quality assurance and accreditation management.
            </motion.p>
          </motion.div>

          {/* Features Grid - Clean Checkmark Style */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="flex gap-4 items-start group"
                >
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1 text-[15px]">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>



      {/* ===================== SECTION 5: ABOUT / AUDIENCE ===================== */}
      <section id="about" className="relative py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Excellence for Every Institution
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
              Built for every educational institution seeking excellence in quality assurance.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { title: "For Schools", icon: School },
              { title: "For Universities", icon: GraduationCap },
              { title: "For Training Centers", icon: Library },
              { title: "ISO 21001 Ready", icon: Award },
              { title: "NAQAAE Compatible", icon: ShieldCheck },
              { title: "Evidence-First Approach", icon: Search },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col items-center text-center"
              >
                <div className="mb-6 w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                  <item.icon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="relative h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ===================== SECTION 6: FINAL CTA ===================== */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Floating gradient orbs - Theme Aware */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-muted/30 via-background to-background" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Start Your Quality Journey
            </span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
          >
            Join the platform designed to transform educational quality assurance.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <ShinyButton
              href="/signup"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 px-8 py-6 text-base font-medium shadow-xl shadow-primary/20"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </ShinyButton>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
