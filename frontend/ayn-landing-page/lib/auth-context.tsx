"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "./api"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    role: "ADMIN" | "TEACHER" | "AUDITOR"
  }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      // Verify token is still valid
      api
        .getCurrentUser()
        .then((freshUser) => {
          setUser(freshUser)
          localStorage.setItem("user", JSON.stringify(freshUser))
        })
        .catch(() => {
          localStorage.removeItem("user")
          localStorage.removeItem("access_token")
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password)
    setUser(response.user)
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    role: "ADMIN" | "TEACHER" | "AUDITOR"
  }) => {
    const response = await api.register(data)
    setUser(response.user)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    const freshUser = await api.getCurrentUser()
    setUser(freshUser)
    localStorage.setItem("user", JSON.stringify(freshUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
