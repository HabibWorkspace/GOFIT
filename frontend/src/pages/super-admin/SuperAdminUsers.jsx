import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/super-admin/users')
      setUsers(response.data.users)
      setError('')
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.response?.data?.error || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    
    try {
      await apiClient.post('/super-admin/users', formData)
      setSuccess('Receptionist created successfully!')
      setShowAddModal(false)
      setFormData({ username: '', password: '', full_name: '' })
      fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create receptionist')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleToggleActive = async (userId) => {
    try {
      await apiClient.post(`/super-admin/users/${userId}/toggle-active`)
      setSuccess('User status updated successfully!')
      fetchUsers()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status')
      setTimeout(() => setError(''), 3000)
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

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fitnix-off-white">User Management</h1>
            <p className="text-fitnix-off-white/60 mt-1">Manage receptionist accounts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-6 py-3 rounded-lg font-semibold transition-all flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Receptionist
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-fitnix-dark-light border-b border-fitnix-gold/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fitnix-gold/10">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-fitnix-dark-light/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fitnix-gold to-fitnix-gold-dark flex items-center justify-center">
                            <span className="text-fitnix-dark font-bold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-fitnix-off-white">
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-400">
                          {user.role === 'admin' ? 'Receptionist' : user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-fitnix-off-white/60">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`${
                            user.is_active
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-green-400 hover:text-green-300'
                          } transition-colors`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-fitnix-off-white/60">
                      No receptionists found. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-fitnix-off-white">Add Receptionist</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-fitnix-off-white/60 hover:text-fitnix-off-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
                  placeholder="Enter password (min 6 characters)"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
                  placeholder="Enter full name (optional)"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg hover:bg-fitnix-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}
