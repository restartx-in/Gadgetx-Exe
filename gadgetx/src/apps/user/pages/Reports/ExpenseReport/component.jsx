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
import useExpensesPaginated from "@/hooks/api/expense/useExpensesPaginated";
import useDeleteExpense from "@/hooks/api/expense/useDeleteExpense";
import { useExpenseTypes } from "@/hooks/api/expenseType/useExpenseTypes";
import useAccounts from "@/hooks/api/account/useAccounts";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import DateFilter from "@/components/DateFilter";
import Expense from "@/apps/user/pages/Transactions/Expense";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import PopUpFilter from "@/components/PopUpFilter";
import Loader from "@/components/Loader";
import RangeField from "@/components/RangeField";
import InputField from "@/components/InputField";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdNumeric,
  TdSL,
  ThSL,
  TdDate,
  TdMenu,
  ThMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import AmountSummary from "@/components/AmountSummary";
import AddButton from "@/components/AddButton";
import DateField from "@/components/DateField";
import Select from "@/components/Select";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import TableFooter from "@/components/TableFooter";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ExportMenu from "@/components/ExportMenu";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import TableTopContainer from "@/components/TableTopContainer";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TextBadge from "@/apps/user/components/TextBadge";
import { format, isValid } from "date-fns";
import { useExpenseExportAndPrint } from "@/hooks/api/exportAndPrint/useExpenseExportAndPrint";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

const getExpenseStatus = (exp) => {
  const amount = parseFloat(exp.amount) || 0;
  const amountPaid = parseFloat(exp.amount_paid) || 0;
  const balance = amount - amountPaid;
  let status = "Unpaid";
  if (balance <= 0) {
    status = "Paid";
  } else if (amountPaid > 0 && balance > 0) {
    status = "Partial";
  }
  return { balance, status };
};

const ExpenseRow = React.memo(
  ({ exp, index, page, pageSize, onEdit, onView, onDelete }) => {
    const { balance, status } = getExpenseStatus(exp);
    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        <TdDate>{exp.date}</TdDate>
        {/* FIX APPLIED: Use flat property 'category' */}
        <Td>{exp.category || "N/A"}</Td>
        {/* FIX APPLIED: Use flat property 'account_name' */}
        <Td>{exp.account_name || "N/A"}</Td>
        {/* FIX APPLIED: Use flat property 'done_by_name' */}
        <Td>{exp.done_by_name || "N/A"}</Td>
        {/* FIX APPLIED: Use flat property 'cost_center_name' */}
        <Td>{exp.cost_center_name || "N/A"}</Td>

        <Td>{exp.description}</Td>
        <TdNumeric>{exp.amount}</TdNumeric>
        <TdNumeric>{exp.amount_paid}</TdNumeric>
        <TdNumeric>{balance.toFixed(2)}</TdNumeric>
        <Td>
          <TextBadge variant="paymentStatus" type={status}>
            {status}
          </TextBadge>
        </Td>
        <TdMenu
          onEdit={() => onEdit(exp)}
          onView={() => onView(exp)}
          onDelete={() => onDelete(exp.id)}
        />
      </Tr>
    );
  }
);

const ExpenseReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // UI States for filter inputs (These remain useState as they manage the local form)
  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");

  // Other component states (These remain useState)
  const [headerCategory, setHeaderCategory] = useState("");
  const [headerAccount, setHeaderAccount] = useState("");
  const [headerFilters, setHeaderFilters] = useState({
    amount: "",
    amount_paid: "",
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    rangeType: "custom",
  });
  const [filterDatas, setFilterDatas] = useState({});

  // Modal States
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenExpenseModal, setIsOpenExpenseModal] = useState(false);

  // --- 1. Centralized state initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    category: searchParams.get("category") || "",
    account_id: searchParams.get("accountId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    min_amount: searchParams.get("minAmount") || "",
    max_amount: searchParams.get("maxAmount") || "",
    amount: searchParams.get("amount") || "",
    amount_paid: searchParams.get("amountPaid") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: "",
    end_date: "",
  });

  // --- 2. Sync state to URL using custom hook ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    category: state.category,
    accountId: state.account_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    minAmount: state.min_amount,
    maxAmount: state.max_amount,
    amount: state.amount,
    amountPaid: state.amount_paid,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  const { data, isLoading, refetch, isRefetching } =
    useExpensesPaginated(state);
  const { data: accounts = [] } = useAccounts();
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { data: expenseTypesData, isLoading: expenseTypesLoading } =
    useExpenseTypes();

  // Derived Data (Matching AdvanceList pattern)
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching;

  // --- 3. Sync UI controls from main state ---
  useEffect(() => {
    setCategory(state.category || "");
    setAccountId(state.account_id || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    setMinAmount(state.min_amount || "");
    setMaxAmount(state.max_amount || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderCategory(state.category || "");
    setHeaderAccount(state.account_id || "");
    setHeaderFilters({
      amount: state.amount || "",
      amount_paid: state.amount_paid || "",
    });
    setDateFilter({
      startDate: state.start_date || "",
      endDate: state.end_date || "",
      rangeType: "custom",
    });
  }, [state, defaltCostCenter]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    setFilterDatas({
      category,
      accountId,
      doneById,
      costCenterId,
      minAmount,
      maxAmount,
      headerCategory,
      headerAccount,
      amount: headerFilters.amount,
      amount_paid: headerFilters.amount_paid,
    });
  }, [
    category,
    accountId,
    doneById,
    costCenterId,
    minAmount,
    maxAmount,
    headerCategory,
    headerAccount,
    headerFilters,
  ]);

  const { exportToExcel, exportToPdf, printDocument } =
    useExpenseExportAndPrint({
      listData: listData,
      reportType: "Expense Report",
      duration: startDate && endDate ? `${startDate} to ${endDate}` : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: {
        totalAmount: data?.total_amount || 0,
      },
      filterDatas,
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

  // --- Handlers (Memoized) - UPDATED setState CALLS ---

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ page: 1, sort: value }); // Simplified setState
  }, []);

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState({
      // Simplified setState
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleSearch = useCallback(() => {
    setState({ page: 1, searchType, searchKey }); // Simplified setState
  }, [searchType, searchKey]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({
      // Simplified setState
      [key]: value,
      ...(key === "amount" && { min_amount: "", max_amount: "" }),
      page: 1,
    });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [headerFilters, handleHeaderSearch]
  );

  const handleFilter = useCallback(() => {
    setState({
      // Simplified setState
      page: 1,
      category,
      account_id: accountId,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      min_amount: minAmount,
      max_amount: maxAmount,
      start_date: startDate,
      end_date: endDate,
      amount: "", // Clear header filters when applying main filter
      amount_paid: "",
    });
    setShowFilter(false);
  }, [
    category,
    accountId,
    doneById,
    costCenterId,
    minAmount,
    maxAmount,
    startDate,
    endDate,
  ]);

  const handleRefresh = useCallback(() => {
    // Reset local UI states
    setCategory("");
    setAccountId("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId(defaltCostCenter);
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setHeaderCategory("");
    setHeaderAccount("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setDateFilter({ startDate: "", endDate: "", rangeType: "custom" });
    setHeaderFilters({ amount: "", amount_paid: "" });

    // Reset Main State (The useReducer dispatch will merge this object into the current state)
    setState({
      page: 1,
      page_size: 10,
      category: "",
      account_id: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      amount: "",
      amount_paid: "",
      min_amount: "",
      max_amount: "",
      start_date: "",
      end_date: "",
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const handleHeaderCategoryFilter = useCallback((value) => {
    setHeaderCategory(value);
    setState({ page: 1, category: value }); // Simplified setState
  }, []);

  const handleHeaderAccountFilter = useCallback((value) => {
    setHeaderAccount(value);
    setState({ page: 1, account_id: value }); // Simplified setState
  }, []);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }); // Simplified setState
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value }); // Simplified setState
  }, []);

  const handleAddClick = useCallback(() => {
    setMode("add");
    setSelectedExpense(null);
    setIsOpenExpenseModal(true);
  }, []);

  const handleEditClick = useCallback((expense) => {
    setSelectedExpense(expense);
    setMode("edit");
    setIsOpenExpenseModal(true);
  }, []);

  const handleViewClick = useCallback((expense) => {
    setSelectedExpense(expense);
    setMode("view");
    setIsOpenExpenseModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteExpense(id);
        showToast({
          crudItem: CRUDITEM.EXPENSE,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          type: "GENARAL",
          message:
            error.response?.data?.error || "Failed to delete the expense.",
          status: "ERROR",
        });
      }
    },
    [deleteExpense, refetch, showToast]
  );

  const searchOptions = useMemo(
    () => [
      { value: "description", name: "Description" },
      { value: "category", name: "Type" },
      { value: "amount", name: "Amount" },
      { value: "amount_paid", name: "Amount Paid" },
      { value: "account_name", name: "Account" },
      { value: "done_by_name", name: "Done By" },
      ...(!isDisableCostCenter
        ? [{ value: "cost_center_name", name: "Cost Center" }]
        : []),
    ],
    [isDisableCostCenter]
  );

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    category,
    setCategory,
    accountId,
    setAccountId,
    accounts,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    expenseTypesData,
    expenseTypesLoading,
    disableCostCenter: isDisableCostCenter,
  };

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All Types" },
      ...(expenseTypesData || []).map((type) => ({
        value: type.name,
        label: type.name,
      })),
    ],
    [expenseTypesData]
  );

  const accountOptions = useMemo(
    () => [
      { value: "", label: "All Accounts" },
      ...(accounts || []).map((acc) => ({ value: acc.id, label: acc.name })),
    ],
    [accounts]
  );

  const { startDate: dfStartDate, endDate: dfEndDate } = dateFilter;
  const isDateFilterActive =
    dfStartDate &&
    dfEndDate &&
    isValid(new Date(dfStartDate)) &&
    isValid(new Date(dfEndDate));

  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(dfStartDate), "MMM d, yyyy")} → ${format(
        new Date(dfEndDate),
        "MMM d, yyyy"
      )}`
    : null;

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Expenses" subtitle={dateSubtitle} />
            <TableTopContainer
              summary={
                !loading && data && <AmountSummary total={data.total_amount} />
              }
              mainActions={
                <>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />

                  {!loading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )}
                  <PopupSearchField
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                  <AddButton onClick={handleAddClick}>Add Expense</AddButton>
                </>
              }
            />
            {loading ? (
              <Loader />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>
                      <ThContainer>
                        Date
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="date"
                          handleSort={handleSort}
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Type
                        <ThFilterContainer>
                          <ThSort
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="category"
                          />
                          <ThSearchOrFilterPopover isSearch={false}>
                            <Select
                              name="header_category_filter"
                              value={headerCategory}
                              onChange={(e) =>
                                handleHeaderCategoryFilter(e.target.value)
                              }
                              options={categoryOptions}
                              disabled={expenseTypesLoading}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Account
                        <ThFilterContainer>
                          <ThSort
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="account_name"
                          />
                          <ThSearchOrFilterPopover isSearch={false}>
                            <AccountAutoComplete
                              name="header_account_filter"
                              value={headerAccount}
                              onChange={(e) =>
                                handleHeaderAccountFilter(e.target.value)
                              }
                              options={accountOptions}
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
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="done_by"
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <DoneByAutoComplete
                              placeholder="Select Done By"
                              value={state.done_by_id}
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
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="cost_center"
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <CostCenterAutoComplete
                              placeholder="Select Cost Center"
                              value={state.cost_center_id}
                              onChange={(e) =>
                                handleHeaderSearch(
                                  "cost_center_id",
                                  e.target.value
                                )
                              }
                              is_edit={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Description</Th>
                    <Th>
                      <ThContainer>
                        Amount
                        <ThFilterContainer>
                          <ThSort
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="amount"
                          />
                          <ThSearchOrFilterPopover
                            isSearch={true}
                            popoverWidth={220}
                            onSearch={() =>
                              handleHeaderSearch("amount", headerFilters.amount)
                            }
                          >
                            <InputField
                              placeholder="Search Exact Amount"
                              type="number"
                              value={headerFilters.amount}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "amount")
                              }
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Paid
                        <ThFilterContainer>
                          <ThSort
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="amount_paid"
                          />
                          <ThSearchOrFilterPopover
                            isSearch={true}
                            popoverWidth={220}
                            onSearch={() =>
                              handleHeaderSearch(
                                "amount_paid",
                                headerFilters.amount_paid
                              )
                            }
                          >
                            <InputField
                              placeholder="Search Exact Amount"
                              type="number"
                              value={headerFilters.amount_paid}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  amount_paid: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "amount_paid")
                              }
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {listData.length > 0 ? (
                    listData.map((exp, index) => (
                      <ExpenseRow
                        key={exp.id}
                        exp={exp}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.Expense} noOfCol={12} />
                  )}
                </Tbody>
              </Table>
            )}
            {!loading && listData.length > 0 && (
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
        ) : (
          <>
            <PageTitleWithBackButton title="Expenses" />
            <ScrollContainer>
              <PageHeader className="expense_report_header">
                <HStack justifyContent="flex-end" style={{ width: "100%" }}>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                </HStack>
                <div className="expense_report__add_button">
                  <AddButton onClick={handleAddClick}>Add Expense</AddButton>
                </div>
              </PageHeader>
              {loading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Expense} />
              ) : (
                <div>
                  {listData.map((exp) => {
                    const { balance, status } = getExpenseStatus(exp);
                    const amountPaid = parseFloat(exp.amount_paid) || 0;
                    return (
                      <ListItem
                        key={exp.id}
                        // FIX APPLIED: Use flat property 'category'
                        title={exp.category || 'N/A'}
                        subtitle={
                          <>
                            {/* FIX APPLIED: Use flat property 'account_name' */}
                            <div>Account: {exp.account_name || "N/A"}</div>
                            {new Date(exp.date).toLocaleDateString("en-IN")}
                            <div className="list-item-status-wrapper">
                              <TextBadge variant="paymentStatus" type={status}>
                                {status}
                              </TextBadge>
                            </div>
                            <div></div>
                          </>
                        }
                        amount={
                          <div style={{ textAlign: "right" }}>
                            <div>{exp.amount || 0}</div>
                            {amountPaid > 0 && (
                              <div
                                style={{ color: "green", fontSize: "0.8rem" }}
                              >
                                Paid: {exp.amount_paid || 0}
                              </div>
                            )}
                            {balance > 0 && (
                              <div style={{ color: "red", fontSize: "0.8rem" }}>
                                Balance: {balance.toFixed(2)}
                              </div>
                            )}
                          </div>
                        }
                        onView={() => handleViewClick(exp)}
                        onEdit={() => handleEditClick(exp)}
                        onDelete={() => handleDelete(exp.id)}
                      />
                    );
                  })}
                </div>
              )}
              <Spacer />
              {!loading && listData.length > 0 && (
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

      <Expense
        isOpen={isOpenExpenseModal}
        onClose={() => setIsOpenExpenseModal(false)}
        mode={mode}
        selectedExpense={selectedExpense}
        onSuccess={refetch}
      />
    </>
  );
};

const ListFilter = React.memo(({ ...props }) => {
  const {
    showFilter,
    setShowFilter,
    handleFilter,
    category,
    setCategory,
    accountId,
    setAccountId,
    accounts,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    expenseTypesData,
    expenseTypesLoading,
    disableCostCenter,
  } = props;

  const isMobile = useIsMobile();
  const filterCategoryOptions = [
    { value: "", label: "All Types" },
    ...(expenseTypesData || []).map((type) => ({
      value: type.name,
      label: type.name,
    })),
  ];
  const accountFilterOptions = [
    { value: "", label: "All Accounts" },
    ...(accounts || []).map((acc) => ({ value: acc.id, label: acc.name })),
  ];
  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack>
        <Select
          label="Type"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={filterCategoryOptions}
          disabled={expenseTypesLoading}
        />
        <AccountAutoComplete
          label="Account"
          name="account_id"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={accountFilterOptions}
          disabled={!accounts}
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
        <RangeField
          label="Amount"
          minValue={minAmount}
          maxValue={maxAmount}
          onMinChange={(value) => setMinAmount(value)}
          onMaxChange={(value) => setMaxAmount(value)}
        />
        {isMobile ? (
          <>
            {" "}
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split("T")[0] : "")
              }
            />{" "}
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split("T")[0] : "")
              }
            />{" "}
          </>
        ) : (
          <HStack justifyContent="flex-start">
            {" "}
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split("T")[0] : "")
              }
            />{" "}
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split("T")[0] : "")
              }
            />{" "}
          </HStack>
        )}
      </VStack>
    </PopUpFilter>
  );
});
export default ExpenseReport;