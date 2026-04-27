import React from "react";
import CommonAddSupplier from "@/pages/CommonAddSupplier";
import useCreateSupplier from "@/apps/user/hooks/api/supplier/useCreateSupplier";
import useUpdateSupplier from "@/apps/user/hooks/api/supplier/useUpdateSupplier";
import useDeleteSupplier from "@/apps/user/hooks/api/supplier/useDeleteSupplier";
import useCreateAccount from "@/apps/user/hooks/api/account/useCreateAccount";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";

const AddSupplier = (props) => (
  <CommonAddSupplier
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreateSupplier}
    useUpdateHook={useUpdateSupplier}
    useDeleteHook={useDeleteSupplier}
    useCreateAccountHook={useCreateAccount}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
    CalculatorInput={InputFieldWithCalculator}
  />
);

export default AddSupplier;