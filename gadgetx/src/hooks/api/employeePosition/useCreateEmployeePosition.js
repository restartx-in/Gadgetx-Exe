import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateEmployeePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (employeePositionData) => {
      const res = await api.post(
        API_ENDPOINTS.EMPLOYEE_POSITION.BASE,
        employeePositionData,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['employee_position'] })
      queryClient.refetchQueries({ queryKey: ['employees'] })
    },
  })
}
