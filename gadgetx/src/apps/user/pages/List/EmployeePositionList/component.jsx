import React, { useMemo } from "react";
import CommonEmployeePositionList from "@/pages/CommonEmployeePositionList";
import { useSearchParams } from "react-router-dom";
import { useEmployeePosition } from "@/apps/user/hooks/api/employeePosition/useEmployeePosition";
import { useDeleteEmployeePosition } from "@/apps/user/hooks/api/employeePosition/useDeleteEmployeePosition";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import AddEmployeePosition from "./components/AddEmployeePosition";

const EmployeePositionList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );

  const {
    data: rawData = [],
    isLoading,
    refetch,
  } = useEmployeePosition(urlState);
  const { mutateAsync: deleteItem } = useDeleteEmployeePosition();
  const list = useMemo(() => rawData || [], [rawData]);

  return (
    <CommonEmployeePositionList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      refetch={refetch}
      urlState={urlState}
      setURLState={setSearchParams}
      AddModalComponent={AddEmployeePosition}
      DoneByAutoCompleteComponent={DoneByAutoComplete}
      CostCenterAutoCompleteComponent={CostCenterAutoComplete}
    />
  );
};

export default EmployeePositionList;
