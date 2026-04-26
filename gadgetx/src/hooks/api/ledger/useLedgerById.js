// src/hooks/api/ledger/useLedgerById.js
import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

async function fetchLedgerById(id) {
  if (!id) {
    console.warn('useLedgerById hook: ID is undefined, skipping fetch.')
    return null
  }

  try {
    const res = await api.get(API_ENDPOINTS.LEDGERS.BY_ID(id))
    console.log('Ledger by ID API response:', res.data)
    return res.data
  } catch (error) {
    console.error(`Error fetching ledger with ID ${id}:`, error)
    throw error
  }
}

export function useLedgerById(id) {
  return useQuery({
    queryKey: ['ledger', id],
    queryFn: () => fetchLedgerById(id),
    enabled: !!id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })
}

export default useLedgerById