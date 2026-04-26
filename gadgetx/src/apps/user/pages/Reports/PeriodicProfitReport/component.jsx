import React, { useMemo, useCallback, useReducer } from "react";
import { format, isValid, parseISO } from "date-fns";
import usePeriodicProfitReport from "@/hooks/api/periodicProfitReport/usePeriodicProfitReport";
import { useIsMobile } from "@/utils/useIsMobile";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer from "@/components/TableTopContainer";
import DateFilter from "@/components/DateFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/apps/user/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";

// --- Reducer & Helper Functions (outside component) ---
const stateReducer = (state, newState) => ({ ...state, ...newState });

const formatNumber = (value) => {
  if (value === null || value === undefined) return "0.00";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const initialState = {
  startDate: "",
  endDate: "",
};

const PeriodicProfitReport = () => {
  const isMobile = useIsMobile();

  // --- 1. Consolidated State using useReducer ---
  const [state, setState] = useReducer(stateReducer, initialState);

  // --- 2. Data Fetching ---
  const { data, isLoading, isFetching } = usePeriodicProfitReport({
    start_date: state.startDate,
    end_date: state.endDate,
  });

  // --- 3. Memoized Callbacks for Handlers ---
  const handleDateFilterChange = useCallback((newDateValue) => {
    setState({
      startDate: newDateValue.startDate || "",
      endDate: newDateValue.endDate || "",
    });
  }, []); // Empty dependency array means this function is created only once.

  const handleRefresh = useCallback(() => {
    setState({
      startDate: "",
      endDate: "",
    });
  }, []); // Stable function.

  // --- 4. Memoized Derived Data ---
  const dateSubtitle = useMemo(() => {
    const { startDate, endDate } = state;
    const isDateFilterActive =
      startDate &&
      endDate &&
      isValid(parseISO(startDate)) &&
      isValid(parseISO(endDate));

    return isDateFilterActive
      ? `${format(parseISO(startDate), "MMM d, yyyy")} → ${format(
          parseISO(endDate),
          "MMM d, yyyy"
        )}`
      : "Showing all-time data";
  }, [state.startDate, state.endDate]);

  const { total_sales, total_cost, total_expenses, net_profit } = data || {};

  // --- 5. Render Logic ---
  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Periodic Profit Report"
            subtitle={dateSubtitle}
          />
          <TableTopContainer
            isMargin={true}
            mainActions={
              <>
                <DateFilter
                  value={{ startDate: state.startDate, endDate: state.endDate }}
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
                  <Th>Total Sales</Th>
                  <Th>Total Cost (COGS)</Th>
                  <Th>Total Expenses</Th>
                  <Th>Net Profit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data ? (
                  <Tr>
                    <Td>{formatNumber(total_sales)}</Td>
                    <Td>{formatNumber(total_cost)}</Td>
                    <Td>{formatNumber(total_expenses)}</Td>
                    <Td>{formatNumber(net_profit)}</Td>
                  </Tr>
                ) : (
                  <TableCaption item="Periodic Profit Report" noOfCol={4} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Periodic Profit Report" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateFilter
                  value={{ startDate: state.startDate, endDate: state.endDate }}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : !data ? (
              <TableCaption item="Periodic Profit Report" />
            ) : (
              <div>
                <ListItem
                  title="Profit Summary"
                  subtitle={
                    <>
                      <div>
                        <strong>Net Profit: {formatNumber(net_profit)}</strong>
                      </div>
                      <div>Total Sales: {formatNumber(total_sales)}</div>
                      <div>Total Cost: {formatNumber(total_cost)}</div>
                      <div>Total Expenses: {formatNumber(total_expenses)}</div>
                    </>
                  }
                />
              </div>
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

export default PeriodicProfitReport;
