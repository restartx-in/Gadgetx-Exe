import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

// Hooks
import { useLedgerReport } from "@/apps/user/hooks/api/ledger/useLedgerReport";
import { useLedger } from "@/apps/user/hooks/api/ledger/useLedger";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

// Components
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TdNumeric,
  TableCaption,
  ThSL,
  TdSL,
  ThContainer,
  ThSort,
  ThFilterContainer,
  ThSearchOrFilterPopover,
} from "@/components/Table";
import DateFilter from "@/components/DateFilter";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import Loader from "@/components/Loader";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import RefreshButton from "@/components/RefreshButton";
import ListItem from "@/components/ListItem/component";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack/component.jsx";
import SelectField from "@/components/SelectField";
import DateField from "@/components/DateField";
import PageHeader from "@/components/PageHeader";
import InputField from "@/components/InputField";

// Helper Reducer
const stateReducer = (state, newState) => ({ ...state, ...newState });

// --- Memoized Row Components for Performance ---

const ReportRow = React.memo(({ row, onRowClick, index, totalRows }) => (
  <Tr onClick={() => onRowClick(row)} style={{ cursor: "pointer" }}>
    <TdSL index={index} page={1} pageSize={totalRows} />
    <Td style={{ fontWeight: 500, color: "#2563eb" }}>{row.label}</Td>
    <TdNumeric>{parseFloat(row.total_debit || 0).toFixed(2)}</TdNumeric>
    <TdNumeric>{parseFloat(row.total_credit || 0).toFixed(2)}</TdNumeric>
    <TdNumeric style={{ fontWeight: "bold" }}>
      {parseFloat(row.balance || 0).toFixed(2)}
    </TdNumeric>
  </Tr>
));

const MobileReportCard = React.memo(({ row, onRowClick }) => (
  <ListItem
    onClick={() => onRowClick(row)}
    title={row.label}
    subtitle={
      <div style={{ fontSize: "12px", color: "#9ca3af" }}>Tap for details</div>
    }
    amount={
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#16a34a", fontSize: "12px" }}>
          Dr: {parseFloat(row.total_debit || 0).toFixed(2)}
        </div>
        <div style={{ color: "#dc2626", fontSize: "12px" }}>
          Cr: {parseFloat(row.total_credit || 0).toFixed(2)}
        </div>
        <div style={{ fontWeight: "bold", color: "#1f2937" }}>
          Bal: {parseFloat(row.balance || 0).toFixed(2)}
        </div>
      </div>
    }
  />
));

const MonthlyLedgerReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // --- 1. Centralized State (Reducer) ---
  const [state, setState] = useReducer(stateReducer, {
    ledger_id: searchParams.get("ledgerId") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    sort: searchParams.get("sort") || "label",
    label: searchParams.get("label") || "",
    total_debit: searchParams.get("total_debit") || "",
    total_credit: searchParams.get("total_credit") || "",
    balance: searchParams.get("balance") || "",
  });

  // --- 2. URL Sync ---
  useSyncURLParams({
    ledgerId: state.ledger_id,
    startDate: state.start_date,
    endDate: state.end_date,
    sort: state.sort,
    label: state.label,
    total_debit: state.total_debit,
    total_credit: state.total_credit,
    balance: state.balance,
  });

  // --- 3. Local UI States (to prevent unwanted API calls) ---
  const [showFilter, setShowFilter] = useState(false);
  const [headerFilters, setHeaderFilters] = useState({
    label: "",
    total_debit: "",
    total_credit: "",
    balance: "",
  });
  const [localFilters, setLocalFilters] = useState({
    ledger_id: "",
    start_date: "",
    end_date: "",
  });

  // Sync state to local filters when URL changes (e.g., back button)
  useEffect(() => {
    setHeaderFilters({
      label: state.label || "",
      total_debit: state.total_debit || "",
      total_credit: state.total_credit || "",
      balance: state.balance || "",
    });
    setLocalFilters((prev) => ({
      ...prev,
      ledger_id: state.ledger_id || "",
      start_date: state.start_date || "",
      end_date: state.end_date || "",
    }));
  }, [
    state.label,
    state.total_debit,
    state.total_credit,
    state.balance,
    state.ledger_id,
    state.start_date,
    state.end_date,
  ]);

  // --- 4. Data Fetching ---
  const { data: ledgersList = [] } = useLedger();
  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useLedgerReport({ ...state, view: "monthly" });

  const ledgerOptions = useMemo(
    () =>
      Array.isArray(ledgersList)
        ? ledgersList.map((l) => ({ value: l.id, label: l.name }))
        : [],
    [ledgersList]
  );

  const isDetailedMode = !!state.ledger_id;

  // --- 5. Memoized Callbacks for Handlers ---
  const handleRefresh = useCallback(() => {
    setState({
      ledger_id: "",
      start_date: "",
      end_date: "",
      sort: "label",
      label: "",
      total_debit: "",
      total_credit: "",
      balance: "",
    });
    refetch();
  }, [refetch]);

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setState({
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
    });
  }, []);

  const handleSort = useCallback((value) => {
    setState({ sort: value });
  }, []);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ [key]: value });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [headerFilters, handleHeaderSearch]
  );

  const handleApplyFilter = useCallback(() => {
    setState({
      ledger_id: localFilters.ledger_id,
      start_date: localFilters.start_date,
      end_date: localFilters.end_date,
    });
    setShowFilter(false);
  }, [localFilters]);

  const handleRowClick = useCallback(
    (row) => {
      if (isDetailedMode) {
        if (!row.month_key) return;
        const date = parseISO(`${row.month_key}-01`);
        const start = format(startOfMonth(date), "yyyy-MM-dd");
        const end = format(endOfMonth(date), "yyyy-MM-dd");
        navigate(
          `/ledger-report?ledgerId=${state.ledger_id}&startDate=${start}&endDate=${end}`
        );
      } else {
        let url = `/ledger-report?ledgerId=${row.ledger_id}`;
        if (state.start_date) url += `&startDate=${state.start_date}`;
        if (state.end_date) url += `&endDate=${state.end_date}`;
        navigate(url);
      }
    },
    [
      isDetailedMode,
      state.ledger_id,
      state.start_date,
      state.end_date,
      navigate,
    ]
  );

  // --- 6. Derived Data (Memoized) ---
  const selectedLedgerName = useMemo(
    () =>
      state.ledger_id
        ? ledgerOptions.find((l) => String(l.value) === String(state.ledger_id))
            ?.label || "Unknown Ledger"
        : "Summary Report",
    [ledgerOptions, state.ledger_id]
  );

  // --- 7. Render ---
  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Monthly Ledger Report"
            subtitle={selectedLedgerName}
          />
          <TableTopContainer
            //isMargin={true}
            mainActions={
              <>
                <DateFilter
                  value={{
                    startDate: state.start_date,
                    endDate: state.end_date,
                  }}
                  onChange={handleDateFilterChange}
                />
                <MonthlyFilter
                  {...{
                    showFilter,
                    setShowFilter,
                    handleApplyFilter,
                    localFilters,
                    setLocalFilters,
                    ledgerOptions,
                  }}
                />
                <RefreshButton onClick={handleRefresh} />
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
                      {isDetailedMode ? "Month" : "Ledger Name"}
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="label"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch={true}
                          onSearch={() =>
                            handleHeaderSearch("label", headerFilters.label)
                          }
                        >
                          <InputField
                            value={headerFilters.label}
                            onChange={(e) =>
                              setHeaderFilters((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => handleHeaderKeyDown(e, "label")}
                            isLabel={false}
                            placeholder="Search..."
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th style={{ textAlign: "right" }}>
                    <ThContainer style={{ justifyContent: "flex-end" }}>
                      Total Debit
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="total_debit"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch={true}
                          onSearch={() =>
                            handleHeaderSearch(
                              "total_debit",
                              headerFilters.total_debit
                            )
                          }
                        >
                          <InputField
                            type="number"
                            value={headerFilters.total_debit}
                            onChange={(e) =>
                              setHeaderFilters((prev) => ({
                                ...prev,
                                total_debit: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              handleHeaderKeyDown(e, "total_debit")
                            }
                            isLabel={false}
                            placeholder="Exact Amount"
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th style={{ textAlign: "right" }}>
                    <ThContainer style={{ justifyContent: "flex-end" }}>
                      Total Credit
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="total_credit"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch={true}
                          onSearch={() =>
                            handleHeaderSearch(
                              "total_credit",
                              headerFilters.total_credit
                            )
                          }
                        >
                          <InputField
                            type="number"
                            value={headerFilters.total_credit}
                            onChange={(e) =>
                              setHeaderFilters((prev) => ({
                                ...prev,
                                total_credit: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              handleHeaderKeyDown(e, "total_credit")
                            }
                            isLabel={false}
                            placeholder="Exact Amount"
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th style={{ textAlign: "right" }}>
                    <ThContainer style={{ justifyContent: "flex-end" }}>
                      Balance
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="balance"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch={true}
                          onSearch={() =>
                            handleHeaderSearch("balance", headerFilters.balance)
                          }
                        >
                          <InputField
                            type="number"
                            value={headerFilters.balance}
                            onChange={(e) =>
                              setHeaderFilters((prev) => ({
                                ...prev,
                                balance: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => handleHeaderKeyDown(e, "balance")}
                            isLabel={false}
                            placeholder="Exact Amount"
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((row, idx) => (
                  <ReportRow
                    key={idx}
                    row={row}
                    onRowClick={handleRowClick}
                    index={idx}
                    totalRows={rows.length}
                  />
                ))}
                {rows.length === 0 && (
                  <TableCaption noOfCol={5} message="No records found." />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton title="Monthly Report" />
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateFilter
                  value={{
                    startDate: state.start_date,
                    endDate: state.end_date,
                  }}
                  onChange={handleDateFilterChange}
                />
                <MonthlyFilter
                  {...{
                    showFilter,
                    setShowFilter,
                    handleApplyFilter,
                    localFilters,
                    setLocalFilters,
                    ledgerOptions,
                  }}
                />
                <RefreshButton onClick={handleRefresh} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : rows.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                No Data
              </div>
            ) : (
              rows.map((row, idx) => (
                <MobileReportCard
                  key={idx}
                  row={row}
                  onRowClick={handleRowClick}
                />
              ))
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

// Reused, Memoized Filter Component
const MonthlyFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleApplyFilter,
    localFilters,
    setLocalFilters,
    ledgerOptions,
  }) => {
    const isMobile = useIsMobile();
    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleApplyFilter}
      >
        <VStack spacing={4}>
          <SelectField
            label="Filter by Ledger"
            placeholder="All Ledgers (Summary)"
            options={[
              { value: "", label: "All Ledgers (Summary)" },
              ...ledgerOptions,
            ]}
            value={localFilters.ledger_id}
            onChange={(e) =>
              setLocalFilters((prev) => ({
                ...prev,
                ledger_id: e.target.value,
              }))
            }
            isSearchable={true}
          />
          {isMobile && (
            <>
              <DateField
                label="Start Date"
                value={
                  localFilters.start_date
                    ? new Date(localFilters.start_date)
                    : null
                }
                onChange={(d) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    start_date: d ? d.toISOString().split("T")[0] : "",
                  }))
                }
              />
              <DateField
                label="End Date"
                value={
                  localFilters.end_date ? new Date(localFilters.end_date) : null
                }
                onChange={(d) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    end_date: d ? d.toISOString().split("T")[0] : "",
                  }))
                }
              />
            </>
          )}
        </VStack>
      </PopUpFilter>
    );
  }
);

export default MonthlyLedgerReport;
