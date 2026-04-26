import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js' // Assuming you have an axios instance setup
import { API_ENDPOINTS } from '@/config/api' // Assuming API_ENDPOINTS is configured

async function fetchBrands(filters) {
  const res = await api.get(API_ENDPOINTS.BRAND.BASE, { params: filters })
  return res.data || []
}

export function useBrands(filters = {}) {
  return useQuery({
    queryKey: ['brand', filters], 
    queryFn: () => fetchBrands(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}