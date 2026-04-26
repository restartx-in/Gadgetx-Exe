// src/hooks/api/ledger/useUpdateLedger.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

export function useUpdateLedger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      // NOTE: Ledger update does not use FormData, passing data object directly
      const res = await api.put(API_ENDPOINTS.LEDGERS.BY_ID(id), data)
      return res.data
    },
    onSuccess: () => {
      // Invalidate all ledger-related queries on successful update
      queryClient.refetchQueries({ queryKey: ['ledgers'] })
      queryClient.refetchQueries({ queryKey: ['ledgers_paginated'] })
      // Optionally invalidate the specific ledger query
      // queryClient.refetchQueries({ queryKey: ['ledger', id] })
    },
  })
}
export default useUpdateLedger