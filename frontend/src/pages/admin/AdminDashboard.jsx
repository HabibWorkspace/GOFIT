import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'
import NotificationPopup from '../../components/NotificationPopup'
import Pusher from 'pusher-js'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMetrics()
    fetchRecentActivities()
    
    // Initialize Pusher for real-time notifications
    let pusher = null
    let channel = null
    
    try {
      // Get Pusher credentials from environment variables
      const pusherKey = import.meta.env.VITE_PUSHER_KEY
      const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'
      
      if (pusherKey) {
        // Initialize Pusher client
        pusher = new Pusher(pusherKey, {
          cluster: pusherCluster,
          encrypted: true
        })
        
        // Subscribe to admin notifications channel
        channel = pusher.subscribe('admin-notifications')
        
        // Listen for member check-in events
        channel.bind('member-checkin', (data) => {
          console.log('Member check-in notification received:', data)
          
          // Show notification popup
          setNotification(data)
          
          // Refresh metrics to update counts
          fetchMetrics()
          
          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(err => console.log('Audio play failed:', err))
          } catch (err) {
            console.log('Audio not available:', err)
          }
        })
        
        // Listen for overdue payment alerts
        channel.bind('overdue-payment', (data) => {
          console.log('Overdue payment alert received:', data)
          // You can add a different notification style for overdue payments
        })
        
        console.log('Pusher connected successfully')
      } else {
        console.warn('Pusher key not configured. Real-time notifications disabled.')
      }
    } catch (err) {
      console.error('Failed to initialize Pusher:', err)
    }
    
    // Auto-refresh metrics every 10 seconds to update overdue payments
    const metricsInterval = setInterval(() => {
      fetchMetrics()
    }, 10000)
    
    // Auto-refresh recent activities every 30 seconds
    const activitiesInterval = setInterval(() => {
      fetchRecentActivities()
    }, 30000)
    
    return () => {
      clearInterval(metricsInterval)
      clearInterval(activitiesInterval)
      
      // Cleanup Pusher connection
      if (channel) {
        channel.unbind_all()
        channel.unsubscribe()
      }
      if (pusher) {
        pusher.disconnect()
      }
    }
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await apiClient.get(`/admin/dashboard/metrics?_t=${Date.now()}`)
      setMetrics(response.data)
    } catch (err) {
      setError('Failed to load dashboard metrics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      // Use dedicated recent activity endpoint
      const response = await apiClient.get(`/admin/dashboard/recent-activity?_t=${Date.now()}`)
      setRecentActivities(response.data.activities || [])
    } catch (err) {
      console.error('Failed to fetch recent activities:', err)
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const metricCards = [
    {
      title: 'Total Members',
      value: metrics?.total_members || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      iconBg: 'bg-fitnix-gold',
      iconColor: 'text-fitnix-dark',
      accentColor: 'text-fitnix-gold',
      borderColor: 'border-fitnix-gold/30',
      glowColor: 'hover:shadow-neon-lime'
    },
    {
      title: 'Overdue Payments',
      value: metrics?.overdue_payments_count || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
      accentColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      glowColor: 'hover:shadow-neon-red'
    },
    {
      title: 'Inactive Members',
      value: metrics?.inactive_members_count || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-orange-500',
      iconColor: 'text-white',
      accentColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      glowColor: 'hover:shadow-neon-orange'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Members',
      description: 'Add, edit, and manage member accounts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/admin/members',
      color: 'from-fitnix-gold to-fitnix-gold-dark'
    },
    {
      title: 'Manage Trainers',
      description: 'Handle trainer profiles and schedules',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: '/admin/trainers',
      color: 'from-fitnix-gold-dark to-fitnix-gold'
    },
    {
      title: 'Finance Overview',
      description: 'Track payments and financial reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      path: '/admin/finance',
      color: 'from-fitnix-gold to-fitnix-gold-dark'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports and insights',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/admin/analytics',
      color: 'from-fitnix-gold-dark to-fitnix-gold'
    }
  ]

  if (loading) {
    return (
      <div className="fixed inset-0 bg-fitnix-dark flex items-center justify-center z-50">
        <div className="relative flex flex-col items-center">
          {/* Outer rotating ring */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-fitnix-dark-light/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-fitnix-gold border-r-fitnix-gold animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-fitnix-gold-dark border-l-fitnix-gold-dark animate-spin-reverse"></div>
            {/* Logo in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/logo.PNG" 
                alt="FitNix Logo" 
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
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      {/* Notification Popup */}
      {notification && (
        <NotificationPopup
          member={notification}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-fitnix-off-white">
              Admin <span className="fitnix-gradient-text">Dashboard</span>
            </h1>
            <p className="text-fitnix-off-white/70 mt-2 text-lg">
              Welcome back! Here's what's happening at your gym today.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-sm text-fitnix-off-white/60">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-fitnix-dark-light border border-fitnix-gold text-fitnix-off-white px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCards.map((metric, index) => {
            const isOverdue = index === 1
            const isInactive = index === 2
            const isClickable = isOverdue // Make overdue card clickable
            
            const CardWrapper = isClickable ? 'button' : 'div'
            const clickProps = isClickable ? {
              onClick: () => navigate('/admin/finance'),
              className: `w-full text-left fitnix-card-glow border-2 ${metric.borderColor} transform hover:scale-105 transition-all duration-300 relative rounded-2xl cursor-pointer`
            } : {
              className: `fitnix-card-glow border-2 ${metric.borderColor} transform hover:scale-105 transition-all duration-300 relative rounded-2xl`
            }
            
            return (
            <CardWrapper
              key={index} 
              {...clickProps}
              onMouseEnter={(e) => {
                if (isOverdue) {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 59, 48, 0.3), 0 0 24px rgba(255, 59, 48, 0.15)'
                } else if (isInactive) {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.3), 0 0 24px rgba(249, 115, 22, 0.15)'
                } else {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(242, 194, 40, 0.3), 0 0 24px rgba(242, 194, 40, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Gradient mesh overlay */}
              <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 ${metric.iconBg} rounded-xl flex items-center justify-center ${metric.iconColor} shadow-lg`}>
                    {metric.icon}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${metric.accentColor}`}>{metric.value}</p>
                  <p className="text-fitnix-off-white/80 text-sm sm:text-base font-semibold">{metric.title}</p>
                  {metric.subtitle && (
                    <p className="text-fitnix-off-white/50 text-xs">{metric.subtitle}</p>
                  )}
                </div>
              </div>
            </CardWrapper>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="fitnix-card-glow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-fitnix-off-white">Recent Activity</h2>
            <div className="flex items-center space-x-2 bg-fitnix-dark px-4 py-2 rounded-full border-2 border-fitnix-gold/20">
              <div className="w-2 h-2 bg-fitnix-gold rounded-full animate-pulse"></div>
              <span className="text-fitnix-gold text-sm font-bold uppercase tracking-wide">Live</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-fitnix-dark-light to-fitnix-dark rounded-full flex items-center justify-center border-2 border-fitnix-gold/20">
                    <svg className="w-12 h-12 text-fitnix-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-fitnix-off-white/60 text-xl font-semibold">No recent activity</p>
                  <p className="text-fitnix-off-white/40 text-sm">Activity will appear here as it happens</p>
                </div>
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-fitnix-dark-light/40 backdrop-blur-lg rounded-xl hover:bg-fitnix-dark-light/60 transition-all duration-300 border border-fitnix-gold/10 hover:border-fitnix-gold/30 hover:shadow-lg transform hover:scale-[1.02]"
                >
                  {/* Icon with gradient background */}
                  <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.icon === 'user' 
                      ? 'bg-gradient-to-br from-fitnix-gold to-fitnix-gold-dark' 
                      : 'bg-gradient-to-br from-cyan-500 to-cyan-700'
                  } shadow-lg`}>
                    {activity.icon === 'user' ? (
                      <svg className="w-7 h-7 text-fitnix-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 rounded-xl ${
                      activity.icon === 'user' 
                        ? 'bg-fitnix-gold' 
                        : 'bg-cyan-500'
                    } opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-200`}></div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-fitnix-off-white font-semibold text-sm sm:text-base truncate group-hover:text-fitnix-gold transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-fitnix-off-white/60 text-xs sm:text-sm truncate mt-0.5">
                      {activity.description}
                    </p>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center space-x-2 flex-shrink-0 sm:ml-auto">
                    <div className="text-fitnix-off-white/40 text-xs sm:text-sm font-medium whitespace-nowrap bg-fitnix-dark px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                      {getTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
