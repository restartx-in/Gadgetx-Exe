import React from "react";
import CommonAddUnit from "@/pages/CommonAddUnit";
import { useCreateUnit } from "@/apps/user/hooks/api/unitType/useCreateUnit";
import { useUpdateUnit } from "@/apps/user/hooks/api/unitType/useUpdateUnit";
import { useDeleteUnit } from "@/apps/user/hooks/api/unitType/useDeleteUnit";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import { Transaction } from "@/constants/object/transaction";
import { Report } from "@/constants/object/report";

const AddUnit = (props) => (
  <CommonAddUnit
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreateUnit}
    useUpdateHook={useUpdateUnit}
    useDeleteHook={useDeleteUnit}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
    reportConstant={Report.Unit}
    itemConstant={Transaction.Unit}
  />
);

export default AddUnit;