import axios, { AxiosError } from 'axios'
import { isOnline, addToOfflineQueue, processOfflineQueue } from '@/lib/utils/offline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and offline queue
apiClient.interceptors.response.use(
  (response) => {
    // Process offline queue when online and request succeeds
    if (isOnline()) {
      processOfflineQueue(apiClient).catch(console.error)
    }
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as any
    
    // Handle network errors (offline)
    if (!error.response && config && isOnline() === false) {
      // Add to offline queue for POST, PUT, DELETE
      if (config.method && ['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
        addToOfflineQueue(
          config.method.toUpperCase() as 'POST' | 'PUT' | 'DELETE',
          config.url || '',
          config.data
        )
        // Return a promise that resolves when back online
        return Promise.reject(new Error('OFFLINE'))
      }
    }
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/'
    }
    
    return Promise.reject(error)
  }
)

// Process offline queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processOfflineQueue(apiClient).catch(console.error)
  })
}

