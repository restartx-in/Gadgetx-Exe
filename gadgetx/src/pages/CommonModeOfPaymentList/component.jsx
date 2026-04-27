import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
} from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  TdSL,
  TdMenu,
  Th,
  ThSL,
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
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import HStack from "@/components/HStack";
import RefreshButton from "@/components/RefreshButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import InputField from "@/components/InputField";

const MOPFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    done_by_id,
    setDoneById,
    cost_center_id,
    setCostCenterId,
    disableCostCenter,
    DoneByAutoCompleteComponent,
    CostCenterAutoCompleteComponent,
  }) => {
    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleFilter}
      >
        <VStack>
          <InputField
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <DoneByAutoCompleteComponent
            placeholder="Done By"
            value={done_by_id}
            onChange={(e) => setDoneById(e.target.value)}
            is_edit={false}
          />
          <CostCenterAutoCompleteComponent
            placeholder="Cost Center"
            value={cost_center_id}
            onChange={(e) => setCostCenterId(e.target.value)}
            is_edit={false}
            disabled={disableCostCenter}
          />
        </VStack>
      </PopUpFilter>
    );
  },
);

const CommonMOPRow = React.memo(
  ({ item, index, listLength, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={1} pageSize={listLength} />
      <Td>{item.name}</Td>
      <Td>{item.default_ledger_name || "-"}</Td>
      <Td>{item.done_by_name}</Td>
      <Td>{item.cost_center_name}</Td>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  ),
);

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

const CommonModeOfPaymentList = ({
  urlState,
  setURLState,

  AddMOPModal,
  DoneByAutoCompleteHeader,
  CostCenterAutoCompleteHeader,
  list: listData,
  isLoading,
  refetch,
  deleteItem,

  title = "Mode of Payments",
  addBtnText = "Add MOP",
  tableHeaders = ["Name", "Default Ledger", "Done By", "Cost Center"],
  TABLE_CAPTION = CRUDITEM.MODEOFPAYMENT || "Mode Of Payment",
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(urlState.name || "");
  const [done_by_id, setDoneById] = useState(urlState.done_by_id || "");
  const [cost_center_id, setCostCenterId] = useState(
    urlState.cost_center_id || defaultCostCenter,
  );
  const [searchKey, setSearchKey] = useState(urlState.searchKey || "");
  const [searchType, setSearchType] = useState(urlState.searchType || "");
  const [headerFilters, setHeaderFilters] = useState({
    name: urlState.name || "",
    done_by_id: urlState.done_by_id || "",
    cost_center_id: urlState.cost_center_id || "",
  });

  useEffect(() => {
    setName(urlState.name || "");
    setDoneById(urlState.done_by_id || "");
    setCostCenterId(urlState.cost_center_id || defaultCostCenter);
    setSearchKey(urlState.searchKey || "");
    setSearchType(urlState.searchType || "");
    setHeaderFilters({
      name: urlState.name || "",
      done_by_id: urlState.done_by_id || "",
      cost_center_id: urlState.cost_center_id || "",
    });
  }, [urlState, defaultCostCenter]);

  const sort = urlState.sort || "";

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState,
  );

  const updateURL = useCallback(
    (updates) => {
      const newParams = {
        ...urlState,
        ...updates,
      };
      Object.keys(newParams).forEach((key) => {
        if (
          !newParams[key] ||
          (key === "cost_center_id" && newParams[key] === defaultCostCenter)
        ) {
          delete newParams[key];
        }
      });
      setURLState(newParams, { replace: true });
    },
    [urlState, setURLState, defaultCostCenter],
  );

  const handleSort = useCallback(
    (value) => {
      updateURL({ sort: value });
    },
    [updateURL],
  );

  const handleSearch = useCallback(() => {
    updateURL({ searchType, searchKey });
  }, [searchType, searchKey, updateURL]);

  const handleHeaderSearch = useCallback(
    (key, value) => {
      updateURL({ [key]: value });
    },
    [updateURL],
  );

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [handleHeaderSearch, headerFilters],
  );

  const handleFilter = useCallback(() => {
    updateURL({
      name,
      done_by_id: done_by_id,
      cost_center_id: cost_center_id,
    });
    setShowFilter(false);
  }, [name, done_by_id, cost_center_id, updateURL]);

  const handleRefresh = useCallback(() => {
    setURLState({}, { replace: true });

    if (isDisableCostCenter && defaultCostCenter) {
      setURLState({ cost_center_id: defaultCostCenter }, { replace: true });
    }

    refetch();
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [setURLState, isDisableCostCenter, defaultCostCenter, refetch, showToast]);

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    [],
  );
  const handleEditClick = useCallback(
    (item) => dispatchModal({ type: "OPEN", mode: "edit", payload: item }),
    [],
  );
  const handleViewClick = useCallback(
    (item) => dispatchModal({ type: "OPEN", mode: "view", payload: item }),
    [],
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    [],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: TABLE_CAPTION,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({ crudItem: TABLE_CAPTION, crudType: CRUDTYPE.DELETE_ERROR });
      }
    },
    [deleteItem, showToast, TABLE_CAPTION],
  );

  useEffect(() => {
    if (searchParams.get("action") === "add" && !modalState.isOpen) {
      handleAddClick();
      navigate(location.pathname, { replace: true });
    }
  }, [
    searchParams,
    modalState.isOpen,
    navigate,
    location.pathname,
    handleAddClick,
  ]);

  const searchOptions = [{ value: "name", name: "Name" }];

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    done_by_id,
    setDoneById,
    cost_center_id,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
    DoneByAutoCompleteComponent: DoneByAutoCompleteHeader,
    CostCenterAutoCompleteComponent: CostCenterAutoCompleteHeader,
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title={title} />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <MOPFilter {...filterProps} />
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
                  <AddButton onClick={handleAddClick}>{addBtnText}</AddButton>
                </>
              }
            />
            {isLoading ? (
              <Loader />
            ) : (
              <Table className="mop-table">
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>
                      <ThContainer>
                        Name
                        <ThFilterContainer>
                          <ThSort
                            {...{
                              sort,
                              setSort: handleSort,
                              value: "name",
                              handleSort,
                            }}
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
                        Default Ledger
                        <ThFilterContainer>
                          <ThSort
                            {...{
                              sort,
                              setSort: handleSort,
                              value: "default_ledger",
                              handleSort,
                            }}
                          />
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Done By
                        <ThFilterContainer>
                          <ThSort
                            {...{
                              sort,
                              setSort: handleSort,
                              value: "done_by",
                              handleSort,
                            }}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <DoneByAutoCompleteHeader
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
                              setSort: handleSort,
                              value: "cost_center",
                              handleSort,
                            }}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <CostCenterAutoCompleteHeader
                              placeholder="Select Cost Center"
                              value={headerFilters.cost_center_id}
                              onChange={(e) =>
                                handleHeaderSearch(
                                  "cost_center_id",
                                  e.target.value,
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
                    listData.map((item, index) => (
                      <CommonMOPRow
                        key={item.id}
                        item={item}
                        index={index}
                        listLength={listData.length}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption
                      item={TABLE_CAPTION}
                      noOfCol={tableHeaders.length + 2}
                    />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          /* Mobile View */
          <>
            <PageTitleWithBackButton title={title} />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <MOPFilter {...filterProps} />
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
                  <AddButton onClick={handleAddClick}>{addBtnText}</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={TABLE_CAPTION} />
              ) : (
                <div>
                  {listData.map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.name}
                      subtitle={
                        <>
                          {item.done_by_name && (
                            <div>Done By: {item.done_by_name}</div>
                          )}
                          {item.default_ledger_name && (
                            <div>Default Ledger: {item.default_ledger_name}</div>
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

      <AddMOPModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedMOP={modalState.selected}
      />
    </>
  );
};

export default CommonModeOfPaymentList;
