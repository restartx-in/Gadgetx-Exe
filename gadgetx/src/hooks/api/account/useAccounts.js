import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchAccounts(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.ACCOUNTS.BASE}${query}`)
  return res.data || []
}

export function useAccounts(filters = {}) {
  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: () => fetchAccounts(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useAccounts