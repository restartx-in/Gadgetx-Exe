import React from "react";
import CommonCategoryList from "@/pages/CommonCategoryList";
import { useCategorys } from "@/apps/user/hooks/api/category/useCategorys";
import { useDeleteCategory } from "@/apps/user/hooks/api/category/useDeleteCategory";
import AddCategory from "./components/AddCategory";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const CategoryList = () => (
  <CommonCategoryList
    useCategorysHook={useCategorys}
    useDeleteCategoryHook={useDeleteCategory}
    AddCategoryModal={AddCategory}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    categoryItemConstant={Transaction.Category}
  />
);

export default CategoryList;