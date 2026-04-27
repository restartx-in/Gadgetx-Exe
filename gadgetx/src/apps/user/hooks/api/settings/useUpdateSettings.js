import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      let userId = null;
      let settingsData = {};
      let url = API_ENDPOINTS.SETTINGS.BASE;

      if (variables && variables.userId !== undefined) {
        userId = variables.userId;
        settingsData = variables.settingsData;
        url = API_ENDPOINTS.SETTINGS.BY_USER_ID(userId);
      } else {
        settingsData = variables;
      }

      let payload;
      if (settingsData.logo && settingsData.logo instanceof File) {
        payload = new FormData();
        Object.entries(settingsData).forEach(([key, value]) => {
          if (key === "sidebar_labels" && typeof value === "object") {
            payload.append(key, JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            payload.append(key, value);
          }
        });
      } else {
        payload = settingsData;
      }

      const response = await api.put(url, payload);
      return response.data;
    },

    onSuccess: (data, variables) => {
      const userId =
        variables && variables.userId !== undefined
          ? variables.userId
          : undefined;
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
    },
  });
}

export default useUpdateSettings;
