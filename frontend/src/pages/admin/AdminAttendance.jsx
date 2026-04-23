import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function AdminAttendance() {
  const [todayData, setTodayData] = useState(null)
  const [bridgeStatus, setBridgeStatus] = useState(null)
  const [overdueAlerts, setOverdueAlerts] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberAttendance, setMemberAttendance] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAllData()
    
    // Auto-refresh every 60 seconds if enabled
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAllData()
      }, 60000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchAllData = async () => {
    try {
      const [todayRes, bridgeRes, overdueRes] = await Promise.allSettled([
        apiClient.get('/attendance/today'),
        apiClient.get('/attendance/bridge/status'),
        apiClient.get('/attendance/overdue-alerts')
      ])

      if (todayRes.status === 'fulfilled') {
        setTodayData(todayRes.value.data)
      }
      
      if (bridgeRes.status === 'fulfilled') {
        setBridgeStatus(bridgeRes.value.data)
      }
      
      if (overdueRes.status === 'fulfilled') {
        setOverdueAlerts(overdueRes.value.data.overdue_alerts || [])
      }
    } catch (err) {
      setError('Failed to load attendance data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckin = async (memberId) => {
    try {
      await apiClient.post('/attendance/checkin/manual', { member_id: memberId })
      setSuccess('Member checked in successfully')
      fetchAllData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check in member')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/attendance/export', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSuccess('Attendance exported successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to export attendance')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getChartData = () => {
    if (!todayData?.chart_data) {
      return {
        labels: [],
        datasets: []
      }
    }

    return {
      labels: todayData.chart_data.labels,
      datasets: [{
        label: 'Check-ins per Hour',
        data: todayData.chart_data.data,
        borderColor: '#F2C228',
        backgroundColor: 'rgba(242, 194, 40, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#F2C228',
        pointBorderColor: '#0B0B0B',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleColor: '#F2C228',
        bodyColor: '#F5F5F5',
        borderColor: '#F2C228',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#F5F5F5' },
        grid: { color: '#2A2A2A' }
      },
      y: {
        ticks: { color: '#F5F5F5', stepSize: 1 },
        grid: { color: '#2A2A2A' }
      }
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-fitnix-dark flex items-center justify-center z-50">
        <div className="relative flex flex-col items-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-fitnix-dark-light/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-fitnix-gold border-r-fitnix-gold animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-fitnix-gold-dark border-l-fitnix-gold-dark animate-spin-reverse"></div>
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
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-fitnix-off-white">
              Attendance <span className="fitnix-gradient-text">System</span>
            </h1>
            <p className="text-fitnix-off-white/70 mt-2 text-lg">
              Real-time member check-ins and turnstile monitoring
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                autoRefresh 
                  ? 'bg-fitnix-gold text-fitnix-dark' 
                  : 'bg-fitnix-dark-light text-fitnix-off-white border border-fitnix-off-white/20'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {autoRefresh ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span>{autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

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

        {/* Bridge Status */}
        {bridgeStatus && (
          <div className={`fitnix-card-glow border-2 ${
            bridgeStatus.online 
              ? 'border-emerald-500/40 hover:border-emerald-500/60' 
              : 'border-red-500/40 hover:border-red-500/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  bridgeStatus.online ? 'bg-emerald-500' : 'bg-red-500'
                }`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-fitnix-off-white">
                    Bridge Status: <span className={bridgeStatus.online ? 'text-emerald-400' : 'text-red-400'}>
                      {bridgeStatus.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </h3>
                  <p className="text-fitnix-off-white/60 text-sm">
                    {bridgeStatus.online 
                      ? `Connected from ${bridgeStatus.pc_ip}` 
                      : `Last seen: ${formatDate(bridgeStatus.last_seen)} at ${formatTime(bridgeStatus.last_seen)}`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-fitnix-gold">{bridgeStatus.records_synced_today}</p>
                <p className="text-fitnix-off-white/60 text-sm">Records synced today</p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="fitnix-card-glow border-2 border-fitnix-gold/20 hover:border-fitnix-gold/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm font-semibold uppercase">Total Check-ins</p>
                <p className="text-4xl font-bold text-fitnix-gold mt-2">{todayData?.total_checkins || 0}</p>
              </div>
              <div className="w-14 h-14 bg-fitnix-gold/10 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-fitnix-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="fitnix-card-glow border-2 border-amber-500/20 hover:border-amber-500/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-fitnix-off-white/60 text-sm font-semibold uppercase">Overdue Payments</p>
                <p className="text-4xl font-bold text-amber-400 mt-2">{overdueAlerts.length}</p>
              </div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Traffic Chart */}
        <div className="fitnix-card-glow">
          <h2 className="text-2xl font-bold text-fitnix-off-white mb-4">Today's Traffic Pattern</h2>
          <div className="h-64">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </div>

        {/* Overdue Payment Alerts */}
        {overdueAlerts.length > 0 && (
          <div className="fitnix-card-glow border-2 border-amber-500/30">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-amber-400">Overdue Payment Alerts</h2>
            </div>
            <p className="text-fitnix-off-white/60 mb-4">These members checked in today but have overdue payments (past 3-day grace period)</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-amber-500/30">
                    <th className="px-4 py-3 text-left text-sm font-bold text-amber-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-amber-400 uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-amber-400 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-amber-400 uppercase">Card ID</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-amber-400 uppercase">Days Overdue</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-amber-400 uppercase">Amount Due</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueAlerts.map((alert, index) => (
                    <tr key={`${alert.member_id}-${alert.check_in_time}`} className={`border-b border-amber-500/10 ${index % 2 === 0 ? 'bg-amber-900/10' : 'bg-amber-900/20'}`}>
                      <td className="px-4 py-3 text-fitnix-off-white font-semibold">{formatTime(alert.check_in_time)}</td>
                      <td className="px-4 py-3 text-fitnix-off-white">
                        {alert.member_name} <span className="text-fitnix-gold">#{alert.member_number}</span>
                      </td>
                      <td className="px-4 py-3 text-fitnix-off-white/60">{alert.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-fitnix-off-white/60">{alert.card_id || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.days_overdue > 7 
                            ? 'bg-red-900/30 text-red-400 border border-red-500' 
                            : 'bg-amber-900/30 text-amber-400 border border-amber-500'
                        }`}>
                          {alert.days_overdue} days
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold text-amber-400">
                          Rs. {alert.total_overdue.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <p className="text-xs text-fitnix-off-white/60">{alert.overdue_count} transaction(s)</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Today's Check-ins */}
        <div className="fitnix-card-glow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-fitnix-off-white">Today's Check-ins</h2>
            <button
              onClick={fetchAllData}
              className="px-4 py-2 bg-fitnix-dark-light hover:bg-fitnix-dark text-fitnix-gold rounded-lg font-semibold transition-colors border border-fitnix-gold/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {todayData?.records && todayData.records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-fitnix-gold/30">
                    <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Card ID</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Door</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Direction</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-fitnix-gold uppercase">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {todayData.records.map((record, index) => (
                    <tr key={record.id} className={`border-b border-fitnix-off-white/10 ${index % 2 === 0 ? 'bg-fitnix-dark-light/20' : 'bg-fitnix-dark-light/40'}`}>
                      <td className="px-4 py-3 text-fitnix-off-white font-semibold">{formatTime(record.check_in_time)}</td>
                      <td className="px-4 py-3 text-fitnix-off-white">
                        {record.member_name} <span className="text-fitnix-gold">#{record.member_number}</span>
                      </td>
                      <td className="px-4 py-3 text-fitnix-off-white/60">{record.card_id || 'N/A'}</td>
                      <td className="px-4 py-3 text-fitnix-off-white">{record.door === 0 ? 'Manual' : `Door ${record.door}`}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          record.direction === 'entry' 
                            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500' 
                            : 'bg-amber-900/30 text-amber-400 border border-amber-500'
                        }`}>
                          {record.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-fitnix-dark text-fitnix-gold border border-fitnix-gold">
                          {record.method.replace(/_/g, ' ').replace(/\bId\b/g, 'ID').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-fitnix-off-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-fitnix-off-white/60">No check-ins today yet</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
