"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function AccountProfilePage() {
  return (
    <ProtectedRoute>
      <AccountProfileContent />
    </ProtectedRoute>
  )
}

function AccountProfileContent() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name ?? "")

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      await api.updateUser({ name: name.trim() })
      await refreshUser()
      toast.success("Profile updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in-up pb-20 max-w-2xl px-4">
      <Link
        href="/platform/settings"
        className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm font-medium mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          Account <span className="text-[var(--text-tertiary)] font-light">Profile</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Manage your institutional identifiers and contact details
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border-[var(--border-subtle)] space-y-4">
          <div>
            <Label htmlFor="name" className="text-[var(--text-secondary)] text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-primary)]"
              placeholder="Your full name"
            />
          </div>
          <div>
            <Label className="text-[var(--text-tertiary)] text-sm font-medium">Email</Label>
            <p className="mt-2 text-[var(--text-secondary)] text-sm">{user?.email}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Email cannot be changed</p>
          </div>
          <div>
            <Label className="text-[var(--text-tertiary)] text-sm font-medium">Role</Label>
            <p className="mt-2 text-[var(--text-secondary)] text-sm">{user?.role}</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
