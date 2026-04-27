import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";

import useTaxSummaryReport from "@/apps/user/hooks/api/taxSummaryReport/useTaxSummaryReport";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TableCaption,
} from "@/components/Table";

import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

// Extracted Row Component using React.memo
const TaxSummaryRow = React.memo(({ item, index, formatNumber }) => {
  return (
    <Tr>
      <TdSL index={index} />
      <Td>{item.invoice_number}</Td>
      <Td>{format(new Date(item.date), "PP")}</Td>
      <Td>{item.customer || "-"}</Td>
      <Td>{formatNumber(item.tax)}</Td>
    </Tr>
  );
});

// Extracted Mobile Card Component using React.memo
const MobileTaxSummaryCard = React.memo(({ item, formatNumber }) => {
  return (
    <ListItem
      title={item.invoice_number}
      subtitle={
        <>
          <div>
            <strong>Tax: {formatNumber(item.tax)}</strong>
          </div>
          <div>Customer: {item.customer || "-"}</div>
          <div>Date: {format(new Date(item.date), "PP")}</div>
        </>
      }
    />
  );
});

const TaxSummaryReport = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // --- 1. Initialize state from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  // --- 2. Sync state with URL ---
  useSyncURLParams({
    startDate: state.start_date,
    endDate: state.end_date,
  });

  // UI state for DateFilter (local - remains useState)
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    rangeType: "custom",
  });

  const { data, isLoading, isFetching } = useTaxSummaryReport(state);

  // Derived Data (Memoized)
  const reportData = useMemo(() => data || { details: [] }, [data]);
  const { total_tax_collected, details } = reportData;
  const hasData = details && details.length > 0;

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: "custom",
    });
  }, [state.start_date, state.end_date]);

  // --- Handlers (Memoized & UPDATED setState CALLS) ---
  const handleDateFilterChange = useCallback((newDateValue) => {
    setDateFilter(newDateValue);
    setState({
      // Simplified setState
      start_date: newDateValue.startDate || "",
      end_date: newDateValue.endDate || "",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setState({
      // Simplified setState (full reset object)
      start_date: "",
      end_date: "",
    });
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // Memoized Subtitle
  const dateSubtitle = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    const isDateFilterActive =
      startDate &&
      endDate &&
      isValid(new Date(startDate)) &&
      isValid(new Date(endDate));

    return isDateFilterActive
      ? `${format(new Date(startDate), "MMM d, yyyy")} to ${format(
          new Date(endDate),
          "MMM d, yyyy"
        )}`
      : "Showing all-time data";
  }, [dateFilter]);

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Tax Summary Report"
            subtitle={dateSubtitle}
          />
          <TableTopContainer
            isMargin={true}
            mainActions={
              <>
                <div className="total-tax-summary-box fs14 fw500">
                  <strong>Total Tax Collected:</strong>
                  <span>{formatNumber(total_tax_collected)}</span>
                </div>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
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
                  <Th>Invoice No</Th>
                  <Th>Date</Th>
                  <Th>Customer</Th>
                  <Th>Tax Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {hasData ? (
                  details.map((item, index) => (
                    <TaxSummaryRow
                      key={item.invoice_number || index}
                      item={item}
                      index={index}
                      formatNumber={formatNumber}
                    />
                  ))
                ) : (
                  <TableCaption item="Tax Summary Report" noOfCol={5} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Tax Summary Report" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : !hasData ? (
              <TableCaption item="Tax Summary Report" />
            ) : (
              <div>
                <ListItem
                  title="Total Tax Collected"
                  subtitle={
                    <>
                      <div>
                        <strong>
                          Amount: {formatNumber(total_tax_collected)}
                        </strong>
                      </div>
                    </>
                  }
                />
                {details.map((item, index) => (
                  <MobileTaxSummaryCard
                    key={item.invoice_number || index}
                    item={item}
                    formatNumber={formatNumber}
                  />
                ))}
              </div>
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

export default TaxSummaryReport;
