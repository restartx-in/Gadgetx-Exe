import React from "react";
import CommonEmployeeList from "@/pages/CommonEmployeeList";
import useEmployeesPaginated from "@/apps/user/hooks/api/employee/useEmployeesPaginated";
import useDeleteEmployee from "@/apps/user/hooks/api/employee/useDeleteEmployee";
import useCreateBulkPayroll from "@/apps/user/hooks/api/payroll/useCreateBulkPayroll";
import { useEmployeePosition } from "@/apps/user/hooks/api/employeePosition/useEmployeePosition";
import AddEmployee from "./components/AddEmployee";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const EmployeeList = () => (
  <CommonEmployeeList
    useEmployeesHook={useEmployeesPaginated}
    useDeleteHook={useDeleteEmployee}
    usePositionsHook={useEmployeePosition}
    useBulkPayrollHook={useCreateBulkPayroll}
    AddModal={AddEmployee}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    employeeItemConstant={Transaction.Employee}
  />
);

export default EmployeeList;