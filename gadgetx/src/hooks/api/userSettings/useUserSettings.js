import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/config/api';
import api from '@/utils/axios/api.js';


async function fetchUserSettingsById(id) {
  if (!id) return null;
  
  const res = await api.get(API_ENDPOINTS.USER_SETTINGS.BY_ID(id));
  return res.data;  
}


export function useUserSettings(id) {
  return useQuery({
    queryKey: ['userSettings', id],
    queryFn: () => fetchUserSettingsById(id),
    enabled: !!id,
    gcTime: Infinity,     
    staleTime: Infinity,
  });
}

export default useUserSettings;