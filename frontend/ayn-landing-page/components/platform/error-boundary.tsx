"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: { componentStack: string } | null
}

export class PlatformErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("Platform Error:", error, errorInfo)
    this.setState({ errorInfo })
    
    // Could send to error tracking service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/platform/dashboard"
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-destructive/20">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-center">
                <CardTitle className="text-xl">Something went wrong</CardTitle>
                <CardDescription className="mt-2">
                  An error occurred while loading this page. Try refreshing or go back to the dashboard.
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                    <Bug className="w-4 h-4" />
                    Error details
                  </div>
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset}
                  variant="outline" 
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1 gap-2"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle async errors
export function useErrorHandler() {
  return (error: Error) => {
    console.error("Handled error:", error)
    // Could send to error tracking service
  }
}
