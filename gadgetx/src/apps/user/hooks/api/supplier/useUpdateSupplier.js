import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";

const updateSupplier = async ({ id, supplierData }) => {
  if (!id) throw new Error("Supplier ID is required for update");
  const res = await api.put(API_ENDPOINTS.PARTIES.BY_ID(id), supplierData);
  return res.data;
};

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSupplier,
    onSuccess: (updatedSupplier) => {
       queryClient.invalidateQueries({
        queryKey: ["supplier", updatedSupplier.id],
      });
      queryClient.setQueriesData({ queryKey: ["suppliers"] }, (oldData) => {
        if (!oldData) {
          return oldData;
        }
        return oldData.map((item) =>
          item.id === updatedSupplier.id ? updatedSupplier : item,
        );
      });
      queryClient.refetchQueries({ queryKey: ["suppliers_paginated"] });
      queryClient.refetchQueries({ queryKey: ["ledgers_paginated"] });

    },
  });
}
export default useUpdateSupplier;
