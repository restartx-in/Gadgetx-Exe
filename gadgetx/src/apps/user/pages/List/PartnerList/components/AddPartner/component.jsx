import React from "react";
import CommonAddPartner from "@/pages/CommonAddPartner";
import useCreatePartner from "@/apps/user/hooks/api/partner/useCreatePartner";
import useUpdatePartner from "@/apps/user/hooks/api/partner/useUpdatePartner";
import useDeletePartner from "@/apps/user/hooks/api/partner/useDeletePartner";
import usePartnerById from "@/apps/user/hooks/api/partner/usePartnerById";
import usePartnership from "@/apps/user/hooks/api/partnership/usePartnership";
import useDeletePartnership from "@/apps/user/hooks/api/partnership/useDeletePartnership";
import useDeleteAccount from "@/apps/user/hooks/api/account/useDeleteAccount";

import PartnershipModal from "@/apps/user/components/PartnershipModal";
import AddAccount from "@/apps/user/pages/List/AccountList/components/AddAccount";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

const AddPartner = (props) => (
  <CommonAddPartner
    {...props}
    appTag="gadgetx"
    useCreateHook={useCreatePartner}
    useUpdateHook={useUpdatePartner}
    useDeleteHook={useDeletePartner}
    usePartnerByIdHook={usePartnerById}
    usePartnershipHook={usePartnership}
    useDeletePartnershipHook={useDeletePartnership}
    useDeleteAccountHook={useDeleteAccount}
    PartnershipModal={PartnershipModal}
    AddAccountModal={AddAccount}
    DoneByComponent={DoneByAutoCompleteWithAddOption}
    CostCenterComponent={CostCenterAutoCompleteWithAddOption}
  />
);

export default AddPartner;