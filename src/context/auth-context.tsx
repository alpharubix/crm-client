import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@/types/auth'
import { ENV } from '@/conf'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  checkAuth: () => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/auth/me`, {
        credentials: 'include',
      })

      if (!res.ok) {
        setUser(null)
        return null
      }

      const data = await res.json()
      const userData = data.user ?? data
      setUser(userData)
      return userData
    } catch (err) {
      console.error('Auth check failed', err)
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch(`${ENV.VITE_BACKEND_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
