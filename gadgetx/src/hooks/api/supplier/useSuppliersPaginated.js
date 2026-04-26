import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams'

async function fetchSuppliersPaginated(filters) {
  const params = { ...filters, type: 'supplier' }
  const query = buildQueryParams(params)
  const url = `${API_ENDPOINTS.PARTIES.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useSuppliersPaginated(filters = {}) {
  return useQuery({
    queryKey: ['suppliers_paginated', filters],
    queryFn: () => fetchSuppliersPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
export default useSuppliersPaginated