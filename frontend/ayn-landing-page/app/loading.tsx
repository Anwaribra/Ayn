"use client"

import { motion } from "framer-motion"
import { AynLogo } from "@/components/ayn-logo"
import { useUiLanguage } from "@/lib/ui-language-context"
import { cn } from "@/lib/utils"

export default function GlobalLoading() {
  const { isArabic } = useUiLanguage()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn("relative flex flex-col items-center", isArabic && "font-arabic")}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <AynLogo size="lg" withGlow={true} />
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="mt-6 flex max-w-xs flex-col items-center gap-1 px-4 text-center"
        >
          <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-ping" />
            {isArabic ? "جارٍ فتح المنصة" : "Opening Ayn"}
          </span>
          <span className="text-xs font-medium text-muted-foreground/80">
            {isArabic ? "تحميل الواجهة والبيانات الأساسية…" : "Loading the interface and core data…"}
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}
