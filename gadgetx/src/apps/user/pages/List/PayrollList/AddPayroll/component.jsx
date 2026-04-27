import React from "react";
import CommonAddPayroll from "@/pages/CommonAddPayroll";
import useCreatePayroll from "@/apps/user/hooks/api/payroll/useCreatePayroll";
import useUpdatePayroll from "@/apps/user/hooks/api/payroll/useUpdatePayroll";
import useDeletePayroll from "@/apps/user/hooks/api/payroll/useDeletePayroll";

// Specialized Components
import EmployeeAutoCompleteWithAddOption from "@/apps/user/components/EmployeeAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";

const AddPayroll = (props) => (
  <CommonAddPayroll
    {...props}
    appTag="inventoryx"
    useCreateHook={useCreatePayroll}
    useUpdateHook={useUpdatePayroll}
    useDeleteHook={useDeletePayroll}
    // Injected UI Components
    EmployeeComponent={EmployeeAutoCompleteWithAddOption}
    LedgerComponent={LedgerAutoCompleteWithAddOptionWithBalance}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
  />
);

export default AddPayroll;