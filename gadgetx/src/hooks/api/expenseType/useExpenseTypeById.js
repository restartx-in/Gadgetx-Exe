import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchExpenseTypeById(id) {
  if (!id) return null // Prevent fetching if no ID is provided
  const res = await api.get(API_ENDPOINTS.EXPENSE_TYPES.BY_ID(id))
  return res.data
}

export function useExpenseTypeById(id) {
  return useQuery({
    queryKey: ['expense_type', id], // Unique cache key for each expense type by ID
    queryFn: () => fetchExpenseTypeById(id),
    enabled: !!id, // Only run the query if 'id' is truthy
  })
}
