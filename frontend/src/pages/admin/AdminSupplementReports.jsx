import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'

export default function AdminSupplementReports() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportData, setReportData] = useState(null)
  
  // Date range
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })
      
      const response = await apiClient.get(`/supplements/reports/profit-loss?${params.toString()}`)
      setReportData(response.data)
    } catch (err) {
      setError('Failed to load report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = () => {
    fetchReport()
  }

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-screen bg-fitnix-dark">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-transparent border-t-fitnix-gold rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/logo.PNG" alt="GOFIT Logo" className="w-14 h-14 object-contain animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-fitnix-gold font-semibold animate-pulse">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/supplements')}
              className="flex items-center text-fitnix-gold hover:text-fitnix-gold-dark mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Inventory
            </button>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fitnix-off-white">
              Supplement <span className="fitnix-gradient-text">Reports</span>
            </h1>
            <p className="text-fitnix-off-white/60 mt-2">Profit & loss analysis</p>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Date Range Selector */}
        <div className="fitnix-card-glow">
          <h3 className="text-fitnix-off-white font-bold mb-4">Report Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-fitnix-off-white/60 text-sm mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
              />
            </div>
            
            <div>
              <label className="block text-fitnix-off-white/60 text-sm mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                className="w-full fitnix-button-primary"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="fitnix-card-glow border-2 border-blue-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-fitnix-off-white/60 text-sm">Total Revenue</p>
                    <p className="text-blue-400 font-bold text-2xl">{formatCurrency(reportData.summary.total_revenue)}</p>
                  </div>
                </div>
              </div>

              <div className="fitnix-card-glow border-2 border-orange-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-fitnix-off-white/60 text-sm">Total Cost</p>
                    <p className="text-orange-400 font-bold text-2xl">{formatCurrency(reportData.summary.total_cost)}</p>
                  </div>
                </div>
              </div>

              <div className="fitnix-card-glow border-2 border-green-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-fitnix-off-white/60 text-sm">Total Profit</p>
                    <p className="text-green-400 font-bold text-2xl">{formatCurrency(reportData.summary.total_profit)}</p>
                  </div>
                </div>
              </div>

              <div className="fitnix-card-glow border-2 border-fitnix-gold/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-fitnix-gold/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-fitnix-off-white/60 text-sm">Profit Margin</p>
                    <p className="text-fitnix-gold font-bold text-2xl">{reportData.summary.profit_margin}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="fitnix-card-glow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-fitnix-gold/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-fitnix-off-white font-bold text-lg">Total Sales</h3>
                </div>
                <p className="text-fitnix-gold font-bold text-3xl">{reportData.summary.total_sales}</p>
                <p className="text-fitnix-off-white/60 text-sm mt-1">transactions in this period</p>
              </div>

              <div className="fitnix-card-glow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-fitnix-gold/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-fitnix-off-white font-bold text-lg">Stock Value</h3>
                </div>
                <p className="text-fitnix-gold font-bold text-3xl">{formatCurrency(reportData.summary.stock_value)}</p>
                <p className="text-fitnix-off-white/60 text-sm mt-1">current inventory value</p>
              </div>
            </div>

            {/* Best Sellers */}
            <div className="fitnix-card-glow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-fitnix-off-white font-bold text-xl">Best Selling Supplements</h3>
                <div className="px-3 py-1 bg-fitnix-gold/20 rounded-full">
                  <span className="text-fitnix-gold text-sm font-bold">Top 10</span>
                </div>
              </div>

              {reportData.best_sellers && reportData.best_sellers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-fitnix-gold/20">
                        <th className="text-left p-3 text-fitnix-off-white/60 font-semibold text-sm">Rank</th>
                        <th className="text-left p-3 text-fitnix-off-white/60 font-semibold text-sm">Supplement</th>
                        <th className="text-center p-3 text-fitnix-off-white/60 font-semibold text-sm">Qty Sold</th>
                        <th className="text-right p-3 text-fitnix-off-white/60 font-semibold text-sm">Revenue</th>
                        <th className="text-right p-3 text-fitnix-off-white/60 font-semibold text-sm">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.best_sellers.map((item, index) => (
                        <tr key={item.id} className="border-b border-fitnix-gold/10 hover:bg-fitnix-dark-light/30 transition-colors">
                          <td className="p-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-400/20 text-gray-400' :
                              index === 2 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-fitnix-gold/20 text-fitnix-gold'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-fitnix-off-white font-semibold">{item.name}</div>
                            <div className="text-fitnix-off-white/60 text-sm">{item.brand || 'N/A'}</div>
                          </td>
                          <td className="p-3 text-center text-fitnix-gold font-bold">{item.quantity_sold}</td>
                          <td className="p-3 text-right text-blue-400 font-semibold">{formatCurrency(item.revenue)}</td>
                          <td className="p-3 text-right text-green-400 font-bold">{formatCurrency(item.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-fitnix-off-white/60">No sales data available for this period</p>
                </div>
              )}
            </div>

            {/* Expiring Soon */}
            {reportData.expiring_soon && reportData.expiring_soon.length > 0 && (
              <div className="fitnix-card-glow border-2 border-yellow-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-yellow-400 font-bold text-xl">Expiring Within 30 Days</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.expiring_soon.map(item => (
                    <div key={item.id} className="bg-fitnix-dark-light border border-yellow-500/30 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-fitnix-off-white font-bold">{item.name}</h4>
                          <p className="text-fitnix-off-white/60 text-sm">{item.brand || 'N/A'}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-400">
                          {item.current_stock} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-yellow-400 font-semibold">Expires: {formatDate(item.expiry_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
