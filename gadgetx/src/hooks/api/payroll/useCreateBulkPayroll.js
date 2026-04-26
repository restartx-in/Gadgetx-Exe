import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

/**
 * API call function to create payroll records in bulk.
 * @param {Array<object>} bulkData - An array of payroll objects.
 */
const createBulkPayroll = async (bulkData) => {
  return api.post(API_ENDPOINTS.PAYROLL.BULK, bulkData)
}

/**
 * Custom hook for creating bulk payroll records.
 */
export function useCreateBulkPayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBulkPayroll,
    onSuccess: () => {
      // Refetch payroll lists to reflect the newly created records.
      queryClient.refetchQueries({ queryKey: ['payrolls'] })
      queryClient.refetchQueries({ queryKey: ['payrolls_paginated'] })
    },
  })
}

export default useCreateBulkPayroll