import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom"; // UPDATED
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useCashBooksPaginated from "@/apps/user/hooks/api/cashBook/useCashBooksPaginated";
import useDeleteCashBook from "@/apps/user/hooks/api/cashBook/useDeleteCashBook";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import useCostCenterById from "@/apps/user/hooks/api/costCenter/useCostCenterById";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import CashBook from "@/apps/user/pages/Transactions/CashBook";
import RangeField from "@/components/RangeField";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import useDoneById from "@/apps/user/hooks/api/doneBy/useDoneById";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdSL,
  ThSL,
  TdDate,
  TdOverflow,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import DateField from "@/components/DateField";
import Select from "@/components/Select";
import SelectField from "@/components/SelectField";
import Spacer from "@/components/Spacer";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem";
import AccountFilter from "@/apps/user/components/AccountFilter";
import DateFilter from "@/components/DateFilter";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import TextBadge from "@/components/TextBadge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExportMenu from "@/components/ExportMenu";
import DownloadButton from "@/apps/user/components/DownloadButton";
import { format, isValid } from "date-fns";
import { useCashBookExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/useCashBookExportAndPrint";
import useSyncURLParams from "@/hooks/useSyncURLParams"; // IMPORTED


import "./style.scss";

const transactionTypeOptions = [
  { value: "", label: "All Transaction Types" },
  { value: "sale", label: "Sale" },
  { value: "service", label: "Service" },
  { value: "purchase", label: "Purchase" },
  { value: "expense", label: "Expense" },
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "partnership", label: "Partnership" },
  { value: "sale_return", label: "Sale Return" },
  { value: "purchase_return", label: "Purchase Return" },
  { value: "transfer", label: "Transfer" },
  { value: "brokerage", label: "Brokerage" },
];

const formatDateForPDF = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
};

const CostCenterCell = ({ id }) => {
  const { data: costCenter, isLoading } = useCostCenterById(id, {
    enabled: !!id,
  });

  if (!id) return "N/A";
  if (isLoading) return "...";
  return costCenter?.name || "N/A";
};
const DoneByCell = ({ id }) => {
  const { data: doneBy, isLoading } = useDoneById(id, { enabled: !!id });

  if (!id) return "N/A";
  if (isLoading) return "...";
  return doneBy?.name || "N/A";
};

const CashBookReport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // UI States for filter inputs
  const [showFilter, setShowFilter] = useState(false);
  const [transactionType, setTransactionType] = useState("");
  const [accountName, setAccountName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minDebit, setMinDebit] = useState("");
  const [maxDebit, setMaxDebit] = useState("");
  const [minCredit, setMinCredit] = useState("");
  const [maxCredit, setMaxCredit] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter);
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");

  // Other component states
  const [listData, setListData] = useState([]);
  const [filteredAccountTotal, setFilteredAccountTotal] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    rangeType: "custom",
  });
  const [filterDatas, setFilterDatas] = useState({});

  const stateReducer = (state, newState) => ({
    ...state,
    ...newState,
  });

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "",
    transaction_type: searchParams.get("transactionType") || "",
    account_name: searchParams.get("accountName") || "",
    min_debit: searchParams.get("minDebit") || "",
    max_debit: searchParams.get("maxDebit") || "",
    min_credit: searchParams.get("minCredit") || "",
    max_credit: searchParams.get("maxCredit") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: "",
    end_date: "",
  });

  // --- 2. Sync main state to URL using custom hook ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    transactionType: state.transaction_type,
    accountName: state.account_name,
    minDebit: state.min_debit,
    maxDebit: state.max_debit,
    minCredit: state.min_credit,
    maxCredit: state.max_credit,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState((prev) => ({
      ...prev,
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    }));
  }, []);

  const { data, isLoading, refetch } = useCashBooksPaginated(state);
  const { refetch: fetchAllForDownload } = useCashBooksPaginated(
    { ...state, page: 1, page_size: 99999 },
    { enabled: false }
  );
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { mutateAsync: deleteCashBook } = useDeleteCashBook();

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts]
  );

  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenCashBookModal, setIsOpenCashBookModal] = useState(false);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    const selectedAccount = accounts.find(
      (acc) => acc.name === state.account_name
    );

    setTransactionType(state.transaction_type || "");
    setAccountName(selectedAccount ? selectedAccount.id : ""); // Set ID for filter dropdown
    setMinDebit(state.min_debit || "");
    setMaxDebit(state.max_debit || "");
    setMinCredit(state.min_credit || "");
    setMaxCredit(state.max_credit || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setDateFilter({
      startDate: state.start_date || "",
      endDate: state.end_date || "",
      rangeType: "custom",
    });
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
  }, [state, defaltCostCenter, accounts]);

  useEffect(() => {
    if (data?.data) {
      setListData(data.data);
      setTotalPages(data.page_count || 1);
      setTotalItems(data.count || 0);
    } else {
      setListData([]);
    }
  }, [data]);

  useEffect(() => {
    if (state.account_name && listData && listData.length > 0) {
      const total = listData.reduce((accumulator, currentItem) => {
        const credit = parseFloat(currentItem.credit) || 0;
        const debit = parseFloat(currentItem.debit) || 0;
        return accumulator + credit - debit;
      }, 0);
      setFilteredAccountTotal(total);
    } else {
      setFilteredAccountTotal(null);
    }
  }, [state.account_name, listData]);

  useEffect(() => {
    setFilterDatas({
      transactionType,
      accountName,
      minDebit,
      maxDebit,
      minCredit,
      maxCredit,
      doneById,
      costCenterId,
      transaction_type: state.transaction_type,
      account_name: state.account_name,
    });
  }, [
    transactionType,
    accountName,
    minDebit,
    maxDebit,
    minCredit,
    maxCredit,
    doneById,
    costCenterId,
    state.transaction_type,
    state.account_name,
  ]);

  const { exportToExcel, exportToPdf, printDocument } =
    useCashBookExportAndPrint({
      listData: listData,
      reportType: "Cash Book Report",
      duration: startDate && endDate ? `${startDate} to ${endDate}` : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: {
        balance: filteredAccountTotal,
      },
      filterDatas,
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

  const cleanDescription = (description) => {
    if (!description) return "No description";
    return description
      .replace(
        /linked to (purchase|sale|service|expense|partnership|sale_return|purchase_return) ID \d+\./i,
        ""
      )
      .trim();
  };

  const handleSort = useCallback((value) => {
    setState({
      page: 1,
      sort: value,
    });
  }, []);

  const handleSearch = useCallback(() => {
    setState({
      page: 1,
      searchType,
      searchKey,
    });
  }, [searchType, searchKey]);

  const handleAccountFilterChange = useCallback(
    (e) => {
      const selectedId = e.target.value;

      const selectedAccount = accounts.find(
        (acc) =>
          String(acc.id) === String(selectedId) ||
          String(acc.name) === String(selectedId)
      );

      setState({
        page: 1,
        account_name: selectedAccount ? selectedAccount.name : "",
      });
    },
    [accounts]
  );

  const handleFilter = useCallback(() => {
    let accountNameToSend = accountName;

    const selectedAccount = accounts.find(
      (acc) => String(acc.id) === String(accountName)
    );

    if (selectedAccount) {
      accountNameToSend = selectedAccount.name;
    }

    setState({
      page: 1,
      transaction_type: transactionType,
      account_name: accountNameToSend,
      start_date: startDate,
      end_date: endDate,
      min_debit: minDebit,
      max_debit: maxDebit,
      min_credit: minCredit,
      max_credit: maxCredit,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });

    setShowFilter(false);
  }, [
    transactionType,
    accountName,
    startDate,
    endDate,
    minDebit,
    maxDebit,
    minCredit,
    maxCredit,
    doneById,
    costCenterId,
    accounts,
  ]);

  const handleRefresh = useCallback(() => {
    setTransactionType("");
    setAccountName("");
    setStartDate("");
    setEndDate("");
    setMinDebit("");
    setMaxDebit("");
    setMinCredit("");
    setMaxCredit("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setDateFilter({ startDate: "", endDate: "", rangeType: "custom" });

    setState({
      page: 1,
      page_size: 10,
      transaction_type: "",
      account_name: "",
      start_date: "",
      end_date: "",
      min_debit: "",
      max_debit: "",
      min_credit: "",
      max_credit: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 });
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value });
  }, []);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Preparing PDF...",
      status: TOASTSTATUS.INFO,
    });

    try {
      const { data: allDataResponse } = await fetchAllForDownload();
      const allRecords = allDataResponse?.data;

      if (!allRecords || allRecords.length === 0) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "No data available to download.",
          status: TOASTSTATUS.WARNING,
        });
        setIsDownloading(false);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Cash Book Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = [
        "Date",
        "Account",
        "Type",
        "Done By",
        "Description",
        "Debit",
        "Credit",
      ];
      const tableRows = [];

      allRecords.forEach((entry) => {
        const rowData = [
          formatDateForPDF(entry.created_at),
          entry.account_name || "N/A",
          entry.transaction_type
            ? entry.transaction_type.replace(/_/g, " ")
            : "N/A",
          entry.done_by_name || "N/A",
          cleanDescription(entry.description) || "N/A",
          entry.debit > 0 ? Number(entry.debit).toLocaleString("en-IN") : "-",
          entry.credit > 0 ? Number(entry.credit).toLocaleString("en-IN") : "-",
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        startY: 35,
        head: [tableColumn],
        body: tableRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
        columnStyles: {
          5: { halign: "right" },
          6: { halign: "right" },
        },
      });

      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`CashBook_Report_${dateStr}.pdf`);

      showToast({
        type: TOASTTYPE.GENARAL,
        message: "PDF downloaded successfully!",
        status: TOASTSTATUS.SUCCESS,
      });
    } catch (err) {
      console.error("Failed to download PDF:", err);
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to generate PDF.",
        status: TOASTSTATUS.ERROR,
      });
    } finally {
      setIsDownloading(false);
    }
  }, [fetchAllForDownload, showToast]);

  const searchOptions = useMemo(
    () => [
      { value: "account_name", name: "Account Name" },
      { value: "transaction_type", name: "Transaction Type" },
      { value: "description", name: "Description" },
      ...(!isDisableCostCenter
        ? [{ value: "cost_center_name", name: "Cost Center" }]
        : []),
    ],
    [isDisableCostCenter]
  );

  useEffect(() => {
    if (searchParams.get("action") === "add" && !isOpenCashBookModal) {
      setMode("add");
      setSelectedEntry(null);
      setIsOpenCashBookModal(true);
    }
  }, [searchParams, isOpenCashBookModal]);
  const handleAddClick = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("action", "add");
    // The useEffect above will catch this change and open the modal
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleEditClick = useCallback((entry) => {
    setSelectedEntry(entry);
    setMode("edit");
    setIsOpenCashBookModal(true);
  }, []);

  const handleViewClick = useCallback((entry) => {
    setSelectedEntry(entry);
    setMode("view");
    setIsOpenCashBookModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteCashBook(id);
        showToast({
          crudItem: CRUDITEM.CASHBOOK,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message:
            error.response?.data?.error || "Failed to delete cash book entry.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deleteCashBook, refetch, showToast]
  );

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    transactionType,
    setTransactionType,
    accountName,
    setAccountName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    minDebit,
    setMinDebit,
    maxDebit,
    setMaxDebit,
    minCredit,
    setMinCredit,
    maxCredit,
    setMaxCredit,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
  };

  const { startDate: dfStartDate, endDate: dfEndDate } = dateFilter;
  const isDateFilterActive =
    dfStartDate &&
    dfEndDate &&
    isValid(new Date(dfStartDate)) &&
    isValid(new Date(dfEndDate));

  const dateSubtitle = useMemo(
    () =>
      isDateFilterActive
        ? `${format(new Date(dfStartDate), "MMM d, yyyy")} to ${format(
            new Date(dfEndDate),
            "MMM d, yyyy"
          )}`
        : null,
    [dfEndDate, dfStartDate, isDateFilterActive]
  );

  const currentAccountOption = useMemo(
    () => accounts.find((a) => a.name === state.account_name),
    [accounts, state.account_name]
  );

  const currentAccountId = useMemo(
    () => (currentAccountOption ? currentAccountOption.id : ""),
    [currentAccountOption]
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Cash Book"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              //isMargin={true}
              summary={
                <>
                  <AccountTotalDisplay
                    accountName={state.account_name}
                    total={filteredAccountTotal}
                  />
                  <div className="cashbook-filters">
                    <div className="account_filter_wrapper">
                      <div className="account_filter_scroll_wrapper">
                        <AccountFilter
                          name="account_filter"
                          value={accountName}
                          onChange={handleAccountFilterChange}
                        />
                      </div>
                    </div>
                  </div>
                </>
              }
              mainActions={
                <>

                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />

                  <ListFilter {...filterProps} />

                  <RefreshButton onClick={handleRefresh} />

                  {!isLoading && (
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

                  <AddButton onClick={handleAddClick}>Add Entry</AddButton>
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
                        Date
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="created_at"
                          handleSort={handleSort}
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Account
                        <ThFilterContainer>
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            handleSort={handleSort}
                            value="account_id"
                          />
                          <ThSearchOrFilterPopover isSearch={false}>
                            <AccountAutoComplete
                              placeholder="Select Account"
                              value={currentAccountId}
                              onChange={handleAccountFilterChange}
                              options={[
                                { value: "", label: "All Accounts" },
                                ...accountOptions,
                              ]}
                              isLoading={isLoadingAccounts}
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
                                setState((prev) => ({
                                  ...prev,
                                  page: 1,
                                  done_by_id: e.target.value,
                                }))
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
                                setState((prev) => ({
                                  ...prev,
                                  page: 1,
                                  cost_center_id: e.target.value,
                                }))
                              }
                              is_edit={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Type
                        <ThFilterContainer>
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            handleSort={handleSort}
                            value="transaction_type"
                          />
                          <ThSearchOrFilterPopover isSearch={false}>
                            <SelectField
                              placeholder="Transaction Type"
                              value={state.transaction_type}
                              onChange={(e) =>
                                setState((prev) => ({
                                  ...prev,
                                  page: 1,
                                  transaction_type: e.target.value,
                                }))
                              }
                              options={transactionTypeOptions}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Description</Th>
                    <Th>
                      <ThContainer>
                        Debit
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          handleSort={handleSort}
                          value="debit"
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Credit
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          handleSort={handleSort}
                          value="credit"
                        />
                      </ThContainer>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {listData.length > 0 ? (
                    listData.map((entry, index) => {
                      let descriptionContent = cleanDescription(
                        entry.description
                      );
                      if (entry.transaction_type === "transfer") {
                        descriptionContent = `Transfer to ${
                          entry.to_account_name || "Account"
                        }`;
                      }

                      return (
                        <Tr key={entry.id}>
                          <TdSL
                            index={index}
                            page={state.page}
                            pageSize={state.page_size}
                          />
                          <TdDate>{entry.created_at}</TdDate>
                          <TdOverflow>{entry.account_name}</TdOverflow>
                          <TdOverflow>
                            {" "}
                            <DoneByCell id={entry.done_by_id} />
                          </TdOverflow>
                          <TdOverflow>
                            <CostCenterCell id={entry.cost_center_id} />
                          </TdOverflow>
                          <Td>
                            {entry.transaction_type && (
                              <TextBadge
                                variant="transactionType"
                                type={entry.transaction_type}
                              >
                                {entry.transaction_type.replace("_", " ")}
                              </TextBadge>
                            )}
                          </Td>
                          <TdOverflow>{descriptionContent}</TdOverflow>
                          <TdNumeric isDebit={true}>{entry.debit}</TdNumeric>
                          <TdNumeric isDebit={false}>{entry.credit}</TdNumeric>
                        </Tr>
                      );
                    })
                  ) : (
                    <TableCaption item={Transaction.CashBook} noOfCol={9} />
                  )}
                </Tbody>
              </Table>
            )}
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
        ) : (
          <>
            <PageTitleWithBackButton title="Cash Book" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
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
                <div className="cashbook_list__add_button">
                  <AddButton onClick={handleAddClick}>Add Entry</AddButton>
                </div>
              </PageHeader>
              <div className="AccountTotalDisplay_wrapper">
                <AccountTotalDisplay
                  accountName={state.account_name}
                  total={filteredAccountTotal}
                />
              </div>
              <div>
                <AccountFilter
                  name="account_filter"
                  value={currentAccountId}
                  onChange={handleAccountFilterChange}
                />
              </div>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.CashBook} />
              ) : (
                <div className="mobile-list-view">
                  {listData.map((entry) => {
                    const isEditableDeletable =
                      entry.transaction_type === "deposit" ||
                      entry.transaction_type === "withdrawal" ||
                      entry.transaction_type === "transfer";

                    let subtitleContent;
                    if (entry.transaction_type === "transfer") {
                      subtitleContent = (
                        <div>
                          Transfer to{" "}
                          <strong>{entry.to_account_name || "Account"}`</strong>
                        </div>
                      );
                    } else {
                      subtitleContent = (
                        <>
                          {entry.done_by_name && (
                            <div className="fs16">
                              Done By: <DoneByCell id={entry.done_by_id} />
                            </div>
                          )}
                          {entry.cost_center_id && (
                            <div>
                              Cost Center:{" "}
                              <CostCenterCell id={entry.cost_center_id} />
                            </div>
                          )}
                        </>
                      );
                    }

                    return (
                      <ListItem
                        key={entry.id}
                        title={entry.account_name}
                        subtitle={
                          <>
                            {subtitleContent}
                            <div style={{ marginTop: "8px" }}>
                              <TextBadge
                                variant="transactionType"
                                type={entry.transaction_type}
                              >
                                {entry.transaction_type.replace("_", " ")}
                              </TextBadge>
                            </div>
                          </>
                        }
                        amount={
                          entry.debit > 0
                            ? `-${(entry.debit || 0).toLocaleString("en-IN")}`
                            : `+${(entry.credit || 0).toLocaleString("en-IN")}`
                        }
                        amountColor={entry.debit > 0 ? "red" : "green"}
                        onView={() => handleViewClick(entry)}
                        onEdit={
                          isEditableDeletable
                            ? () => handleEditClick(entry)
                            : undefined
                        }
                        onDelete={
                          isEditableDeletable
                            ? () => handleDelete(entry.id)
                            : undefined
                        }
                      />
                    );
                  })}
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
      <CashBook
        isOpen={isOpenCashBookModal}
        onClose={() => setIsOpenCashBookModal(false)}
        mode={mode}
        selectedEntry={selectedEntry}
        onSuccess={()=>{}}
      />
    </>
  );
};

export default CashBookReport;

const ListFilter = ({
  showFilter,
  setShowFilter,
  handleFilter,
  transactionType,
  setTransactionType,
  accountName,
  setAccountName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  minDebit,
  setMinDebit,
  maxDebit,
  setMaxDebit,
  minCredit,
  setMinCredit,
  maxCredit,
  setMaxCredit,
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
        <AccountAutoComplete
          type="text"
          placeholder="Account Name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
        <Select
          label="Transaction Type"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          options={transactionTypeOptions}
          placeholder="Transaction Type"
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
          <HStack justifyContent="flex-start">
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
        <RangeField
          label="Debit Range"
          minValue={minDebit}
          maxValue={maxDebit}
          onMinChange={(value) => setMinDebit(value)}
          onMaxChange={(value) => setMaxDebit(value)}
        />
        <RangeField
          label="Credit Range"
          minValue={minCredit}
          maxValue={maxCredit}
          onMinChange={(value) => setMinCredit(value)}
          onMaxChange={(value) => setMaxCredit(value)}
        />
      </VStack>
    </PopUpFilter>
  );
};

const TdNumeric = ({ children, isDebit = null }) => {
  const combinedClassName = `td_numeric ${
    isDebit === true ? "td_num--debit" : "td_num--credit"
  }`.trim();

  return (
    <td>
      <div className={children !== "0.00" ? combinedClassName : "td_numeric"}>
        <AmountSymbol>
          {" "}
          {children !== "0.00"
            ? (isDebit ? "-" : "+") + Number(children).toLocaleString("en-IN")
            : "-"}
        </AmountSymbol>
      </div>
    </td>
  );
};

const AccountTotalDisplay = ({ accountName, total }) => {
  if (!accountName || total === null) {
    return null;
  }
  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(total);
  const totalClassName = total >= 0 ? "total--positive" : "total--negative";

  return (
    <div className="account_total_display">
      <div className={`total-display-box ${totalClassName}`}>
        {formattedTotal}
      </div>
    </div>
  );
};
