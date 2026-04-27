import React, { useReducer, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { useBrands } from "@/apps/user/hooks/api/brand/useBrands";
import { useDeleteBrand } from "@/apps/user/hooks/api/brand/useDeleteBrand";
import AddBrand from "./components/AddBrand";
import CommonBrandList from "@/pages/CommonBrandList";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const BrandList = () => {
  const [searchParams] = useSearchParams(); // Get current URL params
  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  
  const [state, setState] = useReducer(stateReducer, {
    name: searchParams.get("name") || "",
    sort: searchParams.get("sort") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  // FIX: Include 'action' and 'id' from searchParams so the hook doesn't delete them
  useSyncURLParams({
    name: state.name,
    sort: state.sort,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
    action: searchParams.get("action"), 
    id: searchParams.get("id"),
  });

  const { data: brandsData, isLoading } = useBrands(state);
  const { mutateAsync: deleteItem } = useDeleteBrand();
  const list = useMemo(() => brandsData || [], [brandsData]);

  const handleFilterChange = (updates) => {
     setState(updates);
  };

  const handleRefresh = () => {
    setState({
      name: "",
      sort: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      searchType: "",
      searchKey: "",
    });
  };

  return (
    <CommonBrandList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      AddBrandModal={AddBrand}
      filterState={state}
      onFilterChange={handleFilterChange}
      onRefresh={handleRefresh}
    />
  );
};

export default BrandList;