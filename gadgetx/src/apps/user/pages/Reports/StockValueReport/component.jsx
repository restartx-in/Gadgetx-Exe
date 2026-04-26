import React, { useState, useEffect, useMemo, useCallback, useReducer } from "react";
import { useSearchParams } from "react-router-dom";

import useStockValueReport from "@/hooks/api/stockValueReport/useStockValueReport";
import useStockValueReportPaginated from "@/hooks/api/stockValueReport/useStockValueReportPaginated";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer from "@/components/TableTopContainer";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/apps/user/components/ListItem/component";
import PageHeader from "@/components/PageHeader";
import HStack from "@/components/HStack/component.jsx";
import TableFooter from "@/components/TableFooter";
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
const StockValueRow = React.memo(
  ({ item, index, page, pageSize, formatNumber }) => {
    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        <Td>{item.name}</Td>
        <Td>{item.sku}</Td>
        <Td>{item.category_name}</Td>
        <Td>{item.stock_quantity}</Td>
        <Td>{formatNumber(item.purchase_price)}</Td>
        <Td>{formatNumber(item.total_value)}</Td>
      </Tr>
    );
  }
);

// Extracted Mobile Card Component using React.memo
const MobileStockValueCard = React.memo(({ item, formatNumber }) => {
  return (
    <ListItem
      title={item.name}
      subtitle={
        <>
          <div>
            <strong>Total Value: {formatNumber(item.total_value)}</strong>
          </div>
          <div>SKU: {item.sku}</div>
          <div>
            Qty: {item.stock_quantity} @ {formatNumber(item.purchase_price)}
          </div>
          <div>Category: {item.category_name}</div>
        </>
      }
    />
  );
});

const StockValueReport = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  // --- 1. Initialize state from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
  });

  // --- 2. Sync state with URL ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
  });

  // API Hooks
  const {
    data: paginatedResult,
    isLoading,
    isFetching,
    refetch: refetchPaginated,
  } = useStockValueReportPaginated(state);

  const { data: summaryResult, refetch: refetchSummary } = useStockValueReport(
    {}
  );

  // Derived Data (Memoized)
  const listData = useMemo(
    () => paginatedResult?.data || [],
    [paginatedResult]
  );
  const totalPages = paginatedResult?.page_count || 1;

  // Use item_count from summary for totalItems if available, otherwise fallback
  const totalItems = summaryResult?.item_count || 0;

  const summaryData = useMemo(() => summaryResult || {}, [summaryResult]);
  const hasData = listData.length > 0;

  // --- Handlers (Memoized & UPDATED setState CALLS) ---
  const handleRefresh = useCallback(() => {
    setState({ page: 1 }); // Simplified setState
    refetchPaginated();
    refetchSummary();
  }, [refetchPaginated, refetchSummary]);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }); // Simplified setState
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value }); // Simplified setState
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const subtitle = "Showing current stock value for all items";

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Stock Value Report"
            subtitle={subtitle}
          />
          <TableTopContainer
            isMargin={true}
            mainActions={
              <>
                <div className="total-stock-value-box fs14 fw500">
                  <strong>Total Inventory Value:</strong>{" "}
                  {formatNumber(summaryData.total_inventory_value)}
                </div>
                <div className="total-stock-value-box fs14 fw500">
                  <strong>Total Item Count:</strong>{" "}
                  {summaryData.item_count || 0}
                </div>
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </>
            }
          />

          {isLoading ? (
            <Loader />
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>Item Name</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th>Stock Qty</Th>
                    <Th>Purchase Price</Th>
                    <Th>Total Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {hasData ? (
                    listData.map((item, index) => (
                      <StockValueRow
                        key={item.id}
                        item={item}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        formatNumber={formatNumber}
                      />
                    ))
                  ) : (
                    <TableCaption item="Stock Value Report" noOfCol={7} />
                  )}
                </Tbody>
              </Table>
              {!isLoading && hasData && (
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
          )}
        </>
      ) : (
        // MOBILE VIEW
        <>
          <TitleContainer>
            <PageTitleWithBackButton title="Stock Value Report" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : !hasData ? (
              <TableCaption item="Stock Value Report" />
            ) : (
              <div>
                <ListItem
                  title="Total Inventory Value"
                  subtitle={
                    <>
                      <div>
                        <strong>
                          Value:{" "}
                          {formatNumber(summaryData.total_inventory_value)}
                        </strong>
                      </div>
                      <div>Total Items: {summaryData.item_count || 0}</div>
                    </>
                  }
                />
                {listData.map((item) => (
                  <MobileStockValueCard
                    key={item.id}
                    item={item}
                    formatNumber={formatNumber}
                  />
                ))}
              </div>
            )}
          </ScrollContainer>
          {!isLoading && hasData && (
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
      )}
    </ContainerWrapper>
  );
};

export default StockValueReport;