import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'

export default function SuperAdminMembersReport() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overdue')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get(`/super-admin/members-report?_t=${Date.now()}`)
      setData(res.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleDateString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const formatCurrency = (amount) =>
    `Rs. ${Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`

  const filteredOverdue = (data?.overdue_payments || []).filter(m =>
    !search ||
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    String(m.member_number).includes(search) ||
    m.phone.includes(search)
  )

  const filteredInactive = (data?.inactive_members || []).filter(m =>
    !search ||
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    String(m.member_number).includes(search) ||
    m.phone.includes(search)
  )

  const getBadgeColor = (days) => {
    if (days >= 30) return 'bg-red-900/40 text-red-400 border border-red-500/30'
    if (days >= 14) return 'bg-orange-900/40 text-orange-400 border border-orange-500/30'
    return 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30'
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-transparent border-t-fitnix-gold rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/logo.PNG" alt="GOFIT" className="w-10 h-10 object-contain animate-pulse"
                style={{ filter: 'drop-shadow(0 0 8px rgba(242,194,40,0.3))', mixBlendMode: 'screen' }} />
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    )
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-fitnix-off-white">
              Members <span className="text-fitnix-gold">Report</span>
            </h1>
            <p className="text-fitnix-off-white/50 mt-1 text-sm">
              Overdue payments and inactive member tracking
            </p>
          </div>
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-4 py-2 bg-fitnix-gold/10 border border-fitnix-gold/30 text-fitnix-gold rounded-lg hover:bg-fitnix-gold/20 transition-all text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 border border-red-500/20 rounded-xl p-5">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">Overdue Members</p>
              <p className="text-3xl font-extrabold text-fitnix-off-white">{data.summary.overdue_count}</p>
              <p className="text-red-400/70 text-xs mt-1">members with pending dues</p>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/20 rounded-xl p-5">
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Overdue Amount</p>
              <p className="text-3xl font-extrabold text-fitnix-off-white">{formatCurrency(data.summary.overdue_total_amount)}</p>
              <p className="text-orange-400/70 text-xs mt-1">total outstanding dues</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border border-yellow-500/20 rounded-xl p-5">
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-1">Inactive Members</p>
              <p className="text-3xl font-extrabold text-fitnix-off-white">{data.summary.inactive_count}</p>
              <p className="text-yellow-400/70 text-xs mt-1">no check-in in 10+ days</p>
            </div>
          </div>
        )}

        {/* Tabs + Search */}
        <div className="bg-fitnix-dark-light border border-fitnix-gold/10 rounded-xl p-1 flex gap-1 w-fit">
          <button
            onClick={() => { setActiveTab('overdue'); setSearch('') }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'overdue'
                ? 'bg-fitnix-gold text-fitnix-dark'
                : 'text-fitnix-off-white/60 hover:text-fitnix-off-white'
            }`}
          >
            Overdue Payments
            {data && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'overdue' ? 'bg-fitnix-dark/30 text-fitnix-dark' : 'bg-red-900/40 text-red-400'
              }`}>
                {data.summary.overdue_count}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('inactive'); setSearch('') }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'inactive'
                ? 'bg-fitnix-gold text-fitnix-dark'
                : 'text-fitnix-off-white/60 hover:text-fitnix-off-white'
            }`}
          >
            Inactive Members
            {data && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'inactive' ? 'bg-fitnix-dark/30 text-fitnix-dark' : 'bg-yellow-900/40 text-yellow-400'
              }`}>
                {data.summary.inactive_count}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fitnix-off-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, ID or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="fitnix-input pl-9 text-sm"
          />
        </div>

        {/* ── OVERDUE PAYMENTS TABLE ── */}
        {activeTab === 'overdue' && (
          <div className="bg-fitnix-dark-light border border-fitnix-gold/10 rounded-xl overflow-hidden">
            {filteredOverdue.length === 0 ? (
              <div className="text-center py-16 text-fitnix-off-white/40">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">No overdue payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-fitnix-gold/10 bg-fitnix-dark/50">
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Member</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Package</th>
                      <th className="text-right px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Amount Due</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Due Date</th>
                      <th className="text-center px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Days Overdue</th>
                      <th className="text-center px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fitnix-gold/5">
                    {filteredOverdue.map((m) => (
                      <tr key={m.transaction_id} className="hover:bg-fitnix-gold/5 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-fitnix-off-white">{m.full_name}</p>
                            <p className="text-fitnix-off-white/40 text-xs">#{m.member_number}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{m.phone}</td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{m.package_name}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-400">{formatCurrency(m.amount)}</td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{formatDate(m.due_date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getBadgeColor(m.days_overdue)}`}>
                            {m.days_overdue}d
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigate(`/admin/members/${m.member_id}`)}
                            className="text-fitnix-gold hover:text-fitnix-gold-dark text-xs font-semibold underline underline-offset-2 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── INACTIVE MEMBERS TABLE ── */}
        {activeTab === 'inactive' && (
          <div className="bg-fitnix-dark-light border border-fitnix-gold/10 rounded-xl overflow-hidden">
            {filteredInactive.length === 0 ? (
              <div className="text-center py-16 text-fitnix-off-white/40">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">No inactive members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-fitnix-gold/10 bg-fitnix-dark/50">
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Member</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Package</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Package Expiry</th>
                      <th className="text-left px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Last Check-in</th>
                      <th className="text-center px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Days Inactive</th>
                      <th className="text-center px-4 py-3 text-fitnix-gold/70 font-semibold text-xs uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fitnix-gold/5">
                    {filteredInactive.map((m) => (
                      <tr key={m.member_id} className="hover:bg-fitnix-gold/5 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-fitnix-off-white">{m.full_name}</p>
                            <p className="text-fitnix-off-white/40 text-xs">#{m.member_number}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{m.phone}</td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{m.package_name}</td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{formatDate(m.package_expiry_date)}</td>
                        <td className="px-4 py-3 text-fitnix-off-white/70">{formatDate(m.last_checkin)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getBadgeColor(m.days_inactive || 0)}`}>
                            {m.days_inactive ?? '?'}d
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigate(`/admin/members/${m.member_id}`)}
                            className="text-fitnix-gold hover:text-fitnix-gold-dark text-xs font-semibold underline underline-offset-2 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </SuperAdminLayout>
  )
}
