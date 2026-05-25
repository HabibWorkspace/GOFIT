import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fitcore-backend.onrender.com/api'

// Create axios instance with timeout and retry configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout (reduced from 30s)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to check if error is retryable
const isRetryableError = (error) => {
  if (!error.response) {
    // Network errors (ERR_CONNECTION_RESET, ERR_CONNECTION_REFUSED, etc.)
    return true
  }
  
  const status = error.response.status
  // Retry on 5xx errors and 429 (rate limit)
  return status >= 500 || status === 429
}

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add cache control headers to prevent caching
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    config.headers['Pragma'] = 'no-cache'
    config.headers['Expires'] = '0'
    
    // Add retry count to config
    config.retryCount = config.retryCount || 0
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and retries
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    
    // Check if we should retry
    if (config && config.retryCount < MAX_RETRIES && isRetryableError(error)) {
      config.retryCount += 1
      
      console.log(`Retrying request (${config.retryCount}/${MAX_RETRIES}): ${config.url}`)
      
      // Wait before retrying (exponential backoff)
      await wait(RETRY_DELAY * config.retryCount)
      
      // Retry the request
      return apiClient(config)
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Only logout if it's an authentication error, not authorization
      const errorMessage = error.response?.data?.error || ''
      
      // Don't logout for authorization errors (403-like messages in 401)
      if (errorMessage.includes('Only members') || 
          errorMessage.includes('Insufficient permissions') ||
          errorMessage.includes('Unauthorized')) {
        // This is an authorization issue, not authentication - don't logout
        return Promise.reject(error)
      }
      
      // Token expired or invalid - logout
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    // Log connection errors for debugging
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        url: config?.url,
        method: config?.method,
        retries: config?.retryCount || 0
      })
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
