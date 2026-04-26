import { useMutation } from '@tanstack/react-query'
import api from '@/utils/axios/api.js'

export function useSignup() {
  return useMutation({
    mutationFn: async (signupData) => {
      const res = await api.post('/auth/signup', signupData)
      return res.data
    },
  })
}