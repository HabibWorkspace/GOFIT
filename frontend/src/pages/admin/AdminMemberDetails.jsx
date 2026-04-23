import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import apiClient from '../../services/api'
import AdminLayout from '../../components/layouts/AdminLayout'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function AdminMemberDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [packages, setPackages] = useState([])
  const [trainers, setTrainers] = useState([])
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cnic: '',
    email: '',
    father_name: '',
    weight_kg: '',
    blood_group: '',
    address: '',
    gender: '',
    date_of_birth: '',
    admission_date: '',
    package_id: '',
    trainer_id: '',
    package_start_date: '',
    package_expiry_date: '',
    card_id: '',
  })

  useEffect(() => {
    fetchMemberDetails()
    fetchPackages()
    fetchTrainers()
  }, [id])

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchMemberDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/admin/member-details?id=${id}`)
      setMember(response.data)
      // Populate form data when member is loaded
      setFormData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        cnic: response.data.cnic || '',
        email: response.data.email || '',
        father_name: response.data.father_name || '',
        weight_kg: response.data.weight_kg || '',
        blood_group: response.data.blood_group || '',
        address: response.data.address || '',
        gender: response.data.gender || '',
        date_of_birth: response.data.date_of_birth || '',
        admission_date: response.data.admission_date || '',
        package_id: response.data.current_package_id || '',
        trainer_id: response.data.trainer_id || '',
        package_start_date: response.data.package_start_date || '',
        package_expiry_date: response.data.package_expiry_date || '',
        card_id: response.data.card_id || '',
      })
      setProfileImagePreview(response.data.profile_picture || null)
    } catch (err) {
      setError('Failed to load member details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPackages = async () => {
    try {
      const response = await apiClient.get('/packages')
      setPackages(response.data.packages || [])
    } catch (err) {
      console.error('Failed to load packages:', err)
    }
  }

  const fetchTrainers = async () => {
    try {
      const response = await apiClient.get('/admin/trainers')
      setTrainers(response.data.trainers || [])
    } catch (err) {
      console.error('Failed to load trainers:', err)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!formData.full_name || !formData.phone) {
      setError('Full Name and Phone are required')
      return
    }
    
    try {
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        cnic: formData.cnic,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        admission_date: formData.admission_date,
        package_id: formData.package_id,
        trainer_id: formData.trainer_id,
        package_start_date: formData.package_start_date,
        package_expiry_date: formData.package_expiry_date,
        card_id: formData.card_id,
      }
      
      if (profileImage) {
        updateData.profile_picture = profileImagePreview
      }
      
      await apiClient.put(`/admin/members/${id}`, updateData)
      setSuccess('Member updated successfully')
      setIsEditMode(false)
      await fetchMemberDetails()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update member')
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setProfileImage(null)
    setProfileImagePreview(member?.profile_picture || null)
    // Reset form data to original member data
    setFormData({
      full_name: member?.full_name || '',
      phone: member?.phone || '',
      cnic: member?.cnic || '',
      email: member?.email || '',
      father_name: member?.father_name || '',
      weight_kg: member?.weight_kg || '',
      blood_group: member?.blood_group || '',
      address: member?.address || '',
      gender: member?.gender || '',
      date_of_birth: member?.date_of_birth || '',
      admission_date: member?.admission_date || '',
      package_id: member?.current_package_id || '',
      trainer_id: member?.trainer_id || '',
      package_start_date: member?.package_start_date || '',
      package_expiry_date: member?.package_expiry_date || '',
      card_id: member?.card_id || '',
    })
    setError('')
    setSuccess('')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleSetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please enter both password fields')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    try {
      setPasswordLoading(true)
      await apiClient.post(`/admin/members/${id}/set-password`, {
        password: newPassword
      })
      setSuccess('Password updated successfully!')
      setShowSetPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
      await fetchMemberDetails()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleResetPasswordEmail = async () => {
    if (!member.email) {
      setError('Member does not have an email address. Please add an email first.')
      return
    }
    
    try {
      setPasswordLoading(true)
      await apiClient.post(`/admin/members/${id}/reset-password-email`)
      setSuccess('Password reset email sent successfully!')
      setShowResetPasswordModal(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send password reset email')
    } finally {
      setPasswordLoading(false)
    }
  }

  const isDefaultPassword = (password) => {
    // Check if password is the default "member123" or looks like a UUID (old default)
    if (!password) return false
    if (password === 'member123') return true
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidPattern.test(password)
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
                alt="FitNix Logo" 
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

  if (error || !member) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="space-y-6">
          <div className="bg-red-900/20 border border-red-500 text-fitnix-off-white px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error || 'Member not found'}
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/members')}
            className="fitnix-button-secondary"
          >
            Back to Members
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          <Link 
            to="/admin/members" 
            className="text-fitnix-gold hover:text-fitnix-gold-dark transition-colors"
          >
            Members
          </Link>
          <svg className="w-4 h-4 text-fitnix-off-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-fitnix-off-white/60">Member Details</span>
        </nav>

        {/* Header with Back and Edit Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fitnix-off-white">
              Member <span className="fitnix-gradient-text">{isEditMode ? 'Edit' : 'Details'}</span>
            </h1>
            <p className="text-fitnix-off-white/60 mt-2">
              {isEditMode ? 'Update member information' : 'Comprehensive member information and history'}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/admin/members')}
              className="fitnix-button-secondary flex items-center justify-center space-x-2 flex-1 sm:flex-initial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="fitnix-button-primary flex items-center justify-center space-x-2 flex-1 sm:flex-initial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
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

        {/* Edit Form or View Mode */}
        {isEditMode ? (
          <form onSubmit={handleSubmit} className="fitnix-card-glow">
            <h2 className="text-xl font-semibold text-fitnix-off-white mb-4">Edit Member</h2>
            
            {/* Personal Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-fitnix-gold mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="fitnix-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    {profileImagePreview && (
                      <img 
                        src={profileImagePreview} 
                        alt="Profile preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-fitnix-gold"
                      />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="fitnix-input flex items-center justify-center gap-2 hover:border-fitnix-gold/50 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{profileImage ? profileImage.name : 'Choose image'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-fitnix-off-white/50 mt-1">Max 5MB, JPG/PNG</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="fitnix-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="fitnix-input"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Father Name
                  </label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="fitnix-input"
                    placeholder="Enter father's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    CNIC
                  </label>
                  <input
                    type="text"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    className="fitnix-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="fitnix-input"
                    placeholder="member@example.com"
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">
                    Optional - Used for password reset and notifications
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Date of Birth
                  </label>
                  <DatePicker
                    selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                    onChange={(date) => setFormData({ ...formData, date_of_birth: date ? date.toISOString().split('T')[0] : '' })}
                    dateFormat="MMM dd, yyyy"
                    className="fitnix-input w-full"
                    placeholderText="Select date of birth"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    isClearable
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Admission Date
                  </label>
                  <DatePicker
                    selected={formData.admission_date ? new Date(formData.admission_date) : null}
                    onChange={(date) => setFormData({ ...formData, admission_date: date ? date.toISOString().split('T')[0] : '' })}
                    dateFormat="MMM dd, yyyy"
                    className="fitnix-input w-full"
                    placeholderText="Select admission date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    isClearable
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Card ID
                  </label>
                  <input
                    type="text"
                    value={formData.card_id}
                    onChange={(e) => setFormData({ ...formData, card_id: e.target.value })}
                    className="fitnix-input"
                    maxLength="20"
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">
                    Physical RFID card number for turnstile access
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="500"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="fitnix-input"
                    placeholder="75.50"
                  />
                  <p className="text-xs text-fitnix-off-white/50 mt-1">
                    Weight in kilograms
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Blood Group
                  </label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="fitnix-input"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="fitnix-input"
                    rows="3"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>
            </div>

            {/* Package & Trainer Assignment */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-fitnix-gold mb-3">Package & Trainer Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Package
                  </label>
                  <select
                    value={formData.package_id}
                    onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                    className="fitnix-input"
                  >
                    <option value="">No Package</option>
                    {packages.filter(pkg => pkg.is_active).map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - Rs. {pkg.price} ({pkg.duration_days} days)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Assigned Trainer
                  </label>
                  <select
                    value={formData.trainer_id}
                    onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
                    className="fitnix-input"
                  >
                    <option value="">No Trainer</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.full_name} - {trainer.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Package Dates - Auto-calculate expiry */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-fitnix-gold mb-3">Package Duration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Package Start Date
                  </label>
                  <DatePicker
                    selected={formData.package_start_date ? new Date(formData.package_start_date) : null}
                    onChange={(date) => {
                      const startDate = date ? date.toISOString().split('T')[0] : ''
                      // Auto-calculate expiry date based on package duration
                      let expiryDate = ''
                      if (date && formData.package_id) {
                        const selectedPackage = packages.find(pkg => pkg.id === formData.package_id)
                        if (selectedPackage) {
                          const expiry = new Date(date)
                          expiry.setDate(expiry.getDate() + selectedPackage.duration_days)
                          expiryDate = expiry.toISOString().split('T')[0]
                        }
                      }
                      setFormData({ ...formData, package_start_date: startDate, package_expiry_date: expiryDate })
                    }}
                    dateFormat="MMM dd, yyyy"
                    className="fitnix-input w-full"
                    placeholderText="Select start date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    isClearable
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                    Package Expiry Date
                  </label>
                  <div className="fitnix-input bg-fitnix-dark-light/20 border-fitnix-gold/10 cursor-not-allowed flex items-center">
                    <svg className="w-5 h-5 mr-2 text-fitnix-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-fitnix-off-white/60">
                      {formData.package_expiry_date 
                        ? new Date(formData.package_expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Auto-calculated'}
                    </span>
                  </div>
                  <p className="text-xs text-fitnix-off-white/50 mt-1">
                    Automatically calculated from package duration
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="flex-1 fitnix-button-primary"
              >
                Update Member
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 fitnix-button-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Member Profile Card */}
        <div className="fitnix-card-glow">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {member.profile_picture ? (
                <img 
                  src={member.profile_picture} 
                  alt={member.full_name} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-fitnix-gold shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-fitnix-dark-light border-4 border-fitnix-gold flex items-center justify-center">
                  <svg className="w-20 h-20 text-fitnix-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Full Name</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Gender</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Date of Birth</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{formatDate(member.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">CNIC</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.cnic || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Admission Date</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{formatDate(member.admission_date)}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Card ID</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.card_id || 'Not Assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Status</p>
                <div className="flex flex-col gap-1.5">
                  {member.is_frozen ? (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 w-fit">
                      Frozen
                    </span>
                  ) : member.is_inactive ? (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/50 w-fit">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-fitnix-gold/20 text-fitnix-gold border border-fitnix-gold/50 w-fit">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Email</p>
                <p className="text-lg font-semibold text-fitnix-off-white break-all">{member.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Father Name</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.father_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Weight</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.weight_kg ? `${member.weight_kg} kg` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Blood Group</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.blood_group || 'N/A'}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs text-fitnix-off-white/50 uppercase tracking-wide mb-1">Address</p>
                <p className="text-lg font-semibold text-fitnix-off-white">{member.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Credentials Card */}
        <div className="fitnix-card-glow">
          <h2 className="text-xl font-bold text-fitnix-gold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Login Credentials
          </h2>
          <p className="text-sm text-fitnix-off-white/60 mb-4">
            Use these credentials to mark attendance via the mobile app
          </p>
          
          {/* Default Password Indicator */}
          {member.password && isDefaultPassword(member.password) && (
            <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-400 font-semibold">Default Password Detected</p>
                <p className="text-xs text-blue-300 mt-1">
                  This member is using an auto-generated password. Consider setting a custom password for better security.
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-fitnix-dark-light border border-fitnix-gold/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-fitnix-off-white/50 uppercase tracking-wide">Username</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(member.username || '')
                    setSuccess('Username copied to clipboard!')
                  }}
                  className="text-fitnix-gold hover:text-fitnix-gold-dark transition-colors"
                  title="Copy username"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-lg font-bold text-fitnix-off-white font-mono break-all">
                {member.username || 'N/A'}
              </p>
            </div>
            <div className="bg-fitnix-dark-light border border-fitnix-gold/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-fitnix-off-white/50 uppercase tracking-wide">Password</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(member.password || '')
                    setSuccess('Password copied to clipboard!')
                  }}
                  className="text-fitnix-gold hover:text-fitnix-gold-dark transition-colors"
                  title="Copy password"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-lg font-bold text-fitnix-off-white font-mono break-all">
                {member.password || 'Not Set'}
              </p>
            </div>
          </div>
          
          {/* Password Management Buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowSetPasswordModal(true)}
              className="fitnix-button-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Set Password</span>
            </button>
            <button
              onClick={() => setShowResetPasswordModal(true)}
              className="fitnix-button-secondary flex items-center space-x-2"
              disabled={!member.email}
              title={!member.email ? 'Email required for password reset' : 'Send password reset email'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Reset via Email</span>
            </button>
          </div>
          
          {(!member.username || !member.password) && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-400">
                Login credentials are incomplete. Member may not be able to mark attendance via the app.
              </p>
            </div>
          )}
        </div>

        {/* Current Package & Trainer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Package */}
          <div className="fitnix-card">
            <h2 className="text-xl font-bold text-fitnix-gold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Current Package
            </h2>
            {member.current_package ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Package Name</p>
                  <p className="text-lg font-semibold text-fitnix-off-white">{member.current_package.name}</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Price</p>
                  <p className="text-lg font-semibold text-fitnix-gold">{formatCurrency(member.current_package.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Duration</p>
                  <p className="text-lg font-semibold text-fitnix-off-white">{member.current_package.duration_days} days</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Start Date</p>
                  <p className="text-lg font-semibold text-fitnix-off-white">{formatDate(member.package_start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Expiry Date</p>
                  <p className="text-lg font-semibold text-fitnix-off-white">{formatDate(member.package_expiry_date)}</p>
                </div>
                {member.current_package.description && (
                  <div>
                    <p className="text-sm text-fitnix-off-white/50">Description</p>
                    <p className="text-sm text-fitnix-off-white/70">{member.current_package.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-fitnix-off-white/50">No package assigned</p>
            )}
          </div>

          {/* Current Trainer */}
          <div className="fitnix-card">
            <h2 className="text-xl font-bold text-fitnix-gold mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Assigned Trainer
            </h2>
            {member.current_trainer ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Trainer Name</p>
                  <p className="text-lg font-semibold text-fitnix-off-white">{member.current_trainer.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Specialization</p>
                  <p className="text-lg font-semibold text-fitnix-gold">{member.current_trainer.specialization}</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Phone</p>
                  <p className="text-lg font-semibold text-fitnix-off-white">{member.current_trainer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-fitnix-off-white/50">Email</p>
                  <p className="text-lg font-semibold text-fitnix-off-white break-all">{member.current_trainer.email || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-fitnix-off-white/50">No trainer assigned</p>
            )}
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="fitnix-card-glow">
          <h2 className="text-2xl font-bold text-fitnix-gold mb-6 flex items-center">
            <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Attendance Statistics
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-fitnix-dark-light border border-fitnix-gold/30 rounded-lg p-4">
              <p className="text-sm text-fitnix-off-white/50 mb-1">Total Check-ins</p>
              <p className="text-3xl font-bold text-fitnix-gold">{member.attendance_stats?.total_checkins || 0}</p>
            </div>
            <div className="bg-fitnix-dark-light border border-fitnix-gold/30 rounded-lg p-4">
              <p className="text-sm text-fitnix-off-white/50 mb-1">Days Attended (Current Period)</p>
              <p className="text-3xl font-bold text-fitnix-gold">{member.attendance_stats?.days_attended_current_period || 0}</p>
            </div>
            <div className="bg-fitnix-dark-light border border-fitnix-gold/30 rounded-lg p-4">
              <p className="text-sm text-fitnix-off-white/50 mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-fitnix-gold">{member.attendance_stats?.attendance_rate || 0}%</p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-fitnix-off-white mb-4">Monthly Breakdown (Last 12 Months)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {member.attendance_stats?.monthly_breakdown && 
                Object.entries(member.attendance_stats.monthly_breakdown)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([key, data]) => (
                    <div key={key} className="bg-fitnix-dark border border-fitnix-off-white/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-fitnix-off-white/50 mb-1">{data.month}</p>
                      <p className="text-xl font-bold text-fitnix-gold">{data.count}</p>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Membership History - Timeline + Table */}
        <div className="fitnix-card-glow">
          <h2 className="text-2xl font-bold text-fitnix-gold mb-6 flex items-center">
            <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Membership History
          </h2>

          {member.membership_history && member.membership_history.length > 0 ? (
            <>
              {/* Timeline View */}
              <div className="mb-8 overflow-x-auto">
                <div className="min-w-full inline-block">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-fitnix-gold/20"></div>
                    
                    {/* Timeline items */}
                    <div className="flex justify-between items-center relative z-10 pb-4">
                      {member.membership_history.map((period, index) => (
                        <div key={index} className="flex flex-col items-center min-w-[120px] px-2">
                          <div className="w-4 h-4 rounded-full bg-fitnix-gold border-4 border-fitnix-dark mb-2"></div>
                          <div className="text-center">
                            <p className="text-xs text-fitnix-gold font-semibold">{period.package_name}</p>
                            <p className="text-xs text-fitnix-off-white/50 mt-1">
                              {new Date(period.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-fitnix-off-white/50">to</p>
                            <p className="text-xs text-fitnix-off-white/50">
                              {new Date(period.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table View */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-fitnix-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Package</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Start Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">End Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Amount Paid</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Trainer</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {member.membership_history.map((period, index) => (
                      <tr key={index} className="border-b border-fitnix-off-white/5 hover:bg-fitnix-dark-light/30 transition-colors">
                        <td className="py-4 px-4 text-fitnix-off-white font-semibold">{period.package_name}</td>
                        <td className="py-4 px-4 text-fitnix-off-white">{formatDate(period.start_date)}</td>
                        <td className="py-4 px-4 text-fitnix-off-white">{formatDate(period.end_date)}</td>
                        <td className="py-4 px-4 text-fitnix-gold font-semibold">{formatCurrency(period.amount_paid)}</td>
                        <td className="py-4 px-4 text-fitnix-off-white">{period.trainer_name || 'No Trainer'}</td>
                        <td className="py-4 px-4 text-fitnix-off-white">{formatDate(period.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-fitnix-off-white/50 text-center py-8">No membership history available</p>
          )}
        </div>

        {/* Payment History */}
        <div className="fitnix-card-glow">
          <h2 className="text-2xl font-bold text-fitnix-gold mb-6 flex items-center">
            <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment History
          </h2>

          {member.transactions && member.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-fitnix-gold/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-fitnix-gold uppercase tracking-wide">Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {member.transactions.map((txn, index) => (
                    <tr key={index} className="border-b border-fitnix-off-white/5 hover:bg-fitnix-dark-light/30 transition-colors">
                      <td className="py-4 px-4 text-fitnix-off-white">{formatDate(txn.created_at)}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          txn.transaction_type === 'ADMISSION' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : txn.transaction_type === 'PACKAGE'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-fitnix-gold font-semibold">{formatCurrency(txn.amount)}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          txn.status === 'COMPLETED' 
                            ? 'bg-green-500/20 text-green-400' 
                            : txn.status === 'PENDING'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-fitnix-off-white">{formatDate(txn.due_date)}</td>
                      <td className="py-4 px-4 text-fitnix-off-white">{formatDate(txn.paid_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-fitnix-off-white/50 text-center py-8">No payment history available</p>
          )}
        </div>
          </>
        )}
      </div>

      {/* Set Password Modal */}
      {showSetPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-fitnix-dark border-2 border-fitnix-gold rounded-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-fitnix-gold flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Set Password
              </h3>
              <button
                onClick={() => {
                  setShowSetPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-fitnix-off-white/60 hover:text-fitnix-off-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-fitnix-off-white/70 mb-4">
              Set a new password for <span className="text-fitnix-gold font-semibold">{member?.full_name}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="fitnix-input"
                  placeholder="Enter new password"
                  autoComplete="off"
                />
                <p className="text-xs text-fitnix-off-white/50 mt-1">
                  Minimum 6 characters
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-fitnix-off-white/80 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="fitnix-input"
                  placeholder="Confirm new password"
                  autoComplete="off"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSetPassword}
                disabled={passwordLoading}
                className="flex-1 fitnix-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Setting...' : 'Set Password'}
              </button>
              <button
                onClick={() => {
                  setShowSetPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="flex-1 fitnix-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Email Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-fitnix-dark border-2 border-fitnix-gold rounded-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-fitnix-gold flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Reset Password via Email
              </h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-fitnix-off-white/60 hover:text-fitnix-off-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-400 font-semibold">Send Password Reset Email</p>
                  <p className="text-xs text-blue-300 mt-1">
                    A password reset link will be sent to <span className="font-semibold">{member?.email}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-fitnix-off-white/70 mb-6">
              The member will receive an email with instructions to reset their password. The link will be valid for 24 hours.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleResetPasswordEmail}
                disabled={passwordLoading}
                className="flex-1 fitnix-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Sending...' : 'Send Email'}
              </button>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="flex-1 fitnix-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
