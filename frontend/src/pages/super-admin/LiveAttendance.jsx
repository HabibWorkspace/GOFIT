import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'
import Pusher from 'pusher-js'

export default function LiveAttendance() {
  const [stats, setStats] = useState({
    total_checkins: 0,
    records: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchTodayAttendance()
    
    // Auto-refresh every 10 seconds if enabled
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchTodayAttendance()
      }, 10000)
    }

    // Initialize Pusher for real-time updates
    let pusher = null
    let channel = null
    
    try {
      const pusherKey = import.meta.env.VITE_PUSHER_KEY
      const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'
      
      if (pusherKey) {
        pusher = new Pusher(pusherKey, {
          cluster: pusherCluster,
          encrypted: true
        })
        
        channel = pusher.subscribe('admin-notifications')
        
        channel.bind('member-checkin', (data) => {
          console.log('Live Attendance - Member check-in:', data)
          fetchTodayAttendance()
        })
        
        console.log('Live Attendance - Pusher connected')
      }
    } catch (err) {
      console.error('Failed to initialize Pusher:', err)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (channel) {
        channel.unbind_all()
        channel.unsubscribe()
      }
      if (pusher) pusher.disconnect()
    }
  }, [autoRefresh])

  const fetchTodayAttendance = async () => {
    try {
      const response = await apiClient.get('/attendance/today')
      setStats(response.data)
      setError('')
    } catch (err) {
      console.error('Error fetching attendance:', err)
      setError(err.response?.data?.error || 'Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const checkInTime = new Date(timestamp)
    const diffMs = now - checkInTime
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return checkInTime.toLocaleDateString()
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

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fitnix-off-white">Live Attendance</h1>
            <p className="text-fitnix-off-white/60 mt-1">Real-time gym floor monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                autoRefresh
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white hover:bg-fitnix-dark'
              }`}
            >
              <svg className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </button>
            <button
              onClick={fetchTodayAttendance}
              className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Now
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-fitnix-gold/20 to-fitnix-gold/5 border border-fitnix-gold/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm font-medium mb-2">Total Check-ins Today</p>
                <p className="text-4xl font-bold text-fitnix-gold">{stats.total_checkins}</p>
              </div>
              <div className="p-4 bg-fitnix-gold/20 rounded-xl">
                <svg className="w-10 h-10 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm font-medium mb-2">Peak Hour</p>
                <p className="text-4xl font-bold text-blue-400">
                  {stats.chart_data?.labels[stats.chart_data?.data.indexOf(Math.max(...stats.chart_data?.data || [0]))] || '--:--'}
                </p>
                <p className="text-xs text-fitnix-off-white/40 mt-1">
                  {Math.max(...stats.chart_data?.data || [0])} check-ins
                </p>
              </div>
              <div className="p-4 bg-blue-900/20 rounded-xl">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-fitnix-gold/20">
            <h2 className="text-xl font-bold text-fitnix-off-white">Today's Check-ins</h2>
            <p className="text-sm text-fitnix-off-white/60 mt-1">Most recent first</p>
          </div>

          {stats.records && stats.records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-fitnix-dark-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">Member</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Member ID</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fitnix-gold/10">
                  {stats.records.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-fitnix-dark-light/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-fitnix-off-white font-medium">
                          {new Date(record.check_in_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-fitnix-off-white/60">
                          {getTimeAgo(record.check_in_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-fitnix-off-white">
                          {record.member_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-fitnix-off-white/80">
                          {record.member_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-fitnix-off-white/60 uppercase">
                          {(record.method || 'QR').replace(/_/g, ' ').replace(/\bId\b/g, 'ID').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 text-fitnix-off-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-fitnix-off-white/60 text-lg">No check-ins today</p>
              <p className="text-fitnix-off-white/40 text-sm mt-2">Check-ins will appear here in real-time</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
