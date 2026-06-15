import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Extract header block using regex from <motion.header to </motion.header>
header_pattern = re.compile(r'<motion\.header.*?</motion\.header>', re.DOTALL)

new_header = """<motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      >
        <motion.div
          layout
          className={cn(
            "pointer-events-auto flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full transition-all duration-500 max-w-5xl w-full",
            isOverDark
              ? "bg-[#0A0A0A]/50 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
              : "bg-white/60 border border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
          )}
        >
          {/* ── Logo (Left) ── */}
          <div className="flex-1 flex justify-start z-50">
            <Link href="/" aria-label="Ayn home" className="group block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex items-center select-none"
              >
                <span
                  className={cn(
                    "text-[1.5rem] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
                    isOverDark
                      ? "from-white to-white/70"
                      : "from-black to-black/70"
                  )}
                >
                  Ayn
                </span>
              </motion.div>
            </Link>
          </div>

          {/* ── Desktop Nav Pill (Center) ── */}
          <div className="hidden lg:flex flex-1 justify-center">
            <nav
              className={cn(
                "flex items-center justify-center gap-1 rounded-full px-1.5 py-1.5 transition-all duration-500",
                isOverDark
                  ? "bg-white/[0.03] border border-white/[0.05]"
                  : "bg-black/[0.03] border border-black/[0.04]"
              )}
            >
              {navItems.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300",
                    isOverDark
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Right Side (Buttons) ── */}
          <div className="flex-1 flex justify-end shrink-0">
            {rightSide}
          </div>
        </motion.div>
      </motion.header>"""

content = header_pattern.sub(new_header, content)

with open(file_path, "w") as f:
    f.write(content)

print("Navbar premium layout updated!")
