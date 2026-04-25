import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layouts/AdminLayout'
import apiClient from '../../services/api'

export default function TrainerCommissionProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [monthlyRecords, setMonthlyRecords] = useState([])
  const [searchMonth, setSearchMonth] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const user = JSON.parse(localStorage.getItem('user'))
  const isSuperAdmin = user?.role === 'super_admin'

  // Generate last 5 months
  const generateLast5Months = () => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 5; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(date.toISOString().slice(0, 7))
    }
    return months
  }

  useEffect(() => {
    fetchTrainerProfile()
  }, [id])

  useEffect(() => {
    if (data) {
      generateMonthlyRecords()
    }
  }, [data, searchMonth])

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
        setErrorMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  const fetchTrainerProfile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/trainers/${id}/profile`)
      setData(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trainer profile')
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyRecords = () => {
    const months = searchMonth ? [searchMonth] : generateLast5Months()
    const records = months.map(month => {
      const memberCount = data?.assigned_members?.length || 0
      const ratePerMember = parseFloat(data?.trainer?.salary_rate || 0)
      const totalCharges = memberCount * ratePerMember
      const gymCommission = totalCharges * parseFloat(data?.trainer?.gym_commission_percent || 0) / 100
      const trainerEarnings = totalCharges * parseFloat(data?.trainer?.trainer_commission_percent || 0) / 100
      
      return {
        month,
        memberCount,
        ratePerMember,
        totalCharges,
        gymCommission,
        trainerEarnings,
        memberPaymentStatus: 'pending', // This can be updated based on actual data
        trainerPaymentStatus: 'pending' // This can be updated based on actual data
      }
    })
    setMonthlyRecords(records)
  }

  const handleMarkAsPaid = async (month) => {
    const monthDate = new Date(month + '-01')
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const record = monthlyRecords.find(r => r.month === month)
    
    setConfirmAction({
      title: 'Mark Trainer as Paid',
      message: `Mark ${data.trainer.full_name} as paid for ${monthName}?`,
      amount: record?.trainerEarnings || 0,
      onConfirm: async () => {
        try {
          const amount = record?.trainerEarnings || 0
          await apiClient.post(`/trainers/${id}/mark-paid`, {
            month_year: monthDate.toISOString().split('T')[0],
            amount_paid: amount,
            payment_date: new Date().toISOString().split('T')[0],
            notes: 'Paid via super admin dashboard'
          })
          
          setSuccessMessage('Trainer marked as paid successfully!')
          setShowConfirmModal(false)
          fetchTrainerProfile()
        } catch (err) {
          setErrorMessage(err.response?.data?.error || 'Failed to mark trainer as paid')
          setShowConfirmModal(false)
        }
      }
    })
    setShowConfirmModal(true)
  }

  const viewSalarySlip = (month) => {
    navigate(`/admin/trainers/${id}/salary-slip/${month}`)
  }

  const printReceipt = (month) => {
    // Create a printable receipt for the trainer's monthly commission
    const receiptWindow = window.open('', '_blank')
    const monthDate = new Date(month + '-01')
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const receiptNumber = `#T${Date.now().toString().slice(-8)}`
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    const totalMembers = data?.assigned_members?.length || 0
    const ratePerMember = parseFloat(data?.trainer?.salary_rate || 0)
    const totalCharges = totalMembers * ratePerMember
    const trainerEarnings = totalCharges * parseFloat(data?.trainer?.trainer_commission_percent || 0) / 100
    
    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trainer Commission Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A5; margin: 1cm; }
          body { 
            font-family: 'Arial', sans-serif;
            padding: 40px;
            background: white;
            color: #333;
          }
          .receipt-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
          }
          .top-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
          }
          .top-header-left {
            font-size: 14px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .top-header-right {
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
            font-weight: bold;
          }
          .logo-section {
            text-align: center;
            margin: 30px 0;
          }
          .logo {
            width: 300px;
            height: auto;
            max-width: 100%;
          }
          .section-box {
            border: 2px solid #000;
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
          }
          .section-title {
            position: absolute;
            top: -12px;
            left: 20px;
            background: white;
            padding: 0 10px;
            font-size: 13px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
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
            font-size: 13px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
          }
          .info-value {
            font-size: 13px;
            color: #333;
            text-align: right;
          }
          .total-box {
            border: 2px solid #000;
            padding: 30px;
            text-align: center;
            margin: 20px 0;
          }
          .total-label {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
          }
          .total-amount {
            font-size: 48px;
            font-weight: bold;
            color: #000;
            letter-spacing: 2px;
          }
          .notice-box {
            border: 2px solid #000;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            font-size: 13px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 3px solid #000;
            font-size: 14px;
            font-weight: bold;
            color: #666;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="receipt-container">
          <!-- Top Header -->
          <div class="top-header">
            <div class="top-header-left">PAYMENT RECEIPT</div>
            <div class="top-header-right">
              <div class="receipt-number">RECEIPT ${receiptNumber}</div>
              <div class="receipt-date">DATE: ${currentDate}</div>
            </div>
          </div>

          <!-- Logo -->
          <div class="logo-section">
            <img src="/reciept.png" alt="GOFIT Logo" class="logo" onerror="this.style.display='none'">
          </div>

          <!-- Trainer Information -->
          <div class="section-box">
            <div class="section-title">TRAINER INFORMATION</div>
            <div class="info-row">
              <div class="info-label">NAME:</div>
              <div class="info-value">${data.trainer.full_name}</div>
            </div>
            <div class="info-row">
              <div class="info-label">PHONE:</div>
              <div class="info-value">${data.trainer.phone || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">SPECIALIZATION:</div>
              <div class="info-value">${data.trainer.specialization}</div>
            </div>
          </div>

          <!-- Member Information -->
          <div class="section-box">
            <div class="section-title">MEMBER INFORMATION</div>
            <div class="info-row">
              <div class="info-label">TOTAL MEMBERS:</div>
              <div class="info-value">${totalMembers} Members</div>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="section-box">
            <div class="section-title">PAYMENT DETAILS</div>
            <div class="info-row">
              <div class="info-label">PAYMENT MONTH:</div>
              <div class="info-value">${monthName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">RATE PER MEMBER:</div>
              <div class="info-value">Rs. ${ratePerMember.toLocaleString()}</div>
            </div>
            <div class="info-row">
              <div class="info-label">TOTAL CHARGES:</div>
              <div class="info-value">Rs. ${totalCharges.toLocaleString()}</div>
            </div>
            <div class="info-row">
              <div class="info-label">TRAINER COMMISSION:</div>
              <div class="info-value">Rs. ${trainerEarnings.toLocaleString()}</div>
            </div>
            <div class="info-row">
              <div class="info-label">PAID DATE:</div>
              <div class="info-value">${currentDate}</div>
            </div>
          </div>

          <!-- Total Amount -->
          <div class="total-box">
            <div class="total-label">TOTAL PAYABLE AMOUNT</div>
            <div class="total-amount">Rs. ${trainerEarnings.toLocaleString()}</div>
          </div>

          <!-- Notice -->
          <div class="notice-box">
            FEES ONCE PAID IS NON-REFUNDABLE
          </div>

          <!-- Footer -->
          <div class="footer">
            Thank You
          </div>
        </div>
      </body>
      </html>
    `)
    receiptWindow.document.close()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitnix-gold"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fitnix-off-white">
              {data?.trainer?.full_name || 'Trainer Profile'}
            </h1>
            <p className="text-fitnix-off-white/60 mt-1">Trainer Details & Commission</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/trainers')}
              className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg hover:bg-fitnix-dark"
            >
              Back
            </button>
          </div>
        </div>

        {/* Trainer Info Card */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-fitnix-off-white/60 text-sm">Specialization</p>
              <p className="text-fitnix-off-white font-semibold">{data?.trainer?.specialization}</p>
            </div>
            <div>
              <p className="text-fitnix-off-white/60 text-sm">Phone</p>
              <p className="text-fitnix-off-white font-semibold">{data?.trainer?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-fitnix-off-white/60 text-sm">Total Members</p>
              <p className="text-fitnix-off-white font-semibold">{data?.assigned_members?.length || 0} Members</p>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-4">
            <p className="text-fitnix-off-white/60 text-sm">Total Billed</p>
            <p className="text-2xl font-bold text-fitnix-gold mt-2">
              Rs. {data?.earnings?.total_billed?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-4">
            <p className="text-fitnix-off-white/60 text-sm">Trainer Earnings</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              Rs. {data?.earnings?.trainer_earnings?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Action Buttons - Removed */}

        {/* All Assigned Members List */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-fitnix-gold/20">
            <h2 className="text-xl font-bold text-fitnix-off-white">All Assigned Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-fitnix-dark-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">Member Name</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Member ID</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fitnix-gold/10">
                {data?.assigned_members?.length > 0 ? (
                  data.assigned_members.map((member, index) => (
                    <tr key={member.id} className="hover:bg-fitnix-dark-light/50">
                      <td className="px-6 py-4 text-sm text-fitnix-off-white/60">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-fitnix-off-white font-semibold">{member.full_name}</td>
                      <td className="px-6 py-4 text-center text-sm text-fitnix-off-white/80">{member.member_number || 'N/A'}</td>
                      <td className="px-6 py-4 text-center text-sm text-fitnix-off-white/80">{member.phone || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-fitnix-off-white/60">
                      No members assigned to this trainer
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Commission Summary */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-fitnix-gold/20 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-fitnix-off-white">Monthly Commission Summary</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
                className="px-4 py-2 bg-fitnix-dark border border-fitnix-off-white/20 rounded-lg text-fitnix-off-white focus:outline-none focus:border-fitnix-gold focus:ring-1 focus:ring-fitnix-gold transition-colors"
              >
                <option value="">Last 5 Months</option>
                {(() => {
                  const months = []
                  const today = new Date()
                  // Generate last 12 months
                  for (let i = 0; i < 12; i++) {
                    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    months.push(<option key={value} value={value}>{label}</option>)
                  }
                  return months
                })()}
              </select>
            </div>
          </div>
          
          {data?.trainer?.salary_rate && parseFloat(data.trainer.salary_rate) > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-fitnix-dark-light">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">Month</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Total Members</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-fitnix-gold uppercase">Rate Per Member</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-fitnix-gold uppercase">Total Charges</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-fitnix-gold uppercase">Trainer Earnings</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Member Payment</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Trainer Payment</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fitnix-gold/10">
                    {monthlyRecords.map((record, index) => (
                      <tr key={index} className="hover:bg-fitnix-dark-light/50">
                        <td className="px-6 py-4 text-sm text-fitnix-off-white font-semibold">
                          {new Date(record.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-fitnix-off-white/80">
                          {record.memberCount} Members
                        </td>
                        <td className="px-6 py-4 text-sm text-fitnix-gold text-right font-semibold">
                          Rs. {record.ratePerMember.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-400 text-right font-semibold">
                          Rs. {record.totalCharges.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-400 text-right font-semibold">
                          Rs. {record.trainerEarnings.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400">
                            PENDING
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            record.trainerPaymentStatus === 'paid'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {record.trainerPaymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col gap-2 items-center">
                            {!isSuperAdmin && record.trainerPaymentStatus === 'pending' && (
                              <button
                                onClick={() => handleMarkAsPaid(record.month)}
                                className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Mark as Paid
                              </button>
                            )}
                            <button
                              onClick={() => printReceipt(record.month)}
                              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-yellow-900/20 rounded-full p-4">
                  <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-fitnix-off-white mb-2">Salary Rate Not Set</h3>
                  <p className="text-fitnix-off-white/60 mb-4">
                    Please set the salary rate per member for this trainer to calculate commissions.
                  </p>
                  <button
                    onClick={() => navigate(`/admin/trainers/edit/${id}`)}
                    className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Trainer Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fitnix-dark-light border-2 border-fitnix-gold/30 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="bg-fitnix-gold/20 rounded-full p-3">
                <svg className="w-12 h-12 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-fitnix-off-white text-center mb-2">
              {confirmAction.title}
            </h3>

            <p className="text-fitnix-off-white/80 text-center mb-4">
              {confirmAction.message}
            </p>

            {confirmAction.amount && (
              <div className="bg-fitnix-dark/50 rounded-lg p-4 mb-6 border border-fitnix-gold/30">
                <p className="text-fitnix-off-white/60 text-sm mb-1">Amount to Pay</p>
                <p className="text-fitnix-gold font-bold text-2xl">
                  Rs. {confirmAction.amount.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-fitnix-dark hover:bg-fitnix-dark/80 text-fitnix-off-white font-semibold py-3 px-4 rounded-lg transition border border-fitnix-off-white/20"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="flex-1 bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark font-semibold py-3 px-4 rounded-lg transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
