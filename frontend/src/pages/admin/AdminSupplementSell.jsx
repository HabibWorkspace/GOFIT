import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'

export default function AdminSupplementSell() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }
  const [supplements, setSupplements] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchMember, setSearchMember] = useState('')
  const [showMemberSearch, setShowMemberSearch] = useState(false)
  
  const [saleData, setSaleData] = useState({
    supplement_id: '',
    quantity: 1,
    unit_price: '',
    member_id: ''
  })
  
  const [selectedSupplement, setSelectedSupplement] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [profitPreview, setProfitPreview] = useState(0)

  useEffect(() => {
    fetchSupplements()
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

  useEffect(() => {
    calculateProfit()
  }, [saleData.quantity, saleData.unit_price, selectedSupplement])

  const fetchSupplements = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/supplements?active_only=true')
      setSupplements(response.data.supplements || [])
    } catch (err) {
      setError('Failed to load supplements')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const searchMembers = async (query) => {
    if (!query.trim()) {
      setMembers([])
      return
    }
    
    try {
      const response = await apiClient.get(`/admin/members?per_page=10&_t=${Date.now()}`)
      const allMembers = response.data.members || []
      const filtered = allMembers.filter(member => {
        const searchLower = query.toLowerCase()
        return (
          (member.full_name && member.full_name.toLowerCase().includes(searchLower)) ||
          (member.member_number && member.member_number.toString().includes(searchLower)) ||
          (member.phone && member.phone.includes(searchLower))
        )
      })
      setMembers(filtered.slice(0, 10))
    } catch (err) {
      console.error('Failed to search members:', err)
    }
  }

  const handleSupplementChange = (supplementId) => {
    const supplement = supplements.find(s => s.id === supplementId)
    setSelectedSupplement(supplement)
    setSaleData({
      ...saleData,
      supplement_id: supplementId,
      unit_price: supplement ? supplement.selling_price : ''
    })
  }

  const handleMemberSelect = (member) => {
    setSelectedMember(member)
    setSaleData({ ...saleData, member_id: member.id })
    setShowMemberSearch(false)
    setSearchMember('')
    setMembers([])
  }

  const clearMember = () => {
    setSelectedMember(null)
    setSaleData({ ...saleData, member_id: '' })
  }

  const calculateProfit = () => {
    if (!selectedSupplement || !saleData.quantity || !saleData.unit_price) {
      setProfitPreview(0)
      return
    }
    
    const quantity = parseFloat(saleData.quantity) || 0
    const sellingPrice = parseFloat(saleData.unit_price) || 0
    const purchasePrice = parseFloat(selectedSupplement.purchase_price) || 0
    
    const profit = (sellingPrice - purchasePrice) * quantity
    setProfitPreview(profit)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!saleData.supplement_id) {
      setError('Please select a supplement')
      return
    }
    
    if (!saleData.quantity || saleData.quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    
    if (!saleData.unit_price || saleData.unit_price <= 0) {
      setError('Unit price must be greater than 0')
      return
    }
    
    // Check stock availability
    if (selectedSupplement && saleData.quantity > selectedSupplement.current_stock) {
      setError(`Insufficient stock. Available: ${selectedSupplement.current_stock}`)
      return
    }
    
    try {
      const response = await apiClient.post('/supplements/sell', saleData)
      setSuccess('Sale recorded successfully!')
      
      // Reset form
      setSaleData({
        supplement_id: '',
        quantity: 1,
        unit_price: '',
        member_id: ''
      })
      setSelectedSupplement(null)
      setSelectedMember(null)
      setProfitPreview(0)
      
      // Refresh supplements to update stock
      fetchSupplements()
      
      // Show success for 3 seconds then navigate to sales history
      setTimeout(() => {
        navigate('/admin/supplements/sales')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record sale')
    }
  }

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
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
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              Record <span className="fitnix-gradient-text">Sale</span>
            </h1>
            <p className="text-fitnix-off-white/60 mt-2">Sell supplements to members or walk-in customers</p>
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

        {/* Sale Form */}
        <form onSubmit={handleSubmit} className="fitnix-card-glow space-y-6">
          {/* Supplement Selection */}
          <div>
            <label className="block text-fitnix-off-white font-bold mb-3 text-lg">Select Supplement *</label>
            <select
              value={saleData.supplement_id}
              onChange={(e) => handleSupplementChange(e.target.value)}
              className="w-full bg-fitnix-dark-light border-2 border-fitnix-gold/20 text-fitnix-off-white px-4 py-4 rounded-xl focus:outline-none focus:border-fitnix-gold text-lg"
              required
            >
              <option value="">Choose a supplement...</option>
              {supplements.map(supplement => (
                <option key={supplement.id} value={supplement.id}>
                  {supplement.name} {supplement.brand ? `- ${supplement.brand}` : ''} (Stock: {supplement.current_stock})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Supplement Info */}
          {selectedSupplement && (
            <div className="bg-fitnix-dark-light border border-fitnix-gold/30 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-fitnix-off-white/60 text-sm">Available Stock</p>
                  <p className="text-fitnix-gold font-bold text-xl">{selectedSupplement.current_stock} {selectedSupplement.unit}</p>
                </div>
                <div>
                  <p className="text-fitnix-off-white/60 text-sm">Purchase Price</p>
                  <p className="text-fitnix-off-white font-bold text-xl">{formatCurrency(selectedSupplement.purchase_price)}</p>
                </div>
                <div>
                  <p className="text-fitnix-off-white/60 text-sm">Selling Price</p>
                  <p className="text-fitnix-gold font-bold text-xl">{formatCurrency(selectedSupplement.selling_price)}</p>
                </div>
                <div>
                  <p className="text-fitnix-off-white/60 text-sm">Profit Margin</p>
                  <p className="text-green-400 font-bold text-xl">{selectedSupplement.profit_margin}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-fitnix-off-white font-bold mb-3 text-lg">Quantity *</label>
              <input
                type="number"
                min="1"
                max={selectedSupplement ? selectedSupplement.current_stock : undefined}
                value={saleData.quantity}
                onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                className="w-full bg-fitnix-dark-light border-2 border-fitnix-gold/20 text-fitnix-off-white px-4 py-4 rounded-xl focus:outline-none focus:border-fitnix-gold text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-fitnix-off-white font-bold mb-3 text-lg">Unit Price (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={saleData.unit_price}
                onChange={(e) => setSaleData({ ...saleData, unit_price: e.target.value })}
                className="w-full bg-fitnix-dark-light border-2 border-fitnix-gold/20 text-fitnix-off-white px-4 py-4 rounded-xl focus:outline-none focus:border-fitnix-gold text-lg"
                required
              />
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-fitnix-off-white font-bold mb-3 text-lg">Customer (Optional)</label>
            
            {selectedMember ? (
              <div className="bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedMember.profile_picture ? (
                    <img src={selectedMember.profile_picture} alt={selectedMember.full_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-fitnix-gold/20 flex items-center justify-center">
                      <span className="text-fitnix-gold font-bold text-lg">{selectedMember.full_name?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-fitnix-off-white font-bold">{selectedMember.full_name}</p>
                    <p className="text-fitnix-off-white/60 text-sm">ID: {selectedMember.member_number} • {selectedMember.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearMember}
                  className="text-red-400 hover:text-red-300 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search member by name, ID, or phone (or leave empty for walk-in)"
                  value={searchMember}
                  onChange={(e) => {
                    setSearchMember(e.target.value)
                    searchMembers(e.target.value)
                    setShowMemberSearch(true)
                  }}
                  onFocus={() => setShowMemberSearch(true)}
                  className="w-full bg-fitnix-dark-light border-2 border-fitnix-gold/20 text-fitnix-off-white px-4 py-4 rounded-xl focus:outline-none focus:border-fitnix-gold text-lg"
                />
                
                {/* Member Search Results */}
                {showMemberSearch && members.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {members.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleMemberSelect(member)}
                        className="w-full px-4 py-3 hover:bg-fitnix-dark transition-colors text-left flex items-center gap-3 border-b border-fitnix-gold/10 last:border-0"
                      >
                        {member.profile_picture ? (
                          <img src={member.profile_picture} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-fitnix-gold/20 flex items-center justify-center">
                            <span className="text-fitnix-gold font-bold">{member.full_name?.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-fitnix-off-white font-semibold">{member.full_name}</p>
                          <p className="text-fitnix-off-white/60 text-sm">ID: {member.member_number} • {member.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profit Preview */}
          {selectedSupplement && saleData.quantity && saleData.unit_price && (
            <div className="bg-gradient-to-r from-green-900/20 to-green-900/10 border-2 border-green-500/30 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-fitnix-off-white/60 text-sm mb-1">Total Amount</p>
                  <p className="text-fitnix-gold font-bold text-2xl">
                    {formatCurrency(saleData.quantity * saleData.unit_price)}
                  </p>
                </div>
                <div>
                  <p className="text-fitnix-off-white/60 text-sm mb-1">Cost</p>
                  <p className="text-fitnix-off-white font-bold text-2xl">
                    {formatCurrency(saleData.quantity * selectedSupplement.purchase_price)}
                  </p>
                </div>
                <div>
                  <p className="text-fitnix-off-white/60 text-sm mb-1">Profit</p>
                  <p className={`font-bold text-2xl ${profitPreview >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(profitPreview)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!selectedSupplement || !saleData.quantity || !saleData.unit_price}
              className="flex-1 fitnix-button-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Record Sale
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/supplements')}
              className="fitnix-button-secondary text-lg py-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
