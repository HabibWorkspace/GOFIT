import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import NotificationPopup from '../../components/NotificationPopup'
import Pusher from 'pusher-js'

export default function AdminQRScanner() {
  const [result, setResult] = useState(null)
  const [sessionQR, setSessionQR] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()

  // Check if user is scanner role
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isScanner = user.role?.toLowerCase() === 'scanner'

  // Generate session QR code every 30 seconds
  useEffect(() => {
    generateSessionQR()
    
    const interval = setInterval(() => {
      generateSessionQR()
    }, 30000) // 30 seconds

    // Initialize Pusher for real-time check-in notifications
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
        
        // Listen for member check-in events
        channel.bind('member-checkin', (data) => {
          console.log('QR Scanner - Member check-in notification:', data)
          
          // Show notification popup
          setNotification(data)
          
          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(err => console.log('Audio play failed:', err))
          } catch (err) {
            console.log('Audio not available:', err)
          }
        })
        
        console.log('QR Scanner - Pusher connected successfully')
      } else {
        console.warn('Pusher key not configured. Real-time notifications disabled.')
      }
    } catch (err) {
      console.error('Failed to initialize Pusher:', err)
    }

    return () => {
      clearInterval(interval)
      
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

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionQR])

  const generateSessionQR = async () => {
    try {
      const response = await apiClient.post('/attendance/generate-session-qr')
      setSessionQR(response.data.qr_code)
      setSessionId(response.data.session_id)
      setTimeRemaining(30)
    } catch (err) {
      console.error('Failed to generate session QR:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-fitnix-dark">
      {/* Notification Popup */}
      {notification && (
        <NotificationPopup
          member={notification}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Header */}
      <div className="bg-fitnix-dark-light border-b border-fitnix-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo.PNG" alt="GOFIT Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              <div>
                <div className="text-base sm:text-lg font-extrabold fitnix-gradient-text">GOFIT QR Scanner</div>
                <div className="text-xs text-fitnix-off-white/60 uppercase tracking-wider hidden sm:block">Attendance System</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {!isScanner && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-3 py-2 sm:px-4 bg-fitnix-dark hover:bg-fitnix-dark-darker text-fitnix-gold border border-fitnix-gold rounded-lg transition-colors font-semibold text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 sm:px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold text-xs sm:text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Session QR Code Section */}
          <div className="fitnix-card-glow">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-fitnix-off-white mb-3 sm:mb-4">
                WELCOME
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold fitnix-gradient-text">
                Scan to CHECK IN
              </h2>
            </div>

            {sessionQR ? (
              <div className="text-center">
                <div className="bg-white p-4 sm:p-6 rounded-xl inline-block mb-3 sm:mb-4">
                  <img src={sessionQR} alt="Session QR Code" className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96" />
                </div>

                {/* Session ID Display */}
                {sessionId && (
                  <div className="mb-4 sm:mb-6">
                    <div className="inline-block bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-xl px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-xs sm:text-sm text-fitnix-off-white/60 mb-1 uppercase tracking-wider">Session ID</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold fitnix-gradient-text font-mono tracking-wider">
                        {sessionId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Countdown Timer */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-fitnix-gold animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-sm sm:text-base text-fitnix-off-white/60">
                    Refreshing in <span className="text-fitnix-gold font-bold text-lg sm:text-xl">{timeRemaining}</span> seconds
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-fitnix-gold border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-fitnix-off-white/60">Generating QR code...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
