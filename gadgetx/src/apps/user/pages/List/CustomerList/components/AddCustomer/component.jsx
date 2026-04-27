import React from "react";
import CommonAddCustomer from "@/pages/CommonAddCustomer";
import useCreateCustomer from "@/apps/user/hooks/api/customer/useCreateCustomer";
import useUpdateCustomer from "@/apps/user/hooks/api/customer/useUpdateCustomer";
import useDeleteCustomer from "@/apps/user/hooks/api/customer/useDeleteCustomer";
import useCreateAccount from "@/apps/user/hooks/api/account/useCreateAccount";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";

const AddCustomer = (props) => (
  <CommonAddCustomer
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreateCustomer}
    useUpdateHook={useUpdateCustomer}
    useDeleteHook={useDeleteCustomer}
    useCreateAccountHook={useCreateAccount}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
    CalculatorInput={InputFieldWithCalculator}
  />
);

export default AddCustomer;