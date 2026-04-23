import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/super-admin/dashboard/stats')
      setStats(response.data)
      setError('')
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-fitnix-dark">
          <div className="text-center">
            {/* Spinning ring with logo */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Spinning golden ring */}
              <div className="absolute inset-0 border-4 border-transparent border-t-fitnix-gold rounded-full animate-spin"></div>
              {/* Logo in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/logo.PNG" 
                  alt="GOFIT Logo" 
                  className="w-14 h-14 object-contain animate-pulse" 
                  style={{ 
                    filter: 'drop-shadow(0 0 8px rgba(242, 194, 40, 0.3))',
                    mixBlendMode: 'screen'
                  }} 
                />
              </div>
            </div>
            {/* Loading text */}
            <p className="mt-4 text-fitnix-gold font-semibold animate-pulse">Loading...</p>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </SuperAdminLayout>
    )
  }

  // Chart data for revenue
  const revenueChartData = {
    labels: stats?.revenue_chart?.map(d => d.day) || [],
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: stats?.revenue_chart?.map(d => d.revenue) || [],
        borderColor: 'rgb(212, 175, 55)',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#D4AF37',
        bodyColor: '#F5F5F5',
        borderColor: '#D4AF37',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return 'Rs. ' + context.parsed.y.toLocaleString()
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return 'Rs. ' + value.toLocaleString()
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-fitnix-off-white">Super Admin Dashboard</h1>
          <p className="text-fitnix-off-white/60 mt-1">Welcome back, Owner! Here's your gym overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Revenue */}
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6 hover:border-fitnix-gold/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Today's Revenue</p>
                <p className="text-3xl font-bold text-fitnix-gold mt-2">
                  Rs. {stats?.today_revenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-fitnix-gold/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Check-ins */}
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6 hover:border-fitnix-gold/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Today's Check-ins</p>
                <p className="text-3xl font-bold text-green-400 mt-2">
                  {stats?.today_checkins || 0}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Outstanding Dues */}
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6 hover:border-fitnix-gold/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Outstanding Dues</p>
                <p className="text-3xl font-bold text-red-400 mt-2">
                  Rs. {stats?.outstanding_dues?.amount?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-fitnix-off-white/40 mt-1">
                  {stats?.outstanding_dues?.count || 0} members
                </p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6 hover:border-fitnix-gold/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Active Members</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {stats?.active_members || 0}
                </p>
                <p className="text-xs text-fitnix-off-white/40 mt-1">
                  of {stats?.total_members || 0} total
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-fitnix-off-white mb-4">Last 7 Days Revenue</h2>
          <div style={{ height: '300px' }}>
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Actions & Recent Audit Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-fitnix-off-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/super-admin/finance')}
                className="w-full bg-fitnix-gold/10 hover:bg-fitnix-gold/20 border border-fitnix-gold/30 text-fitnix-off-white px-4 py-3 rounded-lg transition-all text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 text-fitnix-gold mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  View Financial Reports
                </span>
                <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/super-admin/users')}
                className="w-full bg-fitnix-gold/10 hover:bg-fitnix-gold/20 border border-fitnix-gold/30 text-fitnix-off-white px-4 py-3 rounded-lg transition-all text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 text-fitnix-gold mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Receptionists
                </span>
                <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/super-admin/audit-logs')}
                className="w-full bg-fitnix-gold/10 hover:bg-fitnix-gold/20 border border-fitnix-gold/30 text-fitnix-off-white px-4 py-3 rounded-lg transition-all text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 text-fitnix-gold mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Audit Logs
                </span>
                <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/super-admin/settings')}
                className="w-full bg-fitnix-gold/10 hover:bg-fitnix-gold/20 border border-fitnix-gold/30 text-fitnix-off-white px-4 py-3 rounded-lg transition-all text-left flex items-center justify-between"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 text-fitnix-gold mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  System Settings
                </span>
                <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Recent Audit Log */}
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-fitnix-off-white">Recent Activity</h2>
              <button
                onClick={() => navigate('/super-admin/audit-logs')}
                className="text-fitnix-gold hover:text-fitnix-gold-dark text-sm"
              >
                View All
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats?.recent_audits?.length > 0 ? (
                stats.recent_audits.map((audit) => (
                  <div key={audit.id} className="bg-fitnix-dark-light/50 border border-fitnix-gold/10 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-fitnix-off-white text-sm">
                          <span className="font-semibold text-fitnix-gold">{audit.username}</span>
                          {' '}{audit.action}
                        </p>
                        <p className="text-fitnix-off-white/60 text-xs mt-1">
                          {audit.target_type} • {new Date(audit.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        audit.user_role === 'super_admin' ? 'bg-purple-900/30 text-purple-400' :
                        audit.user_role === 'admin' || audit.user_role === 'receptionist' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-gray-900/30 text-gray-400'
                      }`}>
                        {audit.user_role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-fitnix-off-white/60 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  )
}
