import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'

export default function AdminSupplements() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }
  const [supplements, setSupplements] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [alerts, setAlerts] = useState({ low_stock: 0, expired: 0, expiring_soon: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Modals
  const [showForm, setShowForm] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingSupplement, setEditingSupplement] = useState(null)
  const [restockingSupplement, setRestockingSupplement] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    supplier_id: '',
    purchase_price: '',
    selling_price: '',
    current_stock: 0,
    low_stock_threshold: 5,
    unit: 'unit',
    expiry_date: '',
    description: ''
  })
  
  const [restockData, setRestockData] = useState({
    quantity: '',
    purchase_price: '',
    supplier_id: '',
    expiry_date: '',
    notes: ''
  })
  
  const [supplierData, setSupplierData] = useState({
    name: '',
    contact: '',
    address: ''
  })

  useEffect(() => {
    fetchSupplements()
    fetchSuppliers()
    fetchCategories()
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

  const fetchSupplements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (categoryFilter) params.append('category', categoryFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await apiClient.get(`/supplements?${params.toString()}`)
      setSupplements(response.data.supplements || [])
      setAlerts(response.data.alerts || { low_stock: 0, expired: 0, expiring_soon: 0 })
    } catch (err) {
      setError('Failed to load supplements')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/supplements/suppliers')
      setSuppliers(response.data.suppliers || [])
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/supplements/categories')
      setCategories(response.data.categories || [])
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.name || !formData.purchase_price || !formData.selling_price) {
      setError('Name, purchase price, and selling price are required')
      return
    }
    
    try {
      if (editingSupplement) {
        await apiClient.put(`/supplements/${editingSupplement.id}`, formData)
        setSuccess('Supplement updated successfully')
      } else {
        await apiClient.post('/supplements', formData)
        setSuccess('Supplement created successfully')
      }
      
      resetForm()
      setShowForm(false)
      fetchSupplements()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save supplement')
    }
  }

  const handleRestock = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!restockData.quantity || restockData.quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    
    try {
      await apiClient.post(`/supplements/${restockingSupplement.id}/restock`, restockData)
      setSuccess(`Successfully restocked ${restockingSupplement.name}`)
      setShowRestockModal(false)
      setRestockingSupplement(null)
      resetRestockForm()
      fetchSupplements()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restock supplement')
    }
  }

  const handleDelete = async (supplement) => {
    if (!window.confirm(`Are you sure you want to delete ${supplement.name}?`)) return
    
    try {
      await apiClient.delete(`/supplements/${supplement.id}`)
      setSuccess('Supplement deleted successfully')
      fetchSupplements()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete supplement')
    }
  }

  const handleEdit = (supplement) => {
    setEditingSupplement(supplement)
    setFormData({
      name: supplement.name || '',
      brand: supplement.brand || '',
      category: supplement.category || '',
      supplier_id: supplement.supplier_id || '',
      purchase_price: supplement.purchase_price || '',
      selling_price: supplement.selling_price || '',
      current_stock: supplement.current_stock || 0,
      low_stock_threshold: supplement.low_stock_threshold || 5,
      unit: supplement.unit || 'unit',
      expiry_date: supplement.expiry_date || '',
      description: supplement.description || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openRestockModal = (supplement) => {
    setRestockingSupplement(supplement)
    setRestockData({
      quantity: '',
      purchase_price: supplement.purchase_price,
      supplier_id: supplement.supplier_id || '',
      expiry_date: '',
      notes: ''
    })
    setShowRestockModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: '',
      supplier_id: '',
      purchase_price: '',
      selling_price: '',
      current_stock: 0,
      low_stock_threshold: 5,
      unit: 'unit',
      expiry_date: '',
      description: ''
    })
    setEditingSupplement(null)
  }

  const resetRestockForm = () => {
    setRestockData({
      quantity: '',
      purchase_price: '',
      supplier_id: '',
      expiry_date: '',
      notes: ''
    })
  }

  const handleCreateSupplier = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!supplierData.name) {
      setError('Supplier name is required')
      return
    }
    
    try {
      await apiClient.post('/supplements/suppliers', supplierData)
      setSuccess('Supplier created successfully')
      setShowSupplierModal(false)
      setSupplierData({ name: '', contact: '', address: '' })
      fetchSuppliers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create supplier')
    }
  }

  const getStatusBadge = (supplement) => {
    const status = supplement.status
    
    if (status === 'expired') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-900/30 text-red-400 border border-red-500/30">EXPIRED</span>
    } else if (status === 'low_stock') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-900/30 text-orange-400 border border-orange-500/30">LOW STOCK</span>
    } else if (status === 'expiring_soon') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-500/30">EXPIRING SOON</span>
    } else {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-900/30 text-green-400 border border-green-500/30">GOOD</span>
    }
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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fitnix-off-white">
              Supplement <span className="fitnix-gradient-text">Inventory</span>
            </h1>
            <p className="text-fitnix-off-white/60 mt-2">Manage supplement stock and sales</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/supplements/sell')}
              className="fitnix-button-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Record Sale</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="fitnix-button-secondary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Supplement</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
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

        {/* Alert Banner */}
        {(alerts.expired > 0 || alerts.low_stock > 0 || alerts.expiring_soon > 0) && (
          <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-400 font-bold mb-2">Inventory Alerts</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  {alerts.expired > 0 && (
                    <span className="text-fitnix-off-white">
                      <span className="font-bold text-red-400">{alerts.expired}</span> expired items
                    </span>
                  )}
                  {alerts.low_stock > 0 && (
                    <span className="text-fitnix-off-white">
                      <span className="font-bold text-orange-400">{alerts.low_stock}</span> low stock items
                    </span>
                  )}
                  {alerts.expiring_soon > 0 && (
                    <span className="text-fitnix-off-white">
                      <span className="font-bold text-yellow-400">{alerts.expiring_soon}</span> expiring within 30 days
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchSupplements()}
            className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
          >
            <option value="">All Status</option>
            <option value="good">Good</option>
            <option value="low_stock">Low Stock</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          
          <button
            onClick={fetchSupplements}
            className="fitnix-button-secondary"
          >
            Apply Filters
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/supplements/sales')}
            className="fitnix-card-glow p-4 text-left hover:border-fitnix-gold/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-fitnix-gold/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-fitnix-off-white font-bold">Sales History</h3>
                <p className="text-fitnix-off-white/60 text-sm">View all sales</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/admin/supplements/reports')}
            className="fitnix-card-glow p-4 text-left hover:border-fitnix-gold/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-fitnix-gold/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-fitnix-off-white font-bold">Reports</h3>
                <p className="text-fitnix-off-white/60 text-sm">Profit & analytics</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setShowSupplierModal(true)}
            className="fitnix-card-glow p-4 text-left hover:border-fitnix-gold/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-fitnix-gold/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-fitnix-off-white font-bold">Suppliers</h3>
                <p className="text-fitnix-off-white/60 text-sm">Manage suppliers</p>
              </div>
            </div>
          </button>
        </div>

        {/* Supplements Table */}
        <div className="fitnix-card-glow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-fitnix-gold/20">
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Name</th>
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Brand</th>
                  <th className="text-left p-4 text-fitnix-off-white font-bold">Category</th>
                  <th className="text-center p-4 text-fitnix-off-white font-bold">Stock</th>
                  <th className="text-right p-4 text-fitnix-off-white font-bold">Purchase</th>
                  <th className="text-right p-4 text-fitnix-off-white font-bold">Selling</th>
                  <th className="text-center p-4 text-fitnix-off-white font-bold">Expiry</th>
                  <th className="text-center p-4 text-fitnix-off-white font-bold">Status</th>
                  <th className="text-center p-4 text-fitnix-off-white font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {supplements.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-24 h-24 bg-fitnix-dark-light rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-fitnix-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-fitnix-off-white/60 text-xl font-semibold">No supplements found</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="fitnix-button-primary"
                        >
                          Add Your First Supplement
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  supplements.map(supplement => (
                    <tr key={supplement.id} className="border-b border-fitnix-gold/10 hover:bg-fitnix-dark-light/30 transition-colors">
                      <td className="p-4">
                        <div className="text-fitnix-off-white font-semibold">{supplement.name}</div>
                        <div className="text-fitnix-off-white/60 text-sm">{supplement.unit}</div>
                      </td>
                      <td className="p-4 text-fitnix-off-white">{supplement.brand || 'N/A'}</td>
                      <td className="p-4 text-fitnix-off-white">{supplement.category || 'N/A'}</td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${supplement.current_stock <= supplement.low_stock_threshold ? 'text-orange-400' : 'text-fitnix-gold'}`}>
                          {supplement.current_stock}
                        </span>
                        <span className="text-fitnix-off-white/60 text-sm"> / {supplement.low_stock_threshold}</span>
                      </td>
                      <td className="p-4 text-right text-fitnix-off-white">{formatCurrency(supplement.purchase_price)}</td>
                      <td className="p-4 text-right text-fitnix-gold font-bold">{formatCurrency(supplement.selling_price)}</td>
                      <td className="p-4 text-center text-fitnix-off-white text-sm">{formatDate(supplement.expiry_date)}</td>
                      <td className="p-4 text-center">{getStatusBadge(supplement)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openRestockModal(supplement)}
                            className="p-2 bg-fitnix-gold/20 hover:bg-fitnix-gold/30 text-fitnix-gold rounded-lg transition-colors"
                            title="Restock"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(supplement)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(supplement)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-fitnix-off-white">
                  {editingSupplement ? 'Edit Supplement' : 'Add New Supplement'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="text-fitnix-off-white/60 hover:text-fitnix-off-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Protein, Creatine, Vitamins"
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Supplier</label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Purchase Price (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Selling Price (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Current Stock</label>
                    <input
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Low Stock Threshold</label>
                    <input
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 5 })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g. kg, bottle, sachet"
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-fitnix-off-white font-semibold mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 fitnix-button-primary"
                  >
                    {editingSupplement ? 'Update Supplement' : 'Add Supplement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    className="flex-1 fitnix-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && restockingSupplement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-fitnix-off-white">
                  Restock {restockingSupplement.name}
                </h2>
                <button
                  onClick={() => {
                    setShowRestockModal(false)
                    setRestockingSupplement(null)
                    resetRestockForm()
                  }}
                  className="text-fitnix-off-white/60 hover:text-fitnix-off-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRestock} className="space-y-4">
                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={restockData.quantity}
                    onChange={(e) => setRestockData({ ...restockData, quantity: e.target.value })}
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Purchase Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={restockData.purchase_price}
                    onChange={(e) => setRestockData({ ...restockData, purchase_price: e.target.value })}
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  />
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Supplier</label>
                  <select
                    value={restockData.supplier_id}
                    onChange={(e) => setRestockData({ ...restockData, supplier_id: e.target.value })}
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={restockData.expiry_date}
                    onChange={(e) => setRestockData({ ...restockData, expiry_date: e.target.value })}
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  />
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Notes</label>
                  <textarea
                    value={restockData.notes}
                    onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                    rows="3"
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 fitnix-button-primary">
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestockModal(false)
                      setRestockingSupplement(null)
                      resetRestockForm()
                    }}
                    className="flex-1 fitnix-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-fitnix-off-white">Add New Supplier</h2>
                <button
                  onClick={() => {
                    setShowSupplierModal(false)
                    setSupplierData({ name: '', contact: '', address: '' })
                  }}
                  className="text-fitnix-off-white/60 hover:text-fitnix-off-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Supplier Name *</label>
                  <input
                    type="text"
                    value={supplierData.name}
                    onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Contact</label>
                  <input
                    type="text"
                    value={supplierData.contact}
                    onChange={(e) => setSupplierData({ ...supplierData, contact: e.target.value })}
                    placeholder="Phone or email"
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  />
                </div>

                <div>
                  <label className="block text-fitnix-off-white font-semibold mb-2">Address</label>
                  <textarea
                    value={supplierData.address}
                    onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                    rows="3"
                    className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 fitnix-button-primary">
                    Add Supplier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSupplierModal(false)
                      setSupplierData({ name: '', contact: '', address: '' })
                    }}
                    className="flex-1 fitnix-button-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
