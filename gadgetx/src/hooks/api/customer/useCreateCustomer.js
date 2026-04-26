import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

// The mutation function now adds the 'type' field automatically
const createCustomer = async (data) => {
  const payload = { ...data, type: 'customer' }
  const res = await api.post(API_ENDPOINTS.PARTIES.BASE, payload)
  return res.data
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCustomer,
    // Invalidate the customer-specific queries
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['customers'] })
      queryClient.refetchQueries({ queryKey: ['customers_paginated'] })
      queryClient.refetchQueries({ queryKey: ['parties'] })
    },
  })
}
export default useCreateCustomer