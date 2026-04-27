import { useMemo } from "react";
import useGadgetTenants from "@/apps/user/hooks/api/tenant/useTenants";
import usePhysiqueTenants from "@/apps/physiquex/hooks/api/tenant/useTenants";
import useWheelTenants from "@/apps/wheelx/hooks/api/tenant/useTenants";
import useBuildTenants from "@/apps/buildx/hooks/api/tenant/useTenants";
import useInvoiceTenants from "@/apps/invoicex/hooks/api/tenant/useTenants";
import useTravelTenants from "@/apps/travelx/hooks/api/tenant/useTenants";
import useInventoryTenants from "@/apps/inventoryx/hooks/api/tenant/useTenants";
import useOpticalTenants from "@/apps/opticalx/hooks/api/tenant/useTenants";

export default function useAllTenants() {
  const physiqueQuery = usePhysiqueTenants();
  const wheelQuery = useWheelTenants();
  const buildQuery = useBuildTenants();
  const gadgetQuery = useGadgetTenants();
  const travelQuery = useTravelTenants();
  const invoiceQuery = useInvoiceTenants();
  const inventoryQuery = useInventoryTenants();
  const opticalQuery = useOpticalTenants();

  const mergedData = useMemo(() => {
    // 1. Define a helper to format AND filter by specific type
    const formatAndFilter = (list, type, sourcePrefix, sourceName) => {
      if (!list) return [];
      
      // Filter the list to ensure we only include tenants of the correct type
      const filteredList = list.filter((item) => item.type === type);

      return filteredList.map((item) => ({
        ...item,
        id: `${sourcePrefix}-${item.id}`,
        originalId: item.id,
        appSource: sourceName,
      }));
    };

    // 2. Map the data using the strict types defined in your database/add forms
    return [
      ...formatAndFilter(physiqueQuery.data, "fitness", "physique", "PhysiqueX"),
      ...formatAndFilter(wheelQuery.data, "vehicle", "wheel", "WheelX"),
      ...formatAndFilter(buildQuery.data, "buildx", "build", "BuildX"),
      ...formatAndFilter(gadgetQuery.data, "gadget", "gadget", "GadgetX"),
      ...formatAndFilter(travelQuery.data, "travelx", "travel", "TravelX"),
      ...formatAndFilter(invoiceQuery.data, "invoice", "invoice", "InvoiceX"),
      ...formatAndFilter(inventoryQuery.data, "inventory", "inventory", "InventoryX"),
      ...formatAndFilter(opticalQuery.data, "optical", "optical", "OpticalX"),
    ];
  }, [
    physiqueQuery.data,
    wheelQuery.data,
    buildQuery.data,
    gadgetQuery.data,
    travelQuery.data,
    invoiceQuery.data,
    inventoryQuery.data,
    opticalQuery.data,

  ]);

  const isLoading =
    physiqueQuery.isLoading ||
    wheelQuery.isLoading ||
    buildQuery.isLoading ||
    gadgetQuery.isLoading ||
    travelQuery.isLoading ||
    invoiceQuery.isLoading ||
    inventoryQuery.isLoading||
    opticalQuery.isLoading;

  return { data: mergedData, isLoading };
}