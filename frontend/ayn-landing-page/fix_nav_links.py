import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

old_nav_block = """          {/* ── Desktop Nav Pill (Absolute Center) ── */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
            <nav
              className={cn(
                "flex items-center justify-center gap-1 rounded-full px-1.5 py-1.5 transition-all duration-500",
                ""
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
          </div>"""

new_nav_block = """          {/* ── Desktop Nav Pill (Absolute Center) ── */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
            <nav
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-1.5 py-1.5 transition-all duration-500",
                ""
              )}
            >
              {navItems.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors duration-300",
                    isOverDark
                      ? "text-white/80 hover:text-white"
                      : "text-black/80 hover:text-black"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>"""

content = content.replace(old_nav_block, new_nav_block)

with open(file_path, "w") as f:
    f.write(content)

print("Nav links enhanced without hover bg!")
