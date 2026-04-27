import React, { useMemo } from "react";
import { useDoneBys } from "@/apps/user/hooks/api/doneBy/useDoneBys";
import { useDeleteDoneBy } from "@/apps/user/hooks/api/doneBy/useDeleteDoneBy";
import CommonDoneByList from "@/pages/CommonDoneByList";
import AddDoneBy from "./components/AddDoneBy";

const DoneByList = () => {
  const { data: listData, isLoading } = useDoneBys();
  const { mutateAsync: deleteItem } = useDeleteDoneBy();
  const list = useMemo(() => listData || [], [listData]);

  return (
    <CommonDoneByList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      AddDoneByModal={AddDoneBy}
    />
  );
};

export default DoneByList;
