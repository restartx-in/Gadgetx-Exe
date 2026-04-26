import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useCreateDoneBy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (doneByData) => {
      const res = await api.post(
        API_ENDPOINTS.DONE_BYS.BASE, // Assumes API_ENDPOINTS.DONE_BYS is configured in your api config
        doneByData,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['done_bys'] })
    },
  })
}