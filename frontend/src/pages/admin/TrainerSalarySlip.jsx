import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../services/api'

export default function TrainerSalarySlip() {
  const { id, month } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSalarySlip()
  }, [id, month])

  const fetchSalarySlip = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/trainers/${id}/salary-slip/${month}`)
      setData(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load salary slip')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fitnix-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitnix-gold"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fitnix-dark flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-fitnix-gold text-fitnix-dark px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const monthName = new Date(data?.salary_slip?.month_year).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50 flex space-x-2">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-fitnix-gold hover:bg-fitnix-gold-dark text-fitnix-dark px-6 py-2 rounded-lg shadow-lg font-semibold"
        >
          Print Salary Slip
        </button>
      </div>

      {/* Salary Slip Content */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-fitnix-gold pb-6">
          <h1 className="text-4xl font-bold text-fitnix-gold mb-2">GOFIT</h1>
          <p className="text-gray-600">Gym Management System</p>
          <p className="text-sm text-gray-500 mt-2">Salary Slip</p>
        </div>

        {/* Slip Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm text-gray-600">Trainer Name</p>
            <p className="text-lg font-semibold text-gray-900">{data?.trainer?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Month</p>
            <p className="text-lg font-semibold text-gray-900">{monthName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Specialization</p>
            <p className="text-lg font-semibold text-gray-900">{data?.trainer?.specialization}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {data?.salary_slip?.payment_date 
                ? new Date(data.salary_slip.payment_date).toLocaleDateString()
                : 'Not paid yet'}
            </p>
          </div>
        </div>

        {/* Member Charges Table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Member Charges</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Member Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Member ID</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Monthly Charge</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Trainer's Cut</th>
              </tr>
            </thead>
            <tbody>
              {data?.member_charges?.map((charge, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{charge.member_name}</td>
                  <td className="border border-gray-300 px-4 py-2">{charge.member_number}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    Rs. {charge.monthly_charge.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Rs. {charge.trainer_cut.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Total Members Billed:</span>
              <span className="font-semibold">{data?.salary_slip?.total_members_billed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Charges:</span>
              <span className="font-semibold">Rs. {data?.salary_slip?.total_charges?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Gym Commission:</span>
              <span className="font-semibold">Rs. {data?.salary_slip?.gym_total_cut?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-300 pt-3">
              <span className="text-lg font-bold text-gray-900">Trainer Total Earnings:</span>
              <span className="text-lg font-bold text-fitnix-gold">
                Rs. {data?.salary_slip?.trainer_total_cut?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-lg font-bold text-gray-900">Amount Paid:</span>
              <span className="text-lg font-bold text-green-600">
                Rs. {data?.salary_slip?.amount_paid?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {data?.trainer?.bank_account && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Bank Account</p>
            <p className="text-lg font-semibold text-gray-900">{data.trainer.bank_account}</p>
          </div>
        )}

        {/* Notes */}
        {data?.salary_slip?.notes && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">Notes</p>
            <p className="text-gray-900">{data.salary_slip.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
          <p>Generated on {new Date(data?.salary_slip?.generated_at).toLocaleString()}</p>
          <p className="mt-2">© 2026 GOFIT. All rights reserved.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
