import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchPartners(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.PARTNERS.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function usePartnersPaginated(filters = {}) {
  return useQuery({
    queryKey: ['partners_paginated', filters],
    queryFn: () => fetchPartners(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default usePartnersPaginated
