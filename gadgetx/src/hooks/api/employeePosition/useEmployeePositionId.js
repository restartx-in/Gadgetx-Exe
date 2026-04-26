import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchEmployeePositionById(id) {
  if (!id) return null 
  const res = await api.get(API_ENDPOINTS.EMPLOYEE_POSITION.BY_ID(id))
  return res.data
}

export function useEmployeePositionById(id) {
  return useQuery({
    queryKey: ['employee_position', id], 
    queryFn: () => fetchEmployeePositionById(id),
    enabled: !!id, 
  })
}
