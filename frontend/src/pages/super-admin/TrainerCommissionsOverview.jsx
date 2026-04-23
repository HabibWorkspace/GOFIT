import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout'
import apiClient from '../../services/api'

export default function TrainerCommissionsOverview() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    fetchCommissions()
  }, [selectedMonth])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/trainers/commissions?month=${selectedMonth}`)
      setData(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load trainer commissions')
    } finally {
      setLoading(false)
    }
  }

  const viewTrainerProfile = (trainerId) => {
    navigate(`/admin/trainers/${trainerId}/commission?month=${selectedMonth}`)
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

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </SuperAdminLayout>
    )
  }

  const monthName = new Date(selectedMonth).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-fitnix-off-white">
              Trainer Commissions
            </h1>
            <p className="text-fitnix-off-white/60 mt-1">Overview of all trainer earnings for {monthName}</p>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-fitnix-dark-light border border-fitnix-gold/20 text-fitnix-off-white px-4 py-2 rounded-lg"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <p className="text-fitnix-off-white/60 text-sm">Total Trainers</p>
            <p className="text-3xl font-bold text-fitnix-gold mt-2">
              {data?.trainers?.length || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <p className="text-fitnix-off-white/60 text-sm">Gym Commission</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              Rs. {data?.totals?.gym_commission?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl p-6">
            <p className="text-fitnix-off-white/60 text-sm">Trainer Commission</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              Rs. {data?.totals?.trainer_commission?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Trainers Table */}
        <div className="bg-gradient-to-br from-fitnix-dark via-fitnix-dark-light to-fitnix-dark border border-fitnix-gold/20 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-fitnix-gold/20">
            <h2 className="text-xl font-bold text-fitnix-off-white">Trainer Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-fitnix-dark-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fitnix-gold uppercase">Trainer Name</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Members</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-fitnix-gold uppercase">Gym Cut</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-fitnix-gold uppercase">Trainer Owed</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-fitnix-gold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fitnix-gold/10">
                {data?.trainers?.length > 0 ? (
                  data.trainers.map((trainer) => (
                    <tr key={trainer.trainer_id} className="hover:bg-fitnix-dark-light/50">
                      <td className="px-6 py-4 text-sm text-fitnix-off-white font-semibold">
                        {trainer.trainer_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-fitnix-gold/20 text-fitnix-gold rounded-full font-bold text-sm">
                          {trainer.members_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 text-right font-semibold">
                        Rs. {trainer.gym_cut?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-400 text-right font-semibold">
                        Rs. {trainer.total_owed?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {trainer.members_count > 0 ? (
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            trainer.paid 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {trainer.paid ? 'Paid' : 'Pending'}
                          </span>
                        ) : (
                          <span className="text-fitnix-off-white/40 text-xs">No members</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => viewTrainerProfile(trainer.trainer_id)}
                          className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-fitnix-off-white/60">
                      No trainer commissions found for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  )
}
