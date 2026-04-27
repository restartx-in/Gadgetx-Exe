import React from "react";
import CommonPayrollList from "@/pages/CommonPayrollList";
import usePayrollPaginated from "@/apps/user/hooks/api/payroll/usePayrollPaginated";
import useDeletePayroll from "@/apps/user/hooks/api/payroll/useDeletePayroll";
import { useCostCenters } from "@/apps/user/hooks/api/costCenter/useCostCenters";
import AddPayroll from "./AddPayroll";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const PayrollList = () => (
  <CommonPayrollList
    usePayrollHook={usePayrollPaginated}
    useDeleteHook={useDeletePayroll}
    useCostCentersHook={useCostCenters}
    AddModal={AddPayroll}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    LedgerAutoComplete={LedgerAutoCompleteWithAddOptionWithBalance}
    TableTopContainer={TableTopContainer}
    payrollConstant={Transaction.Payroll || "Payroll Record"}
  />
);

export default PayrollList;