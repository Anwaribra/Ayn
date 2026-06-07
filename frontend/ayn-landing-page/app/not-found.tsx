"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { FileQuestion, Home } from "lucide-react"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-sm relative z-10"
      >
        <AynLogo size="md" withGlow={false} className="mb-6" />

        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-5">
          <FileQuestion className="w-5 h-5 text-muted-foreground" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Button asChild variant="default" className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </Button>
      </motion.div>
    </div>
  )
}
