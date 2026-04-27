import usePhysiqueCreate from "@/apps/physiquex/hooks/api/tenant/useCreateTenant";
import useWheelCreate from "@/apps/wheelx/hooks/api/tenant/useCreateTenant";
import useBuildCreate from "@/apps/buildx/hooks/api/tenant/useCreateTenant";
import useGadgetCreate from "@/apps/user/hooks/api/tenant/useCreateTenant"; // Added
import useInvoiceCreate from "@/apps/invoicex/hooks/api/tenant/useCreateTenant"; // Added
import useTravelCreate from "@/apps/travelx/hooks/api/tenant/useCreateTenant"; // Added
import useInventoryCreate from "@/apps/inventoryx/hooks/api/tenant/useCreateTenant";
import useOpticalCreate from "@/apps/user/hooks/api/tenant/useCreateTenant";

export default function useAllCreateTenant() {
  const { mutateAsync: createPhysique, isLoading: loadingP } =
    usePhysiqueCreate();
  const { mutateAsync: createWheel, isLoading: loadingW } = useWheelCreate();
  const { mutateAsync: createBuild, isLoading: loadingB } = useBuildCreate();
  const { mutateAsync: createGadget, isLoading: loadingG } = useGadgetCreate();
  const { mutateAsync: createInvoice, isLoading: loadingI } =
    useInvoiceCreate();
  const { mutateAsync: createTravel, isLoading: loadingT } = useTravelCreate();
  const { mutateAsync: createInventory, isLoading: loadingIv } = useInventoryCreate();
  const { mutateAsync: createOptical, isLoading: loadingO } = useOpticalCreate();

  const createTenantUnified = async (data, source) => {
    switch (source) {
      case "PhysiqueX":
        return await createPhysique(data);
      case "WheelX":
        return await createWheel(data);
      case "BuildX":
        return await createBuild(data);
      case "GadgetX":
        return await createGadget(data);
      case "TravelX":
        return await createTravel(data);
      case "InvoiceX":
        return await createInvoice(data);
      case "InventoryX":
        return await createInventory(data);
      case "optical":
        return await createOptical(data);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  };

  return {
    createTenant: createTenantUnified,
    isLoading:
      loadingP || loadingW || loadingB || loadingG || loadingI || loadingT || loadingIv, // Updated
  };
}
