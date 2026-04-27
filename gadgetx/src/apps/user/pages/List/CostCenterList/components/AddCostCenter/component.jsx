
import React from "react";
import CommonCostCenterModal from "@/pages/CommonCostCenterModal"; 

import { useCreateCostCenter } from "@/apps/user/hooks/api/costCenter/useCreateCostCenter";
import { useUpdateCostCenter } from "@/apps/user/hooks/api/costCenter/useUpdateCostCenter";
import { useDeleteCostCenter } from "@/apps/user/hooks/api/costCenter/useDeleteCostCenter";


const AddCostCenter = ({
  isOpen,
  onClose,
  mode,
  selectedCostCenter, 
  onCostCenterCreated, 
}) => {

  return (
    <CommonCostCenterModal
      useCreateHook={useCreateCostCenter}
      useUpdateHook={useUpdateCostCenter}
      useDeleteHook={useDeleteCostCenter}
      
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedCostCenter} 
      onItemCreated={onCostCenterCreated} 
      
    />
  );
};

export default AddCostCenter;