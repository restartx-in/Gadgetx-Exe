import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchCashBookById(id) {
  if (!id) return null
  const res = await api.get(API_ENDPOINTS.CASH_BOOK.BY_ID(id))
  return res.data
}

export function useCashBookById(id) {
  return useQuery({
    queryKey: ['cash_book', id],
    queryFn: () => fetchCashBookById(id),
    enabled: !!id,
  })
}

export default useCashBookById