import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TdMenu,
  ThMenu,
  TableCaption,
  ThContainer,
  ThSort,
  ThFilterContainer,
  ThSearchOrFilterPopover,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { useBrands } from "@/hooks/api/brand/useBrands";
import { useDeleteBrand } from "@/hooks/api/brand/useDeleteBrand";
import AddBrand from "./components/AddBrand";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TableTopContainer from "@/components/TableTopContainer";
import HStack from "@/components/HStack";
import RefreshButton from "@/components/RefreshButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import InputField from "@/components/InputField";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import useSyncURLParams from "@/hooks/useSyncURLParams";

// 2. Define the reducer function
const stateReducer = (state, newState) => ({ ...state, ...newState });

const BrandRow = React.memo(
  ({ item, index, listLength, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={1} pageSize={listLength} />
      <Td>{item.name}</Td>
      <Td>{item.done_by_name}</Td>
      <Td>{item.cost_center_name}</Td>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  )
);

const BrandList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // UI States for filter inputs (remain as useState)
  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaultCostCenter);
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [headerFilters, setHeaderFilters] = useState({
    name: "",
    done_by_id: "",
    cost_center_id: "",
  });

  // 3. Initialize state with useReducer
  const [state, setState] = useReducer(stateReducer, {
    name: searchParams.get("name") || "",
    sort: searchParams.get("sort") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    name: state.name,
    sort: state.sort,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  useEffect(() => {
    setName(state.name || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaultCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      name: state.name || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
  }, [state, defaultCostCenter]);

  const { data: brands, isLoading } = useBrands(state);
  const { mutateAsync: deleteBrand } = useDeleteBrand();

  const listData = useMemo(() => brands || [], [brands]);

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [mode, setMode] = useState("view"); // 'add', 'edit', 'view'
  const [isOpenBrandModal, setIsOpenBrandModal] = useState(false);

  const handleAddClick = useCallback(() => {
    setMode("add");
    setSelectedBrand(null);
    setIsOpenBrandModal(true);
  }, []);

  const handleEditClick = useCallback((brand) => {
    setSelectedBrand(brand);
    setMode("edit");
    setIsOpenBrandModal(true);
  }, []);

  const handleViewClick = useCallback((brand) => {
    setSelectedBrand(brand);
    setMode("view");
    setIsOpenBrandModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteBrand(id);
        showToast({
          crudItem: CRUDITEM.BRAND,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.BRAND,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteBrand, showToast]
  );

  // 4. Simplify state update handlers
  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ sort: value });
  }, []);

  const handleSearch = useCallback(() => {
    setState({ searchType, searchKey });
  }, [searchType, searchKey]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ [key]: value });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleFilter = useCallback(() => {
    setState({
      name,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    setName("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderFilters({ name: "", done_by_id: "", cost_center_id: "" });

    setState({
      name: "",
      sort: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      searchType: "",
      searchKey: "",
    });

    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [defaultCostCenter, isDisableCostCenter, showToast]);

  const searchOptions = [{ value: "name", name: "Name" }];

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Brands" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <PopupSearchField
                    searchRef={searchRef}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                  <AddButton onClick={handleAddClick}>Add Brand</AddButton>
                </>
              }
            />
            {isLoading ? (
              <Loader />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>
                      <ThContainer>
                        Name
                        <ThFilterContainer>
                          <ThSort
                            {...{ sort, setSort, value: "name", handleSort }}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              placeholder="Enter Name"
                              value={headerFilters.name}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => handleHeaderKeyDown(e, "name")}
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Done By
                        <ThFilterContainer>
                          <ThSort
                            {...{ sort, setSort, value: "done_by", handleSort }}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <DoneByAutoComplete
                              placeholder="Select Done By"
                              value={headerFilters.done_by_id}
                              onChange={(e) =>
                                handleHeaderSearch("done_by_id", e.target.value)
                              }
                              is_edit={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Cost Center
                        <ThFilterContainer>
                          <ThSort
                            {...{
                              sort,
                              setSort,
                              value: "cost_center",
                              handleSort,
                            }}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <CostCenterAutoComplete
                              placeholder="Select Cost Center"
                              value={headerFilters.cost_center_id}
                              onChange={(e) =>
                                handleHeaderSearch(
                                  "cost_center_id",
                                  e.target.value
                                )
                              }
                              is_edit={false}
                              disabled={isDisableCostCenter}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {listData.length > 0 ? (
                    listData.map((brand, index) => (
                      <BrandRow
                        key={brand.id}
                        item={brand}
                        index={index}
                        listLength={listData.length}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.Brand} noOfCol={5} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Brands" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchRef={searchRef}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>Add Brand</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Brand} />
              ) : (
                <div>
                  {listData.map((brand) => (
                    <ListItem
                      key={brand.id}
                      title={brand.name}
                      subtitle={
                        <>
                          {brand.done_by_name && (
                            <div>Done By: {brand.done_by_name}</div>
                          )}
                          {brand.cost_center_name && (
                            <div>Cost Center: {brand.cost_center_name}</div>
                          )}
                        </>
                      }
                      onView={() => handleViewClick(brand)}
                      onEdit={() => handleEditClick(brand)}
                      onDelete={() => handleDelete(brand.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddBrand
        isOpen={isOpenBrandModal}
        onClose={() => setIsOpenBrandModal(false)}
        mode={mode}
        selectedBrand={selectedBrand}
      />
    </>
  );
};

export default BrandList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter,
  }) => {
    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleFilter}
      >
        <VStack>
          <InputField
            label="Name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <DoneByAutoComplete
            placeholder="Done By"
            value={doneById}
            onChange={(e) => setDoneById(e.target.value)}
            is_edit={false}
          />
          <CostCenterAutoComplete
            placeholder="Cost Center"
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            is_edit={false}
            disabled={disableCostCenter}
          />
        </VStack>
      </PopUpFilter>
    );
  }
);
