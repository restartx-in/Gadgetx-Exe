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
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import DateFilter from "@/components/DateFilter";
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
  ThMenu,
  TdMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  TdOverflow,
  ThDotMenu,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import DateField from "@/components/DateField";
import SelectField from "@/components/SelectField";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import TableFooter from "@/components/TableFooter";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ExportMenu from "@/components/ExportMenu";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import TextBadge from "@/components/TextBadge";
import { format, isValid } from "date-fns";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";
import "./style.scss";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const getExpenseStatus = (exp) => {
  const amount = parseFloat(exp.amount) || 0;
  const amountPaid = parseFloat(exp.amount_paid) || 0;
  const balance = amount - amountPaid;
  let status = "unpaid";
  if (balance <= 0) {
    status = "paid";
  } else if (amountPaid > 0 && balance > 0) {
    status = "partial";
  }
  return { balance, status };
};

const ExpenseRow = React.memo(
  ({ exp, index, page, pageSize, onEdit, onView, onDelete, columns }) => {
    const { balance, status } = getExpenseStatus(exp);
    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        {columns.map((field) => {
          if (field.value === "date")
            return <TdDate key={field.value}>{exp.date}</TdDate>;
          if (field.value === "type")
            return (
              <TdOverflow key={field.value}>{exp.category || "N/A"}</TdOverflow>
            );
          if (field.value === "ledger")
            return (
              <TdOverflow key={field.value}>
                {exp.ledger_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "done_by")
            return (
              <TdOverflow key={field.value}>
                {exp.done_by_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "cost_center")
            return (
              <TdOverflow key={field.value}>
                {exp.cost_center_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "description")
            return <TdOverflow key={field.value}>{exp.description}</TdOverflow>;
          if (field.value === "total_amount")
            return <TdNumeric key={field.value}>{exp.amount}</TdNumeric>;
          if (field.value === "paid_amount")
            return <TdNumeric key={field.value}>{exp.amount_paid}</TdNumeric>;
          if (field.value === "balance")
            return (
              <TdNumeric key={field.value}>{balance.toFixed(2)}</TdNumeric>
            );
          if (field.value === "status")
            return (
              <Td key={field.value}>
                <TextBadge variant="paymentStatus" type={status}>
                  {status}
                </TextBadge>
              </Td>
            );
          return null;
        })}
        <TdMenu
          onEdit={() => onEdit(exp)}
          onView={() => onView(exp)}
          onDelete={() => onDelete(exp.id)}
        />
      </Tr>
    );
  },
);

const CommonExpenseReport = ({ hooks, components, config }) => {
  const {
    useExpensesPaginated,
    useDeleteExpense,
    useExpenseTypes,
    useLedger,
    useExpenseExportAndPrint,
    useReportTableFieldsSettings,
    useReportFieldPermissions,
    useUpdateReportFieldPermissions,
    useCreateReportFieldPermissions,
  } = hooks;
  const {
    AmountSummary,
    TableTopContainer,
    LedgerAutoCompleteWithAddOptionWithBalance,
    DoneByAutoComplete,
    CostCenterAutoComplete,
    StatusButton,
    Expense,
  } = components;
  const { Report } = config;

  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
  const [headerFilters, setHeaderFilters] = useState({
    amount: "",
    amount_paid: "",
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenExpenseModal, setIsOpenExpenseModal] = useState(false);
  const [extraFields, setExtraFields] = useState([]);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    category: searchParams.get("category") || "",
    ledger_id: searchParams.get("ledgerId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    status: searchParams.get("status") || "",
    min_amount: searchParams.get("minAmount") || "",
    max_amount: searchParams.get("maxAmount") || "",
    amount: searchParams.get("amount") || "",
    amount_paid: searchParams.get("amountPaid") || "",
    sort: searchParams.get("sort") || "-date",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  const { getExtraFields, getReportSettingsKey } = useReportTableFieldsSettings(
    Report.Expense,
  );
  const allPossibleFields = useMemo(() => getExtraFields(), [getExtraFields]);
  const reportSettingsKey = useMemo(
    () => getReportSettingsKey(),
    [getReportSettingsKey],
  );

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useReportFieldPermissions();
  const { mutate: updatePermissions, isLoading: isUpdatingPermissions } =
    useUpdateReportFieldPermissions();
  const { mutate: createPermissions, isLoading: isCreatingPermissions } =
    useCreateReportFieldPermissions();

  const authDetails = useMemo(
    () => JSON.parse(localStorage.getItem("AUTH_DETAILS") || "{}"),
    [],
  );
  const currentUserId = authDetails?.data?.id;
  const isSavingColumns = isUpdatingPermissions || isCreatingPermissions;

  useEffect(() => {
    if (isLoadingPermissions) return;
    const savedKeys = permissionsData?.[reportSettingsKey];
    if (savedKeys && savedKeys.length > 0) {
      const fieldMap = new Map(allPossibleFields.map((f) => [f.value, f]));
      const orderedVisible = savedKeys
        .map((key) => fieldMap.get(key))
        .filter(Boolean);
      const visibleValues = new Set(orderedVisible.map((f) => f.value));
      const hidden = allPossibleFields.filter(
        (f) => !visibleValues.has(f.value),
      );
      setExtraFields([
        ...orderedVisible.map((f) => ({ ...f, show: true })),
        ...hidden.map((f) => ({ ...f, show: false })),
      ]);
    } else {
      setExtraFields(allPossibleFields.map((f) => ({ ...f, show: true })));
    }
  }, [
    permissionsData,
    isLoadingPermissions,
    allPossibleFields,
    reportSettingsKey,
  ]);

  const handleSaveColumns = useCallback(
    (newColumnKeys, closeModalCallback) => {
      const payload = { [reportSettingsKey]: newColumnKeys };
      const onSuccess = () => closeModalCallback();
      if (permissionsData?.id) {
        updatePermissions(
          { id: permissionsData.id, permissionsData: payload },
          { onSuccess },
        );
      } else if (currentUserId) {
        createPermissions(
          { ...payload, user_id: currentUserId },
          { onSuccess },
        );
      } else {
        showToast({
          message: "Could not save settings. User not found.",
          crudType: "error",
        });
      }
    },
    [
      permissionsData,
      reportSettingsKey,
      updatePermissions,
      createPermissions,
      currentUserId,
      showToast,
    ],
  );

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    category: state.category,
    ledgerId: state.ledger_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
    minAmount: state.min_amount,
    maxAmount: state.max_amount,
    amount: state.amount,
    amountPaid: state.amount_paid,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const { data, isLoading, refetch, isRefetching } =
    useExpensesPaginated(state);
  const { data: ledgers = [] } = useLedger();
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { data: expenseTypesData, isLoading: expenseTypesLoading } =
    useExpenseTypes();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching || isLoadingPermissions;

  useEffect(() => {
    setHeaderFilters({
      amount: state.amount || "",
      amount_paid: state.amount_paid || "",
    });
  }, [state.amount, state.amount_paid]);

  const { exportToExcel, exportToPdf, printDocument } =
    useExpenseExportAndPrint({
      listData,
      reportType: "Expense Report",
      duration:
        state.start_date && state.end_date
          ? `${state.start_date} to ${state.end_date}`
          : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: { totalAmount: data?.total_amount || 0 },
      filterDatas: { ...state },
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

  const handleStatusFilterClick = useCallback(
    (newStatus) =>
      setState({
        page: 1,
        status: state.status === newStatus ? "" : newStatus,
      }),
    [state.status],
  );
  const handleSort = useCallback(
    (value) => setState({ page: 1, sort: value }),
    [],
  );
  const handleDateFilterChange = useCallback(
    (newFilterValue) =>
      setState({
        start_date: newFilterValue.startDate || "",
        end_date: newFilterValue.endDate || "",
        page: 1,
      }),
    [],
  );
  const handleSearch = useCallback(
    () =>
      setState({
        page: 1,
        searchType: state.searchType,
        searchKey: state.searchKey,
        min_amount: "",
        max_amount: "",
        amount: "",
        amount_paid: "",
        category: "",
        ledger_id: "",
        done_by_id: "",
        cost_center_id: defaltCostCenter,
        status: "",
        start_date: "",
        end_date: "",
      }),
    [state.searchType, state.searchKey, defaltCostCenter],
  );

  const handleHeaderSearch = useCallback(
    (key, value) =>
      setState({
        [key]: value,
        ...(key === "amount" && { min_amount: "", max_amount: "" }),
        page: 1,
      }),
    [],
  );
  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") handleHeaderSearch(key, headerFilters[key]);
    },
    [headerFilters, handleHeaderSearch],
  );

  const handleApplyFilter = useCallback((newFilters) => {
    setState({
      ...newFilters,
      page: 1,
      searchType: "",
      searchKey: "",
      amount: "",
      amount_paid: "",
    });
    setShowFilter(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setState({
      page: 1,
      page_size: 10,
      category: "",
      ledger_id: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      status: "",
      amount: "",
      amount_paid: "",
      min_amount: "",
      max_amount: "",
      start_date: "",
      end_date: "",
      sort: "-date",
      searchType: "",
      searchKey: "",
    });

    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [defaltCostCenter]);

  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    [],
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    [],
  );

  useEffect(() => {
    if (searchParams.get("action") === "add" && !isOpenExpenseModal) {
      setMode("add");
      setSelectedExpense(null);
      setIsOpenExpenseModal(true);
    }
  }, [searchParams, isOpenExpenseModal]);

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
    [deleteExpense, refetch, showToast],
  );

  const searchOptions = useMemo(
    () => [
      { value: "description", name: "Description" },
      { value: "category", name: "Type" },
      { value: "amount", name: "Amount" },
      { value: "amount_paid", name: "Amount Paid" },
      { value: "ledger_name", name: "Ledger" },
      { value: "done_by_name", name: "Done By" },
      ...(!isDisableCostCenter
        ? [{ value: "cost_center_name", name: "Cost Center" }]
        : []),
    ],
    [isDisableCostCenter],
  );
  const filterProps = {
    showFilter,
    setShowFilter,
    onApply: handleApplyFilter,
    initialFilters: state,
    ledgers,
    expenseTypesData,
    expenseTypesLoading,
    disableCostCenter: isDisableCostCenter,
    components,
  };
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All Types" },
      ...(expenseTypesData || []).map((type) => ({
        value: type.name,
        label: type.name,
      })),
    ],
    [expenseTypesData],
  );
  const ledgerOptions = useMemo(
    () => [
      { value: "", label: "All Ledgers" },
      ...(ledgers || []).map((acc) => ({ value: acc.id, label: acc.name })),
    ],
    [ledgers],
  );
  const dateFilterValue = {
    startDate: state.start_date || "",
    endDate: state.end_date || "",
  };
  const isDateFilterActive =
    state.start_date &&
    state.end_date &&
    isValid(new Date(state.start_date)) &&
    isValid(new Date(state.end_date));
  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(state.start_date), "MMM d, yyyy")} to ${format(new Date(state.end_date), "MMM d, yyyy")}`
    : null;

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Expenses" subtitle={dateSubtitle} />
            <TableTopContainer
              summary={
                !loading &&
                data && (
                  <div className="summary-with-status">
                    <HStack>
                      <AmountSummary total={data.total_amount} />
                      <StatusFilter
                        status={state.status}
                        handleStatusFilterClick={handleStatusFilterClick}
                        StatusButton={StatusButton}
                      />
                    </HStack>
                  </div>
                )
              }
              mainActions={
                <>
                  <ColumnSelectorModal
                    onApply={handleSaveColumns}
                    allPossibleFields={allPossibleFields}
                    savedColumnKeys={extraFields
                      .filter((f) => f.show)
                      .map((f) => f.value)}
                    isLoading={isSavingColumns}
                  />
                  <ListFilter {...filterProps} />
                  <PopupSearchField
                    searchKey={state.searchKey}
                    setSearchKey={(v) => setState({ searchKey: v })}
                    searchType={state.searchType}
                    setSearchType={(v) => setState({ searchType: v })}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                  <AddButton onClick={handleAddClick}>Add Expense</AddButton>
                </>
              }
              topRight={
                <>
                  <RefreshButton onClick={handleRefresh} />
                  <DateFilter
                    value={dateFilterValue}
                    onChange={handleDateFilterChange}
                  />
                  {!loading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )}
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
                    {extraFields
                      .filter((item) => item.show)
                      .map((field) => {
                        if (field.value === "date")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Date
                                <ThSort
                                  sort={state.sort}
                                  setSort={setState}
                                  value="date"
                                  handleSort={handleSort}
                                />
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "type")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Type
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="category"
                                    handleSort={handleSort}
                                  />
                                  <ThSearchOrFilterPopover isSearch={false}>
                                    <SelectField
                                      value={state.category}
                                      onChange={(e) =>
                                        setState({
                                          page: 1,
                                          category: e.target.value,
                                        })
                                      }
                                      options={categoryOptions}
                                      disabled={expenseTypesLoading}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "ledger")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Ledger
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="ledger_name"
                                    handleSort={handleSort}
                                  />
                                  <ThSearchOrFilterPopover isSearch={false}>
                                    <LedgerAutoCompleteWithAddOptionWithBalance
                                      value={state.ledger_id}
                                      onChange={(e) =>
                                        setState({
                                          page: 1,
                                          ledger_id: e.target.value,
                                        })
                                      }
                                      options={ledgerOptions}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "done_by")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Done By
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="done_by"
                                    handleSort={handleSort}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={false}
                                    popoverWidth={220}
                                  >
                                    <DoneByAutoComplete
                                      value={state.done_by_id}
                                      onChange={(e) =>
                                        handleHeaderSearch(
                                          "done_by_id",
                                          e.target.value,
                                        )
                                      }
                                      is_edit={false}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "cost_center")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Cost Center
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="cost_center"
                                    handleSort={handleSort}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={false}
                                    popoverWidth={220}
                                  >
                                    <CostCenterAutoComplete
                                      value={state.cost_center_id}
                                      onChange={(e) =>
                                        handleHeaderSearch(
                                          "cost_center_id",
                                          e.target.value,
                                        )
                                      }
                                      is_edit={false}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "description")
                          return <Th key={field.value}>Description</Th>;
                        if (field.value === "total_amount")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Amount
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="amount"
                                    handleSort={handleSort}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch(
                                        "amount",
                                        headerFilters.amount,
                                      )
                                    }
                                  >
                                    <InputField
                                      placeholder="Search Amount"
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
                          );
                        if (field.value === "paid_amount")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Paid
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="amount_paid"
                                    handleSort={handleSort}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch(
                                        "amount_paid",
                                        headerFilters.amount_paid,
                                      )
                                    }
                                  >
                                    <InputField
                                      placeholder="Search Amount"
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
                          );
                        if (field.value === "balance")
                          return <Th key={field.value}>Balance</Th>;
                        if (field.value === "status")
                          return <Th key={field.value}>Status</Th>;
                        return null;
                      })}
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
                        columns={extraFields.filter((f) => f.show)}
                      />
                    ))
                  ) : (
                    <TableCaption
                      item={Transaction.Expense}
                      noOfCol={extraFields.filter((f) => f.show).length + 2}
                    />
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
              <PageHeader>
                <HStack>
                  <DateFilter
                    value={dateFilterValue}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchKey={state.searchKey}
                    setSearchKey={(v) => setState({ searchKey: v })}
                    searchType={state.searchType}
                    setSearchType={(v) => setState({ searchType: v })}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
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
                        title={exp.category || "N/A"}
                        subtitle={
                          <>
                            <div>Ledger: {exp.ledger_name || "N/A"}</div>{" "}
                            {new Date(exp.date).toLocaleDateString("en-IN")}
                            <div className="list-item-status-wrapper">
                              <TextBadge variant="paymentStatus" type={status}>
                                {status}
                              </TextBadge>
                            </div>
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

const ListFilter = React.memo(
  ({ onApply, initialFilters, components, ...props }) => {
    const {
      showFilter,
      setShowFilter,
      ledgers,
      expenseTypesData,
      expenseTypesLoading,
      disableCostCenter,
    } = props;
    const [localState, setLocalState] = useReducer(
      stateReducer,
      initialFilters,
    );
    const isMobile = useIsMobile();
    const {
      LedgerAutoCompleteWithAddOptionWithBalance,
      DoneByAutoComplete,
      CostCenterAutoComplete,
    } = components;
    useEffect(() => {
      if (showFilter) {
        setLocalState(initialFilters);
      }
    }, [showFilter, initialFilters]);

    const handleApplyClick = () => {
      onApply(localState);
    };

    const filterCategoryOptions = [
      { value: "", label: "All Types" },
      ...(expenseTypesData || []).map((type) => ({
        value: type.name,
        label: type.name,
      })),
    ];
    const ledgerFilterOptions = [
      { value: "", label: "All Ledgers" },
      ...(ledgers || []).map((acc) => ({ value: acc.id, label: acc.name })),
    ];

    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleApplyClick}
      >
        <VStack>
          <SelectField
            label="Type"
            name="category"
            value={localState.category}
            onChange={(e) => setLocalState({ category: e.target.value })}
            options={filterCategoryOptions}
            disabled={expenseTypesLoading}
          />
          <LedgerAutoCompleteWithAddOptionWithBalance
            label="Ledger"
            name="ledger_id"
            value={localState.ledger_id}
            onChange={(e) => setLocalState({ ledger_id: e.target.value })}
            options={ledgerFilterOptions}
            disabled={!ledgers}
          />
          <DoneByAutoComplete
            placeholder="Done By"
            value={localState.done_by_id}
            onChange={(e) => setLocalState({ done_by_id: e.target.value })}
            name="done_by_id"
            is_edit={false}
          />
          <CostCenterAutoComplete
            placeholder="Cost Center"
            value={localState.cost_center_id}
            onChange={(e) => setLocalState({ cost_center_id: e.target.value })}
            name="cost_center_id"
            is_edit={false}
            disabled={disableCostCenter}
          />
          <RangeField
            label="Amount"
            minValue={localState.min_amount}
            maxValue={localState.max_amount}
            onMinChange={(v) => setLocalState({ min_amount: v })}
            onMaxChange={(v) => setLocalState({ max_amount: v })}
          />
          {isMobile ? (
            <>
              <DateField
                label="Start Date"
                value={
                  localState.start_date ? new Date(localState.start_date) : null
                }
                onChange={(date) =>
                  setLocalState({
                    start_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
              />
              <DateField
                label="End Date"
                value={
                  localState.end_date ? new Date(localState.end_date) : null
                }
                onChange={(date) =>
                  setLocalState({
                    end_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
              />
            </>
          ) : (
            <HStack justifyContent="flex-start">
              <DateField
                label="Start Date"
                value={
                  localState.start_date ? new Date(localState.start_date) : null
                }
                onChange={(date) =>
                  setLocalState({
                    start_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
              />
              <DateField
                label="End Date"
                value={
                  localState.end_date ? new Date(localState.end_date) : null
                }
                onChange={(date) =>
                  setLocalState({
                    end_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
              />
            </HStack>
          )}
        </VStack>
      </PopUpFilter>
    );
  },
);

const StatusFilter = ({ status, handleStatusFilterClick, StatusButton }) => {
  return (
    <div className="status-filter-box">
      <div className="status-filter-row">
        <StatusButton
          size="sm"
          variant="all"
          isSelected={status === ""}
          onClick={() => handleStatusFilterClick("")}
        >
          All
        </StatusButton>
        <StatusButton
          size="sm"
          variant="available"
          isSelected={status === "paid"}
          onClick={() => handleStatusFilterClick("paid")}
        >
          Paid
        </StatusButton>
      </div>
      <div className="status-filter-row">
        <StatusButton
          size="sm"
          variant="maintenance"
          isSelected={status === "partial"}
          onClick={() => handleStatusFilterClick("partial")}
        >
          Partial
        </StatusButton>
        <StatusButton
          size="sm"
          variant="sold"
          isSelected={status === "unpaid"}
          onClick={() => handleStatusFilterClick("unpaid")}
        >
          Unpaid
        </StatusButton>
      </div>
    </div>
  );
};

export default CommonExpenseReport;
