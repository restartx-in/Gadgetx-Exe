import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categoryData) => {
      const res = await api.post(
        API_ENDPOINTS.CATEGORY.BASE,
        categoryData,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}