import React from "react";
import CommonAddEmployee from "@/pages/CommonAddEmployee";
import useCreateEmployee from "@/apps/user/hooks/api/employee/useCreateEmployee";
import useUpdateEmployee from "@/apps/user/hooks/api/employee/useUpdateEmployee";
import useDeleteEmployee from "@/apps/user/hooks/api/employee/useDeleteEmployee";

// Specialized Components
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import EmployeePositionAutoCompleteWithAddOption from "@/apps/user/components/EmployeePositionAutoCompleteWithAddOption";

const AddEmployee = (props) => (
  <CommonAddEmployee
    {...props}
    appTag="inventoryx"
    useCreateHook={useCreateEmployee}
    useUpdateHook={useUpdateEmployee}
    useDeleteHook={useDeleteEmployee}
    // Injecting UI Components
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
    PositionComponent={EmployeePositionAutoCompleteWithAddOption}
  />
);

export default AddEmployee;