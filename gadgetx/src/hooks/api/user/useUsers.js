import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchUsers(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.USERS.BASE}${query}`
  const res = await api.get(url)
  return res.data 
}

export function useUsers(filters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => fetchUsers(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
export default useUsers