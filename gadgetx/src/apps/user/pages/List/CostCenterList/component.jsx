import React, { useMemo } from "react";
import { useCostCenters } from "@/apps/user/hooks/api/costCenter/useCostCenters";
import { useDeleteCostCenter } from "@/apps/user/hooks/api/costCenter/useDeleteCostCenter";
import AddCostCenter from "./components/AddCostCenter";
import CommonCostCenterList from "@/pages/CommonCostCenterList";

const CostCenterList = () => {
  const { data: listData, isLoading } = useCostCenters();
  const { mutateAsync: deleteItem } = useDeleteCostCenter();
  const list = useMemo(() => listData || [], [listData]);

  return (
    <CommonCostCenterList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      AddCostCenterModal={AddCostCenter}
    />
  );
};

export default CostCenterList;
