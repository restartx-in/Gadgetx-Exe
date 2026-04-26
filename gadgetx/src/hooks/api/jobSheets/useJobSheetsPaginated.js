import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchPaginatedJobSheets(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.JOBSHEETS.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useJobSheetsPaginated(filters = {}) {
  return useQuery({
    queryKey: ['jobsheets_paginated', filters],
    queryFn: () => fetchPaginatedJobSheets(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}
export default useJobSheetsPaginated