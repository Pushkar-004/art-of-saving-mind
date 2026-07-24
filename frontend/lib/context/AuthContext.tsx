'use client'

// Auth context wired to the real backend.
// Access token lives in memory; refresh token lives in an httpOnly cookie
// set by the backend — so it survives hard-reloads without being exposed
// to JavaScript (XSS-safe).

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  login as apiLogin,
  signup as apiSignup,
  getCurrentUser,
  logoutApi,
  refreshAccessToken,
  setAccessToken,
  type AuthUser,
} from '@/lib/api/client'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  signup: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: try to restore session via the httpOnly refresh-token cookie.
  useEffect(() => {
    async function restoreSession() {
      try {
        // 1. Try to exchange the refresh-token cookie for a new access token.
        const newToken = await refreshAccessToken()
        if (!newToken) {
          setIsLoading(false)
          return
        }
        setAccessToken(newToken)

        // 2. With a valid access token, fetch the current user.
        const res = await getCurrentUser()
        setUser(res.data.user)
      } catch {
        // No valid session — user stays logged out.
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiLogin(email, password)
    setAccessToken(res.data.accessToken)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const signup = useCallback(
    async (fullName: string, email: string, password: string, confirmPassword: string): Promise<AuthUser> => {
      const res = await apiSignup(fullName, email, password, confirmPassword)
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
      return res.data.user
    },
    [],
  )

  const logout = useCallback(async () => {
    // Tell the backend to clear the refresh-token cookie, then clear local state.
    await logoutApi()
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
