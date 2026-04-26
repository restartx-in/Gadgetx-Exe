import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js' 
import { API_ENDPOINTS } from '@/config/api' 

async function fetchCategory(filters) {
  const res = await api.get(API_ENDPOINTS.CATEGORY.BASE, { params: filters })
  return res.data || []
}

export function useCategorys(filters = {}) {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: () => fetchCategory(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}