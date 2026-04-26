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
import { useUnits } from "@/hooks/api/unitType/useUnits";
import { useDeleteUnit } from "@/hooks/api/unitType/useDeleteUnit";
import AddUnit from "./components/AddUnit";
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

// 2. Define Reducers
const stateReducer = (state, newState) => ({ ...state, ...newState });

const initialModalState = {
  isOpen: false,
  mode: "view",
  selected: null,
};

const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN":
      return {
        isOpen: true,
        mode: action.mode,
        selected: action.payload || null,
      };
    case "CLOSE":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const UnitRow = React.memo(
  ({ item, index, listLength, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={1} pageSize={listLength} />
      <Td>{item.name}</Td>
      <Td>{item.symbol}</Td>
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

const UnitList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaultCostCenter);
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [headerFilters, setHeaderFilters] = useState({});

  // 3. Initialize state with useReducer
  const [state, setState] = useReducer(stateReducer, {
    name: searchParams.get("name") || "",
    symbol: searchParams.get("symbol") || "",
    sort: searchParams.get("sort") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    name: state.name,
    symbol: state.symbol,
    sort: state.sort,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  useEffect(() => {
    setName(state.name || "");
    setSymbol(state.symbol || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaultCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      name: state.name || "",
      symbol: state.symbol || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
  }, [state, defaultCostCenter]);

  const { data: units, isLoading, refetch } = useUnits(state);
  const { mutateAsync: deleteUnit } = useDeleteUnit();

  const listData = useMemo(() => units || [], [units]);

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (unit) => dispatchModal({ type: "OPEN", mode: "edit", payload: unit }),
    []
  );
  const handleViewClick = useCallback(
    (unit) => dispatchModal({ type: "OPEN", mode: "view", payload: unit }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteUnit(id);
        showToast({
          crudItem: CRUDITEM.UNIT,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({ crudItem: CRUDITEM.UNIT, crudType: CRUDTYPE.DELETE_ERROR });
      }
    },
    [deleteUnit, showToast]
  );

  // 4. Simplify state update handlers
  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ sort: value });
  }, []);

  const handleSearch = useCallback(
    () => setState({ searchType, searchKey }),
    [searchType, searchKey]
  );

  const handleHeaderSearch = useCallback(
    (key, value) => setState({ [key]: value }),
    []
  );

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") handleHeaderSearch(key, headerFilters[key]);
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleFilter = useCallback(() => {
    setState({
      name,
      symbol,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, symbol, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    setName("");
    setSymbol("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderFilters({
      name: "",
      symbol: "",
      done_by_id: "",
      cost_center_id: "",
    });
    setState({
      name: "",
      symbol: "",
      sort: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      searchType: "",
      searchKey: "",
    });
    refetch();
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [defaultCostCenter, isDisableCostCenter, refetch, showToast]);

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "symbol", name: "Symbol" },
  ];

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    symbol,
    setSymbol,
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
            <PageTitleWithBackButton title="Units" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <PopupSearchField
                    {...{
                      searchRef,
                      searchKey,
                      setSearchKey,
                      searchType,
                      setSearchType,
                      handleSearch,
                      searchOptions,
                    }}
                  />
                  <AddButton onClick={handleAddClick}>Add Unit</AddButton>
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
                        Symbol
                        <ThFilterContainer>
                          <ThSort
                            {...{ sort, setSort, value: "symbol", handleSort }}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              placeholder="Enter Symbol"
                              value={headerFilters.symbol}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  symbol: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "symbol")
                              }
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
                    listData.map((unit, index) => (
                      <UnitRow
                        key={unit.id}
                        item={unit}
                        index={index}
                        listLength={listData.length}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.Unit} noOfCol={6} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Units" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    {...{
                      searchRef,
                      searchKey,
                      setSearchKey,
                      searchType,
                      setSearchType,
                      handleSearch,
                      searchOptions,
                    }}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>Add Unit</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Unit} />
              ) : (
                <div>
                  {listData.map((unit) => (
                    <ListItem
                      key={unit.id}
                      title={unit.name}
                      subtitle={
                        <>
                          <div>Symbol: {unit.symbol}</div>
                          {unit.done_by_name && (
                            <div>Done By: {unit.done_by_name}</div>
                          )}
                          {unit.cost_center_name && (
                            <div>Cost Center: {unit.cost_center_name}</div>
                          )}
                        </>
                      }
                      onView={() => handleViewClick(unit)}
                      onEdit={() => handleEditClick(unit)}
                      onDelete={() => handleDelete(unit.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      {/* 5. Update component props to use modalState */}
      <AddUnit
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedUnit={modalState.selected}
      />
    </>
  );
};

export default UnitList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    symbol,
    setSymbol,
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <InputField
            label="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
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
