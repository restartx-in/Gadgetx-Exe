import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js' 
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams'

async function fetchEmployeePosition(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.EMPLOYEE_POSITION.BASE}${query}`)
  return res.data || []
}

export function useEmployeePosition(filters = {}) {
  return useQuery({
    queryKey: ['employee_position', filters], 
    queryFn: () => fetchEmployeePosition(filters),
     gcTime: Infinity,
    staleTime: Infinity,
  })
}