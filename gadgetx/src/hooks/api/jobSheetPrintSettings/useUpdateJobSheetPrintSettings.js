import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useUpdateJobSheetPrintSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      // Payload can be JSON object or FormData (for image uploads)
      const response = await api.put(API_ENDPOINTS.JOB_SHEET_PRINT_SETTINGS, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-print-settings'] })
    },
  })
}

export default useUpdateJobSheetPrintSettings