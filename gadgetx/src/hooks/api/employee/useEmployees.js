import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'
import buildQueryParams from '@/utils/buildQueryParams.js'


async function fetchEmployees(filters = {}) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.EMPLOYEE.BASE}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useEmployees(filters = {}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useEmployees
