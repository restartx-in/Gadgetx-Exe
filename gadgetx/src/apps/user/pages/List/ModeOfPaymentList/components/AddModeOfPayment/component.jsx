import React from "react";
import { useCreateModeOfPayment } from "@/apps/user/hooks/api/modeOfPayment/useCreateModeOfPayment";
import { useUpdateModeOfPayment } from "@/apps/user/hooks/api/modeOfPayment/useUpdateModeOfPayment";
import { useDeleteModeOfPayment } from "@/apps/user/hooks/api/modeOfPayment/useDeleteModeOfPayment";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import CommonModeOfPaymentModal from "@/pages/CommonModeOfPaymentModal"; 

const AddModeOfPayment = ({
  isOpen,
  onClose,
  mode,
  selectedMOP,
  onMOPCreated,
}) => {
  return (
    <CommonModeOfPaymentModal
      useCreateHook={useCreateModeOfPayment}
      useUpdateHook={useUpdateModeOfPayment}
      useDeleteHook={useDeleteModeOfPayment}
      
      DoneBySelectorComponent={DoneByAutoCompleteWithAddOption}
      CostCenterSelectorComponent={CostCenterAutoCompleteWithAddOption}
      LedgerSelectorComponent={LedgerAutoCompleteWithAddOptionWithBalance}

      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedMOP}
      onItemCreated={onMOPCreated} 
    />
  );
};

export default AddModeOfPayment;