import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import OfflineIndicator from './components/OfflineIndicator'

// ONLY eager load login page - everything else lazy
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// Lazy load ALL pages including critical ones
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'))
const AdminMemberDetails = lazy(() => import('./pages/admin/AdminMemberDetails'))
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'))
const AdminQRScanner = lazy(() => import('./pages/admin/AdminQRScanner'))
const AdminTrainers = lazy(() => import('./pages/admin/AdminTrainers'))
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance'))
const AdminSupplements = lazy(() => import('./pages/admin/AdminSupplements'))
const AdminSupplementSell = lazy(() => import('./pages/admin/AdminSupplementSell'))
const AdminSupplementSales = lazy(() => import('./pages/admin/AdminSupplementSales'))
const AdminSupplementReports = lazy(() => import('./pages/admin/AdminSupplementReports'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminPackages = lazy(() => import('./pages/admin/AdminPackages'))
const MemberProfile = lazy(() => import('./pages/member/MemberProfile'))
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'))
const SuperAdminUsers = lazy(() => import('./pages/super-admin/SuperAdminUsers'))
const SuperAdminAuditLogs = lazy(() => import('./pages/super-admin/SuperAdminAuditLogs'))
const SuperAdminFinance = lazy(() => import('./pages/super-admin/SuperAdminFinance'))
const SuperAdminSettings = lazy(() => import('./pages/super-admin/SuperAdminSettings'))
const TrainerCommissionsOverview = lazy(() => import('./pages/super-admin/TrainerCommissionsOverview'))
const LiveAttendance = lazy(() => import('./pages/super-admin/LiveAttendance'))
const SuperAdminMembersReport = lazy(() => import('./pages/super-admin/SuperAdminMembersReport'))
const TrainerCommissionProfile = lazy(() => import('./pages/admin/TrainerCommissionProfile'))
const TrainerSalarySlip = lazy(() => import('./pages/admin/TrainerSalarySlip'))

// Minimal loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
  </div>
)

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {!isOnline && <OfflineIndicator />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin/users" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminUsers /></ProtectedRoute>} />
          <Route path="/super-admin/audit-logs" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminAuditLogs /></ProtectedRoute>} />
          <Route path="/super-admin/finance" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminFinance /></ProtectedRoute>} />
          <Route path="/super-admin/settings" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminSettings /></ProtectedRoute>} />
          <Route path="/super-admin/trainers/commissions" element={<ProtectedRoute requiredRole="super_admin"><TrainerCommissionsOverview /></ProtectedRoute>} />
          <Route path="/super-admin/live-attendance" element={<ProtectedRoute requiredRole="super_admin"><LiveAttendance /></ProtectedRoute>} />
          <Route path="/super-admin/members-report" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminMembersReport /></ProtectedRoute>} />
          
          {/* Admin Routes - Accessible by both admin/receptionist and super_admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute requiredRole="admin"><AdminMembers /></ProtectedRoute>} />
          <Route path="/admin/members/:id" element={<ProtectedRoute requiredRole="admin"><AdminMemberDetails /></ProtectedRoute>} />
          <Route path="/admin/trainers" element={<ProtectedRoute requiredRole="admin"><AdminTrainers /></ProtectedRoute>} />
          <Route path="/admin/trainers/:id/commission" element={<ProtectedRoute requiredRole="admin"><TrainerCommissionProfile /></ProtectedRoute>} />
          <Route path="/admin/trainers/:id/salary-slip/:month" element={<ProtectedRoute requiredRole="admin"><TrainerSalarySlip /></ProtectedRoute>} />
          <Route path="/admin/packages" element={<ProtectedRoute requiredRole="admin"><AdminPackages /></ProtectedRoute>} />
          <Route path="/admin/finance" element={<ProtectedRoute requiredRole="admin"><AdminFinance /></ProtectedRoute>} />
          <Route path="/admin/supplements" element={<ProtectedRoute requiredRole="admin"><AdminSupplements /></ProtectedRoute>} />
          <Route path="/admin/supplements/sell" element={<ProtectedRoute requiredRole="admin"><AdminSupplementSell /></ProtectedRoute>} />
          <Route path="/admin/supplements/sales" element={<ProtectedRoute requiredRole="admin"><AdminSupplementSales /></ProtectedRoute>} />
          <Route path="/admin/supplements/reports" element={<ProtectedRoute requiredRole="admin"><AdminSupplementReports /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute requiredRole="admin"><AdminAttendance /></ProtectedRoute>} />
          <Route path="/admin/qr-scanner" element={<ProtectedRoute requiredRole="admin"><AdminQRScanner /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute requiredRole="scanner"><AdminQRScanner /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
          
          {/* Member Routes */}
          <Route path="/member/profile" element={<ProtectedRoute requiredRole="member"><MemberProfile /></ProtectedRoute>} />
          
          {/* Default redirect - Only admin login available */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch-all for removed routes */}
          <Route path="/member/*" element={<Navigate to="/login" replace />} />
          <Route path="/trainer/*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
