import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react"; // Import useReducer
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";

import useItemProfitReport from "@/hooks/api/itemProfitReport/useItemProfitReport";
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
const ItemProfitRow = React.memo(({ item, index }) => {
  return (
    <Tr>
      <TdSL index={index} />
      <Td>{item.item_name}</Td>
      <Td>{item.sold_qty}</Td>
      <Td>{item.revenue}</Td>
      <Td>{item.cost}</Td>
      <Td>{item.profit}</Td>
    </Tr>
  );
});

// Extracted Mobile List Item using React.memo
const MobileItemProfitCard = React.memo(({ item }) => {
  return (
    <ListItem
      title={item.item_name}
      subtitle={
        <>
          <div>
            <strong>Profit: {item.profit}</strong>
          </div>
          <div>Sold Qty: {item.sold_qty}</div>
          <div>
            Revenue: {item.revenue} | Cost: {item.cost}
          </div>
        </>
      }
    />
  );
});

const ItemProfitReport = () => {
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

  // UI state for DateFilter (local) - Remains useState
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    rangeType: "custom",
  });

  const { data, isLoading, refetch, isRefetching } = useItemProfitReport(state);

  // Derived Data (Memoized)
  const listData = useMemo(() => data || [], [data]);
  const loading = isLoading || isRefetching;

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: "custom",
    });
  }, [state.start_date, state.end_date]);

  // --- Handlers (Memoized) - UPDATED setState CALLS ---
  const handleDateFilterChange = useCallback((newDateValue) => {
    setDateFilter(newDateValue);
    setState({ // Simplified setState
      start_date: newDateValue.startDate || "",
      end_date: newDateValue.endDate || "",
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setState({ // Simplified setState
      start_date: "",
      end_date: "",
    });
  }, []);

  // Memoized Subtitle
  const { startDate, endDate } = dateFilter;
  const dateSubtitle = useMemo(() => {
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
  }, [startDate, endDate]);

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Item Profit Report"
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
          {loading ? (
            <Loader />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Item Name</Th>
                  <Th>Sold Qty</Th>
                  <Th>Total Revenue</Th>
                  <Th>Total Cost</Th>
                  <Th>Total Profit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((item, index) => (
                    <ItemProfitRow
                      key={item.item_id || index}
                      item={item}
                      index={index}
                    />
                  ))
                ) : (
                  <TableCaption item="Item Profit Report" noOfCol={6} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Item Profit Report" />
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
            {loading ? (
              <Loader />
            ) : listData.length === 0 ? (
              <TableCaption item="Item Profit Report" />
            ) : (
              <div>
                {listData.map((item, index) => (
                  <MobileItemProfitCard
                    key={item.item_id || index}
                    item={item}
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

export default ItemProfitReport;