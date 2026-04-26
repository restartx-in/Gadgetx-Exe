import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import useDailySummary from "@/hooks/api/dailySummary/useDailySummary";
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
import DateField from "@/components/DateField";
import TableFooter from "@/components/TableFooter";
import { useIsMobile } from "@/utils/useIsMobile";
import ContainerWrapper from "@/components/ContainerWrapper";
import TableWrapper from "@/components/TableWrapper";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import PopUpFilter from "@/components/PopUpFilter";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";

import "./style.scss";

// 2. Define Reducer
const stateReducer = (state, action) => {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
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
    default:
      return state;
  }
};

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
        </VStack>
      </PopUpFilter>
    );
  }
);

function DailySummaryReport() {
  const isMobile = useIsMobile();
  const defaultDates = getDefaultDateRange();
  const [searchParams] = useSearchParams();

  // 3. Initialize state with useReducer
  const [state, dispatch] = useReducer(stateReducer, {
    activeTab: searchParams.get("activeTab") || "sales",
    startDate: searchParams.get("startDate") || defaultDates.start,
    endDate: searchParams.get("endDate") || defaultDates.end,
    page: parseInt(searchParams.get("page")) || 1,
    pageSize: parseInt(searchParams.get("pageSize")) || 10,
  });

  const [filterStartDate, setFilterStartDate] = useState(state.startDate);
  const [filterEndDate, setFilterEndDate] = useState(state.endDate);

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
  });
  
  // --- FIX STARTS HERE ---
  // This useEffect ensures that the data is fetched on initial component load
  // and whenever the filters or pagination change. It fixes the issue where
  // data would only appear after a manual refresh.
  useEffect(() => {
    refetch();
  }, [state.startDate, state.endDate, state.page, state.pageSize, refetch]);
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
  }, [state.startDate, state.endDate]);

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
    setShowFilter(false);
  }, [filterStartDate, filterEndDate]);

  const handleFilterReset = useCallback(() => {
    const { start, end } = getDefaultDateRange();
    setFilterStartDate(start);
    setFilterEndDate(end);
    dispatch({ type: "SET_DATES", payload: { start, end } });
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
    }),
    [
      showFilter,
      handleApplyFilter,
      handleFilterReset,
      filterStartDate,
      filterEndDate,
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