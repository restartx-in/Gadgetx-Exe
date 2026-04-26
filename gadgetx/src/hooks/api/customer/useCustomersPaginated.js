import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams'

async function fetchCustomersPaginated(filters) {
  const params = { ...filters, type: 'customer' }
  const query = buildQueryParams(params)
  const url = `${API_ENDPOINTS.PARTIES.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useCustomersPaginated(filters = {}) {
  return useQuery({
    queryKey: ['customers_paginated', filters],
    queryFn: () => fetchCustomersPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useCustomersPaginated