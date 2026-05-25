import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      })

      const { access_token, user } = response.data
      
      // Debug logging
      console.log('Login response:', { access_token, user })
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Verify storage
      console.log('Token stored:', localStorage.getItem('token'))
      console.log('User stored:', localStorage.getItem('user'))

      const userRole = user.role?.toLowerCase()
      console.log('User role:', userRole)

      if (userRole === 'super_admin') {
        navigate('/super-admin')
      } else if (userRole === 'admin' || userRole === 'receptionist') {
        navigate('/admin')
      } else if (userRole === 'scanner') {
        navigate('/scanner')
      } else if (userRole === 'trainer') {
        navigate('/trainer')
      } else if (userRole === 'member') {
        navigate('/member/profile')
      } else {
        setError('Unknown user role')
      }
    } catch (err) {
      if (!err.response) {
        if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
          setError('Connection timeout. Please check your internet connection.')
        } else if (err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
          setError('Unable to connect to server. Please try again.')
        } else {
          setError('Connection failed. Please try again.')
        }
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Login failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo-optimized.png" 
            alt="GOFIT" 
            className="w-32 h-32 object-contain" 
            loading="eager"
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-center mb-2 text-yellow-400">
          GOFIT
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm font-semibold tracking-widest">
          ACTIVE LIFESTYLE
        </p>

        {/* Login Card */}
        <div className="bg-gray-800/90 border border-yellow-400/30 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <span className="text-sm text-white">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-300 font-semibold mb-2 text-sm">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2 text-sm">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-yellow-400"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 GOFIT. All rights reserved.
        </p>
      </div>
    </div>
  )
}
