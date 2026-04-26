import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateExpenseType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (expenseTypeData) => {
      const res = await api.post(
        API_ENDPOINTS.EXPENSE_TYPES.BASE,
        expenseTypeData,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_types'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      // queryClient.invalidateQueries({ queryKey: ['expenses_paginated'] });
    },
  })
}
