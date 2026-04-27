import React from "react";
import CommonCustomerList from "@/pages/CommonCustomerList";
import useCustomersPaginated from "@/apps/user/hooks/api/customer/useCustomersPaginated";
import useDeleteCustomer from "@/apps/user/hooks/api/customer/useDeleteCustomer";
import AddCustomer from "./components/AddCustomer";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const CustomerList = () => (
  <CommonCustomerList
    useCustomersPaginatedHook={useCustomersPaginated}
    useDeleteCustomerHook={useDeleteCustomer}
    AddCustomerModal={AddCustomer}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    customerItemConstant={Transaction.Customer}
  />
);

export default CustomerList;