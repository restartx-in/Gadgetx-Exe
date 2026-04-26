import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  const deleteEmployee = async (id) => {
    return api.delete(API_ENDPOINTS.EMPLOYEE.BY_ID(id))
  }

  const mutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employees'] })
      queryClient.refetchQueries({ queryKey: ['employees_paginated'] })
    },
  })
  return mutation
}
export default useDeleteEmployee
