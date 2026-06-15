import re

file_path = "/home/anwar/Projects/Ayn/frontend/ayn-landing-page/components/landing/Hero.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace Background
old_bg = """      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>"""

new_bg = """      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent z-20" />
        
        {/* Animated Aurora Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[130px] mix-blend-screen"
        />
      </div>"""

content = content.replace(old_bg, new_bg)

# Replace Buttons
old_buttons = """        <motion.div
          className="mb-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <ShinyButton
            onClick={() => onOpenDemo("demo")}
            className="w-full rounded-full bg-[#0A0A0A] px-8 py-5 text-base font-bold text-white transition-all hover:bg-black sm:w-auto"
          >
            Book a Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </ShinyButton>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full rounded-full border-border/60 bg-background px-8 py-5 text-base font-medium text-foreground transition-all hover:bg-muted/40 sm:w-auto"
          >
            <Link href="/signup">Create account</Link>
          </Button>
        </motion.div>"""

new_buttons = """        <motion.div
          className="mb-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
            <ShinyButton
              onClick={() => onOpenDemo("demo")}
              className="w-full rounded-full bg-[#0A0A0A] px-8 py-5 text-base font-bold text-white shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all sm:w-auto"
            >
              Book a Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </ShinyButton>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full rounded-full border-border/60 bg-background/50 backdrop-blur-md px-8 py-5 text-base font-medium text-foreground transition-all sm:w-auto"
            >
              <Link href="/signup">Create account</Link>
            </Button>
          </motion.div>
        </motion.div>"""

content = content.replace(old_buttons, new_buttons)

with open(file_path, "w") as f:
    f.write(content)

print("Hero updated with Aurora and Magnetic buttons!")
