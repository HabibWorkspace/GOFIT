import { useState, useEffect } from 'react'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'
import { Bar } from 'react-chartjs-2'

export default function SuperAdminFinance() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  useEffect(() => {
    fetchFinanceReport()
  }, [month])

  const fetchFinanceReport = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/super-admin/finance/report', {
        params: { month }
      })
      setReport(response.data)
      setError('')
    } catch (err) {
      console.error('Error fetching finance report:', err)
      setError(err.response?.data?.error || 'Failed to load finance report')
    } finally {
      setLoading(false)
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

  const revenueBreakdownData = {
    labels: ['Admission', 'Package', 'Payment'],
    datasets: [
      {
        label: 'Revenue (Rs.)',
        data: [
          report?.revenue_breakdown?.admission || 0,
          report?.revenue_breakdown?.package || 0,
          report?.revenue_breakdown?.payment || 0,
        ],
        backgroundColor: [
          'rgba(212, 175, 55, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgb(212, 175, 55)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#D4AF37',
        bodyColor: '#F5F5F5',
        borderColor: '#D4AF37',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return 'Rs. ' + context.parsed.y.toLocaleString()
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return 'Rs. ' + value.toLocaleString()
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fitnix-off-white">Financial Reports</h1>
            <p className="text-fitnix-off-white/60 mt-1">Comprehensive revenue and profit analysis</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-fitnix-off-white mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg focus:outline-none focus:border-fitnix-gold"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <p className="text-fitnix-off-white/60 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-fitnix-gold mt-2">
              Rs. {report?.total_revenue?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <p className="text-fitnix-off-white/60 text-sm">Trainer Fees Paid</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              Rs. {report?.trainer_fees_paid?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <p className="text-fitnix-off-white/60 text-sm">Net Revenue</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              Rs. {report?.net_revenue?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Revenue Breakdown Chart */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-fitnix-off-white mb-4">Revenue by Source</h2>
          <div style={{ height: '300px' }}>
            <Bar data={revenueBreakdownData} options={chartOptions} />
          </div>
        </div>

        {/* Monthly Breakdown */}
        {report?.monthly_breakdown && report.monthly_breakdown.length > 0 && (
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-fitnix-off-white mb-4">Monthly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-fitnix-dark-light border-b border-fitnix-gold/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-fitnix-gold uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fitnix-gold/10">
                  {report.monthly_breakdown.map((month) => (
                    <tr key={month.month} className="hover:bg-fitnix-dark-light/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-fitnix-off-white">
                        {month.month_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-fitnix-gold text-right font-semibold">
                        Rs. {month.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
