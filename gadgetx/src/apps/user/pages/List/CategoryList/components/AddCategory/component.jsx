import React from "react";
import CommonAddCategory from "@/pages/CommonAddCategory";
import { useCreateCategory } from "@/apps/user/hooks/api/category/useCreateCategory";
import { useUpdateCategory } from "@/apps/user/hooks/api/category/useUpdateCategory";
import { useDeleteCategory } from "@/apps/user/hooks/api/category/useDeleteCategory";
import { useCategoryById } from "@/apps/user/hooks/api/category/useCategoryById"; // Import hook
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

const AddCategory = (props) => (
  <CommonAddCategory
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreateCategory}
    useUpdateHook={useUpdateCategory}
    useDeleteHook={useDeleteCategory}
    useGetByIdHook={useCategoryById} // Pass hook
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
  />
);

export default AddCategory;