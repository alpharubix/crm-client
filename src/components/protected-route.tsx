import { useAuth } from '@/context/auth-context';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }: any) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  const isHrRestrict =
    user.user_id === '3899927000000221552' ||
    user.user_id === '3899927000000527649';
  if (
    isHrRestrict &&
    !location.pathname.startsWith('/hiring') &&
    !location.pathname.startsWith('/jr') &&
    !location.pathname.startsWith('/candidate')
  ) {
    return <Navigate to='/hiring' replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function ProtectedLogRoute({ children }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  const userRole = String(user?.role || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  const isAdminOrSuperAdmin =
    ['super_admin', 'superadmin', 'admin'].includes(userRole) ||
    userRole.includes('admin');

  if (!isAdminOrSuperAdmin) {
    return <Navigate to='/accounts' replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
