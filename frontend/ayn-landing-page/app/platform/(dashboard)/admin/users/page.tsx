"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { ProtectedRoute } from "@/components/platform/protected-route"
import useSWR from "swr"
import { Users, Search, Mail, Building2, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import type { User, UserRole } from "@/lib/types"

export default function AdminUsersPage() {
  const { data: users, isLoading } = useSWR("admin-users", () => api.getUsers())
  const [search, setSearch] = useState("")

  const filteredUsers = users?.filter(
    (user: User) =>
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase()),
  )

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "INSTITUTION_ADMIN":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "TEACHER":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "AUDITOR":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen">
        <Header title="Manage Users" description="View and manage platform users" />

        <div className="p-4 md:p-8 space-y-6">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>

          {/* Users List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-card/50 border border-border rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-32" />
                      <div className="h-4 bg-muted rounded w-48" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-16 bg-card/50 border border-border rounded-xl">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search" : "No users registered yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers?.map((user: User) => (
                <div
                  key={user.id}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-foreground/20 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-foreground">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{user.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.institutionId && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>Assigned</span>
                        </div>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border ${getRoleBadgeClass(user.role)}`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
