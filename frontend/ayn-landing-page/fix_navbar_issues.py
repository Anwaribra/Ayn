file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Fix nav links back to absolute center
old_middle = """          {/* ── Desktop Nav Pill (Shifted slightly left) ── */}
          <div className="hidden lg:flex flex-1 justify-start ml-8 xl:ml-16">"""

new_middle = """          {/* ── Desktop Nav Pill (Absolute Center) ── */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">"""

content = content.replace(old_middle, new_middle)

# 2. Remove inner pill background/border and fix nav items
old_nav = """            <nav
              className={cn(
                "flex items-center justify-center gap-2 rounded-full px-1.5 py-1.5 transition-all duration-500",
                isOverDark
                  ? "bg-white/[0.04] border border-white/[0.05] shadow-inner"
                  : "bg-black/[0.03] border border-black/[0.04] shadow-inner"
              )}
            >"""

new_nav = """            <nav
              className="flex items-center justify-center gap-0.5 rounded-full px-1 py-1 transition-all duration-500"
            >"""

content = content.replace(old_nav, new_nav)

# 3. Stronger glassmorphism on outer shell
old_shell = """            isCompact 
              ? "max-w-[880px] w-[95%] p-1.5 pl-6 pr-1.5 rounded-full mt-0" 
              : "max-w-[1100px] w-[96%] p-3 pl-8 pr-3 rounded-[2rem] mt-2",
            isOverDark
              ? "bg-white/[0.02] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
              : "bg-black/[0.02] border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl\""""

new_shell = """            isCompact 
              ? "max-w-[820px] p-1 pl-5 pr-1 rounded-full mt-0" 
              : "max-w-[1050px] w-[94%] p-2.5 pl-7 pr-2.5 rounded-[1.5rem] mt-1",
            isOverDark
              ? "bg-black/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-150"
              : "bg-white/60 border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150\""""

content = content.replace(old_shell, new_shell)

with open(file_path, "w") as f:
    f.write(content)

print("All 3 issues fixed!")
