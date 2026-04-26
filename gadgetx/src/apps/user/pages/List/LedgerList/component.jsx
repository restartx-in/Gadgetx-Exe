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
import useLedgerPaginated from "@/hooks/api/ledger/useLedgerPaginated";
import useDeleteLedger from "@/hooks/api/ledger/useDeleteLedger";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  ThSL,
  TdSL,
  TdDate,
  TdMenu,
  ThMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import VStack from "@/components/VStack/component.jsx";
import HStack from "@/components/HStack/component.jsx";
import PageHeader from "@/components/PageHeader";
import InputField from "@/components/InputField";
import MobileSearchField from "@/components/MobileSearchField";
import PopupSearchField from "@/components/PopupSearchField";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import DateField from "@/components/DateField";
import DateFilter from "@/components/DateFilter";
import AddLedger from "./components/AddLedger";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TableTopContainer from "@/components/TableTopContainer";
import ExportMenu from "@/components/ExportMenu";
// NOTE: You'll need to create a hook like this:
// import { useLedgerExportAndPrint } from "@/hooks/api/exportAndPrint/useLedgerExportAndPrint";

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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
};

const LedgerRow = React.memo(
  ({ ledger, index, page, pageSize, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <Td>{ledger.name}</Td>
      <Td>{parseFloat(ledger.balance).toFixed(2)}</Td>
      <Td>{ledger.done_by_name || "N/A"}</Td>
      <Td>{ledger.cost_center_name || "N/A"}</Td>
      <TdDate>{ledger.created_at}</TdDate>
      <TdMenu
        onEdit={() => onEdit(ledger)}
        onView={() => onView(ledger)}
        onDelete={() => onDelete(ledger.id)}
      />
    </Tr>
  )
);

const MobileLedger = React.memo(({ ledger, onView, onEdit, onDelete }) => (
  <ListItem
    key={ledger.id}
    title={ledger.name}
    subtitle={
      <>
        <div>Done By: {ledger.done_by_name || "N/A"}</div>
        <div style={{ color: "var(--color-neutral-600)" }}>
          Cost Center: {ledger.cost_center_name || "N/A"}
        </div>
      </>
    }
    amount={
      <div style={{ textAlign: "right" }}>
        <div className="fs18fw600" style={{ color: "green" }}>
          {parseFloat(ledger.balance).toFixed(2)}
        </div>
        <div className="fs14" style={{ color: "var(--color-neutral-500)" }}>
          {formatDate(ledger.created_at)}
        </div>
      </div>
    }
    onView={() => onView(ledger)}
    onEdit={() => onEdit(ledger)}
    onDelete={() => onDelete(ledger.id)}
  />
));

const LedgerList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const searchRef = useRef(null);
  const isMobile = useIsMobile();

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    balance: searchParams.get("balance") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    name: state.name,
    balance: state.balance,
    startDate: state.start_date,
    endDate: state.end_date,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  // Local UI states for controlled inputs
  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(state.name);
  const [balance, setBalance] = useState(state.balance);
  const [startDate, setStartDate] = useState(state.start_date);
  const [endDate, setEndDate] = useState(state.end_date);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [headerFilters, setHeaderFilters] = useState({});
  const [dateFilter, setDateFilter] = useState({});
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  useEffect(() => {
    setName(state.name || "");
    setBalance(state.balance || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || "");
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");

    setHeaderFilters({
      name: state.name || "",
      balance: state.balance || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });

    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: "custom",
    });
  }, [state]);

  const filterDatas = useMemo(
    () => ({
      name: state.name,
      balance: state.balance,
      doneById: state.done_by_id,
      costCenterId: state.cost_center_id,
      ...headerFilters,
    }),
    [state, headerFilters]
  );

  const { data, isLoading } = useLedgerPaginated(state);
  const { mutateAsync: deleteLedger } = useDeleteLedger();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;

  // NOTE: Assuming useLedgerExportAndPrint is implemented similarly to useItemExportAndPrint
  // const { exportToExcel, exportToPdf, printDocument } = useLedgerExportAndPrint({
  //   listData: listData,
  //   reportType: "Ledger List",
  //   duration: startDate && endDate ? `${startDate} to ${endDate}` : "",
  //   pageNumber: state.page,
  //   selectedPageCount: state.page_size,
  //   totalPage: totalPages,
  //   totalData: {
  //     totalItems: totalItems,
  //   },
  //   filterDatas,
  //   searchType: state.searchType,
  //   searchKey: state.searchKey,
  // });

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ page: 1, sort: value });
  }, []);

  const handleSearch = useCallback(
    () => setState({ page: 1, searchType, searchKey }),
    [searchType, searchKey]
  );
  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    []
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    []
  );

  const handleFilter = useCallback(() => {
    setState({
      page: 1,
      name,
      balance,
      start_date: startDate,
      end_date: endDate,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, balance, startDate, endDate, doneById, costCenterId]);

  const handleHeaderSearch = useCallback(
    (key, value) => setState({ [key]: value, page: 1 }),
    []
  );

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState({
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") handleHeaderSearch(key, headerFilters[key]);
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleRefresh = useCallback(() => {
    setName("");
    setBalance("");
    setStartDate("");
    setEndDate("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setHeaderFilters({
      name: "",
      balance: "",
      done_by_id: "",
      cost_center_id: "",
    });
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });

    setState({
      page: 1,
      page_size: 10,
      name: "",
      balance: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaultCostCenter, isDisableCostCenter]);

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (ledger) => dispatchModal({ type: "OPEN", mode: "edit", payload: ledger }),
    []
  );
  const handleViewClick = useCallback(
    (ledger) => dispatchModal({ type: "OPEN", mode: "view", payload: ledger }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteLedger(id);
        showToast({
          crudItem: CRUDITEM.LEDGER,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.LEDGER,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteLedger, showToast]
  );

  const searchOptions = [
    { value: "name", name: "Name" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ];

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    balance,
    setBalance,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
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
            <PageTitleWithBackButton title="Ledgers" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />

                  {/* {!isLoading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )} */}

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
                  <AddButton onClick={handleAddClick}>Add Ledger</AddButton>
                </>
              }
            />
            {isLoading ? (
              <Loader />
            ) : (
              <>
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
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch("name", headerFilters.name)
                              }
                            >
                              <InputField
                                placeholder="Search Name"
                                value={headerFilters.name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "name")
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Balance
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "balance",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "balance",
                                  headerFilters.balance
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Balance"
                                type="number"
                                value={headerFilters.balance}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    balance: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "balance")
                                }
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
                              {...{
                                sort,
                                setSort,
                                value: "done_by",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={false}
                              popoverWidth={220}
                            >
                              <DoneByAutoComplete
                                placeholder="Select Done By"
                                value={headerFilters.done_by_id}
                                onChange={(e) =>
                                  handleHeaderSearch(
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
                      <Th>
                        <ThContainer>
                          Date
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "created_at",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover>
                              <DateFilter
                                value={dateFilter}
                                onChange={handleDateFilterChange}
                                popover={true}
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
                      listData.map((ledger, index) => (
                        <LedgerRow
                          key={ledger.id}
                          ledger={ledger}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          onEdit={handleEditClick}
                          onView={handleViewClick}
                          onDelete={handleDelete}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Ledger} noOfCol={7} />
                    )}
                  </Tbody>
                </Table>
                {!isLoading && listData.length > 0 && (
                  <TableFooter
                    totalItems={totalItems}
                    currentPage={state.page}
                    itemsPerPage={state.page_size}
                    totalPages={totalPages}
                    handlePageLimitSelect={handlePageLimitSelect}
                    handlePageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Ledgers" />
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
                  <AddButton onClick={handleAddClick}>Add Ledger</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Ledger} />
              ) : (
                <div>
                  {listData.map((ledger) => (
                    <MobileLedger
                      key={ledger.id}
                      ledger={ledger}
                      onView={handleViewClick}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
              <Spacer />
              {!isLoading && listData.length > 0 && (
                <TableFooter
                  totalItems={totalItems}
                  currentPage={state.page}
                  itemsPerPage={state.page_size}
                  totalPages={totalPages}
                  handlePageLimitSelect={handlePageLimitSelect}
                  handlePageChange={handlePageChange}
                />
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddLedger
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedLedger={modalState.selected}
      />
    </>
  );
};

export default LedgerList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    balance,
    setBalance,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter,
  }) => {
    const isMobile = useIsMobile();
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
            label="Balance"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            type="number"
            step="0.01"
          />
          <DoneByAutoComplete
            placeholder="Done By"
            value={doneById}
            onChange={(e) => setDoneById(e.target.value)}
            name="done_by_id"
            is_edit={false}
          />
          <CostCenterAutoComplete
            placeholder="Cost Center"
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            name="cost_center_id"
            is_edit={false}
            disabled={disableCostCenter}
          />
          {isMobile ? (
            <>
              <DateField
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(date) =>
                  setStartDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
              <DateField
                label="End Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(date) =>
                  setEndDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
            </>
          ) : (
            <HStack>
              <DateField
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(date) =>
                  setStartDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
              <DateField
                label="End Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(date) =>
                  setEndDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
            </HStack>
          )}
        </VStack>
      </PopUpFilter>
    );
  }
);
