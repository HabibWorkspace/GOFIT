import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  try {
    const userData = JSON.parse(user)
    
    // Normalize role to lowercase for comparison
    const userRole = userData.role?.toLowerCase()
    const required = requiredRole?.toLowerCase()
    
    if (required) {
      // Super admin can access everything
      if (userRole === 'super_admin') {
        return children
      }
      
      // Admin/receptionist can access admin routes
      if (required === 'admin' && (userRole === 'admin' || userRole === 'receptionist')) {
        return children
      }
      
      // Exact role match required for other roles
      if (userRole !== required) {
        return <Navigate to="/login" replace />
      }
    }
  } catch (e) {
    return <Navigate to="/login" replace />
  }

  return children
}
