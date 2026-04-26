import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

const createSupplier = async (data) => {
  const payload = { ...data, type: 'supplier' }
  const res = await api.post(API_ENDPOINTS.PARTIES.BASE, payload)
  return res.data
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['suppliers'] })
      queryClient.refetchQueries({ queryKey: ['suppliers_paginated'] })
    },
  })
}
export default useCreateSupplier