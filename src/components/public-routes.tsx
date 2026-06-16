import { useAuth } from '@/context/auth-context'
import { Navigate, Outlet } from 'react-router-dom'

export default function PublicRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (user) {
    const isHrRestrict = user.user_id === '3899927000000221552' || user.user_id === '3899927000000527649'
    return <Navigate to={isHrRestrict ? '/hiring' : '/accounts'} replace />
  }

  return <Outlet />
}
