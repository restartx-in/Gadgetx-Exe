import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchUnits(filters) {
  const res = await api.get(API_ENDPOINTS.UNITS.BASE, { params: filters })
  return res.data || []
}

export function useUnits(filters = {}) {
  return useQuery({
    queryKey: ['units', filters], 
    queryFn: () => fetchUnits(filters),
    gcTime: Infinity,
    staleTime: Infinity,
  })
}