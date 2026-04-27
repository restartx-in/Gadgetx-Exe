import React from "react";
import CommonSupplierList from "@/pages/CommonSupplierList";
import useSuppliersPaginated from "@/apps/user/hooks/api/supplier/useSuppliersPaginated";
import useDeleteSupplier from "@/apps/user/hooks/api/supplier/useDeleteSupplier";
import AddSupplier from "./components/AddSupplier";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const SupplierList = () => (
  <CommonSupplierList
    useSuppliersPaginatedHook={useSuppliersPaginated}
    useDeleteSupplierHook={useDeleteSupplier}
    AddSupplierModal={AddSupplier}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    supplierItemConstant={Transaction.Supplier}
  />
);

export default SupplierList;