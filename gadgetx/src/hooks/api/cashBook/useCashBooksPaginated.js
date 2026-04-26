import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchCashBooks(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.CASH_BOOK.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useCashBooksPaginated(filters = {}) {
  return useQuery({
    queryKey: ['cash_books_paginated', filters],
    queryFn: () => fetchCashBooks(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useCashBooksPaginated
