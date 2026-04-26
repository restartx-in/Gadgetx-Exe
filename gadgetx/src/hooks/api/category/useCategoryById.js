import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchCategoryById(id) {
  if (!id) return null 
    const res = await api.get(API_ENDPOINTS.CATEGORY.BY_ID(id))
  return res.data
}

export function useCategoryById(id) {
  return useQuery({
    queryKey: ['category', id], // Unique cache key for each category by ID
    queryFn: () => fetchCategoryById(id),
    enabled: !!id, // Only run the query if 'id' is truthy
  })
}