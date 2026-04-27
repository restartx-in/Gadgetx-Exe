import React from "react";
import CommonAddAccount from "@/pages/CommonAddAccount";
import useCreateAccount from "@/apps/user/hooks/api/account/useCreateAccount";
import useUpdateAccount from "@/apps/user/hooks/api/account/useUpdateAccount";
import useDeleteAccount from "@/apps/user/hooks/api/account/useDeleteAccount";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import SupplierAutoCompleteWithAddOption from "@/apps/user/components/SupplierAutoCompleteWithAddOption";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";

const AddAccount = (props) => (
  <CommonAddAccount
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreateAccount}
    useUpdateHook={useUpdateAccount}
    useDeleteHook={useDeleteAccount}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
    SupplierComponent={SupplierAutoCompleteWithAddOption}
    CalculatorInputComponent={InputFieldWithCalculator}
  />
);

export default AddAccount;