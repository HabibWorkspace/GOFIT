/**
 * Custom React hook for WebSocket connection using Socket.IO
 * Replaces Pusher for real-time notifications
 */

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

// Remove /api suffix from API URL for WebSocket connection
const API_URL = import.meta.env.VITE_API_URL || 'https://web.go-fit.me/api'
const WEBSOCKET_URL = API_URL.replace('/api', '')

export function useWebSocket(options = {}) {
  const {
    onMemberCheckin,
    onBirthdayNotification,
    onSystemAlert,
    autoConnect = true,
    token = null
  } = options

  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  
  // Use refs for callbacks to avoid recreating socket on callback changes
  const onMemberCheckinRef = useRef(onMemberCheckin)
  const onBirthdayNotificationRef = useRef(onBirthdayNotification)
  const onSystemAlertRef = useRef(onSystemAlert)
  
  // Update refs when callbacks change
  useEffect(() => {
    onMemberCheckinRef.current = onMemberCheckin
    onBirthdayNotificationRef.current = onBirthdayNotification
    onSystemAlertRef.current = onSystemAlert
  }, [onMemberCheckin, onBirthdayNotification, onSystemAlert])

  useEffect(() => {
    if (!autoConnect) return

    // Initialize Socket.IO client
    // Use polling only to avoid WebSocket upgrade issues with Cloudflare Tunnel
    const socket = io(WEBSOCKET_URL, {
      transports: ['polling'],  // Use polling only (more reliable through Cloudflare)
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      query: token ? { token } : {},
      path: '/socket.io/'
    })

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
      setError(null)
      
      // Join admin notifications room
      socket.emit('join-admin', {})
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err)
      setError(err.message)
      setIsConnected(false)
    })

    socket.on('connection-status', (data) => {
      console.log('Connection status:', data)
    })

    socket.on('room-joined', (data) => {
      console.log('Joined room:', data)
    })

    // Notification event handlers
    socket.on('member-checkin', (data) => {
      console.log('Member check-in:', data)
      if (onMemberCheckinRef.current) {
        onMemberCheckinRef.current(data)
      }
    })

    socket.on('birthday-notification', (data) => {
      console.log('🎂 Birthday notification received:', data)
      if (onBirthdayNotificationRef.current) {
        onBirthdayNotificationRef.current(data)
      }
    })

    socket.on('system-alert', (data) => {
      console.log('System alert:', data)
      if (onSystemAlertRef.current) {
        onSystemAlertRef.current(data)
      }
    })

    // Cleanup on unmount
    return () => {
      if (socket && socket.connected) {
        socket.emit('leave-admin', {})
        socket.off() // Remove all event listeners
        socket.disconnect()
      }
    }
  }, []) // Empty dependency array - only run once on mount

  // Helper functions
  const requestBirthdays = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request-birthdays')
    }
  }

  const sendPing = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('ping')
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    error,
    requestBirthdays,
    sendPing
  }
}
