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
import TableTopContainer from "@/components/TableTopContainer";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { useEmployeePosition } from "@/hooks/api/employeePosition/useEmployeePosition";
import { useDeleteEmployeePosition } from "@/hooks/api/employeePosition/useDeleteEmployeePosition";
import AddEmployeePosition from "./components/AddEmployeePosition";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
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

const EmployeePositionRow = React.memo(
  ({ item, index, page, pageSize, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
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

const EmployeePositionList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // 3. Initialize state with useReducer
  const [state, setState] = useReducer(stateReducer, {
    name: searchParams.get("name") || "",
    sort: searchParams.get("sort") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    page: 1,
    page_size: 10,
  });

  useSyncURLParams({
    name: state.name,
    sort: state.sort,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  // Local UI States for controlled inputs
  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(state.name);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [headerFilters, setHeaderFilters] = useState({
    name: state.name || "",
  });
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  useEffect(() => {
    setName(state.name || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaultCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({ name: state.name || "" });
  }, [state, defaultCostCenter]);

  const {
    data: employeePositions,
    isLoading,
    refetch,
  } = useEmployeePosition(state);
  const { mutateAsync: deleteEmployeePosition } = useDeleteEmployeePosition();

  const listData = useMemo(() => employeePositions || [], [employeePositions]);

  // Modal State and Handlers using reducer
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (pos) => dispatchModal({ type: "OPEN", mode: "edit", payload: pos }),
    []
  );
  const handleViewClick = useCallback(
    (pos) => dispatchModal({ type: "OPEN", mode: "view", payload: pos }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteEmployeePosition(id);
        showToast({
          crudItem: CRUDITEM.EMPLOYEE_POSITION,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.EMPLOYEE_POSITION,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteEmployeePosition, showToast]
  );

  // 4. Simplify state update handlers
  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ sort: value });
  }, []);

  const handleSearch = useCallback(() => {
    setState({ searchType, searchKey });
  }, [searchType, searchKey]);

  const applyHeaderSearch = useCallback(
    (key) => {
      setState({ [key]: headerFilters[key] });
    },
    [headerFilters]
  );

  const handleHeaderDropdownChange = useCallback((key, value) => {
    setState({ [key]: value });
  }, []);

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
    setHeaderFilters({ name: "" });

    setState({
      name: "",
      sort: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      searchType: "",
      searchKey: "",
      page: 1,
      page_size: 10,
    });

    refetch();
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [defaultCostCenter, isDisableCostCenter, refetch, showToast]);

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
            <PageTitleWithBackButton title="Employee Position" />
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
                  <AddButton onClick={handleAddClick}>
                    Add Employee Position
                  </AddButton>
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
                          <ThSearchOrFilterPopover
                            isSearch
                            popoverWidth={200}
                            onSearch={() => applyHeaderSearch("name")}
                          >
                            <InputField
                              placeholder="Enter Name"
                              value={headerFilters.name}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  applyHeaderSearch("name");
                              }}
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
                              value={state.done_by_id}
                              onChange={(e) =>
                                handleHeaderDropdownChange(
                                  "done_by_id",
                                  e.target.value
                                )
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
                              value={state.cost_center_id}
                              onChange={(e) =>
                                handleHeaderDropdownChange(
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
                    listData.map((type, index) => (
                      <EmployeePositionRow
                        key={type.id}
                        item={type}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption
                      item={Transaction.EmployeePosition}
                      noOfCol={5}
                    />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Employee Position" />
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
                  <AddButton onClick={handleAddClick}>
                    Add Employee Position
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.EmployeePosition} />
              ) : (
                <div>
                  {listData.map((type) => (
                    <ListItem
                      key={type.id}
                      title={type.name}
                      subtitle={
                        <>
                          {type.done_by_name && (
                            <div>Done By: {type.done_by_name}</div>
                          )}
                          {type.cost_center_name && (
                            <div>Cost Center: {type.cost_center_name}</div>
                          )}
                        </>
                      }
                      onView={() => handleViewClick(type)}
                      onEdit={() => handleEditClick(type)}
                      onDelete={() => handleDelete(type.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddEmployeePosition
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedEmployeePosition={modalState.selected}
      />
    </>
  );
};

export default EmployeePositionList;

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
