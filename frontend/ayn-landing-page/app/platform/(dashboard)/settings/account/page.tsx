"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { SettingsPageLayout } from "@/components/platform/settings-page-layout"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useUiLanguage } from "@/lib/ui-language-context"

export default function AccountProfilePage() {
  return (
    <ProtectedRoute>
      <AccountProfileContent />
    </ProtectedRoute>
  )
}

function AccountProfileContent() {
  const { user, refreshUser } = useAuth()
  const { isArabic } = useUiLanguage()
  const [name, setName] = useState(user?.name ?? "")

  useEffect(() => {
    if (user?.name) setName(user.name)
  }, [user?.name])
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(isArabic ? "الاسم مطلوب" : "Name is required")
      return
    }
    setSaving(true)
    try {
      await api.updateUser({ name: name.trim() })
      await refreshUser()
      toast.success(isArabic ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (isArabic ? "فشل تحديث الملف الشخصي" : "Failed to update profile"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsPageLayout
      title="Account profile"
      titleAr="الملف الشخصي"
      description="Manage your name and view account identifiers."
      descriptionAr="إدارة الاسم وعرض بيانات الحساب."
    >
      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel glass-border space-y-4 rounded-2xl p-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
              {isArabic ? "الاسم الكامل" : "Full name"}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input mt-2 text-foreground"
              placeholder={isArabic ? "اسمك الكامل" : "Your full name"}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
            <p className="mt-2 text-sm text-foreground/80">{user?.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{isArabic ? "لا يمكن تغيير البريد الإلكتروني هنا" : "Email cannot be changed here"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{isArabic ? "الدور" : "Role"}</Label>
            <p className="mt-2 text-sm text-foreground/80">{user?.role}</p>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? (isArabic ? "جاري الحفظ…" : "Saving…") : (isArabic ? "حفظ التغييرات" : "Save changes")}
        </Button>
      </form>
    </SettingsPageLayout>
  )
}
