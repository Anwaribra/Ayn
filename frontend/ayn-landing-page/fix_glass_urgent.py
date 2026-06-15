file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/LandingNavbar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Fix the glassmorphism and widths
old_shell = """            isCompact 
              ? "max-w-[820px] p-1 pl-5 pr-1 rounded-full mt-0" 
              : "max-w-[1050px] w-[94%] p-2.5 pl-7 pr-2.5 rounded-[1.5rem] mt-1",
            isOverDark
              ? "bg-black/40 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-150"
              : "bg-white/60 border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150\""""

new_shell = """            isCompact 
              ? "max-w-[960px] w-auto p-1.5 pl-6 pr-1.5 rounded-full mt-0" 
              : "max-w-5xl w-[92%] p-2.5 pl-7 pr-2.5 rounded-[1.5rem] mt-1",
            isOverDark
              ? "bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
              : "bg-black/[0.03] border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl\""""

content = content.replace(old_shell, new_shell)

with open(file_path, "w") as f:
    f.write(content)

print("Fixed!")
