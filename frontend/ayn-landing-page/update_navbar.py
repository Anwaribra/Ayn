import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace navItems
old_nav_items = """  const navItems = [
    { label: "Platform", href: "/#main-content" },
    { label: "Horus", href: "/#horus-intelligence" },
    { label: "Features", href: "/#features" },
    { label: "How", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/#about" },
    { label: "FAQ", href: faqNavHref },
  ]"""

new_nav_items = """  const navItems = [
    { label: "Platform", href: "/#main-content", icon: LayoutDashboard },
    { label: "Horus", href: "/#horus-intelligence", icon: Brain },
    { label: "Features", href: "/#features", icon: Sparkles },
    { label: "How", href: "/#how-it-works", icon: Layers },
    { label: "Pricing", href: "/pricing", icon: CalendarDays },
    { label: "About", href: "/#about", icon: HelpCircle },
    { label: "FAQ", href: faqNavHref, icon: HelpCircle },
  ]"""

content = content.replace(old_nav_items, new_nav_items)

# Replace rightSide user hidden logic
content = content.replace(
    'const rightSide = !user ? (\n    <div className={cn("flex items-center gap-1.5", isCompact && "hidden")}>',
    'const rightSide = !user ? (\n    <div className="flex items-center gap-1.5">'
)

# Extract header block using regex from <motion.header to </motion.header>
header_pattern = re.compile(r'<motion\.header.*?</motion\.header>', re.DOTALL)

new_header = """<motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <motion.div
          layout
          className={cn(
            "pointer-events-auto flex items-center justify-between gap-4 p-1.5 pl-4 pr-1.5 rounded-full transition-all duration-500 shadow-2xl backdrop-blur-xl border max-w-5xl w-full",
            isOverDark
              ? "bg-[#0A0A0A]/80 border-white/10"
              : "bg-white/80 border-black/10"
          )}
        >
          {/* ── Logo ── */}
          <div className="shrink-0 z-50 flex items-center">
            <Link href="/" aria-label="Ayn home" className="group block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex items-center gap-2 select-none"
              >
                {/* Minimal abstract eye/A icon */}
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full",
                  isOverDark ? "bg-white text-black" : "bg-black text-white"
                )}>
                  <div className="w-2.5 h-2.5 rounded-sm bg-current rotate-45" />
                </div>
                <span
                  className={cn(
                    "text-[1.4rem] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                    isOverDark
                      ? "from-white via-white/90 to-primary"
                      : "from-black via-black/90 to-primary"
                  )}
                >
                  Ayn
                </span>
              </motion.div>
            </Link>
          </div>

          {/* ── Desktop Nav Pill ── */}
          <nav
            className={cn(
              "hidden lg:flex items-center justify-center gap-1 rounded-full px-1.5 py-1.5 transition-all duration-500",
              isOverDark
                ? "bg-white/5 border border-white/5"
                : "bg-black/5 border border-black/5"
            )}
          >
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300",
                  isOverDark
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-black/60 hover:text-black hover:bg-black/5"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right Side ── */}
          <div className="shrink-0">
            {rightSide}
          </div>
        </motion.div>
      </motion.header>"""

content = header_pattern.sub(new_header, content)

with open(file_path, "w") as f:
    f.write(content)

print("Updated Navbar!")
