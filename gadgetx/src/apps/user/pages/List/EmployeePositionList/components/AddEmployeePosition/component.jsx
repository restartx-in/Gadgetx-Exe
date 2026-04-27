import React from "react";
import CommonEmployeePositionModal from "@/pages/CommonEmployeePositionModal"; 

import { useCreateEmployeePosition } from "@/apps/user/hooks/api/employeePosition/useCreateEmployeePosition";
import { useUpdateEmployeePosition } from "@/apps/user/hooks/api/employeePosition/useUpdateEmployeePosition";
import { useDeleteEmployeePosition } from "@/apps/user/hooks/api/employeePosition/useDeleteEmployeePosition";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";


const AddEmployeePosition = ({
  isOpen,
  onClose,
  mode,
  selectedEmployeePosition,
  onSuccess,
}) => {
  return (
    <CommonEmployeePositionModal
      useCreateHook={useCreateEmployeePosition}
      useUpdateHook={useUpdateEmployeePosition}
      useDeleteHook={useDeleteEmployeePosition}
      
      DoneByAutoCompleteComponent={DoneByAutoComplete}
      CostCenterAutoCompleteComponent={CostCenterAutoComplete}
      
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedEmployeePosition} 
      onItemCreated={onSuccess} 
    />
  );
};

export default AddEmployeePosition;