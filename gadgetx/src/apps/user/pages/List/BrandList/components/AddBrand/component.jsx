import React from "react";
import CommonBrandModal from "@/pages/CommonBrandModal"; 

import { useCreateBrand } from "@/apps/user/hooks/api/brand/useCreateBrand";
import { useUpdateBrand } from "@/apps/user/hooks/api/brand/useUpdateBrand";
import { useDeleteBrand } from "@/apps/user/hooks/api/brand/useDeleteBrand";

const AddBrand = ({
  isOpen,
  onClose,
  mode,
  selectedItem, // CHANGED: Was 'selectedBrand', but CommonList passes 'selectedItem'
  onBrandCreated, // Note: CommonList maps this to 'onItemCreated' if passed, but usually handled internally
}) => {

  return (
    <CommonBrandModal
      useCreateHook={useCreateBrand}
      useUpdateHook={useUpdateBrand}
      useDeleteHook={useDeleteBrand}
      
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedItem} 
      onItemCreated={onBrandCreated} 
    />
  );
};

export default AddBrand;