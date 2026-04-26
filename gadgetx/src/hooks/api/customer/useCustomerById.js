import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

async function fetchCustomerById(id) {
  // Calls the generic party endpoint
  const res = await api.get(API_ENDPOINTS.PARTIES.BY_ID(id))
  return res.data
}

export function useCustomerById(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomerById(id),
    enabled: !!id,
  })
}

export default useCustomerById