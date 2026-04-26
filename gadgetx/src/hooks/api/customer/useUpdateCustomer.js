import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

const updateCustomer = async ({ id, customerData }) => {
  if (!id) throw new Error('Customer ID is required for update')
  const res = await api.put(API_ENDPOINTS.PARTIES.BY_ID(id), customerData)
  return res.data
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['customers'] })
      queryClient.refetchQueries({ queryKey: ['customers_paginated'] })
      queryClient.refetchQueries({ queryKey: ['parties'] })
    },
  })
}
export default useUpdateCustomer