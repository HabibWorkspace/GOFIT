/**
 * Birthday Notification Popup Component
 * Shows celebratory popup for members with birthdays today
 * Persists throughout the day until midnight
 * Matches GOFIT gym theme: Dark background with gold accents
 */

import { useState, useEffect } from 'react'
import { X, Cake, Gift, Hash } from 'lucide-react'

export default function BirthdayNotification({ members, onClose }) {
  const [visible, setVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Check if already shown this session using sessionStorage
    const shownThisSession = sessionStorage.getItem('birthday_shown_today')
    const today = new Date().toDateString()
    
    if (shownThisSession === today) {
      // Already shown today in this session, don't show again
      onClose()
      return
    }
    
    // Show the popup
    setTimeout(() => setVisible(true), 100)
    
    // Mark as shown for this session
    sessionStorage.setItem('birthday_shown_today', today)
  }, [onClose])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const nextMember = () => {
    if (currentIndex < members.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevMember = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (!members || members.length === 0) return null

  const member = members[currentIndex]
  const API_URL = import.meta.env.VITE_API_URL || 'https://web.go-fit.me'
  
  // Debug: Log member data
  console.log('BirthdayNotification - Member data:', member)
  console.log('BirthdayNotification - card_id:', member.card_id)
  console.log('BirthdayNotification - member_number:', member.member_number)

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark-darker rounded-2xl shadow-2xl border-2 border-fitnix-gold/30 max-w-sm w-full mx-4 overflow-hidden transform transition-all duration-300 ${
          visible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 0 40px rgba(242, 194, 40, 0.3), 0 0 80px rgba(242, 194, 40, 0.15)'
        }}
      >
        {/* Animated Gold Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
                fontSize: `${12 + Math.random() * 12}px`
              }}
            >
              {i % 4 === 0 ? '⭐' : i % 4 === 1 ? '✨' : i % 4 === 2 ? '🎉' : '🎊'}
            </div>
          ))}
        </div>

        {/* Gradient Mesh Overlay */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-20 pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-fitnix-dark-light/80 hover:bg-fitnix-gold/20 border border-fitnix-gold/30 rounded-full p-2 transition-all duration-200 group"
          title="Close (won't show again today)"
        >
          <X className="w-5 h-5 text-fitnix-gold group-hover:text-fitnix-off-white transition-colors" />
        </button>

        {/* Content */}
        <div className="relative p-6 text-center">
          {/* Header with Gold Accent */}
          <div className="mb-4">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Cake className="w-8 h-8 text-fitnix-gold animate-bounce" />
              <h2 className="text-3xl font-extrabold fitnix-gradient-text">
                Happy Birthday!
              </h2>
              <Gift className="w-8 h-8 text-fitnix-gold animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="flex items-center justify-center gap-2 bg-fitnix-gold/10 border border-fitnix-gold/30 rounded-full px-3 py-1.5 inline-flex">
              <span className="text-xl">🎊</span>
              <p className="text-fitnix-off-white/90 text-xs font-semibold">
                {members.length === 1
                  ? 'Birthday celebration today!'
                  : `${members.length} birthdays today!`}
              </p>
            </div>
          </div>

          {/* Member Card with Dark Theme */}
          <div className="bg-fitnix-dark-light/60 backdrop-blur-lg rounded-xl p-4 mb-4 border border-fitnix-gold/20 shadow-lg">
            {/* Profile Picture with Gold Border */}
            <div className="mb-3">
              {member.profile_picture ? (
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-fitnix-gold/30 blur-xl rounded-full"></div>
                  <img
                    src={`${API_URL}${member.profile_picture}`}
                    alt={member.full_name}
                    className="relative w-24 h-24 rounded-full mx-auto object-cover border-4 border-fitnix-gold shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-fitnix-gold/30 blur-xl rounded-full"></div>
                  <div className="relative w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-fitnix-gold to-fitnix-gold-dark flex items-center justify-center border-4 border-fitnix-gold shadow-2xl">
                    <span className="text-5xl font-extrabold text-fitnix-dark">
                      {member.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Member Info with Gold Accents */}
            <h3 className="text-2xl font-extrabold text-fitnix-off-white mb-2">
              {member.full_name}
            </h3>
            
            <div className="flex items-center justify-center gap-2 mb-3 bg-gradient-to-r from-fitnix-gold/20 to-fitnix-gold-dark/20 border border-fitnix-gold/40 rounded-lg px-3 py-2">
              <Gift className="w-5 h-5 text-fitnix-gold" />
              <p className="text-xl font-bold fitnix-gradient-text">
                Turning {member.age} today!
              </p>
            </div>
            
            {/* Card ID or Member Number */}
            {(member.card_id || member.member_number) && (
              <div className="flex items-center justify-center gap-2 text-fitnix-off-white/70 text-xs">
                <Hash className="w-3 h-3 text-fitnix-gold" />
                <span className="font-medium">
                  {member.card_id ? 'Card ID:' : 'Member #:'}
                </span>
                <span className="text-fitnix-gold font-semibold">
                  {member.card_id || member.member_number}
                </span>
              </div>
            )}
          </div>

          {/* Navigation for Multiple Birthdays */}
          {members.length > 1 && (
            <div className="flex items-center justify-between mb-4 bg-fitnix-dark-light/40 rounded-lg px-3 py-2 border border-fitnix-gold/20">
              <button
                onClick={prevMember}
                disabled={currentIndex === 0}
                className="px-3 py-1.5 bg-fitnix-gold/20 hover:bg-fitnix-gold/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 text-fitnix-gold text-sm font-semibold border border-fitnix-gold/30"
              >
                ← Prev
              </button>
              <span className="text-xs font-bold text-fitnix-off-white">
                {currentIndex + 1} of {members.length}
              </span>
              <button
                onClick={nextMember}
                disabled={currentIndex === members.length - 1}
                className="px-3 py-1.5 bg-fitnix-gold/20 hover:bg-fitnix-gold/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all duration-200 text-fitnix-gold text-sm font-semibold border border-fitnix-gold/30"
              >
                Next →
              </button>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-fitnix-gold to-fitnix-gold-dark hover:from-fitnix-gold-dark hover:to-fitnix-gold text-fitnix-dark font-extrabold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105"
            style={{
              boxShadow: '0 4px 20px rgba(242, 194, 40, 0.4)'
            }}
          >
            Got it! 🎉
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes float-confetti {
          0% {
            transform: translateY(0) rotate(0deg) translateX(0);
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(20px);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(-20px);
            opacity: 0;
          }
        }
        .animate-float-confetti {
          animation: float-confetti linear infinite;
        }
        
        @keyframes gradient-mesh {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .bg-gradient-mesh {
          background: linear-gradient(
            45deg,
            rgba(242, 194, 40, 0.1),
            rgba(242, 194, 40, 0.05),
            rgba(242, 194, 40, 0.1)
          );
          background-size: 200% 200%;
          animation: gradient-mesh 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
