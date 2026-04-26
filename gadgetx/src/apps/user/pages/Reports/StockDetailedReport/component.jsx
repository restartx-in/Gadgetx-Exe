import React, { useState, useEffect, useMemo, useCallback, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";

import useStockDetailedReport from "@/hooks/api/stockDetailedReport/useStockDetailedReport";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

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
  ThSL,
  TdSL,
  TableCaption,
} from "@/components/Table";

import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

// Extracted Row Component using React.memo
const StockRow = React.memo(({ item, index }) => {
  return (
    <Tr>
      <TdSL index={index} />
      <Td>{item.name}</Td>
      <Td>{item.opening_qty}</Td>
      <Td>{item.qty_in}</Td>
      <Td>{item.qty_out}</Td>
      <Td>{item.closing_qty}</Td>
    </Tr>
  );
});

// Extracted Mobile Card Component using React.memo
const MobileStockCard = React.memo(({ item }) => {
  return (
    <ListItem
      title={item.name}
      subtitle={
        <>
          <div>
            <strong>Closing Qty: {item.closing_qty}</strong>
          </div>
          <div>
            Opening: {item.opening_qty} | In: {item.qty_in} | Out:{" "}
            {item.qty_out}
          </div>
        </>
      }
    />
  );
});

const StockDetailedReport = () => {
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

  const { data, isLoading } = useStockDetailedReport(state);

  // Derived Data (Memoized)
  const listData = useMemo(() => data || [], [data]);

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
    setState({ // Simplified setState
      start_date: newDateValue.startDate || "",
      end_date: newDateValue.endDate || "",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setState({ // Simplified setState (full reset object)
      start_date: "",
      end_date: "",
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
      ? `${format(new Date(startDate), "MMM d, yyyy")} → ${format(
          new Date(endDate),
          "MMM d, yyyy"
        )}`
      : "No date range selected";
  }, [dateFilter]);

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Stock Detailed Report"
            subtitle={dateSubtitle}
          />
          <TableTopContainer
            isMargin={true}
            mainActions={
              <>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
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
                  <Th>Item Name</Th>
                  <Th>Opening Qty</Th>
                  <Th>Qty In</Th>
                  <Th>Qty Out</Th>
                  <Th>Closing Qty</Th>
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((item, index) => (
                    <StockRow
                      key={item.item_id || index}
                      item={item}
                      index={index}
                    />
                  ))
                ) : (
                  <TableCaption item="Stock Report" noOfCol={6} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Stock Detailed Report" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <DateFilter
                  value={dateFilter}
                  onChange={handleDateFilterChange}
                />
                <RefreshButton onClick={handleRefresh} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : listData.length === 0 ? (
              <TableCaption item="Stock Detailed Report" />
            ) : (
              <div>
                {listData.map((item, index) => (
                  <MobileStockCard key={item.item_id || index} item={item} />
                ))}
              </div>
            )}
          </ScrollContainer>
        </>
      )}
    </ContainerWrapper>
  );
};

export default StockDetailedReport;