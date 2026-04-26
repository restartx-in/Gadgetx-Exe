import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

async function fetchSaleReturnById(id) {
  // Changed from fetchSaleById to be specific
  if (!id) return null
  const response = await api.get(API_ENDPOINTS.SALE_RETURNS.BY_ID(id)) // Use SALE_RETURNS endpoint
  return response.data
}

export function useSaleReturnById(id, enabled = true) {
  // Changed from useSaleById
  return useQuery({
    queryKey: ['saleReturn', id], // Changed queryKey for clarity
    queryFn: () => fetchSaleReturnById(id),
    enabled: !!id && enabled,
  })
}

export default useSaleReturnById
