import { useEffect, useState } from 'react'

export default function NotificationPopup({ member, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 transform ${
        isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '600px', width: 'calc(100vw - 2rem)' }}
    >
      <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border-2 border-fitnix-gold rounded-2xl shadow-2xl overflow-hidden">
        {/* Animated gradient border glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-fitnix-gold via-fitnix-gold-dark to-fitnix-gold opacity-20 blur-xl animate-pulse pointer-events-none"></div>
        
        {/* Header with close button */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-fitnix-gold/20 bg-fitnix-dark/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <h3 className="text-lg font-bold text-fitnix-gold uppercase tracking-wide">
              Member Check-In
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-fitnix-off-white/60 hover:text-fitnix-off-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {member.profile_picture ? (
                <img
                  src={member.profile_picture}
                  alt={member.full_name}
                  className="w-32 h-32 rounded-2xl object-cover border-3 border-fitnix-gold shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-fitnix-gold to-fitnix-gold-dark flex items-center justify-center border-3 border-fitnix-gold shadow-2xl">
                  <svg className="w-16 h-16 text-fitnix-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Member Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-3xl font-bold text-fitnix-off-white mb-3 truncate">
                {member.full_name}
              </h4>
              
              <div className="space-y-3">
                {/* Member ID (combined with Card ID) */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-fitnix-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-base text-fitnix-off-white/80">
                    Member ID: <span className="font-semibold text-fitnix-gold text-lg">{member.member_number}</span>
                  </span>
                </div>

                {/* Status Badge */}
                {member.status && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-fitnix-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-base font-bold px-3 py-1 rounded ${
                      member.status === 'active' ? 'bg-green-900/30 text-green-400' :
                      member.status === 'overdue' ? 'bg-red-900/30 text-red-400' :
                      'bg-orange-900/30 text-orange-400'
                    }`}>
                      {member.status === 'active' ? 'ACTIVE' : 
                       member.status === 'overdue' ? 'OVERDUE' : 'INACTIVE'}
                    </span>
                  </div>
                )}

                {/* Package */}
                {member.package_name && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-fitnix-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-base text-fitnix-off-white/80">
                      Package: <span className="font-semibold text-fitnix-gold text-lg">{member.package_name}</span>
                    </span>
                  </div>
                )}

                {/* Days Remaining or Overdue */}
                {member.days_info && member.days_info.days !== undefined && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-fitnix-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-base font-semibold ${
                      member.days_info.type === 'overdue' ? 'text-red-400' :
                      member.days_info.days <= 3 ? 'text-orange-400' :
                      'text-green-400'
                    }`}>
                      {member.days_info.type === 'overdue' 
                        ? `${member.days_info.days} days overdue` 
                        : `${member.days_info.days} days remaining`}
                    </span>
                  </div>
                )}

                {/* Phone */}
                {member.phone && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-fitnix-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-base text-fitnix-off-white/80 truncate">
                      {member.phone}
                    </span>
                  </div>
                )}

                {/* Check-in Time */}
                <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-fitnix-gold/20">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-base text-fitnix-off-white/80">
                    Checked in at <span className="font-semibold text-green-400 text-lg">{formatTime(member.check_in_time)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        <div className="relative h-1 bg-fitnix-dark-light overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-fitnix-gold to-fitnix-gold-dark"
            style={{
              animation: 'shrink 5s linear forwards'
            }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
