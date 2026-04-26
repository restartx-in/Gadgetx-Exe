import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config/api'
import api from '@/utils/axios/api.js'

export function useDeleteUser() {
  const queryClient = useQueryClient()

  const deleteUser = async (id) => {
    return api.delete(API_ENDPOINTS.USERS.BY_ID(id))
  }

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] })
    },
  })
}
export default useDeleteUser
