// src/hooks/api/ledger/useLedgerPaginated.js
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'
import buildQueryParams from '@/utils/buildQueryParams.js'

async function fetchLedgersPaginated(filters) {
  const query = buildQueryParams(filters)
  const url = `${API_ENDPOINTS.LEDGERS.PAGINATED}${query}`
  const res = await api.get(url)
  return res.data || []
}

export function useLedgerPaginated(filters = {}) {
  return useQuery({
    queryKey: ['ledgers_paginated', filters],
    queryFn: () => fetchLedgersPaginated(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}

export default useLedgerPaginated