import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Profile data
  const [profileData, setProfileData] = useState({
    username: '',
  })
  
  // Password change data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  // System settings
  const [formData, setFormData] = useState({
    admission_fee: 0,
    grace_period_days: 3,
    trainer_commission_percent: 50,
  })

  useEffect(() => {
    fetchSettings()
    fetchProfile()
  }, [])

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setProfileData({
        username: user.username || '',
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/super-admin/settings')
      setSettings(response.data)
      setFormData({
        admission_fee: response.data.admission_fee,
        grace_period_days: response.data.grace_period_days,
        trainer_commission_percent: response.data.trainer_commission_percent,
      })
      setError('')
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err.response?.data?.error || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await apiClient.put('/super-admin/update-credentials', {
        new_username: profileData.username,
      })
      
      // Update local storage with new username
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.username = profileData.username
      localStorage.setItem('user', JSON.stringify(user))
      
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setSaving(true)

    try {
      await apiClient.put('/super-admin/update-credentials', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      })
      setSuccess('Password changed successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleSystemSettingsUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await apiClient.put('/super-admin/settings', formData)
      setSuccess('System settings updated successfully')
      fetchSettings()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings')
    } finally {
      setSaving(false)
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

  const tabs = [
    { id: 'profile', name: 'Profile & Security', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'password', name: 'Change Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'system', name: 'System Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fitnix-off-white">
            Settings <span className="fitnix-gradient-text">& Configuration</span>
          </h1>
          <p className="text-fitnix-off-white/60 mt-2">
            Manage your profile, security, and system preferences
          </p>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-fitnix-off-white px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-fitnix-dark-light border border-fitnix-gold text-fitnix-off-white px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-fitnix-off-white/20 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 font-semibold transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-fitnix-gold'
                    : 'text-fitnix-off-white/60 hover:text-fitnix-off-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.name}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fitnix-gold"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="fitnix-card-glow">
          {/* Profile & Security Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-fitnix-off-white mb-4 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-fitnix-gold to-fitnix-gold-dark rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-fitnix-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Admin Profile Information
                </h2>
                <p className="text-fitnix-off-white/60 mb-6">Update your admin profile and security settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="fitnix-input"
                    placeholder="Enter admin username"
                    required
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">This will be your login username</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-fitnix-off-white/10">
                <div className="flex items-center space-x-2 text-fitnix-off-white/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Role: Owner</span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark font-semibold py-2 px-8 rounded-lg transition-all shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Information'}
                </button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-fitnix-off-white mb-4 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Change Password
                </h2>
                <p className="text-fitnix-off-white/60 mb-6">Update your password to keep your account secure</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="fitnix-input"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="fitnix-input"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="fitnix-input"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="bg-cyan-600/10 border border-cyan-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-fitnix-off-white/80">
                    <p className="font-semibold text-cyan-400 mb-1">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Minimum 6 characters long</li>
                      <li>Use a mix of letters, numbers, and symbols for better security</li>
                      <li>Avoid using common words or personal information</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-fitnix-off-white/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-8 rounded-lg transition-all shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <form onSubmit={handleSystemSettingsUpdate} className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-fitnix-off-white mb-4 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  System Configuration
                </h2>
                <p className="text-fitnix-off-white/60 mb-6">Configure gym-wide settings and preferences</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Admission Fee (Rs.)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter admission fee"
                    value={formData.admission_fee || 0}
                    onChange={(e) => setFormData({ ...formData, admission_fee: parseFloat(e.target.value) || 0 })}
                    className="fitnix-input"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">One-time fee charged when a new member joins</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter grace period"
                    value={formData.grace_period_days}
                    onChange={(e) => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) })}
                    className="fitnix-input"
                    min="0"
                    max="30"
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">Days before marking payment as overdue</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Default Trainer Commission (%)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter trainer commission percentage"
                    value={formData.trainer_commission_percent}
                    onChange={(e) => setFormData({ ...formData, trainer_commission_percent: parseInt(e.target.value) })}
                    className="fitnix-input"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">Default commission split for trainers</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-fitnix-off-white/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-8 rounded-lg transition-all shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Active Packages */}
        {activeTab === 'system' && settings?.active_packages && (
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-fitnix-off-white mb-6">Active Packages</h2>
            
            {settings.active_packages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.active_packages.map((pkg) => (
                  <div key={pkg.id} className="bg-fitnix-dark-light/50 border border-fitnix-gold/10 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-fitnix-gold">{pkg.name}</h3>
                    <p className="text-sm text-fitnix-off-white/60 mt-1">
                      {pkg.duration_days} days
                    </p>
                    <p className="text-xl font-bold text-fitnix-off-white mt-2">
                      Rs. {pkg.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-fitnix-off-white/60 text-center py-8">
                No active packages found
              </p>
            )}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
