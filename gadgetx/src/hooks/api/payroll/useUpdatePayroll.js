// src/hooks/payroll/useUpdatePayroll.js

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useUpdatePayroll() {
  const queryClient = useQueryClient()

  const updatePayroll = async ({ id, payrollData }) => {
    return api.put(API_ENDPOINTS.PAYROLL.BY_ID(id), payrollData)
  }

  const mutation = useMutation({
    mutationFn: updatePayroll,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['payroll'] })
      queryClient.refetchQueries({ queryKey: ['payroll_paginated'] })
    },
  })

  return mutation
}

export default useUpdatePayroll
