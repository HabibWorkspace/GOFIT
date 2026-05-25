import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  console.log('🔒 ProtectedRoute Check:', {
    hasToken: !!token,
    hasUser: !!user,
    token: token ? token.substring(0, 20) + '...' : null,
    user: user,
    requiredRole
  })

  if (!token || !user) {
    console.log('❌ No token or user - redirecting to login')
    return <Navigate to="/login" replace />
  }

  try {
    const userData = JSON.parse(user)
    console.log('👤 User data:', userData)
    
    // Normalize role to lowercase for comparison
    const userRole = userData.role?.toLowerCase()
    const required = requiredRole?.toLowerCase()
    
    console.log('🎭 Role check:', { userRole, required })
    
    if (required) {
      // Super admin can access everything
      if (userRole === 'super_admin') {
        console.log('✅ Super admin access granted')
        return children
      }
      
      // Admin/receptionist can access admin routes
      if (required === 'admin' && (userRole === 'admin' || userRole === 'receptionist')) {
        console.log('✅ Admin/receptionist access granted')
        return children
      }
      
      // Exact role match required for other roles
      if (userRole !== required) {
        console.log('❌ Role mismatch - redirecting to login')
        return <Navigate to="/login" replace />
      }
    }
    
    console.log('✅ Access granted')
  } catch (e) {
    console.log('❌ Error parsing user data:', e)
    return <Navigate to="/login" replace />
  }

  return children
}
