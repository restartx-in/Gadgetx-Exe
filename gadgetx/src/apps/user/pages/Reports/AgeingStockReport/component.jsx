import React, {
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";

import useAgeingStockReport from "@/apps/user/hooks/api/ageingStockReport/useAgeingStockReport";
import useAgeingStockReportPaginated from "@/apps/user/hooks/api/ageingStockReport/useAgeingStockReportPaginated";
import { useCategorys } from "@/apps/user/hooks/api/category/useCategorys";
import { useBrands } from "@/apps/user/hooks/api/brand/useBrands";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import TitleContainer from "@/components/TitleContainer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import ListItem from "@/components/ListItem/component";
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

const stateReducer = (state, newState) => ({ ...state, ...newState });

const THRESHOLD_OPTIONS = [
  { value: 30,  label: "Older than 30 days" },
  { value: 90,  label: "Older than 90 days" },
  { value: 180, label: "Older than 6 months" },
  { value: 365, label: "Older than 1 year" },
  { value: 730, label: "Older than 2 years" },
];

const SORT_OPTIONS = [
  { value: "-ageing_days",    label: "Days Old ↓ (default)" },
  { value: "ageing_days",     label: "Days Old ↑" },
  { value: "-total_value",    label: "Total Value ↓" },
  { value: "total_value",     label: "Total Value ↑" },
  { value: "-stock_quantity", label: "Stock Qty ↓" },
  { value: "stock_quantity",  label: "Stock Qty ↑" },
  { value: "-purchase_price", label: "Purchase Price ↓" },
  { value: "purchase_price",  label: "Purchase Price ↑" },
  { value: "name",            label: "Name A → Z" },
  { value: "-name",           label: "Name Z → A" },
  { value: "category",        label: "Category A → Z" },
  { value: "brand",           label: "Brand A → Z" },
];

// Clickable sortable column header
const SortableTh = React.memo(({ label, col, currentSort, onSort }) => {
  const isDesc = currentSort === `-${col}`;
  const isAsc  = currentSort === col;
  return (
    <Th
      onClick={() => onSort(col)}
      style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
    >
      {label}{isDesc ? " ↓" : isAsc ? " ↑" : " ↕"}
    </Th>
  );
});

const AgeingStockRow = React.memo(({ item, index, page, pageSize, formatNumber }) => (
  <Tr>
    <TdSL index={index} page={page} pageSize={pageSize} />
    <Td>{item.name}</Td>
    <Td>{item.sku || "—"}</Td>
    <Td>{item.category_name || "—"}</Td>
    <Td>{item.brand_name || "—"}</Td>
    <Td>{item.stock_quantity}</Td>
    <Td>{formatNumber(item.purchase_price)}</Td>
    <Td>{formatNumber(item.total_value)}</Td>
    <Td>{item.last_purchase_date ? new Date(item.last_purchase_date).toLocaleDateString() : "—"}</Td>
    <Td>{item.ageing_days} days</Td>
  </Tr>
));

const MobileAgeingStockCard = React.memo(({ item, formatNumber }) => (
  <ListItem
    title={item.name}
    subtitle={
      <>
        <div><strong>{item.ageing_days} days old</strong></div>
        <div><strong>Total Value: {formatNumber(item.total_value)}</strong></div>
        <div>SKU: {item.sku || "—"}</div>
        <div>Qty: {item.stock_quantity} @ {formatNumber(item.purchase_price)}</div>
        <div>Category: {item.category_name || "—"} | Brand: {item.brand_name || "—"}</div>
        <div>
          Last Purchase:{" "}
          {item.last_purchase_date
            ? new Date(item.last_purchase_date).toLocaleDateString()
            : "—"}
        </div>
      </>
    }
  />
));

const AgeingStockReport = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const [state, setState] = useReducer(stateReducer, {
    page:            parseInt(searchParams.get("page")) || 1,
    page_size:       parseInt(searchParams.get("pageSize")) || 10,
    min_days:        parseInt(searchParams.get("min_days")) || 365,
    search:          searchParams.get("search") || "",
    category_id:     searchParams.get("category_id") || "",
    brand_id:        searchParams.get("brand_id") || "",
    min_qty:         searchParams.get("min_qty") || "",
    max_qty:         searchParams.get("max_qty") || "",
    min_stock_value: searchParams.get("min_stock_value") || "",
    max_stock_value: searchParams.get("max_stock_value") || "",
    sort:            searchParams.get("sort") || "-ageing_days",
  });

  useSyncURLParams({
    page:            state.page,
    pageSize:        state.page_size,
    min_days:        state.min_days,
    search:          state.search,
    category_id:     state.category_id,
    brand_id:        state.brand_id,
    min_qty:         state.min_qty,
    max_qty:         state.max_qty,
    min_stock_value: state.min_stock_value,
    max_stock_value: state.max_stock_value,
    sort:            state.sort,
  });

  // Summary excludes page/sort so totals reflect current filters only
  const summaryFilters = useMemo(() => ({
    min_days:        state.min_days,
    search:          state.search,
    category_id:     state.category_id,
    brand_id:        state.brand_id,
    min_qty:         state.min_qty,
    max_qty:         state.max_qty,
    min_stock_value: state.min_stock_value,
    max_stock_value: state.max_stock_value,
  }), [
    state.min_days, state.search, state.category_id, state.brand_id,
    state.min_qty, state.max_qty, state.min_stock_value, state.max_stock_value,
  ]);

  const {
    data: paginatedResult,
    isLoading,
    isFetching,
    refetch: refetchPaginated,
  } = useAgeingStockReportPaginated(state);

  const { data: summaryResult, refetch: refetchSummary } =
    useAgeingStockReport(summaryFilters);

  const { data: categories = [] } = useCategorys();
  const { data: brands = [] }     = useBrands();

  const listData   = useMemo(() => paginatedResult?.data || [], [paginatedResult]);
  const totalPages = paginatedResult?.page_count || 1;
  const totalItems = summaryResult?.total_items || 0;
  const summaryData = useMemo(() => summaryResult || {}, [summaryResult]);
  const hasData = listData.length > 0;

  const handleRefresh = useCallback(() => {
    setState({ page: 1 });
    refetchPaginated();
    refetchSummary();
  }, [refetchPaginated, refetchSummary]);

  const handlePageLimitSelect = useCallback((v) => setState({ page_size: v, page: 1 }), []);
  const handlePageChange      = useCallback((v) => setState({ page: v }), []);

  const handleThresholdChange = useCallback((e) => {
    setState({ min_days: parseInt(e.target.value, 10), page: 1 });
  }, []);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setState({ [name]: value, page: 1 });
  }, []);

  // Click column header → toggle ASC/DESC; default to DESC on first click
  const handleSortToggle = useCallback((col) => {
    const next = state.sort === `-${col}` ? col : `-${col}`;
    setState({ sort: next, page: 1 });
  }, [state.sort]);

  const formatNumber = useCallback((value) => {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const currentLabel =
    THRESHOLD_OPTIONS.find((o) => o.value === state.min_days)?.label ||
    `Older than ${state.min_days} days`;

  // ─── Shared filter bar (desktop + mobile) ─────────────────────────────────
  const filterBar = (
    <div className="ageing-stock-filter-bar">
      {/* Row 1: text search, age, category, brand, sort */}
      <div className="ageing-stock-filter-row">
        <input
          type="text"
          name="search"
          className="ageing-stock-input ageing-stock-search"
          placeholder="Search name / SKU…"
          value={state.search}
          onChange={handleFilterChange}
        />
        <select
          className="ageing-stock-select"
          value={state.min_days}
          onChange={handleThresholdChange}
        >
          {THRESHOLD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          name="category_id"
          className="ageing-stock-select"
          value={state.category_id}
          onChange={handleFilterChange}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          name="brand_id"
          className="ageing-stock-select"
          value={state.brand_id}
          onChange={handleFilterChange}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          name="sort"
          className="ageing-stock-select"
          value={state.sort}
          onChange={handleFilterChange}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Row 2: qty range, value range, totals, refresh */}
      <div className="ageing-stock-filter-row">
        <input
          type="number" min="0" name="min_qty"
          className="ageing-stock-input"
          placeholder="Min qty"
          value={state.min_qty}
          onChange={handleFilterChange}
        />
        <input
          type="number" min="0" name="max_qty"
          className="ageing-stock-input"
          placeholder="Max qty"
          value={state.max_qty}
          onChange={handleFilterChange}
        />
        <input
          type="number" min="0" step="0.01" name="min_stock_value"
          className="ageing-stock-input"
          placeholder="Min value"
          value={state.min_stock_value}
          onChange={handleFilterChange}
        />
        <input
          type="number" min="0" step="0.01" name="max_stock_value"
          className="ageing-stock-input"
          placeholder="Max value"
          value={state.max_stock_value}
          onChange={handleFilterChange}
        />
        <div className="ageing-stock-summary-box fs14 fw500">
          <strong>Items:</strong> {summaryData.total_items || 0}
        </div>
        <div className="ageing-stock-summary-box fs14 fw500">
          <strong>Total Value:</strong> {formatNumber(summaryData.total_stock_value)}
        </div>
        <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
      </div>
    </div>
  );

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Ageing Stock Report"
            subtitle={currentLabel}
          />
          <TableTopContainer mainActions={filterBar} />

          {isLoading ? (
            <Loader />
          ) : (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <SortableTh label="Item Name"      col="name"           currentSort={state.sort} onSort={handleSortToggle} />
                    <Th>SKU</Th>
                    <SortableTh label="Category"       col="category"       currentSort={state.sort} onSort={handleSortToggle} />
                    <SortableTh label="Brand"          col="brand"          currentSort={state.sort} onSort={handleSortToggle} />
                    <SortableTh label="Stock Qty"      col="stock_quantity" currentSort={state.sort} onSort={handleSortToggle} />
                    <SortableTh label="Purchase Price" col="purchase_price" currentSort={state.sort} onSort={handleSortToggle} />
                    <SortableTh label="Total Value"    col="total_value"    currentSort={state.sort} onSort={handleSortToggle} />
                    <Th>Last Purchase</Th>
                    <SortableTh label="Days Old"       col="ageing_days"    currentSort={state.sort} onSort={handleSortToggle} />
                  </Tr>
                </Thead>
                <Tbody>
                  {hasData ? (
                    listData.map((item, index) => (
                      <AgeingStockRow
                        key={item.id}
                        item={item}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        formatNumber={formatNumber}
                      />
                    ))
                  ) : (
                    <TableCaption item="Ageing Stock" noOfCol={10} />
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
            <PageTitleWithBackButton title="Ageing Stock Report" />
          </TitleContainer>
          <ScrollContainer>
            <PageHeader>{filterBar}</PageHeader>
            {isLoading ? (
              <Loader />
            ) : !hasData ? (
              <TableCaption item="Ageing Stock" />
            ) : (
              <div>
                <ListItem
                  title="Ageing Stock Summary"
                  subtitle={
                    <>
                      <div><strong>Items: {summaryData.total_items || 0}</strong></div>
                      <div>Total Value: {formatNumber(summaryData.total_stock_value)}</div>
                    </>
                  }
                />
                {listData.map((item) => (
                  <MobileAgeingStockCard
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

export default AgeingStockReport;
