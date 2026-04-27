import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const updateFrame = async ({ id, data }) => {
  if (!id) throw new Error("Frame ID is required for update");
  const res = await api.put(API_ENDPOINTS.FRAME.BY_ID(id), data);
  return res.data;
};

export function useUpdateFrame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFrame,
    onSuccess: (response) => {
      // Invalidate specific frame query
      queryClient.invalidateQueries({ queryKey: ["frame", response.data?.id] });
      // Refresh list
      queryClient.refetchQueries({ queryKey: ["frames_paginated"] });
    },
  });
}
export default useUpdateFrame;