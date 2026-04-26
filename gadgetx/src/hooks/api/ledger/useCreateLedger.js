// src/hooks/api/ledger/useCreateLedger.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useCreateLedger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      // NOTE: Ledger creation does not use FormData, passing data object directly
      const res = await api.post(API_ENDPOINTS.LEDGERS.BASE, data)
      return res.data
    },
    onSuccess: () => {
      // Invalidate all ledger-related queries on successful creation
      queryClient.refetchQueries({ queryKey: ['ledgers'] })
      queryClient.refetchQueries({ queryKey: ['ledgers_paginated'] })
    },
  })
}
export default useCreateLedger