import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api'
import { API_ENDPOINTS } from '@/config/api'

async function fetchAccountById(id) {
  if (!id) {
    console.warn('useAccountById hook: ID is undefined, skipping fetch.')
    return null
  }

  try {
    const res = await api.get(API_ENDPOINTS.ACCOUNTS.BY_ID(id))
    return res.data
  } catch (error) {
    console.error(`Error fetching account with ID ${id}:`, error)
    throw error
  }
}

export function useAccountById(id) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => fetchAccountById(id),
    enabled: !!id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })
}

export default useAccountById