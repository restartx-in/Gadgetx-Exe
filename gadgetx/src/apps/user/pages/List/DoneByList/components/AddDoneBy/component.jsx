import React from "react";
import CommonDoneByModal from "@/pages/CommonDoneByModal"; 

import { useCreateDoneBy } from "@/apps/user/hooks/api/doneBy/useCreateDoneBy";
import { useUpdateDoneBy } from "@/apps/user/hooks/api/doneBy/useUpdateDoneBy";
import { useDeleteDoneBy } from "@/apps/user/hooks/api/doneBy/useDeleteDoneBy";



const AddDoneBy = ({
  isOpen,
  onClose,
  mode,
  selectedDoneBy,
  onDoneByCreated,
}) => {
  return (
    <CommonDoneByModal
      // App-specific hooks
      useCreateHook={useCreateDoneBy}
      useUpdateHook={useUpdateDoneBy}
      useDeleteHook={useDeleteDoneBy}
      
      // Modal Props
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedDoneBy} 
      onItemCreated={onDoneByCreated} 
    />
  );
};

export default AddDoneBy;