import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AynLogo } from "@/components/ayn-logo"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <AynLogo size="md" withGlow={false} className="mb-8" />
        <div className="rounded-full bg-muted p-4 mb-6">
          <FileQuestion className="w-10 h-10 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">View Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
