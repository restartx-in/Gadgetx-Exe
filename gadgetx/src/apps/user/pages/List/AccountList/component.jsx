import React from "react";
import CommonAccountList from "@/pages/CommonAccountList";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import useDeleteAccount from "@/apps/user/hooks/api/account/useDeleteAccount";
import useDoneById from "@/apps/user/hooks/api/doneBy/useDoneById";
import useCostCenterById from "@/apps/user/hooks/api/costCenter/useCostCenterById";
import AddAccount from "./components/AddAccount";
import CashBook from "@/apps/user/pages/Transactions/CashBook";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Td } from "@/components/Table";

const DoneByCell = ({ doneById }) => {
  const { data } = useDoneById(doneById);
  return <Td>{data?.name || "N/A"}</Td>;
};

const CostCenterCell = ({ costCenterId }) => {
  const { data } = useCostCenterById(costCenterId);
  return <Td>{data?.name || "N/A"}</Td>;
};

const AccountList = () => (
  <CommonAccountList
    useAccountsHook={useAccounts}
    useDeleteAccountHook={useDeleteAccount}
    DoneByCell={DoneByCell}
    CostCenterCell={CostCenterCell}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    AddAccountModal={AddAccount}
    CashBookModal={CashBook}
    TableTopContainer={TableTopContainer}
  />
);

export default AccountList;