import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchPartnership(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.PARTNERSHIPS.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function usePartnershipPaginated(filters = {}) {
  return useQuery({
    queryKey: ['partnership_paginated', filters],
    queryFn: () => fetchPartnership(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default usePartnershipPaginated
