import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { useToast } from "@/context/ToastContext";
import { useSearchParams } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TdSL,
  ThSL,
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
import TableTopContainer2 from "@/components/TableTopContainer2";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem";
import Spacer from "@/components/Spacer";
import HStack from "@/components/HStack";
import RefreshButton from "@/components/RefreshButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import InputField from "@/components/InputField";
import useActionFromURL from "@/hooks/useActionFromURL"; // Import the custom hook

const stateReducer = (state, newState) => ({ ...state, ...newState });
const initialModalState = { selectedItem: null, mode: "view", isOpen: false };

const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN":
      return {
        isOpen: true,
        mode: action.mode,
        selectedItem: action.payload || null,
      };
    case "CLOSE":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const ExpenseTypeRow = React.memo(
  ({ type, index, page, pageSize, onEdit, onView, onDelete }) => {
    return (
      <Tr>
        <TdSL index={index} page={1} pageSize={pageSize} />
        <Td>{type.name}</Td>
        <Td>{type.done_by_name}</Td>
        <Td>{type.cost_center_name}</Td>
        <TdMenu
          onEdit={() => onEdit(type)}
          onView={() => onView(type)}
          onDelete={() => onDelete(type.id)}
        />
      </Tr>
    );
  }
);
const ListFilter = React.memo(({ ...props }) => {
  const {
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
    DoneByAutoCompleteComponent,
    CostCenterAutoCompleteComponent,
  } = props;

  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack>
        <InputField
          placeholder="Name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
        />
        <DoneByAutoCompleteComponent
          placeholder="Done By"
          value={doneById}
          onChange={(e) => setDoneById(e.target.value)}
          is_edit={false}
        />
        <CostCenterAutoCompleteComponent
          placeholder="Cost Center"
          value={costCenterId}
          onChange={(e) => setCostCenterId(e.target.value)}
          is_edit={false}
          disabled={disableCostCenter}
        />
      </VStack>
    </PopUpFilter>
  );
});

const CommonExpenseTypeList = ({
  list,
  isLoading,
  deleteItem,
  refetch,
  urlState,
  setURLState,
  AddModalComponent,
  DoneByAutoCompleteComponent,
  CostCenterAutoCompleteComponent,
}) => {
  const ENTITY_CRUD_KEY = "EXPENSETYPE";
  const PAGE_TITLE = "Expense Types";
  const ADD_BUTTON_TEXT = "Add Expense Type";
  const ENTITY_TRANSACTION_CONSTANT = CRUDITEM.ExpenseType;

  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);

  const {
    name: urlName,
    sort: urlSort,
    done_by_id: urlDoneById,
    cost_center_id: urlCostCenterId,
    searchType: urlSearchType,
    searchKey: urlSearchKey,
  } = urlState;

  const [name, setName] = useState(urlName || "");
  const [doneById, setDoneById] = useState(urlDoneById || "");
  const [costCenterId, setCostCenterId] = useState(
    urlCostCenterId || defaultCostCenter
  );
  const [sort, setSort] = useState(urlSort || "");
  const [searchType, setSearchType] = useState(urlSearchType || "");
  const [searchKey, setSearchKey] = useState(urlSearchKey || "");

  const [headerFilters, setHeaderFilters] = useState({
    name: urlName || "",
    done_by_id: urlDoneById || "",
    cost_center_id: urlCostCenterId || "",
  });

  const [modalState, dispatchModal] = useReducer(modalReducer, initialModalState);
  const { selectedItem, mode, isOpen: isOpenModal } = modalState;

  const handleSetURLState = useCallback(
    (newState) => {
      const newParams = {};
      for (const [key, value] of Object.entries(newState)) {
        if (value) newParams[key] = value;
      }
      setURLState(newParams, { replace: true });
    },
    [setURLState]
  );
  
  const findItemById = useCallback(
    (id) => list.find((item) => item.id.toString() === id),
    [list]
  );
  
  // EFFECT: Handles opening/closing modal based on URL
  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action && !isOpenModal) {
      if ((action === "edit" || action === "view") && id) {
        const item = findItemById(id);
        if (item) {
          dispatchModal({ type: "OPEN", mode: action, payload: item });
        } else {
          handleCloseModal(); // Clean URL if item not found
        }
      }
    } else if (!action && isOpenModal) {
      dispatchModal({ type: "CLOSE" });
    }
  }, [searchParams, isOpenModal, findItemById]);
  
  // HANDLER: Closes modal and clears URL
  const handleCloseModal = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // HANDLER: Opens 'add' modal and updates URL
  const handleAddClick = useCallback(() => {
    setSearchParams({ action: "add" }, { replace: true });
  }, [setSearchParams]);
  
  // USE HOOK FOR 'add' ACTION
  useActionFromURL('add', () => {
      if (!isOpenModal) {
          dispatchModal({ type: "OPEN", mode: 'add', payload: null });
      }
  });

  // HANDLER: Opens 'edit' modal and updates URL
  const handleEditClick = useCallback((item) => {
    setSearchParams({ action: "edit", id: item.id }, { replace: true });
  }, [setSearchParams]);
  
  // HANDLER: Opens 'view' modal and updates URL
  const handleViewClick = useCallback((item) => {
    setSearchParams({ action: "view", id: item.id }, { replace: true });
  }, [setSearchParams]);
  

  useEffect(() => {
    setName(urlName || "");
    setDoneById(urlDoneById || "");
    setCostCenterId(urlCostCenterId || defaultCostCenter);
    setHeaderFilters({
      name: urlName || "",
      done_by_id: urlDoneById || "",
      cost_center_id: urlCostCenterId || "",
    });
    setSort(urlSort || "");
    setSearchKey(urlSearchKey || "");
    setSearchType(urlSearchType || "");
  }, [urlState, defaultCostCenter]);
  
  const handleItemCreated = useCallback(() => {
    if (refetch) refetch();
  }, [refetch]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: CRUDITEM[ENTITY_CRUD_KEY],
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        if (selectedItem?.id === id) {
          handleCloseModal();
        }
        handleItemCreated();
      } catch (error) {
        showToast({
          crudItem: CRUDITEM[ENTITY_CRUD_KEY],
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteItem, showToast, ENTITY_CRUD_KEY, handleItemCreated, selectedItem, handleCloseModal]
  );
  
  // ... (rest of the handlers remain the same)
  const handleSort = useCallback(
    (value) => {
      setSort(value);
      handleSetURLState({ ...urlState, sort: value });
    },
    [urlState, handleSetURLState]
  );

  const handleSearch = useCallback(() => {
    handleSetURLState({ ...urlState, searchType, searchKey });
  }, [searchType, searchKey, urlState, handleSetURLState]);

  const handleHeaderSearch = useCallback(
    (key, value) => {
      handleSetURLState({ ...urlState, [key]: value });
    },
    [urlState, handleSetURLState]
  );

  const handleAutocompleteHeaderSearch = useCallback(
    (key, value) => {
      if (key === "done_by_id") setDoneById(value);
      if (key === "cost_center_id") setCostCenterId(value);
      handleHeaderSearch(key, value);
    },
    [handleHeaderSearch]
  );

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleFilter = useCallback(() => {
    handleSetURLState({
      name,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, doneById, costCenterId, handleSetURLState]);

  const handleRefresh = useCallback(() => {
    setName("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");

    setHeaderFilters({ name: "", done_by_id: "", cost_center_id: "" });

    handleSetURLState({
      name: "",
      sort: "",
      done_by_id: "",
      cost_center_id: isDisableCostCenter ? defaultCostCenter : "",
      searchType: "",
      searchKey: "",
    });
    if (refetch) refetch();
    showToast({
      type: TOASTTYPE.GENARAL,
      message: `${PAGE_TITLE} has been refreshed.`,
      status: TOASTSTATUS.SUCCESS,
    });
  }, [
    isDisableCostCenter,
    defaultCostCenter,
    showToast,
    PAGE_TITLE,
    refetch,
    handleSetURLState,
  ]);
  
  const commonRowProps = {
    onEdit: handleEditClick,
    onView: handleViewClick,
    onDelete: handleDelete,
  };
  
  // ... (JSX remains the same, but the logic is now cleaner)
  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "done_by_name", name: "Done By" },
    { value: "cost_center_name", name: "Cost Center" },
  ];

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
    DoneByAutoCompleteComponent,
    CostCenterAutoCompleteComponent,
  };
  
  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <TableTopContainer2>
              <PageTitleWithBackButton title={PAGE_TITLE} />
              <HStack>
                <ListFilter {...filterProps} />
                <RefreshButton onClick={handleRefresh} />
                <PopupSearchField
                  searchRef={searchRef}
                  searchKey={searchKey}
                  setSearchKey={setSearchKey}
                  setSearchType={setSearchType}
                  handleSearch={handleSearch}
                  searchOptions={searchOptions}
                />
                <AddButton onClick={handleAddClick}>
                  {ADD_BUTTON_TEXT}
                </AddButton>
              </HStack>
            </TableTopContainer2>
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
                            <DoneByAutoCompleteComponent
                              placeholder="Select Done By"
                              value={headerFilters.done_by_id}
                              onChange={(e) =>
                                handleAutocompleteHeaderSearch(
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
                            <CostCenterAutoCompleteComponent
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
                  {list && list.length > 0 ? (
                    list.map((type, index) => (
                      <ExpenseTypeRow
                        key={type.id}
                        type={type}
                        index={index}
                        page={1}
                        pageSize={list.length}
                        {...commonRowProps}
                      />
                    ))
                  ) : (
                    <TableCaption
                      item={ENTITY_TRANSACTION_CONSTANT}
                      noOfCol={5}
                    />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title={PAGE_TITLE} />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchRef={searchRef}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>
                    {ADD_BUTTON_TEXT}
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : list && list.length === 0 ? (
                <TableCaption item={ENTITY_TRANSACTION_CONSTANT} />
              ) : (
                <div>
                  {list &&
                    list.map((item) => (
                      <ListItem
                        key={item.id}
                        title={item.name}
                        subtitle={
                          <>
                            {item.done_by_name && (
                              <div>Done By: {item.done_by_name}</div>
                            )}
                            {item.cost_center_name && (
                              <div>Cost Center: {item.cost_center_name}</div>
                            )}
                          </>
                        }
                        onView={() => handleViewClick(item)}
                        onEdit={() => handleEditClick(item)}
                        onDelete={() => handleDelete(item.id)}
                      />
                    ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddModalComponent
        isOpen={isOpenModal}
        onClose={handleCloseModal}
        mode={mode}
        selectedExpenseType={selectedItem}
        onExpenseTypeCreated={handleItemCreated}
      />
    </>
  );
};

export default CommonExpenseTypeList;