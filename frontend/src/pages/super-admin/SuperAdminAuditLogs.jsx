import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'

// ─── Smart audit details renderer ────────────────────────────────────────────
function AuditDetails({ details, action }) {
  let parsed = details
  if (typeof details === 'string') {
    try { parsed = JSON.parse(details) } catch { parsed = null }
  }
  if (!parsed) return null

  const fmt = (val, key = '') => {
    if (val === null || val === undefined || val === '') return '—'
    if (typeof val === 'boolean') return val ? 'Yes' : 'No'
    // Format ISO dates
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return new Date(val).toLocaleString('en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }
    // Currency fields — only specific keys get Rs. prefix
    const currencyKeys = ['amount', 'admission_fee', 'trainer_fee', 'discount', 'package_price', 'salary_rate', 'total_amount', 'fee']
    if (currencyKeys.includes(key) && val !== '' && !isNaN(Number(val))) {
      return `Rs. ${Number(val).toLocaleString('en-PK')}`
    }
    return String(val)
  }

  const labelMap = {
    member_number: 'Member ID',
    member_name: 'Member Name',
    full_name: 'Full Name',
    amount: 'Amount',
    transaction_type: 'Transaction Type',
    paid_date: 'Paid Date',
    due_date: 'Due Date',
    package_name: 'Package',
    trainer_name: 'Trainer',
    phone: 'Phone',
    email: 'Email',
    username: 'Username',
    role: 'Role',
    is_active: 'Active',
    is_frozen: 'Frozen',
    total_members: 'Total Members',
    filename: 'File',
    status: 'Status',
    discount: 'Discount',
    discount_type: 'Discount Type',
    admission_fee: 'Admission Fee',
    trainer_fee: 'Trainer Fee',
    gender: 'Gender',
    blood_group: 'Blood Group',
    weight_kg: 'Weight (kg)',
    address: 'Address',
    father_name: 'Father Name',
    date_of_birth: 'Date of Birth',
    admission_date: 'Admission Date',
    card_id: 'RFID Card ID',
    cnic: 'CNIC',
  }

  const label = (key) => labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  // ── Case 1: before/after change tracking ──────────────────────────────────
  if (parsed.before !== undefined || parsed.after !== undefined) {
    const before = parsed.before || {}
    const after = parsed.after || {}
    const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    const changed = allKeys.filter(k => String(before[k]) !== String(after[k]))

    return (
      <div className="space-y-2">
        {changed.length === 0 ? (
          <p className="text-xs text-fitnix-off-white/40 italic">No field changes recorded</p>
        ) : (
          changed.map(key => (
            <div key={key} className="grid grid-cols-3 gap-2 text-xs bg-fitnix-dark/40 rounded-lg px-3 py-2">
              <span className="text-fitnix-gold/70 font-semibold">{label(key)}</span>
              <span className="text-red-400 line-through">{fmt(before[key], key)}</span>
              <span className="text-green-400">{fmt(after[key], key)}</span>
            </div>
          ))
        )}
        <div className="grid grid-cols-3 gap-2 text-xs px-3 pt-1">
          <span className="text-fitnix-off-white/30">Field</span>
          <span className="text-fitnix-off-white/30">Before</span>
          <span className="text-fitnix-off-white/30">After</span>
        </div>
      </div>
    )
  }

  // ── Case 2: flat key-value details (payment, member create, etc.) ──────────
  const skip = ['id', 'user_id', 'member_id', 'trainer_id', 'package_id', 'transaction_id', 'transaction_type', 'card_id']
  const entries = Object.entries(parsed).filter(([k]) => !skip.includes(k))

  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-start gap-2 bg-fitnix-dark/40 rounded-lg px-3 py-2 text-xs">
          <span className="text-fitnix-gold/70 font-semibold min-w-[90px] shrink-0">{label(key)}</span>
          <span className="text-fitnix-off-white/80 break-all">{fmt(val, key)}</span>
        </div>
      ))}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    target_type: '',
    start_date: '',
    end_date: '',
  })
  const [expandedLog, setExpandedLog] = useState(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [currentPage, filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        per_page: 20,
        ...filters,
      }
      
      const response = await apiClient.get('/super-admin/audit-logs', { params })
      setLogs(response.data.logs)
      setTotalPages(response.data.pages)
      setError('')
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err.response?.data?.error || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      action: '',
      target_type: '',
      start_date: '',
      end_date: '',
    })
    setCurrentPage(1)
  }

  const getActionIcon = (action) => {
    if (action.includes('created') || action.includes('added')) {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    }
    if (action.includes('updated') || action.includes('edited') || action.includes('modified')) {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    }
    if (action.includes('deleted') || action.includes('removed') || action.includes('deactivated')) {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    }
    if (action.includes('login') || action.includes('logged')) {
      return (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const getActionDescription = (log) => {
    const action = log.action.toLowerCase()
    const target = log.target_type
    
    if (action.includes('created')) return `Created a new ${target}`
    if (action.includes('updated')) return `Updated ${target} information`
    if (action.includes('deleted')) return `Deleted a ${target}`
    if (action.includes('activated')) return `Activated ${target}`
    if (action.includes('deactivated')) return `Deactivated ${target}`
    if (action.includes('payment')) return `Processed payment for ${target}`
    if (action.includes('login')) return `Logged into the system`
    if (action.includes('logout')) return `Logged out of the system`
    
    return log.action
  }

  const getActionColor = (action) => {
    if (action.includes('created') || action.includes('added')) return 'bg-green-900/20 border-green-500/30 text-green-400'
    if (action.includes('updated') || action.includes('edited')) return 'bg-blue-900/20 border-blue-500/30 text-blue-400'
    if (action.includes('deleted') || action.includes('deactivated')) return 'bg-red-900/20 border-red-500/30 text-red-400'
    if (action.includes('login')) return 'bg-purple-900/20 border-purple-500/30 text-purple-400'
    return 'bg-fitnix-gold/20 border-fitnix-gold/30 text-fitnix-gold'
  }

  const getRoleBadgeColor = (role) => {
    if (role === 'super_admin') return 'bg-purple-900/30 text-purple-400 border-purple-500/30'
    if (role === 'admin' || role === 'receptionist') return 'bg-blue-900/30 text-blue-400 border-blue-500/30'
    if (role === 'trainer') return 'bg-green-900/30 text-green-400 border-green-500/30'
    return 'bg-gray-900/30 text-gray-400 border-gray-500/30'
  }

  const formatRoleName = (role) => {
    if (role === 'super_admin') return 'Owner'
    if (role === 'admin') return 'Admin'
    if (role === 'receptionist') return 'Receptionist'
    if (role === 'trainer') return 'Trainer'
    return role
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-fitnix-off-white">Activity History</h1>
          <p className="text-fitnix-off-white/60 mt-1">Monitor all actions performed in your gym management system</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-fitnix-off-white/60">Created</p>
                <p className="text-lg font-bold text-green-400">{logs.filter(l => l.action.includes('created')).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-fitnix-off-white/60">Updated</p>
                <p className="text-lg font-bold text-blue-400">{logs.filter(l => l.action.includes('updated')).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-fitnix-off-white/60">Deleted</p>
                <p className="text-lg font-bold text-red-400">{logs.filter(l => l.action.includes('deleted')).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-fitnix-gold/20 to-fitnix-gold/5 border border-fitnix-gold/20 rounded-xl p-4">
            <div className="flex items-center">
              <div className="p-2 bg-fitnix-gold/30 rounded-lg">
                <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-fitnix-off-white/60">Total Activities</p>
                <p className="text-lg font-bold text-fitnix-gold">{logs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
          <h2 className="text-lg font-bold text-fitnix-off-white mb-4">Filter Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                Search Action
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
                placeholder="e.g., created, updated..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                Category
              </label>
              <select
                value={filters.target_type}
                onChange={(e) => handleFilterChange('target_type', e.target.value)}
                className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
              >
                <option value="">All Categories</option>
                <option value="Member">Members</option>
                <option value="Payment">Payments</option>
                <option value="Trainer">Trainers</option>
                <option value="User">Staff Users</option>
                <option value="Settings">System Settings</option>
                <option value="Attendance">Attendance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fitnix-off-white mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-6 py-2 rounded-lg hover:bg-fitnix-dark transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
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

        {/* Activity Timeline */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-fitnix-gold/20">
            <h2 className="text-xl font-bold text-fitnix-off-white">Recent Activities</h2>
            <p className="text-sm text-fitnix-off-white/60 mt-1">Showing {logs.length} activities on this page</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitnix-gold mx-auto mb-4"></div>
                <p className="text-fitnix-off-white/60">Loading activities...</p>
              </div>
            </div>
          ) : logs.length > 0 ? (
            <div className="p-6 space-y-4">
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className={`border ${getActionColor(log.action)} rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer`}
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-fitnix-off-white">
                            {log.username}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded border ${getRoleBadgeColor(log.user_role)}`}>
                            {formatRoleName(log.user_role)}
                          </span>
                        </div>
                        <span className="text-xs text-fitnix-off-white/60 whitespace-nowrap ml-2">
                          {new Date(log.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-fitnix-off-white mb-2">
                        {getActionDescription(log)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-fitnix-off-white/60">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {log.target_type}
                        </span>
                        {log.ip_address && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                      
                      {expandedLog === log.id && log.details && (
                        <div className="mt-3 pt-3 border-t border-fitnix-gold/10">
                          <p className="text-xs font-semibold text-fitnix-off-white/80 mb-2">Details:</p>
                          <AuditDetails details={log.details} action={log.action} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="w-16 h-16 text-fitnix-off-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-fitnix-off-white/60 text-lg">No activities found</p>
              <p className="text-fitnix-off-white/40 text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-fitnix-dark-light border-t border-fitnix-gold/20 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-fitnix-off-white/60">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white rounded-lg hover:bg-fitnix-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  )
}
