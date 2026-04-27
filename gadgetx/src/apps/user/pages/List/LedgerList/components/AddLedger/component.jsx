import React from "react";
import CommonAddLedger from "@/pages/CommonAddLedger";
import { useCreateLedger } from "@/apps/user/hooks/api/ledger/useCreateLedger";
import { useUpdateLedger } from "@/apps/user/hooks/api/ledger/useUpdateLedger";
import { useDeleteLedger } from "@/apps/user/hooks/api/ledger/useDeleteLedger";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

const AddLedger = (props) => (
  <CommonAddLedger
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreateLedger}
    useUpdateHook={useUpdateLedger}
    useDeleteHook={useDeleteLedger}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
  />
);

export default AddLedger;