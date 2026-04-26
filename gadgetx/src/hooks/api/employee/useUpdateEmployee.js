import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  const updateEmployee = async ({ id, employeeData }) => {
    return api.put(API_ENDPOINTS.EMPLOYEE.BY_ID(id), employeeData)
  }

  const mutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employees'] })
      queryClient.refetchQueries({ queryKey: ['employees_paginated'] })
    },
  })

  return mutation
}
export default useUpdateEmployee
