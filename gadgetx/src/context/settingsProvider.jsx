import axios from 'axios'
import { API_BASE_URL } from '@/config/api'

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
});

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          localStorage.clear()
          window.location.hash = '#/login'
          return Promise.reject(error)
        }
        
        const response = await refreshApi.post('/auth/refreshToken', { refreshToken })
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data

        localStorage.setItem('access_token', newAccessToken)
        localStorage.setItem('refresh_token', newRefreshToken)

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        if (refreshError.response && (refreshError.response.status === 401 || refreshError.response.status === 403)) {
          localStorage.clear()
          window.location.hash = '#/login'
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export default api