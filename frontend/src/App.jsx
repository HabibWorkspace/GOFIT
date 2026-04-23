import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMembers from './pages/admin/AdminMembers'
import AdminMemberDetails from './pages/admin/AdminMemberDetails'
import AdminTrainers from './pages/admin/AdminTrainers'
import AdminFinance from './pages/admin/AdminFinance'
import AdminSupplements from './pages/admin/AdminSupplements'
import AdminSupplementSell from './pages/admin/AdminSupplementSell'
import AdminSupplementSales from './pages/admin/AdminSupplementSales'
import AdminSupplementReports from './pages/admin/AdminSupplementReports'
import AdminSettings from './pages/admin/AdminSettings'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminPackages from './pages/admin/AdminPackages'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminQRScanner from './pages/admin/AdminQRScanner'
import MemberProfile from './pages/member/MemberProfile'
import OfflineIndicator from './components/OfflineIndicator'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import SuperAdminUsers from './pages/super-admin/SuperAdminUsers'
import SuperAdminAuditLogs from './pages/super-admin/SuperAdminAuditLogs'
import SuperAdminFinance from './pages/super-admin/SuperAdminFinance'
import SuperAdminSettings from './pages/super-admin/SuperAdminSettings'
import TrainerCommissionsOverview from './pages/super-admin/TrainerCommissionsOverview'
import LiveAttendance from './pages/super-admin/LiveAttendance'
import SuperAdminMembersReport from './pages/super-admin/SuperAdminMembersReport'
import TrainerCommissionProfile from './pages/admin/TrainerCommissionProfile'
import TrainerSalarySlip from './pages/admin/TrainerSalarySlip'

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
    </Router>
  )
}

export default App
