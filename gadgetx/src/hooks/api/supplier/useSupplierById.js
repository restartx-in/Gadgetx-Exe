import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

async function fetchSupplierById(id) {
  const res = await api.get(API_ENDPOINTS.PARTIES.BY_ID(id))
  return res.data
}

export function useSupplierById(id) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => fetchSupplierById(id),
    enabled: !!id,
  })
}
export default useSupplierById