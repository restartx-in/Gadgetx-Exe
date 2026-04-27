import React from "react";
import CommonLedgerList from "@/pages/CommonLedgerList";
import { useLedgerPaginated } from "@/apps/user/hooks/api/ledger/useLedgerPaginated";
import { useDeleteLedger } from "@/apps/user/hooks/api/ledger/useDeleteLedger";
import AddLedger from "./components/AddLedger";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const LedgerList = () => (
  <CommonLedgerList
    useLedgerPaginatedHook={useLedgerPaginated}
    useDeleteLedgerHook={useDeleteLedger}
    AddLedgerModal={AddLedger}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    ledgerItemConstant={Transaction.Ledger}
  />
);

export default LedgerList;