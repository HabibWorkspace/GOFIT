import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'

export default function AdminFinanceOptimized() {
  const navigate = useNavigate()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Overdue members data
  const [overdueMembers, setOverdueMembers] = useState([])
  const [graceMembers, setGraceMembers] = useState([])
  const [overdueTotal, setOverdueTotal] = useState(0)
  
  // Monthly summary data
  const [monthlySummary, setMonthlySummary] = useState([])
  const [expandedMonths, setExpandedMonths] = useState({})
  const [monthTransactions, setMonthTransactions] = useState({})
  const [loadingMonth, setLoadingMonth] = useState(null)
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  
  // Export modal
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportMonth, setExportMonth] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  
  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  useEffect(() => {
    fetchInitialData()
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

  // Fetch initial data (overdue + monthly summary only)
  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      const [overdueRes, summaryRes] = await Promise.all([
        apiClient.get('/admin/finance/overdue-members'),
        apiClient.get('/admin/finance/monthly-summary?months=3')
      ])
      
      setOverdueMembers(overdueRes.data.overdue_members || [])
      setGraceMembers(overdueRes.data.grace_members || [])
      setOverdueTotal(overdueRes.data.total_amount || 0)
      setMonthlySummary(summaryRes.data.monthly_summary || [])
      
      // Auto-expand current month
      if (summaryRes.data.monthly_summary && summaryRes.data.monthly_summary.length > 0) {
        const currentMonth = summaryRes.data.monthly_summary[0].month
        setExpandedMonths({ [currentMonth]: true })
        fetchMonthTransactions(currentMonth)
      }
      
      setError('')
    } catch (err) {
      console.error('Error fetching finance data:', err)
      setError(err.response?.data?.error || 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch transactions for a specific month (lazy loading)
  const fetchMonthTransactions = async (month) => {
    if (monthTransactions[month]) return // Already loaded
    
    try {
      setLoadingMonth(month)
      const response = await apiClient.get(`/admin/finance/transactions-by-month?month=${month}`)
      
      setMonthTransactions(prev => ({
        ...prev,
        [month]: response.data.transactions || []
      }))
    } catch (err) {
      console.error(`Error fetching transactions for ${month}:`, err)
      setError(`Failed to load transactions for ${month}`)
    } finally {
      setLoadingMonth(null)
    }
  }

  // Toggle month expansion
  const toggleMonth = (month) => {
    const isExpanding = !expandedMonths[month]
    
    setExpandedMonths(prev => ({
      ...prev,
      [month]: isExpanding
    }))
    
    if (isExpanding && !monthTransactions[month]) {
      fetchMonthTransactions(month)
    }
  }

  // Mark payment as paid
  const handleMarkAsPaid = async (transactionId, memberName) => {
    // Show custom confirmation modal instead of browser alert
    setConfirmMessage(`Mark payment as received for ${memberName}?`)
    setConfirmAction(() => async () => {
      try {
        await apiClient.post(`/admin/finance/transactions/${transactionId}/mark-paid`)
        setSuccess(`Payment marked as received for ${memberName}`)
        
        // Refresh data
        fetchInitialData()
        
        // Refresh expanded months
        Object.keys(expandedMonths).forEach(month => {
          if (expandedMonths[month]) {
            setMonthTransactions(prev => {
              const updated = { ...prev }
              delete updated[month]
              return updated
            })
            fetchMonthTransactions(month)
          }
        })
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to mark payment as paid')
      }
    })
    setShowConfirmModal(true)
  }
  
  // Handle confirmation
  const handleConfirm = async () => {
    setShowConfirmModal(false)
    if (confirmAction) {
      await confirmAction()
    }
  }
  
  // Handle cancel
  const handleCancel = () => {
    setShowConfirmModal(false)
    setConfirmAction(null)
    setConfirmMessage('')
  }

  // Search members
  const handleSearch = async (query) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setShowSearchResults(false)
      return
    }
    
    try {
      const response = await apiClient.get(`/admin/members?search=${query}`)
      setSearchResults(response.data.members || [])
      setShowSearchResults(true)
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  // Navigate to member details
  const viewMemberDetails = (memberId) => {
    navigate(`/admin/members/${memberId}`)
  }

  // WhatsApp contact function
  const handleWhatsAppContact = (member) => {
    if (!member.phone) {
      setError('Member phone number not available')
      return
    }
    
    // Clean phone number - remove all non-digits
    let phone = member.phone.replace(/[^0-9]/g, '')
    
    // Ensure phone has country code (Pakistan = 92)
    if (!phone.startsWith('92') && phone.startsWith('0')) {
      phone = '92' + phone.substring(1)
    } else if (!phone.startsWith('92') && !phone.startsWith('0')) {
      phone = '92' + phone
    }
    
    const memberName = member.full_name || 'Member'
    const amount = parseFloat(member.total_overdue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })
    const dueDate = new Date(member.oldest_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    
    // Create message with proper line breaks
    const message = `Dear ${memberName},

This is a reminder that your gym membership payment of Rs. ${amount} was due on ${dueDate}.

Please make the payment at your earliest convenience to continue enjoying our services.

Thank you!
GOFIT Gym`
    
    // Use api.whatsapp.com for better mobile compatibility
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // Print receipt function
  const handlePrintReceipt = async (transaction) => {
    try {
      // Fetch member details with package information
      const memberResponse = await apiClient.get(`/admin/members/${transaction.member_id}`)
      const member = memberResponse.data
      
      // Fetch package details if member has a package
      let packageInfo = null
      if (member.current_package_id) {
        try {
          const packagesResponse = await apiClient.get('/packages')
          const packages = packagesResponse.data.packages || []
          packageInfo = packages.find(p => p.id === member.current_package_id)
        } catch (err) {
          console.error('Error fetching package:', err)
        }
      }
      
      // Fetch all transactions for this member to check for admission fee
      const transactionsResponse = await apiClient.get(`/finance/transactions?member_id=${transaction.member_id}`)
      const allTransactions = transactionsResponse.data.transactions || []
      
      // Check if there's an admission fee transaction
      const admissionTransaction = allTransactions.find(t => t.transaction_type === 'ADMISSION')
      const hasAdmissionFee = admissionTransaction && parseFloat(admissionTransaction.amount) > 0
      const admissionFeeAmount = hasAdmissionFee ? parseFloat(admissionTransaction.amount) : 0
      
      // Create receipt window
      const receiptWindow = window.open('', '_blank')
      const receiptNumber = `#${Date.now().toString().slice(-8).toUpperCase()}`
      const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
      const paidDate = transaction.paid_date ? new Date(transaction.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      
      // Get package info
      const packageName = packageInfo?.name || 'N/A'
      const packageStart = member.package_start_date ? new Date(member.package_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      const packageExpiry = member.package_expiry_date ? new Date(member.package_expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
      
      // Build admission fee row HTML (only if exists)
      const admissionFeeRow = hasAdmissionFee ? `
        <div class="info-row">
          <span class="info-label">ADMISSION FEE:</span>
          <span class="info-value">Rs. ${admissionFeeAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
        </div>
      ` : ''
      
      receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt - ${transaction.full_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              background: white;
              color: #333;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
            }
            .header-left {
              font-size: 14px;
              font-weight: bold;
              color: #666;
              letter-spacing: 1px;
            }
            .header-right {
              text-align: right;
            }
            .receipt-number {
              font-size: 16px;
              font-weight: bold;
              color: #000;
              margin-bottom: 5px;
            }
            .receipt-date {
              font-size: 12px;
              color: #666;
            }
            .logo-section {
              text-align: center;
              margin: 40px 0;
            }
            .logo {
              width: 400px;
              height: auto;
              max-width: 100%;
            }
            .section {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px 0;
              position: relative;
            }
            .section-title {
              position: absolute;
              top: -12px;
              left: 20px;
              background: white;
              padding: 0 10px;
              font-weight: bold;
              font-size: 12px;
              letter-spacing: 1px;
              color: #000;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px dotted #ccc;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #000;
              font-size: 14px;
            }
            .info-value {
              color: #333;
              font-size: 14px;
              text-align: right;
            }
            .total-section {
              border: 2px solid #000;
              padding: 30px;
              margin: 20px 0;
              text-align: center;
            }
            .total-label {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 2px;
              margin-bottom: 15px;
              color: #000;
            }
            .total-amount {
              font-size: 48px;
              font-weight: bold;
              color: #000;
            }
            .notice-section {
              border: 2px solid #000;
              padding: 15px;
              margin: 20px 0;
              text-align: center;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #000;
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            @media print {
              body { padding: 20px; }
              .section, .total-section, .notice-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <!-- Header -->
          <div class="header">
            <div class="header-left">PAYMENT RECEIPT</div>
            <div class="header-right">
              <div class="receipt-number">RECEIPT ${receiptNumber}</div>
              <div class="receipt-date">DATE: ${currentDate}</div>
            </div>
          </div>

          <!-- Logo -->
          <div class="logo-section">
            <img src="/reciept.png" alt="GOFIT Logo" class="logo" />
          </div>

          <!-- Member Information -->
          <div class="section">
            <div class="section-title">MEMBER INFORMATION</div>
            <div class="info-row">
              <span class="info-label">MEMBER ID:</span>
              <span class="info-value">${transaction.member_number}</span>
            </div>
            <div class="info-row">
              <span class="info-label">NAME:</span>
              <span class="info-value">${transaction.full_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">PHONE:</span>
              <span class="info-value">${member.phone || 'N/A'}</span>
            </div>
          </div>

          <!-- Package Information -->
          <div class="section">
            <div class="section-title">PACKAGE INFORMATION</div>
            <div class="info-row">
              <span class="info-label">PACKAGE:</span>
              <span class="info-value">${packageName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">START DATE:</span>
              <span class="info-value">${packageStart}</span>
            </div>
            <div class="info-row">
              <span class="info-label">EXPIRY DATE:</span>
              <span class="info-value">${packageExpiry}</span>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="section">
            <div class="section-title">PAYMENT DETAILS</div>
            <div class="info-row">
              <span class="info-label">PAYMENT MONTH:</span>
              <span class="info-value">${new Date(transaction.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            ${admissionFeeRow}
            <div class="info-row">
              <span class="info-label">PACKAGE:</span>
              <span class="info-value">Rs. ${parseFloat(transaction.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">PAID DATE:</span>
              <span class="info-value">${paidDate}</span>
            </div>
          </div>

          <!-- Total Amount -->
          <div class="total-section">
            <div class="total-label">TOTAL PAYABLE AMOUNT</div>
            <div class="total-amount">Rs. ${parseFloat(transaction.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
          </div>

          <!-- Notice -->
          <div class="notice-section">
            FEES ONCE PAID IS NON-REFUNDABLE
          </div>

          <!-- Footer -->
          <div class="footer">
            Thank You
          </div>
        </body>
        </html>
      `)
      receiptWindow.document.close()
    } catch (err) {
      console.error('Error printing receipt:', err)
      setError('Failed to generate receipt')
    }
  }

  // Export to Excel
  const handleExportExcel = async () => {
    if (!exportMonth) {
      setError('Please select a month to export')
      return
    }
    
    try {
      setExportLoading(true)
      const response = await apiClient.get(`/admin/finance/export-transactions?month=${exportMonth}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `GOFIT_Finance_${exportMonth}_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      setShowExportModal(false)
      setExportMonth('')
      setSuccess('Excel file downloaded successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export Excel file')
    } finally {
      setExportLoading(false)
    }
  }

  // Generate month options for export (last 12 months)
  const getMonthOptions = () => {
    const options = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value: monthValue, label: monthLabel })
    }
    
    return options
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-900/30 text-green-400 border-green-500/30'
      case 'PENDING':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'
      case 'OVERDUE':
        return 'bg-red-900/30 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-fitnix-dark">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-transparent border-t-fitnix-gold rounded-full animate-spin"></div>
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
            <p className="mt-4 text-fitnix-gold font-semibold animate-pulse">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fitnix-off-white">
              Finance <span className="fitnix-gradient-text">Dashboard</span>
            </h1>
            <p className="text-fitnix-off-white/60 mt-2">
              Manage payments and track revenue
            </p>
          </div>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="fitnix-button-secondary flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Excel</span>
          </button>
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

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search member by name or ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 pl-12 rounded-xl focus:outline-none focus:border-fitnix-gold transition-all"
            />
            <svg className="w-5 h-5 text-fitnix-gold/60 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-fitnix-dark-light border border-fitnix-gold/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
              {searchResults.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    viewMemberDetails(member.id)
                    setShowSearchResults(false)
                    setSearchQuery('')
                  }}
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
                    <p className="text-fitnix-off-white/60 text-sm">ID: {member.member_number}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 1: OVERDUE PAYMENTS & GRACE PERIOD */}
        {(overdueMembers.length > 0 || graceMembers.length > 0) && (
          <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border-2 border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-400">Overdue Payments</h2>
                  <p className="text-fitnix-off-white/60 text-sm">
                    {overdueMembers.length} overdue • {graceMembers.length} in grace period
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-fitnix-off-white/60">Total Amount</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(overdueTotal)}</p>
              </div>
            </div>

            {/* Overdue Member Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Grace Period Members First */}
              {graceMembers.map(member => (
                <div key={member.member_id} className="bg-fitnix-dark-light border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    {member.profile_picture ? (
                      <img src={member.profile_picture} alt={member.full_name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-fitnix-gold/20 flex items-center justify-center">
                        <span className="text-fitnix-gold font-bold text-xl">{member.full_name?.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-fitnix-off-white font-bold truncate">{member.full_name}</h3>
                      <p className="text-fitnix-off-white/60 text-sm">ID: {member.member_number}</p>
                      <p className="text-fitnix-off-white/60 text-sm">{member.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-fitnix-off-white/60">Amount:</span>
                      <span className="text-yellow-400 font-bold">{formatCurrency(member.total_overdue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-fitnix-off-white/60">Status:</span>
                      <span className="text-yellow-400 font-bold">
                        Grace {member.grace_day}/{member.grace_period_total}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-fitnix-off-white/60">Pending Payments:</span>
                      <span className="text-fitnix-off-white font-bold">{member.overdue_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewMemberDetails(member.member_id)}
                      className="flex-1 bg-fitnix-dark hover:bg-fitnix-dark-light text-fitnix-off-white px-3 py-2 rounded-lg text-sm font-semibold transition-all border border-fitnix-gold/20"
                    >
                      View Details
                    </button>
                    {member.transactions && member.transactions[0] && (
                      <button
                        onClick={() => handleMarkAsPaid(member.transactions[0], member.full_name)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Overdue Members (Past Grace Period) */}
              {overdueMembers.map(member => (
                <div key={member.member_id} className="bg-fitnix-dark-light border border-red-500/30 rounded-xl p-4 hover:border-red-500/50 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    {member.profile_picture ? (
                      <img src={member.profile_picture} alt={member.full_name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-fitnix-gold/20 flex items-center justify-center">
                        <span className="text-fitnix-gold font-bold text-xl">{member.full_name?.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-fitnix-off-white font-bold truncate">{member.full_name}</h3>
                      <p className="text-fitnix-off-white/60 text-sm">ID: {member.member_number}</p>
                      <p className="text-fitnix-off-white/60 text-sm">{member.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-fitnix-off-white/60">Amount:</span>
                      <span className="text-red-400 font-bold">{formatCurrency(member.total_overdue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-fitnix-off-white/60">Days Overdue:</span>
                      <span className="text-red-400 font-bold">{member.days_overdue} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-fitnix-off-white/60">Pending Payments:</span>
                      <span className="text-fitnix-off-white font-bold">{member.overdue_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewMemberDetails(member.member_id)}
                      className="flex-1 bg-fitnix-dark hover:bg-fitnix-dark-light text-fitnix-off-white px-3 py-2 rounded-lg text-sm font-semibold transition-all border border-fitnix-gold/20"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleWhatsAppContact(member)}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
                      title="Contact via WhatsApp"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                    {member.transactions && member.transactions[0] && (
                      <button
                        onClick={() => handleMarkAsPaid(member.transactions[0], member.full_name)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: MONTHLY SUMMARY */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-fitnix-off-white flex items-center gap-2">
            <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Monthly Overview
          </h2>

          {monthlySummary.map((monthData, index) => (
            <div key={monthData.month} className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(monthData.month)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-fitnix-dark-light/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${index === 0 ? 'bg-fitnix-gold/20' : 'bg-fitnix-gold/10'}`}>
                    <svg className="w-6 h-6 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-fitnix-off-white">{monthData.month_name}</h3>
                    <p className="text-sm text-fitnix-off-white/60">
                      {monthData.completed_count + monthData.pending_count + monthData.overdue_count} transactions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-fitnix-off-white/60">Collected</p>
                      <p className="text-lg font-bold text-green-400">{formatCurrency(monthData.total_collected)}</p>
                    </div>
                    {monthData.total_pending > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-fitnix-off-white/60">Pending</p>
                        <p className="text-lg font-bold text-yellow-400">{formatCurrency(monthData.total_pending)}</p>
                      </div>
                    )}
                    {monthData.total_overdue > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-fitnix-off-white/60">Overdue</p>
                        <p className="text-lg font-bold text-red-400">{formatCurrency(monthData.total_overdue)}</p>
                      </div>
                    )}
                  </div>

                  {/* Expand Icon */}
                  <svg 
                    className={`w-6 h-6 text-fitnix-gold transition-transform ${expandedMonths[monthData.month] ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Month Transactions (Collapsible) */}
              {expandedMonths[monthData.month] && (
                <div className="border-t border-fitnix-gold/20">
                  {loadingMonth === monthData.month ? (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fitnix-gold mx-auto"></div>
                      <p className="text-fitnix-off-white/60 mt-2">Loading transactions...</p>
                    </div>
                  ) : monthTransactions[monthData.month] && monthTransactions[monthData.month].length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-fitnix-dark-light">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">Member</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-fitnix-gold uppercase">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase hidden lg:table-cell">Due Date</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-fitnix-gold/10">
                          {monthTransactions[monthData.month].map(transaction => (
                            <tr key={transaction.id} className="hover:bg-fitnix-dark-light/50 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-fitnix-off-white font-semibold">{transaction.full_name}</p>
                                  <p className="text-fitnix-off-white/60 text-sm">ID: {transaction.member_number}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-fitnix-off-white font-bold">{formatCurrency(transaction.amount)}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-fitnix-off-white/80 text-sm hidden lg:table-cell">
                                {formatDate(transaction.due_date)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {transaction.status === 'COMPLETED' ? (
                                    <button
                                      onClick={() => handlePrintReceipt(transaction)}
                                      className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-3 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-1"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                      </svg>
                                      Print
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkAsPaid(transaction.id, transaction.full_name)}
                                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center text-fitnix-off-white/60">
                      No transactions for this month
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-fitnix-dark-light border border-fitnix-gold/20 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-fitnix-off-white mb-4">Export Transactions to Excel</h3>
              <p className="text-fitnix-off-white/60 mb-4">
                Select a month to export transaction data
              </p>
              
              {/* Month Selector */}
              <div className="mb-6">
                <label className="block text-fitnix-off-white/80 text-sm font-semibold mb-2">
                  Select Month
                </label>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full bg-fitnix-dark border border-fitnix-gold/20 text-fitnix-off-white px-4 py-3 rounded-xl focus:outline-none focus:border-fitnix-gold transition-all"
                >
                  <option value="">-- Select Month --</option>
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleExportExcel}
                  disabled={!exportMonth || exportLoading}
                  className={`flex-1 font-bold py-3 px-6 rounded-xl transition-all ${
                    !exportMonth || exportLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark'
                  }`}
                >
                  {exportLoading ? 'Exporting...' : 'Export Now'}
                </button>
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportMonth('')
                  }}
                  disabled={exportLoading}
                  className="flex-1 bg-fitnix-dark hover:bg-fitnix-dark-light text-fitnix-off-white font-bold py-3 px-6 rounded-xl transition-all border border-fitnix-gold/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border-2 border-fitnix-gold/30 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-fitnix-gold/20 flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Message */}
              <h3 className="text-2xl font-bold text-fitnix-off-white text-center mb-3">
                Confirm Payment
              </h3>
              <p className="text-fitnix-off-white/80 text-center mb-8 text-lg">
                {confirmMessage}
              </p>
              
              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-fitnix-gold/50"
                >
                  OK
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-cyan-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
