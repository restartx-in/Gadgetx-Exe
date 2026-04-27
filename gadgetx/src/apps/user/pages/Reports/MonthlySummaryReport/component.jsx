import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import useMonthlySummary from "@/apps/user/hooks/api/monthlySummary/useMonthlySummary";
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
import DateField from "@/components/DateField";
import Select from "@/components/Select";
import PageHeader from "@/components/PageHeader";
import TableFooter from "@/components/TableFooter";
import { useIsMobile } from "@/utils/useIsMobile";
import ContainerWrapper from "@/components/ContainerWrapper";
import TableWrapper from "@/components/TableWrapper";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import RefreshButton from "@/components/RefreshButton";
import PopUpFilter from "@/components/PopUpFilter";
import Spacer from "@/components/Spacer";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "expenses", label: "Expenses" },
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

// --- Extracted & Memoized Mobile Card ---
const MobileSummaryCard = React.memo(({ item, activeTab }) => {
  let count, total, receivedPaid, balance, label;

  if (activeTab === "sales") {
    count = item.sale?.count || 0;
    receivedPaid = item.sale?.received || 0;
    balance = item.sale?.pending || 0;
    total = receivedPaid + balance;
    label = "Sales";
  } else if (activeTab === "purchases") {
    count = item.purchase?.count || 0;
    receivedPaid = item.purchase?.paid || 0;
    balance = item.purchase?.pending || 0;
    total = receivedPaid + balance;
    label = "Purchases";
  } else {
    count = item.expense?.count || 0;
    total = item.expense?.amount || 0;
    receivedPaid = item.expense?.paid || 0;
    balance = item.expense?.balance || 0;
    label = "Expenses";
  }

  return (
    <div className="monthly_summary_report__mobile_card">
      <div className="monthly_summary_report__mobile_card-content">
        <div className="monthly_summary_report__mobile_card-info">
          <div className="monthly_summary_report__mobile_card-title">
            {item.month} {item.year}
          </div>
          <div className="monthly_summary_report__mobile_card-subtitle">
            {label}: {count}
          </div>
        </div>
        <div className="monthly_summary_report__mobile_card-details">
          <div className="monthly_summary_report__mobile_card-total">
            {formatCurrency(total)}
          </div>
          <div className="monthly_summary_report__mobile_card-paid">
            {activeTab === "sales" ? "Received" : "Paid"}:{" "}
            {formatCurrency(receivedPaid)}
          </div>
          <div className="monthly_summary_report__mobile_card-balance">
            Balance: {formatCurrency(balance)}
          </div>
        </div>
      </div>
    </div>
  );
});

// --- Extracted & Memoized Desktop Row ---
const DesktopSummaryRow = React.memo(({ item, activeTab }) => {
  if (activeTab === "sales") {
    const total = (item.sale?.received || 0) + (item.sale?.pending || 0);
    return (
      <Tr>
        <Td>
          {item.month} {item.year}
        </Td>
        <Td>{item.sale?.count || 0}</Td>
        <TdNumeric>{total}</TdNumeric>
        <TdNumeric>{item.sale?.received || 0}</TdNumeric>
        <TdNumeric>{item.sale?.pending || 0}</TdNumeric>
      </Tr>
    );
  } else if (activeTab === "purchases") {
    const total = (item.purchase?.paid || 0) + (item.purchase?.pending || 0);
    return (
      <Tr>
        <Td>
          {item.month} {item.year}
        </Td>
        <Td>{item.purchase?.count || 0}</Td>
        <TdNumeric>{total}</TdNumeric>
        <TdNumeric>{item.purchase?.paid || 0}</TdNumeric>
        <TdNumeric>{item.purchase?.pending || 0}</TdNumeric>
      </Tr>
    );
  } else {
    return (
      <Tr>
        <Td>
          {item.month} {item.year}
        </Td>
        <Td>{item.expense?.count || 0}</Td>
        <TdNumeric>{item.expense?.amount || 0}</TdNumeric>
        <TdNumeric>{item.expense?.paid || 0}</TdNumeric>
        <TdNumeric>{item.expense?.balance || 0}</TdNumeric>
      </Tr>
    );
  }
});

const MonthlySummaryReport = () => {
  const [searchParams] = useSearchParams();
  const today = new Date();
  const isMobile = useIsMobile();
  const tabsContainerRef = useRef(null);

  // --- Centralized State using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    start_date: searchParams.get("startDate") || `${today.getFullYear()}-01-01`,
    end_date: searchParams.get("endDate") || `${today.getFullYear()}-12-31`,
    active_tab: searchParams.get("activeTab") || "sales",
  });

  // --- URL Sync ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    startDate: state.start_date,
    endDate: state.end_date,
    activeTab: state.active_tab,
  });

  // --- Local Filter State (for the PopUpFilter) - Remain useState ---
  const [showFilter, setShowFilter] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(state.start_date);
  const [localEndDate, setLocalEndDate] = useState(state.end_date);
  const [localYear, setLocalYear] = useState(String(today.getFullYear()));

  // --- API Call ---
  const {
    data: summaryResponse,
    isLoading,
    isRefetching,
  } = useMonthlySummary({
    start_date: state.start_date,
    end_date: state.end_date,
    page: state.page,
    page_size: state.page_size,
  });

  // --- Derived Data ---
  const monthlyData = useMemo(
    () => summaryResponse?.data || [],
    [summaryResponse]
  );
  const totalPages = summaryResponse?.page_count || 0;
  const totalItems = summaryResponse?.count || 0;
  const loading = isLoading || isRefetching;

  const activeData = useMemo(() => {
    switch (state.active_tab) {
      case "sales":
        return monthlyData.filter((item) => item.sale?.count > 0);
      case "purchases":
        return monthlyData.filter((item) => item.purchase?.count > 0);
      case "expenses":
        return monthlyData.filter((item) => item.expense?.count > 0);
      default:
        return [];
    }
  }, [state.active_tab, monthlyData]);

  const captionItem = useMemo(() => {
    const mapping = {
      sales: "Sale",
      purchases: "Purchase",
      expenses: "Expense",
    };
    return mapping[state.active_tab] || "Item";
  }, [state.active_tab]);

  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 6 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    }));
  }, []);

  // --- Sync local filter state when main state changes (e.g. from URL) ---
  useEffect(() => {
    setLocalStartDate(state.start_date);
    setLocalEndDate(state.end_date);
  }, [state.start_date, state.end_date]);

  // --- Mobile Tab Scrolling ---
  useEffect(() => {
    if (isMobile && tabsContainerRef.current) {
      const activeTabElement = tabsContainerRef.current.querySelector(
        `[data-tab-key="${state.active_tab}"]`
      );
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [state.active_tab, isMobile]);

  // --- Handlers - UPDATED setState CALLS ---

  const handleTabChange = useCallback((key) => {
    setState({ active_tab: key }); // Simplified setState
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value }); // Simplified setState
  }, []);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }); // Simplified setState
  }, []);

  const handleApplyFilter = useCallback(() => {
    setState({
      // Simplified setState
      start_date: localStartDate,
      end_date: localEndDate,
      page: 1,
    });
    setShowFilter(false);
  }, [localStartDate, localEndDate]);

  const handleFilterReset = useCallback(() => {
    const currentYearStr = String(today.getFullYear());
    const defaultStartDate = `${currentYearStr}-01-01`;
    const defaultEndDate = `${currentYearStr}-12-31`;

    // Reset local state
    setLocalStartDate(defaultStartDate);
    setLocalEndDate(defaultEndDate);
    setLocalYear(currentYearStr);

    // Reset global state
    setState({
      // Simplified setState
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      page: 1,
      // Note: active_tab is usually kept on refresh unless explicitly cleared/set to default
    });
    setShowFilter(false);
  }, []);

  // Filter Helper Handlers
  const handleLocalYearChange = useCallback((e) => {
    const year = e.target.value;
    setLocalYear(year);
    setLocalStartDate(`${year}-01-01`);
    setLocalEndDate(`${year}-12-31`);
  }, []);

  const handleLocalStartDateChange = useCallback((date) => {
    setLocalStartDate(date ? date.toISOString().slice(0, 10) : "");
  }, []);

  const handleLocalEndDateChange = useCallback((date) => {
    setLocalEndDate(date ? date.toISOString().slice(0, 10) : "");
  }, []);

  const filterProps = {
    showFilter,
    setShowFilter,
    handleApplyFilter,
    handleFilterReset,
    localStartDate,
    handleLocalStartDateChange,
    localEndDate,
    handleLocalEndDateChange,
    localYear,
    handleLocalYearChange,
    yearOptions,
  };

  return (
    <ContainerWrapper className="monthly_summary_report">
      <div>
        <PageTitleWithBackButton title="Monthly Reports" />
      </div>

      <TableWrapper>
        {loading ? (
          <Loader />
        ) : activeData.length === 0 ? (
          <TableCaption item={captionItem} />
        ) : isMobile ? (
          <>
            {/* === MOBILE HEADER === */}
            <PageHeader className="monthly_summary_report__page-header--mobile">
              <div
                className="monthly_summary_report__tabs_container"
                ref={tabsContainerRef}
              >
                <HStack className="monthly_summary_report__tabs_container-tabs">
                  {TABS.map((tab) => (
                    <Button
                      key={tab.key}
                      data-tab-key={tab.key}
                      variant={
                        state.active_tab === tab.key
                          ? "primary"
                          : "filter-outline"
                      }
                      onClick={() => handleTabChange(tab.key)}
                      className="monthly_summary_report__tab_btn"
                    >
                      {tab.label}
                    </Button>
                  ))}
                </HStack>
              </div>
              <HStack className="monthly_summary_report__actions_container">
                <MonthlySummaryListFilter {...filterProps} />
                <RefreshButton onClick={handleFilterReset} />
              </HStack>
            </PageHeader>
            <VStack className="monthly_summary_report__mobile-list">
              {activeData.map((item) => (
                <MobileSummaryCard
                  key={`${item.year}-${item.month}`}
                  item={item}
                  activeTab={state.active_tab}
                />
              ))}
            </VStack>
            <Spacer />
          </>
        ) : (
          <>
            {/* === DESKTOP HEADER === */}
            <HStack justifyContent="space-between" alignItems="center">
              <div
                className="monthly_summary_report__tabs_container"
                ref={tabsContainerRef}
              >
                <HStack>
                  {TABS.map((tab) => (
                    <Button
                      key={tab.key}
                      data-tab-key={tab.key}
                      variant={
                        state.active_tab === tab.key
                          ? "primary"
                          : "filter-outline"
                      }
                      onClick={() => handleTabChange(tab.key)}
                      className="monthly_summary_report__tab_btn fs18 fw600"
                    >
                      {tab.label}
                    </Button>
                  ))}
                </HStack>
              </div>
              <HStack className="monthly_summary_report__actions_container">
                <MonthlySummaryListFilter {...filterProps} />
                <RefreshButton onClick={handleFilterReset} />
              </HStack>
            </HStack>

            <div className="monthly_summary_report__table_responsive">
              <Table>
                <Thead>
                  {state.active_tab === "sales" && (
                    <Tr>
                      <Th>Month</Th>
                      <Th>Sales Count</Th>
                      <Th>Total Amount</Th>
                      <Th>Received Amount</Th>
                      <Th>Balance</Th>
                    </Tr>
                  )}
                  {state.active_tab === "purchases" && (
                    <Tr>
                      <Th>Month</Th>
                      <Th>Purchases Count</Th>
                      <Th>Total Cost</Th>
                      <Th>Cost (Paid)</Th>
                      <Th>Cost (Balance)</Th>
                    </Tr>
                  )}
                  {state.active_tab === "expenses" && (
                    <Tr>
                      <Th>Month</Th>
                      <Th>Expenses Count</Th>
                      <Th>Total Amount</Th>
                      <Th>Amount (Paid)</Th>
                      <Th>Amount (Balance)</Th>
                    </Tr>
                  )}
                </Thead>
                <Tbody>
                  {activeData.map((item) => (
                    <DesktopSummaryRow
                      key={`${item.year}-${item.month}`}
                      item={item}
                      activeTab={state.active_tab}
                    />
                  ))}
                </Tbody>
              </Table>
            </div>
          </>
        )}
      </TableWrapper>
      {!loading && monthlyData.length > 0 && (
        <TableFooter
          totalItems={totalItems}
          currentPage={state.page}
          itemsPerPage={state.page_size}
          totalPages={totalPages}
          handlePageLimitSelect={handlePageLimitSelect}
          handlePageChange={handlePageChange}
        />
      )}
    </ContainerWrapper>
  );
};

const MonthlySummaryListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleApplyFilter,
    handleFilterReset,
    localStartDate,
    handleLocalStartDateChange,
    localEndDate,
    handleLocalEndDateChange,
    localYear,
    handleLocalYearChange,
    yearOptions,
  }) => {
    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleApplyFilter}
        onReset={handleFilterReset}
      >
        <VStack>
          <DateField
            label="From Date"
            value={localStartDate ? new Date(localStartDate) : null}
            onChange={handleLocalStartDateChange}
          />
          <DateField
            label="To Date"
            value={localEndDate ? new Date(localEndDate) : null}
            onChange={handleLocalEndDateChange}
          />
          <Select
            label="Year"
            value={localYear}
            onChange={handleLocalYearChange}
            options={yearOptions}
          />
        </VStack>
      </PopUpFilter>
    );
  }
);

export default MonthlySummaryReport;
