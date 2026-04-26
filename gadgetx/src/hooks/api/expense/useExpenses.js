import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'


async function fetchExpenses(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.EXPENSES.BASE}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useExpenses(filters = {}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => fetchExpenses(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useExpenses