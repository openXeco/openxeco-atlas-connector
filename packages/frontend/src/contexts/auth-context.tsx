'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, setAccessToken, getAccessToken } from '@/lib/api'

interface User {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshToken = async () => {
    try {
      const response = await apiClient.post<{ accessToken: string }>('/api/auth/refresh', {})
      setAccessToken(response.accessToken)
      await fetchCurrentUser()
    } catch (error) {
      setAccessToken(null)
      setUser(null)
      throw error
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setUser(null)
        return
      }

      const response = await apiClient.get<{ user: User }>('/api/auth/me')
      setUser(response.user)
    } catch (_error) {
      setAccessToken(null)
      setUser(null)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{
      accessToken: string
      user: User
    }>('/api/auth/login', { email, password })

    setAccessToken(response.accessToken)
    setUser(response.user)
    router.push('/')
  }

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout', {})
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAccessToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        // On page load, try to restore session via refresh token cookie
        await refreshToken()
      } catch (_error) {
        // No valid refresh token — user needs to log in
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    const interval = setInterval(
      async () => {
        const token = getAccessToken()
        if (token) {
          try {
            await refreshToken()
          } catch (error) {
            console.error('Token refresh failed:', error)
          }
        }
      },
      50 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
