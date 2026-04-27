import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import useDailySummary from "@/apps/user/hooks/api/dailySummary/useDailySummary";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  TdNumeric,
  TableCaption,
  Th,
} from "@/components/Table";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import RefreshButton from "@/components/RefreshButton";
import DownloadButton from "@/apps/user/components/DownloadButton";
import DateField from "@/components/DateField";
import TableFooter from "@/components/TableFooter";
import { useIsMobile } from "@/utils/useIsMobile";
import ContainerWrapper from "@/components/ContainerWrapper";
import TableWrapper from "@/components/TableWrapper";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import PopUpFilter from "@/components/PopUpFilter";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/context/ToastContext";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";

import "./style.scss";

// 2. Define Reducer
const stateReducer = (state, action) => {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.payload, page: 1 };
    case "SET_DATES":
      return {
        ...state,
        startDate: action.payload.start,
        endDate: action.payload.end,
        page: 1,
      };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_PAGE_SIZE":
      return {
        ...state,
        pageSize: action.payload,
        page: 1,
      };
    case "SET_FILTERS":
      return {
        ...state,
        minCount: action.payload.minCount,
        maxCount: action.payload.maxCount,
        minAmount: action.payload.minAmount,
        maxAmount: action.payload.maxAmount,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
        page: 1,
      };
    default:
      return state;
  }
};

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "expenses", label: "Expenses" },
];

const SORT_FIELD_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "count", label: "Count" },
  { value: "amount", label: "Amount" },
  { value: "primary", label: "Received/Paid" },
  { value: "balance", label: "Balance" },
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

const formatCurrency = (amount) => {
  const options = {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  return new Intl.NumberFormat("en-IN", options).format(Math.abs(amount));
};

const formatDate = (dateString) => {
  const localDate = new Date(dateString + "T00:00:00");
  return localDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getISODateString = (date) => date.toISOString().slice(0, 10);

const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 29);
  return {
    start: getISODateString(startDate),
    end: getISODateString(endDate),
  };
};

// --- Extracted & Memoized Mobile Card ---
const MobileCard = React.memo(
  ({
    date,
    type,
    count,
    total,
    primaryAmountLabel,
    primaryAmount,
    balanceAmount,
  }) => {
    return (
      <div className="daily_summary_report__mobile_card" key={date}>
        <div className="daily_summary_report__mobile_card-content">
          <div className="daily_summary_report__mobile_card-info">
            <div className="daily_summary_report__mobile_card-title">
              {formatDate(date)}
            </div>
            <div className="daily_summary_report__mobile_card-subtitle">
              {type}: {count || 0}
            </div>
          </div>
          <div className="daily_summary_report__mobile_card-details">
            <div className="daily_summary_report__mobile_card-total">
              {formatCurrency(total || 0)}
            </div>
            <div className="daily_summary_report__mobile_card-received">
              {primaryAmountLabel}: {formatCurrency(primaryAmount || 0)}
            </div>
            <div className="daily_summary_report__mobile_card-balance">
              Balance: {formatCurrency(balanceAmount || 0)}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// --- Extracted Filter Component ---
const DailySummaryListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleApplyFilter,
    handleFilterReset,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    filterMinCount,
    setFilterMinCount,
    filterMaxCount,
    setFilterMaxCount,
    filterMinAmount,
    setFilterMinAmount,
    filterMaxAmount,
    setFilterMaxAmount,
    filterSortBy,
    setFilterSortBy,
    filterSortOrder,
    setFilterSortOrder,
  }) => {
    const handleLocalStartDateChange = useCallback(
      (date) => {
        setFilterStartDate(date ? getISODateString(date) : "");
      },
      [setFilterStartDate]
    );

    const handleLocalEndDateChange = useCallback(
      (date) => {
        setFilterEndDate(date ? getISODateString(date) : "");
      },
      [setFilterEndDate]
    );

    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleApplyFilter}
        onReset={handleFilterReset}
        buttonLabel="Filter"
      >
        <VStack>
          <DateField
            label="From Date"
            value={filterStartDate ? new Date(filterStartDate) : null}
            onChange={handleLocalStartDateChange}
          />
          <DateField
            label="To Date"
            value={filterEndDate ? new Date(filterEndDate) : null}
            onChange={handleLocalEndDateChange}
          />
          <input
            type="number"
            className="daily_summary_report__filter_input"
            placeholder="Min Count"
            value={filterMinCount}
            onChange={(e) => setFilterMinCount(e.target.value)}
          />
          <input
            type="number"
            className="daily_summary_report__filter_input"
            placeholder="Max Count"
            value={filterMaxCount}
            onChange={(e) => setFilterMaxCount(e.target.value)}
          />
          <input
            type="number"
            className="daily_summary_report__filter_input"
            placeholder="Min Amount"
            value={filterMinAmount}
            onChange={(e) => setFilterMinAmount(e.target.value)}
          />
          <input
            type="number"
            className="daily_summary_report__filter_input"
            placeholder="Max Amount"
            value={filterMaxAmount}
            onChange={(e) => setFilterMaxAmount(e.target.value)}
          />
          <select
            className="daily_summary_report__filter_select"
            value={filterSortBy}
            onChange={(e) => setFilterSortBy(e.target.value)}
          >
            {SORT_FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort By: {opt.label}
              </option>
            ))}
          </select>
          <select
            className="daily_summary_report__filter_select"
            value={filterSortOrder}
            onChange={(e) => setFilterSortOrder(e.target.value)}
          >
            {SORT_ORDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Order: {opt.label}
              </option>
            ))}
          </select>
        </VStack>
      </PopUpFilter>
    );
  }
);

function DailySummaryReport() {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const defaultDates = getDefaultDateRange();
  const [searchParams] = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  // 3. Initialize state with useReducer
  const [state, dispatch] = useReducer(stateReducer, {
    activeTab: searchParams.get("activeTab") || "sales",
    startDate: searchParams.get("startDate") || defaultDates.start,
    endDate: searchParams.get("endDate") || defaultDates.end,
    page: parseInt(searchParams.get("page")) || 1,
    pageSize: parseInt(searchParams.get("pageSize")) || 10,
    minCount: searchParams.get("min_count") || "",
    maxCount: searchParams.get("max_count") || "",
    minAmount: searchParams.get("min_amount") || "",
    maxAmount: searchParams.get("max_amount") || "",
    sortBy: searchParams.get("sort_by") || "date",
    sortOrder: searchParams.get("sort_order") || "desc",
  });

  const [filterStartDate, setFilterStartDate] = useState(state.startDate);
  const [filterEndDate, setFilterEndDate] = useState(state.endDate);
  const [filterMinCount, setFilterMinCount] = useState(state.minCount);
  const [filterMaxCount, setFilterMaxCount] = useState(state.maxCount);
  const [filterMinAmount, setFilterMinAmount] = useState(state.minAmount);
  const [filterMaxAmount, setFilterMaxAmount] = useState(state.maxAmount);
  const [filterSortBy, setFilterSortBy] = useState(state.sortBy);
  const [filterSortOrder, setFilterSortOrder] = useState(state.sortOrder);

  // --- API Call ---
  const {
    data: dailySummaryResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useDailySummary({
    start_date: state.startDate,
    end_date: state.endDate,
    page: state.page,
    page_size: state.pageSize,
    active_tab: state.activeTab,
    min_count: state.minCount,
    max_count: state.maxCount,
    min_amount: state.minAmount,
    max_amount: state.maxAmount,
    sort_by: state.sortBy,
    sort_order: state.sortOrder,
  });

  // --- FIX STARTS HERE ---
  // This useEffect ensures that the data is fetched on initial component load
  // and whenever the filters or pagination change. It fixes the issue where
  // data would only appear after a manual refresh.
  useEffect(() => {
    refetch();
  }, [
    state.startDate,
    state.endDate,
    state.page,
    state.pageSize,
    state.activeTab,
    state.minCount,
    state.maxCount,
    state.minAmount,
    state.maxAmount,
    state.sortBy,
    state.sortOrder,
    refetch,
  ]);
  // --- FIX ENDS HERE ---

  // --- Derived Data ---
  const dailyData = useMemo(
    () => dailySummaryResponse?.data || [],
    [dailySummaryResponse]
  );

  const totalItems = dailySummaryResponse?.count || 0;
  const totalPages = dailySummaryResponse?.page_count || 0;
  const loading = isLoading || isRefetching;

  const tabsContainerRef = useRef(null);

  // --- Sync local filter state when main state changes ---
  useEffect(() => {
    setFilterStartDate(state.startDate);
    setFilterEndDate(state.endDate);
    setFilterMinCount(state.minCount);
    setFilterMaxCount(state.maxCount);
    setFilterMinAmount(state.minAmount);
    setFilterMaxAmount(state.maxAmount);
    setFilterSortBy(state.sortBy);
    setFilterSortOrder(state.sortOrder);
  }, [
    state.startDate,
    state.endDate,
    state.minCount,
    state.maxCount,
    state.minAmount,
    state.maxAmount,
    state.sortBy,
    state.sortOrder,
  ]);

  // --- Mobile Tab Scrolling ---
  useEffect(() => {
    if (isMobile && tabsContainerRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(
        `[data-tab-key="${state.activeTab}"]`
      );
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [state.activeTab, isMobile]);

  const [showFilter, setShowFilter] = useState(false);

  // --- Handlers ---
  const handleApplyFilter = useCallback(() => {
    dispatch({
      type: "SET_DATES",
      payload: { start: filterStartDate, end: filterEndDate },
    });
    dispatch({
      type: "SET_FILTERS",
      payload: {
        minCount: filterMinCount,
        maxCount: filterMaxCount,
        minAmount: filterMinAmount,
        maxAmount: filterMaxAmount,
        sortBy: filterSortBy,
        sortOrder: filterSortOrder,
      },
    });
    setShowFilter(false);
  }, [
    filterStartDate,
    filterEndDate,
    filterMinCount,
    filterMaxCount,
    filterMinAmount,
    filterMaxAmount,
    filterSortBy,
    filterSortOrder,
  ]);

  const handleFilterReset = useCallback(() => {
    const { start, end } = getDefaultDateRange();
    setFilterStartDate(start);
    setFilterEndDate(end);
    setFilterMinCount("");
    setFilterMaxCount("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setFilterSortBy("date");
    setFilterSortOrder("desc");
    dispatch({ type: "SET_DATES", payload: { start, end } });
    dispatch({
      type: "SET_FILTERS",
      payload: {
        minCount: "",
        maxCount: "",
        minAmount: "",
        maxAmount: "",
        sortBy: "date",
        sortOrder: "desc",
      },
    });
    setShowFilter(false);
  }, []);

  const handlePageChange = useCallback(
    (newPage) => dispatch({ type: "SET_PAGE", payload: newPage }),
    []
  );

  const handlePageLimitSelect = useCallback(
    (newPageSize) => dispatch({ type: "SET_PAGE_SIZE", payload: newPageSize }),
    []
  );

  const handleTabChange = useCallback(
    (tabKey) => dispatch({ type: "SET_TAB", payload: tabKey }),
    []
  );

  const handleManualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const query = buildQueryParams({
        start_date: state.startDate,
        end_date: state.endDate,
        page: 1,
        page_size: 100000,
        active_tab: state.activeTab,
        min_count: state.minCount,
        max_count: state.maxCount,
        min_amount: state.minAmount,
        max_amount: state.maxAmount,
        sort_by: state.sortBy,
        sort_order: state.sortOrder,
      });

      const response = await api.get(`${API_ENDPOINTS.DAILY_SUMMARY.BASE}${query}`);
      const rows = response?.data?.data || [];

      if (!rows.length) {
        showToast({
          type: TOASTTYPE.GENARAL,
          status: TOASTSTATUS.WARNING,
          message: "No data available to download.",
        });
        return;
      }

      const tabLabel =
        state.activeTab === "purchases"
          ? "Purchases"
          : state.activeTab === "expenses"
            ? "Expenses"
            : "Sales";

      const doc = new jsPDF("l", "pt", "a4");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Daily ${tabLabel} Report`, 40, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `From: ${state.startDate || "-"}  To: ${state.endDate || "-"}  |  Sort: ${state.sortBy} (${state.sortOrder})`,
        40,
        48
      );

      const tableHead =
        state.activeTab === "purchases"
          ? [["SL", "Date", "Count", "Total", "Paid", "Balance"]]
          : state.activeTab === "expenses"
            ? [["SL", "Date", "Count", "Total", "Paid", "Balance"]]
            : [["SL", "Date", "Count", "Total", "Received", "Balance"]];

      const tableBody = rows.map((item, index) => {
        const metrics =
          state.activeTab === "purchases"
            ? {
                count: item.purchase?.count || 0,
                total: (item.purchase?.paid || 0) + (item.purchase?.pending || 0),
                primary: item.purchase?.paid || 0,
                balance: item.purchase?.pending || 0,
              }
            : state.activeTab === "expenses"
              ? {
                  count: item.expense?.count || 0,
                  total: item.expense?.amount || 0,
                  primary: item.expense?.paid || 0,
                  balance: item.expense?.balance || 0,
                }
              : {
                  count: item.sale?.count || 0,
                  total: (item.sale?.received || 0) + (item.sale?.pending || 0),
                  primary: item.sale?.received || 0,
                  balance: item.sale?.pending || 0,
                };

        return [
          index + 1,
          formatDate(item.date),
          metrics.count,
          metrics.total.toFixed(2),
          metrics.primary.toFixed(2),
          metrics.balance.toFixed(2),
        ];
      });

      autoTable(doc, {
        startY: 64,
        head: tableHead,
        body: tableBody,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [35, 128, 123] },
        margin: { left: 40, right: 40 },
        theme: "striped",
      });

      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`daily-${state.activeTab}-report-${stamp}.pdf`);

      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.SUCCESS,
        message: "PDF downloaded successfully.",
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.ERROR,
        message: error?.response?.data?.message || "Failed to download PDF report.",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [state, showToast]);

  const captionItem = useMemo(
    () =>
      ({
        sales: "Sale",
        purchases: "Purchase",
        expenses: "Expense",
      }[state.activeTab] || "Item"),
    [state.activeTab]
  );

  const filterProps = useMemo(
    () => ({
      showFilter,
      setShowFilter,
      handleApplyFilter,
      handleFilterReset,
      filterStartDate,
      setFilterStartDate,
      filterEndDate,
      setFilterEndDate,
      filterMinCount,
      setFilterMinCount,
      filterMaxCount,
      setFilterMaxCount,
      filterMinAmount,
      setFilterMinAmount,
      filterMaxAmount,
      setFilterMaxAmount,
      filterSortBy,
      setFilterSortBy,
      filterSortOrder,
      setFilterSortOrder,
    }),
    [
      showFilter,
      handleApplyFilter,
      handleFilterReset,
      filterStartDate,
      filterEndDate,
      filterMinCount,
      filterMaxCount,
      filterMinAmount,
      filterMaxAmount,
      filterSortBy,
      filterSortOrder,
    ]
  );

  const getCardProps = useCallback(
    (item) => {
      switch (state.activeTab) {
        case "sales":
          return {
            type: "Sales",
            count: item.sale.count,
            total: (item.sale.received || 0) + (item.sale.pending || 0),
            primaryAmountLabel: "Received",
            primaryAmount: item.sale.received,
            balanceAmount: item.sale.pending,
          };
        case "purchases":
          return {
            type: "Purchases",
            count: item.purchase.count,
            total: (item.purchase.paid || 0) + (item.purchase.pending || 0),
            primaryAmountLabel: "Paid",
            primaryAmount: item.purchase.paid,
            balanceAmount: item.purchase.pending,
          };
        case "expenses":
          return {
            type: "Expenses",
            count: item.expense.count,
            total: item.expense.amount,
            primaryAmountLabel: "Paid",
            primaryAmount: item.expense.paid,
            balanceAmount: item.expense.balance,
          };
        default:
          return {};
      }
    },
    [state.activeTab]
  );

  return (
    <ContainerWrapper className="daily_summary_report">
      <div>
        <PageTitleWithBackButton title="Daily Reports" />
      </div>

      {isMobile ? (
        <PageHeader className="daily_summary_report__page-header--mobile">
          <>
            <div
              className="daily_summary_report__tabs_container"
              ref={tabsContainerRef}
            >
              <HStack className="daily_summary_report__tabs_container-tabs">
                {TABS.map((tab) => (
                  <Button
                    key={tab.key}
                    data-tab-key={tab.key}
                    variant={
                      state.activeTab === tab.key ? "primary" : "filter-outline"
                    }
                    onClick={() => handleTabChange(tab.key)}
                    className="daily_summary_report__tab_btn"
                  >
                    {tab.label}
                  </Button>
                ))}
              </HStack>
            </div>
            <HStack className="daily_summary_report__actions_container">
              <DailySummaryListFilter {...filterProps} />
              <DownloadButton
                onClick={handleDownloadPdf}
                loading={isDownloading}
                disabled={isDownloading || loading}
              />
              <RefreshButton onClick={handleManualRefresh} />
            </HStack>
          </>
        </PageHeader>
      ) : (
        <HStack justifyContent="space-between" alignItems="center">
          <div
            className="daily_summary_report__tabs_container"
            ref={tabsContainerRef}
          >
            <HStack>
              {TABS.map((tab) => (
                <Button
                  key={tab.key}
                  data-tab-key={tab.key}
                  variant={
                    state.activeTab === tab.key ? "primary" : "filter-outline"
                  }
                  onClick={() => handleTabChange(tab.key)}
                  className="daily_summary_report__tab_btn fs18 fw600"
                >
                  {tab.label}
                </Button>
              ))}
            </HStack>
          </div>
          <HStack className="daily_summary_report__actions_container">
            <DailySummaryListFilter {...filterProps} />
            <DownloadButton
              onClick={handleDownloadPdf}
              loading={isDownloading}
              disabled={isDownloading || loading}
            />
            <RefreshButton onClick={handleManualRefresh} />
          </HStack>
        </HStack>
      )}

      <TableWrapper>
        {loading ? (
          <Loader />
        ) : dailyData.length === 0 ? (
          <TableCaption item={captionItem} />
        ) : isMobile ? (
          <>
            <VStack className="daily_summary_report__mobile-list">
              {dailyData.map((item) => (
                <MobileCard
                  key={item.date}
                  date={item.date}
                  {...getCardProps(item)}
                />
              ))}
            </VStack>
            <Spacer />
          </>
        ) : (
          <>
            <div className="daily_summary_report__table-responsive">
              {state.activeTab === "sales" && (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Sales Count</Th>
                      <Th>Sale Amount</Th>
                      <Th>Received Amount</Th>
                      <Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dailyData.map((item) => (
                      <Tr key={item.date}>
                        <Td>{formatDate(item.date)}</Td>
                        <Td>{item.sale?.count || 0}</Td>
                        <TdNumeric>
                          {(item.sale?.received || 0) +
                            (item.sale?.pending || 0)}
                        </TdNumeric>
                        <TdNumeric>{item.sale?.received || 0}</TdNumeric>
                        <TdNumeric>{item.sale?.pending || 0}</TdNumeric>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
              {state.activeTab === "purchases" && (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Purchases Count</Th>
                      <Th>Total Cost</Th>
                      <Th>Cost (Paid)</Th>
                      <Th>Cost (Balance)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dailyData.map((item) => (
                      <Tr key={item.date}>
                        <Td>{formatDate(item.date)}</Td>
                        <Td>{item.purchase?.count || 0}</Td>
                        <TdNumeric>
                          {(item.purchase?.paid || 0) +
                            (item.purchase?.pending || 0)}
                        </TdNumeric>
                        <TdNumeric>{item.purchase?.paid || 0}</TdNumeric>
                        <TdNumeric>{item.purchase?.pending || 0}</TdNumeric>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
              {state.activeTab === "expenses" && (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Expenses Count</Th>
                      <Th>Total Amount</Th>
                      <Th>Amount (Paid)</Th>
                      <Th>Amount (Balance)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dailyData.map((item) => (
                      <Tr key={item.date}>
                        <Td>{formatDate(item.date)}</Td>
                        <Td>{item.expense?.count || 0}</Td>
                        <TdNumeric>{item.expense?.amount || 0}</TdNumeric>
                        <TdNumeric>{item.expense?.paid || 0}</TdNumeric>
                        <TdNumeric>{item.expense?.balance || 0}</TdNumeric>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </div>
          </>
        )}
      </TableWrapper>
      {!loading && dailyData.length > 0 && (
        <TableFooter
          totalItems={totalItems}
          currentPage={state.page}
          itemsPerPage={state.pageSize}
          totalPages={totalPages}
          handlePageLimitSelect={handlePageLimitSelect}
          handlePageChange={handlePageChange}
        />
      )}
    </ContainerWrapper>
  );
}

export default DailySummaryReport;
