import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchJobSheets(filters = {}) {
  const query = buildQueryParams(filters)
  const res = await api.get(`${API_ENDPOINTS.JOBSHEETS.BASE}${query}`)
  return res.data || []
}

export function useJobSheets(filters = {}) {
  return useQuery({
    queryKey: ['jobsheets', filters],
    queryFn: () => fetchJobSheets(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useJobSheets