import useBuildUpdate from "@/apps/buildx/hooks/api/tenant/useUpdateTenant";
import usePhysiqueUpdate from "@/apps/physiquex/hooks/api/tenant/useUpdateTenant";
import useWheelUpdate from "@/apps/wheelx/hooks/api/tenant/useUpdateTenant";
import useGadgetUpdate from "@/apps/user/hooks/api/tenant/useUpdateTenant";
import useInvoiceUpdate from "@/apps/invoicex/hooks/api/tenant/useUpdateTenant";
import useTravelUpdate from "@/apps/travelx/hooks/api/tenant/useUpdateTenant";
import useInventoryUpdate from "@/apps/inventoryx/hooks/api/tenant/useUpdateTenant";
import useOpticalUpdate from "@/apps/opticalx/hooks/api/tenant/useUpdateTenant";


export default function useAllUpdateTenant() {
  const { mutateAsync: updateBuild, isLoading: loadingB } = useBuildUpdate();
  const { mutateAsync: updatePhysique, isLoading: loadingP } =
    usePhysiqueUpdate();
  const { mutateAsync: updateWheel, isLoading: loadingW } = useWheelUpdate();
  const { mutateAsync: updateGadget, isLoading: loadingG } = useGadgetUpdate();
  const { mutateAsync: updateTravel, isLoading: loadingT } = useTravelUpdate();
  const { mutateAsync: updateInvoice, isLoading: loadingI } =
    useInvoiceUpdate(); 
  const { mutateAsync: updateInventory, isLoading: loadingIv } = useInventoryUpdate();
  const { mutateAsync: updateOptical, isLoading: loadingO } = useOpticalUpdate();

  const updateTenantUnified = async ({ id, data }, source) => {
    const payload = { id, data };

    switch (source) {
      case "BuildX":
        return await updateBuild(payload);
      case "PhysiqueX":
        return await updatePhysique(payload);
      case "WheelX":
        return await updateWheel(payload);
      case "GadgetX":
        return await updateGadget(payload);
      case "TravelX":
        return await updateTravel(payload);
      case "InvoiceX":
        return await updateInvoice(payload);
      case "InventoryX":
        return await updateInventory(payload);
      case "optical":
        return await updateOptical(payload);

      default:
        throw new Error(`Unknown source: ${source}`);
    }
  };

  return {
    updateTenant: updateTenantUnified,
    isLoading:
      loadingP || loadingW || loadingB || loadingG || loadingI || loadingT || loadingIv || loadingO, 
  };
}
