"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { Settings, Database, Shield, Bell, Palette, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminSettingsPage() {
  const settingsSections = [
    {
      title: "Database",
      description: "Database connection and backup settings",
      icon: Database,
    },
    {
      title: "Security",
      description: "Authentication and access control",
      icon: Shield,
    },
    {
      title: "Notifications",
      description: "Email and push notification settings",
      icon: Bell,
    },
    {
      title: "Appearance",
      description: "Theme and branding customization",
      icon: Palette,
    },
    {
      title: "Localization",
      description: "Language and regional settings",
      icon: Globe,
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen">
        <Header title="System Settings" description="Configure platform settings" />

        <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              Settings configuration is currently managed through environment variables and backend configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settingsSections.map((section) => (
              <div key={section.title} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <section.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
            ))}
          </div>

          {/* System Info */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Platform Version</p>
                <p className="font-medium text-foreground">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Version</p>
                <p className="font-medium text-foreground">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Environment</p>
                <p className="font-medium text-foreground">Production</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium text-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
