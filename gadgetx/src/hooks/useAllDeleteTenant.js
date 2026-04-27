import usePhysiqueDelete from "@/apps/physiquex/hooks/api/tenant/useDeleteTenant";
import useWheelDelete from "@/apps/wheelx/hooks/api/tenant/useDeleteTenant";
import useBuildDelete from "@/apps/buildx/hooks/api/tenant/useDeleteTenant";
import useGadgetDelete from "@/apps/user/hooks/api/tenant/useDeleteTenant";
import useInvoiceDelete from "@/apps/invoicex/hooks/api/tenant/useDeleteTenant"; 
import useTravelDelete from "@/apps/travelx/hooks/api/tenant/useDeleteTenant";
import useInventoryDelete from "@/apps/inventoryx/hooks/api/tenant/useDeleteTenant";
import useOpticalDelete from "@/apps/opticalx/hooks/api/tenant/useDeleteTenant";

export default function useAllDeleteTenant() {
  const { mutateAsync: deletePhysique } = usePhysiqueDelete();
  const { mutateAsync: deleteWheel } = useWheelDelete();
  const { mutateAsync: deletebuild } = useBuildDelete();
  const { mutateAsync: deleteGadget } = useGadgetDelete();
  const { mutateAsync: deleteInvoice } = useInvoiceDelete();
  const { mutateAsync: deleteTravel } = useTravelDelete();
  const { mutateAsync: deleteInventory } = useInventoryDelete();
  const { mutateAsync: deleteOptical } = useOpticalDelete();

  const deleteTenantUnified = async (id, source) => {
    switch (source) {
      case "PhysiqueX": return await deletePhysique(id);
      case "WheelX": return await deleteWheel(id);
      case "BuildX": return await deletebuild(id);
      case "GadgetX": return await deleteGadget(id); 
      case "TravelX": return await deleteTravel(id);
      case "InvoiceX": return await deleteInvoice(id); 
      case "InventoryX": return await deleteInventory(id);
      case "optical": return await deleteOptical(id);
      default: throw new Error(`Unknown source application: ${source}`);
    }
  };

  return { deleteTenant: deleteTenantUnified };
}