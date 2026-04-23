import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'

export default function AdminSupplementSales() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSales, setTotalSales] = useState(0)
  const [summary, setSummary] = useState({ total_revenue: 0, total_profit: 0 })
  
  // Filters
  const [filters, setFilters] = useState({
    supplement_id: '',
    member_id: '',
    start_date: '',
    end_date: ''
  })
  
  const [supplements, setSupplements] = useState([])

  useEffect(() => {
    fetchSales()
    fetchSupplements()
  }, [currentPage])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 30,
        ...filters
      })
      
      const response = await apiClient.get(`/supplements/sales?${params.toString()}`)
      setSales(response.data.sales || [])
      setTotalPages(response.data.pages || 1)
      setTotalSales(response.data.total || 0)
      setSummary(response.data.summary || { total_revenue: 0, total_profit: 0 })
    } catch (err) {
      setError('Failed to load sales history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplements = async () => {
    try {
      const response = await apiClient.get('/supplements')
      setSupplements(response.data.supplements || [])
    } catch (err) {
      console.error('Failed to load supplements:', err)
    }
  }

  const handleFilter = () => {
    setCurrentPage(1)
    fetchSales()
  }

  const clearFilters = () => {
    setFilters({
      supplement_id: '',
      member_id: '',
      start_date: '',
      end_date: ''
    })
    setCurrentPage(1)
    setTimeout(() => fetchSales(), 100)
  }

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && sales.length === 0) {
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
              Sales <span className="fitnix-gradient-text">History</span>
            </h1>
            <p className="text-fitnix-off-white/60 mt-2">View all supplement sales transactions</p>
          </div>
          
          <button
            onClick={() => navigate('/admin/supplements/sell')}
            className="fitnix-button-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Sale</span>
          </button>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="fitnix-card-glow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-fitnix-gold/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Total Sales</p>
                <p className="text-fitnix-gold font-bold text-2xl">{totalSales}</p>
              </div>
            </div>
          </div>

          <div className="fitnix-card-glow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Total Revenue</p>
                <p className="text-blue-400 font-bold text-2xl">{formatCurrency(summary.total_revenue)}</p>
              </div>
            </div>
          </div>

          <div className="fitnix-card-glow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-fitnix-off-white/60 text-sm">Total Profit</p>
                <p className="text-green-400 font-bold text-2xl">{formatCurrency(summary.total_profit)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="fitnix-card-glow">
          <h3 className="text-fitnix-off-white font-bold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.supplement_id}
              onChange={(e) => setFilters({ ...filters, supplement_id: e.target.value })}
              className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
            >
              <option value="">All Supplements</option>
              {supplements.map(supplement => (
                <option key={supplement.id} value={supplement.id}>
                  {supplement.name} {supplement.brand ? `- ${supplement.brand}` : ''}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              placeholder="Start Date"
              className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              placeholder="End Date"
              className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
            />

            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="flex-1 fitnix-button-primary"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="fitnix-button-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="fitnix-card-glow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-fitnix-gold/20">
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Date & Time</th>
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Supplement</th>
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Customer</th>
                  <th className="text-center p-4 text-fitnix-off-white font-bold">Qty</th>
                  <th className="text-right p-4 text-fitnix-off-white font-bold">Unit Price</th>
                  <th className="text-right p-4 text-fitnix-off-white font-bold">Total</th>
                  <th className="text-right p-4 text-fitnix-off-white font-bold">Profit</th>
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Sold By</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-24 h-24 bg-fitnix-dark-light rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-fitnix-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-fitnix-off-white/60 text-xl font-semibold">No sales found</p>
                        <button
                          onClick={() => navigate('/admin/supplements/sell')}
                          className="fitnix-button-primary"
                        >
                          Record Your First Sale
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="border-b border-fitnix-gold/10 hover:bg-fitnix-dark-light/30 transition-colors">
                      <td className="p-4 text-fitnix-off-white text-sm">{formatDate(sale.sold_at)}</td>
                      <td className="p-4">
                        <div className="text-fitnix-off-white font-semibold">{sale.supplement_name}</div>
                        <div className="text-fitnix-off-white/60 text-sm">{sale.supplement_brand || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        {sale.member_name ? (
                          <div>
                            <div className="text-fitnix-off-white font-semibold">{sale.member_name}</div>
                            <div className="text-fitnix-off-white/60 text-sm">ID: {sale.member_number}</div>
                          </div>
                        ) : (
                          <span className="text-fitnix-off-white/60 italic">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-fitnix-gold font-bold">{sale.quantity}</td>
                      <td className="p-4 text-right text-fitnix-off-white">{formatCurrency(sale.unit_price)}</td>
                      <td className="p-4 text-right text-fitnix-gold font-bold">{formatCurrency(sale.total_amount)}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${sale.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(sale.profit)}
                        </span>
                      </td>
                      <td className="p-4 text-fitnix-off-white text-sm">{sale.sold_by_username}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-fitnix-gold/20">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="fitnix-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-fitnix-off-white">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="fitnix-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
