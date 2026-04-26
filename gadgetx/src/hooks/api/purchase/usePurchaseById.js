// import { useQuery } from '@tanstack/react-query'
// import axios from 'axios'

// export default function usePurchaseById(id) {
//   return useQuery({
//     queryKey: ['purchase', id],
//     enabled: !!id,
//     queryFn: async () => {
//       const { data } = await axios.get(`/api/purchases/${id}`)
//       return data
//     },
//   })
// }
 

import { useQuery } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'
import { API_ENDPOINTS } from '@/config/api'

async function fetchPurchaseById(id) {
  if (!id) return null
  const res = await api.get(API_ENDPOINTS.PURCHASE.BY_ID(id))
  return res.data
}

export function usePurchaseById(id) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: () => fetchPurchaseById(id),
    enabled: !!id,
  })
}

export default usePurchaseById
