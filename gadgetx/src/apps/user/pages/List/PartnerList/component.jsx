import React from "react";
import CommonPartnerList from "@/pages/CommonPartnerList";
import usePartnersPaginated from "@/apps/user/hooks/api/partner/usePartnersPaginated";
import useDeletePartner from "@/apps/user/hooks/api/partner/useDeletePartner";
import AddPartner from "./components/AddPartner";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const PartnerList = () => (
  <CommonPartnerList
    usePartnersPaginatedHook={usePartnersPaginated}
    useDeletePartnerHook={useDeletePartner}
    AddPartnerModal={AddPartner}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    partnerItemConstant={Transaction.Partner}
  />
);

export default PartnerList;