import React from "react";
import CommonExpenseTypeModal from "@/pages/CommonExpenseTypeModal"; 

import { useCreateExpenseType } from "@/apps/user/hooks/api/expenseType/useCreateExpenseType";
import { useUpdateExpenseType } from "@/apps/user/hooks/api/expenseType/useUpdateExpenseType";
import { useDeleteExpenseType } from "@/apps/user/hooks/api/expenseType/useDeleteExpenseType";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";


const AddExpenseType = ({
  isOpen,
  onClose,
  mode,
  selectedExpenseType, 
  onExpenseTypeCreated, 
}) => {
  return (
    <CommonExpenseTypeModal
      useCreateHook={useCreateExpenseType}
      useUpdateHook={useUpdateExpenseType}
      useDeleteHook={useDeleteExpenseType}
      
      DoneByAutoCompleteComponent={DoneByAutoComplete}
      CostCenterAutoCompleteComponent={CostCenterAutoComplete}
      
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedExpenseType} 
      onItemCreated={onExpenseTypeCreated} 
    />
  );
};

export default AddExpenseType;