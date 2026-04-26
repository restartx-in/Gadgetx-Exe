// src/hooks/items/useItemById.js
import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

async function fetchItemById(id) {
  if (!id) {
    console.warn('useItemById hook: ID is undefined, skipping fetch.')
    return null
  }

  try {
    const res = await api.get(API_ENDPOINTS.ITEMS.BY_ID(id))
    console.log('Item by ID API response:', res.data)
    return res.data
  } catch (error) {
    console.error(`Error fetching item with ID ${id}:`, error)
    throw error
  }
}

export function useItemById(id) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItemById(id),
    enabled: !!id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })
}

export default useItemById