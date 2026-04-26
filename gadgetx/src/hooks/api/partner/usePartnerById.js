import { useQuery } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api'

async function fetchPartnerById(id) {
  if (!id) {
    console.warn('usePartnerById hook: ID is undefined, skipping fetch.')
    return null
  }

  try {
    const res = await api.get(API_ENDPOINTS.PARTNERS.BY_ID(id)) // ✅ Correct: PARTNERS
    console.log('Partner by ID API response:', res.data)
    return res.data
  } catch (error) {
    console.error(`Error fetching partner with ID ${id}:`, error)
    throw error
  }
}

export function usePartnerById(id) {
  return useQuery({
    queryKey: ['partner', id],
    queryFn: () => fetchPartnerById(id),
    enabled: !!id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })
}

export default usePartnerById
