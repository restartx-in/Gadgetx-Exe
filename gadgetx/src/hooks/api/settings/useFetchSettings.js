
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

export function useFetchSettings(userId) {
  return useQuery({
    queryKey: ['settings', userId], 
    queryFn: async () => {
      const url = userId ? API_ENDPOINTS.SETTINGS.BY_USER_ID(userId) : API_ENDPOINTS.SETTINGS.BASE;
      const response = await api.get(url)
      return response.data
    },
     gcTime: Infinity,
    staleTime: Infinity,
    enabled: userId === undefined || !!userId, 
  })
}
export default useFetchSettings