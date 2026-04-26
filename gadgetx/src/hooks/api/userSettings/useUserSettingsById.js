import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';


async function fetchUserSettingsById(userId) {
  if (!userId) {
    return null;
  }
  
  const url = API_ENDPOINTS.USER_SETTINGS.BY_ID(userId);
  
  const response = await api.get(url);
  
  return response.data;
}


export function useUserSettingsById(userId) {
  return useQuery({
 
    queryKey: ['userSettings', userId],

    queryFn: () => fetchUserSettingsById(userId),

    enabled: !!userId,
    gcTime: Infinity,     
    staleTime: Infinity,
  });
}


export default useUserSettingsById;