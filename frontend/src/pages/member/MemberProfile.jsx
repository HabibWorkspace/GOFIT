import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import apiClient from '../../services/api'

export default function MemberProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const html5QrcodeScannerRef = useRef(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/member/profile')
      setProfile(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const startScanning = () => {
    setScanning(true)
    setScanResult(null)
    setError('')

    setTimeout(() => {
      if (scannerRef.current && !html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "member-qr-reader",
          { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: { ideal: "environment" }  // back camera
            }
          },
          false
        )

        html5QrcodeScannerRef.current.render(onScanSuccess, onScanError)
      }
    }, 100)
  }

  const stopScanning = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear()
      html5QrcodeScannerRef.current = null
    }
    setScanning(false)
  }

  const onScanSuccess = async (decodedText) => {
    try {
      stopScanning()

      const response = await apiClient.post('/attendance/check-in-qr', {
        qr_data: decodedText
      })

      setScanResult({
        success: true,
        message: response.data.message,
        time: new Date().toLocaleTimeString()
      })

      // Refresh profile to update attendance
      fetchProfile()

      // Auto-clear result after 5 seconds
      setTimeout(() => {
        setScanResult(null)
      }, 5000)

    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Failed to check in'
      })

      setTimeout(() => {
        setScanResult(null)
      }, 5000)
    }
  }

  const onScanError = (errorMessage) => {
    // Ignore scanning errors (they happen frequently)
    console.log(errorMessage)
  }

  const handleManualCheckIn = async () => {
    if (!sessionId.trim()) {
      setScanResult({
        success: false,
        message: 'Please enter a session ID'
      })
      setTimeout(() => setScanResult(null), 3000)
      return
    }

    setCheckingIn(true)
    setScanResult(null)
    setError('')

    try {
      const response = await apiClient.post('/attendance/check-in-session', {
        session_id: sessionId.trim()
      })

      setScanResult({
        success: true,
        message: response.data.message,
        time: new Date().toLocaleTimeString()
      })

      // Clear session ID input
      setSessionId('')

      // Refresh profile to update attendance
      fetchProfile()

      // Auto-clear result after 5 seconds
      setTimeout(() => {
        setScanResult(null)
      }, 5000)

    } catch (err) {
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Failed to check in'
      })

      setTimeout(() => {
        setScanResult(null)
      }, 5000)
    } finally {
      setCheckingIn(false)
    }
  }

  const getMembershipStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-900/30 border-emerald-500'
      case 'expiring_soon':
        return 'text-amber-400 bg-amber-900/30 border-amber-500'
      case 'expired':
        return 'text-red-400 bg-red-900/30 border-red-500'
      default:
        return 'text-fitnix-off-white/60 bg-fitnix-dark-light border-fitnix-off-white/20'
    }
  }

  const getMembershipStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'expiring_soon':
        return 'Expiring Soon'
      case 'expired':
        return 'Expired'
      default:
        return 'Unknown'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-400 bg-emerald-900/30 border-emerald-500'
      case 'pending':
        return 'text-amber-400 bg-amber-900/30 border-amber-500'
      case 'overdue':
        return 'text-red-400 bg-red-900/30 border-red-500'
      default:
        return 'text-fitnix-off-white/60 bg-fitnix-dark-light border-fitnix-off-white/20'
    }
  }

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'pending':
        return 'Pending'
      case 'overdue':
        return 'Overdue'
      case 'no_payments':
        return 'No Payments'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-fitnix-dark flex items-center justify-center z-50">
        <div className="relative flex flex-col items-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-fitnix-dark-light/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-fitnix-gold border-r-fitnix-gold animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-fitnix-gold-dark border-l-fitnix-gold-dark animate-spin-reverse"></div>
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
          <p className="mt-4 text-fitnix-gold font-semibold animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fitnix-dark flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 text-fitnix-off-white px-6 py-4 rounded-xl max-w-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fitnix-dark">
      {/* Header */}
      <div className="bg-fitnix-dark-light border-b border-fitnix-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.PNG" alt="GOFIT Logo" className="w-12 h-12 object-contain" />
              <div>
                <div className="text-lg font-extrabold fitnix-gradient-text">GOFIT</div>
                <div className="text-xs text-fitnix-off-white/60 uppercase tracking-wider">Active Lifestyle</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="text-fitnix-off-white">Welcome, </span>
              <span className="fitnix-gradient-text">{profile.member.full_name?.split(' ')[0] || 'Member'}</span>
            </h1>
            <p className="text-fitnix-off-white/60 text-lg">Ready to crush your fitness goals today?</p>
          </div>

          {/* Profile Header */}
          <div className="fitnix-card-glow">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Picture */}
              <div className="relative">
                {profile.member.profile_picture ? (
                  <img
                    src={profile.member.profile_picture}
                    alt={profile.member.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-fitnix-gold"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-fitnix-dark-light border-4 border-fitnix-gold flex items-center justify-center">
                    <svg className="w-16 h-16 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-fitnix-off-white mb-2">{profile.member.full_name}</h1>
                <p className="text-fitnix-gold font-semibold text-lg mb-4">Member #{profile.member.member_number}</p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getMembershipStatusColor(profile.membership_status)}`}>
                    {getMembershipStatusText(profile.membership_status)}
                  </span>
                  {profile.payment_status !== 'no_payments' && (
                    <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getPaymentStatusColor(profile.payment_status)}`}>
                      Payment: {getPaymentStatusText(profile.payment_status)}
                    </span>
                  )}
                  {profile.member.package_expiry_date && (
                    <span className="px-4 py-2 rounded-full text-sm font-bold border border-fitnix-gold/50 bg-fitnix-dark text-fitnix-gold">
                      Due: {formatDate(profile.member.package_expiry_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Membership Details & QR Code */}
          <div className="grid grid-cols-1 gap-6">
            {/* Membership Details */}
            <div className="fitnix-card-glow">
              <h2 className="text-xl font-bold text-fitnix-gold mb-4">Membership Details</h2>
              
              <div className="space-y-3">
                {profile.package ? (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-fitnix-off-white/10">
                      <span className="text-fitnix-off-white/60">Package:</span>
                      <span className="text-fitnix-off-white font-semibold">{profile.package.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-fitnix-off-white/10">
                      <span className="text-fitnix-off-white/60">Duration:</span>
                      <span className="text-fitnix-off-white font-semibold">{profile.package.duration_days} days</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-fitnix-off-white/10">
                      <span className="text-fitnix-off-white/60">Price:</span>
                      <span className="text-fitnix-gold font-bold">Rs. {profile.package.price}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-fitnix-off-white/60">
                    No active package
                  </div>
                )}
                
                {profile.member.package_start_date && (
                  <div className="flex justify-between items-center py-2 border-b border-fitnix-off-white/10">
                    <span className="text-fitnix-off-white/60">Start Date:</span>
                    <span className="text-fitnix-off-white font-semibold">{formatDate(profile.member.package_start_date)}</span>
                  </div>
                )}
                
                {profile.member.package_expiry_date && (
                  <div className="flex justify-between items-center py-2 border-b border-fitnix-off-white/10">
                    <span className="text-fitnix-off-white/60">Due Date:</span>
                    <span className={`font-semibold ${profile.days_remaining < 0 ? 'text-red-400' : profile.days_remaining <= 3 ? 'text-amber-400' : 'text-fitnix-off-white'}`}>
                      {formatDate(profile.member.package_expiry_date)}
                    </span>
                  </div>
                )}
                
                {profile.days_remaining !== null && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-fitnix-off-white/60">Days Remaining:</span>
                    <span className={`font-bold text-lg ${profile.days_remaining < 0 ? 'text-red-400' : profile.days_remaining <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {profile.days_remaining < 0 ? 'Expired' : `${profile.days_remaining} days`}
                    </span>
                  </div>
                )}
                
                {profile.member.trainer_name && (
                  <div className="flex justify-between items-center py-2 border-t border-fitnix-gold/20 mt-2 pt-2">
                    <span className="text-fitnix-off-white/60">Trainer:</span>
                    <span className="text-fitnix-gold font-semibold">{profile.member.trainer_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Scanner for Check-In */}
          <div className="fitnix-card-glow">
            <h2 className="text-xl font-bold text-fitnix-gold mb-4">Quick Check-In</h2>
            <p className="text-fitnix-off-white/60 mb-6">
              Scan the session QR code or enter the session ID displayed at the front desk
            </p>

            {/* Manual Session ID Input */}
            <div className="mb-6 p-4 bg-fitnix-dark-light/40 rounded-xl border border-fitnix-gold/20">
              <h3 className="text-lg font-semibold text-fitnix-gold mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Enter Session ID
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                    setSessionId(value)
                  }}
                  placeholder="Enter 9-digit session ID"
                  maxLength="9"
                  className="flex-1 px-4 py-3 bg-fitnix-dark border-2 border-fitnix-gold/30 rounded-lg text-fitnix-off-white placeholder-fitnix-off-white/40 focus:outline-none focus:border-fitnix-gold transition-colors font-mono text-lg tracking-wider"
                  disabled={checkingIn}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualCheckIn()
                    }
                  }}
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={checkingIn || !sessionId.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-fitnix-gold to-fitnix-gold-light hover:from-fitnix-gold-dark hover:to-fitnix-gold text-fitnix-dark font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {checkingIn ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    'Check In'
                  )}
                </button>
              </div>
              <p className="text-xs text-fitnix-off-white/50 mt-2">
                The session ID is displayed below the QR code at the front desk
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-fitnix-gold/20"></div>
              <span className="text-sm text-fitnix-off-white/60 uppercase tracking-wider">OR</span>
              <div className="flex-1 h-px bg-fitnix-gold/20"></div>
            </div>

            {/* QR Scanner */}
            {!scanning ? (
              <div className="text-center py-8">
                <svg className="w-20 h-20 mx-auto text-fitnix-gold/30 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <button
                  onClick={startScanning}
                  className="px-8 py-4 bg-gradient-to-r from-fitnix-gold to-fitnix-gold-light hover:from-fitnix-gold-dark hover:to-fitnix-gold text-fitnix-dark font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Scan QR Code to Check In
                </button>
              </div>
            ) : (
              <div>
                <div id="member-qr-reader" ref={scannerRef} className="rounded-lg overflow-hidden"></div>
                <button
                  onClick={stopScanning}
                  className="w-full mt-4 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Cancel Scanning
                </button>
              </div>
            )}

            {/* Scan Result Display */}
            {scanResult && (
              <div className={`mt-6 p-4 rounded-lg border-2 ${scanResult.success ? 'bg-emerald-900/20 border-emerald-500' : 'bg-red-900/20 border-red-500'}`}>
                <div className="flex items-center">
                  {scanResult.success ? (
                    <svg className="w-6 h-6 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div>
                    <p className={`font-bold text-lg ${scanResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {scanResult.success ? 'Check-In Successful!' : 'Check-In Failed'}
                    </p>
                    <p className={`text-sm ${scanResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                      {scanResult.message}
                    </p>
                    {scanResult.success && (
                      <p className="text-emerald-400/60 text-xs mt-1">{scanResult.time}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="fitnix-card-glow">
            <h2 className="text-xl font-bold text-fitnix-gold mb-4">Recent Attendance</h2>
            
            {profile.recent_attendance.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-fitnix-off-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-fitnix-off-white/60">No attendance records yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-fitnix-gold/30">
                      <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Direction</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.recent_attendance.map((record, index) => (
                      <tr key={index} className={`border-b border-fitnix-off-white/10 ${index % 2 === 0 ? 'bg-fitnix-dark-light/20' : 'bg-fitnix-dark-light/40'}`}>
                        <td className="px-4 py-3 text-fitnix-off-white">{formatDate(record.check_in_time)}</td>
                        <td className="px-4 py-3 text-fitnix-off-white">{formatTime(record.check_in_time)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.direction === 'entry' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500' : 'bg-amber-900/30 text-amber-400 border border-amber-500'}`}>
                            {record.direction === 'entry' ? 'Entry' : 'Exit'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-fitnix-dark text-fitnix-gold border border-fitnix-gold">
                            {record.method.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
