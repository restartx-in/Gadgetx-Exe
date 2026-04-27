import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom"; 

import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useDeleteModeOfPayment } from "@/apps/user/hooks/api/modeOfPayment/useDeleteModeOfPayment";

import AddModeOfPayment from "./components/AddModeOfPayment";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";

import CommonModeOfPaymentList from "@/pages/CommonModeOfPaymentList"; 

const ModeOfPaymentList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const urlState = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    
    const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER");
    if (defaultCostCenter && !params.costCenterId) {
        params.costCenterId = defaultCostCenter;
    }

    return params;
  }, [searchParams]);
  
  const { data: rawData = [], isLoading, refetch } = useModeOfPayments(urlState);
  const { mutateAsync: deleteItem } = useDeleteModeOfPayment();
  const list = useMemo(() => rawData || [], [rawData]);

  return (
    <CommonModeOfPaymentList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      refetch={refetch}
      
      urlState={Object.fromEntries(searchParams.entries())}
      setURLState={setSearchParams}
      
      AddMOPModal={AddModeOfPayment}
      DoneByAutoCompleteHeader={DoneByAutoComplete}
      CostCenterAutoCompleteHeader={CostCenterAutoComplete}
    />
  );
};

export default ModeOfPaymentList;