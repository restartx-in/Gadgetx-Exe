import React, { useMemo } from "react";
import CommonExpenseTypeList from "@/pages/CommonExpenseTypeList"; 
import { useSearchParams } from "react-router-dom"; 
import { useExpenseTypes } from "@/apps/user/hooks/api/expenseType/useExpenseTypes";
import { useDeleteExpenseType } from "@/apps/user/hooks/api/expenseType/useDeleteExpenseType";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import AddExpenseType from "./components/AddExpenseType";


const ExpenseTypeList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const { data: rawData = [], isLoading, refetch } = useExpenseTypes(urlState);
  const { mutateAsync: deleteItem } = useDeleteExpenseType();
  const list = useMemo(() => rawData || [], [rawData]);

  return (
    <CommonExpenseTypeList
      list={list} 
      isLoading={isLoading} 
      deleteItem={deleteItem} 
      refetch={refetch} 
      
      urlState={urlState} 
      setURLState={setSearchParams} 
      
      AddModalComponent={AddExpenseType}
      DoneByAutoCompleteComponent={DoneByAutoComplete}
      CostCenterAutoCompleteComponent={CostCenterAutoComplete}
    />
  );
};

export default ExpenseTypeList;