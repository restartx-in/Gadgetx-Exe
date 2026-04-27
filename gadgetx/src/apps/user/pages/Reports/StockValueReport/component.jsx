import React, {
  useState,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";

import useStockValueReport from "@/apps/user/hooks/api/stockValueReport/useStockValueReport";
import useStockValueReportPaginated from "@/apps/user/hooks/api/stockValueReport/useStockValueReportPaginated";
import { useCategorys } from "@/apps/user/hooks/api/category/useCategorys";
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
import DownloadButton from "@/apps/user/components/DownloadButton";
import api from "@/utils/axios/api";
import { API_ENDPOINTS } from "@/config/api";
import buildQueryParams from "@/utils/buildQueryParams";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/context/ToastContext";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
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

const SORT_OPTIONS = [
  { value: "name", label: "Name A → Z" },
  { value: "-name", label: "Name Z → A" },
  { value: "sku", label: "SKU A → Z" },
  { value: "-sku", label: "SKU Z → A" },
  { value: "category", label: "Category A → Z" },
  { value: "-category", label: "Category Z → A" },
  { value: "stock_quantity", label: "Stock Qty ↑" },
  { value: "-stock_quantity", label: "Stock Qty ↓" },
  { value: "purchase_price", label: "Purchase Price ↑" },
  { value: "-purchase_price", label: "Purchase Price ↓" },
  { value: "total_value", label: "Total Value ↑" },
  { value: "-total_value", label: "Total Value ↓" },
];

const STOCK_STATUS_OPTIONS = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "negative_stock", label: "Negative Stock" },
  { value: "all", label: "All Items" },
];

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
  const showToast = useToast();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  // --- 1. Initialize state from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "name",
    search: searchParams.get("search") || "",
    category_id: searchParams.get("category_id") || "",
    min_qty: searchParams.get("min_qty") || "",
    max_qty: searchParams.get("max_qty") || "",
    min_stock_value: searchParams.get("min_stock_value") || "",
    max_stock_value: searchParams.get("max_stock_value") || "",
    stock_status: searchParams.get("stock_status") || "all",
  });

  // --- 2. Sync state with URL ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    search: state.search,
    category_id: state.category_id,
    min_qty: state.min_qty,
    max_qty: state.max_qty,
    min_stock_value: state.min_stock_value,
    max_stock_value: state.max_stock_value,
    stock_status: state.stock_status,
  });

  const summaryFilters = useMemo(
    () => ({
      search: state.search,
      category_id: state.category_id,
      min_qty: state.min_qty,
      max_qty: state.max_qty,
      min_stock_value: state.min_stock_value,
      max_stock_value: state.max_stock_value,
      stock_status: state.stock_status,
    }),
    [
      state.search,
      state.category_id,
      state.min_qty,
      state.max_qty,
      state.min_stock_value,
      state.max_stock_value,
      state.stock_status,
    ]
  );

  // API Hooks
  const {
    data: paginatedResult,
    isLoading,
    isFetching,
    refetch: refetchPaginated,
  } = useStockValueReportPaginated(state);

  const { data: summaryResult, refetch: refetchSummary } =
    useStockValueReport(summaryFilters);
  const { data: allSummaryResult, refetch: refetchAllSummary } =
    useStockValueReport({ stock_status: "all" });

  const { data: categories = [] } = useCategorys();

  // Derived Data (Memoized)
  const listData = useMemo(
    () => paginatedResult?.data || [],
    [paginatedResult]
  );
  const totalPages = paginatedResult?.page_count || 1;

  // Use item_count from summary for totalItems if available, otherwise fallback
  const totalItems = summaryResult?.item_count || 0;

  const summaryData = useMemo(() => summaryResult || {}, [summaryResult]);
  const allSummaryData = useMemo(() => allSummaryResult || {}, [allSummaryResult]);
  const hasData = listData.length > 0;

  // --- Handlers (Memoized & UPDATED setState CALLS) ---
  const handleRefresh = useCallback(() => {
    setState({ page: 1 }); // Simplified setState
    refetchPaginated();
    refetchSummary();
    refetchAllSummary();
  }, [refetchPaginated, refetchSummary, refetchAllSummary]);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }); // Simplified setState
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value }); // Simplified setState
  }, []);

  const handleSortChange = useCallback((e) => {
    setState({ sort: e.target.value, page: 1 });
  }, []);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setState({ [name]: value, page: 1 });
  }, []);

  const clearFilters = useCallback(() => {
    setState({
      search: "",
      category_id: "",
      min_qty: "",
      max_qty: "",
      min_stock_value: "",
      max_stock_value: "",
      stock_status: "all",
      sort: "name",
      page: 1,
    });
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === null || value === undefined) return "0.00";
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const subtitle = "Showing current stock value for all items";

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const query = buildQueryParams({
        ...state,
        page: 1,
        page_size: 100000,
      });

      const response = await api.get(
        `${API_ENDPOINTS.STOCK_VALUE_REPORT.PAGINATED}${query}`
      );

      const rows = response?.data?.data || [];
      if (!rows.length) {
        showToast({
          type: TOASTTYPE.GENARAL,
          status: TOASTSTATUS.WARNING,
          message: "No data available to download.",
        });
        return;
      }

      let printSettings = {};
      try {
        printSettings = JSON.parse(localStorage.getItem("PRINT_SETTINGS") || "{}");
      } catch (_e) {
        printSettings = {};
      }

      const companyName = printSettings.company_name || "My Company";
      const detailLines = [
        printSettings.address,
        printSettings.phone ? `Phone: ${printSettings.phone}` : "",
        printSettings.email ? `Email: ${printSettings.email}` : "",
        printSettings.tr_number ? `TRN: ${printSettings.tr_number}` : "",
      ].filter(Boolean);

      const doc = new jsPDF("p", "pt", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(companyName, centerX, 34, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let detailsY = 52;
      detailLines.forEach((line) => {
        doc.text(line, centerX, detailsY, { align: "center" });
        detailsY += 14;
      });

      doc.setDrawColor(200);
      doc.line(40, detailsY + 2, pageWidth - 40, detailsY + 2);

      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const time = now.toLocaleTimeString();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Stock Value Report", 40, detailsY + 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Exported: ${stamp} ${time}`, 40, detailsY + 40);

      const appliedFilters = [];
      if (state.search) appliedFilters.push(`Search: ${state.search}`);
      if (state.category_id) {
        const currentCategory = categories.find((c) => String(c.id) === String(state.category_id));
        appliedFilters.push(`Category: ${currentCategory?.name || state.category_id}`);
      }
      if (state.stock_status) appliedFilters.push(`Stock Status: ${state.stock_status}`);
      if (state.min_qty) appliedFilters.push(`Min Qty: ${state.min_qty}`);
      if (state.max_qty) appliedFilters.push(`Max Qty: ${state.max_qty}`);
      if (state.min_stock_value) appliedFilters.push(`Min Value: ${state.min_stock_value}`);
      if (state.max_stock_value) appliedFilters.push(`Max Value: ${state.max_stock_value}`);
      if (state.sort) appliedFilters.push(`Sort: ${state.sort}`);

      doc.text(
        `Filters: ${appliedFilters.length ? appliedFilters.join(" | ") : "None"}`,
        40,
        detailsY + 56,
        { maxWidth: pageWidth - 80 }
      );

      doc.text(
        `Total Value: ${formatNumber(summaryData.total_inventory_value)} | Filtered Items: ${summaryData.item_count || 0}`,
        40,
        detailsY + 72
      );

      autoTable(doc, {
        startY: detailsY + 86,
        head: [["SL", "Item Name", "SKU", "Category", "Stock Qty", "Purchase Price", "Total Value"]],
        body: rows.map((item, idx) => [
          idx + 1,
          item.name || "",
          item.sku || "",
          item.category_name || "",
          item.stock_quantity ?? 0,
          formatNumber(item.purchase_price),
          formatNumber(item.total_value),
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [35, 128, 123] },
        theme: "striped",
        margin: { left: 40, right: 40 },
      });

      doc.save(`stock-value-report-${stamp}.pdf`);

      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.SUCCESS,
        message: "PDF downloaded successfully.",
      });
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.ERROR,
        message: err?.response?.data?.error || "Failed to download report.",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [state, categories, formatNumber, summaryData.total_inventory_value, summaryData.item_count, showToast]);

  const filterBar = (
    <div className="stock-value-filter-bar">
      <input
        type="text"
        name="search"
        className="stock-value-input stock-value-search"
        placeholder="Search name / SKU..."
        value={state.search}
        onChange={handleFilterChange}
      />
      <select
        name="category_id"
        className="stock-value-select"
        value={state.category_id}
        onChange={handleFilterChange}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="stock_status"
        className="stock-value-select"
        value={state.stock_status}
        onChange={handleFilterChange}
      >
        {STOCK_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="min_qty"
        className="stock-value-input"
        placeholder="Min Qty"
        value={state.min_qty}
        onChange={handleFilterChange}
      />
      <input
        type="number"
        name="max_qty"
        className="stock-value-input"
        placeholder="Max Qty"
        value={state.max_qty}
        onChange={handleFilterChange}
      />
      <input
        type="number"
        name="min_stock_value"
        className="stock-value-input"
        placeholder="Min Value"
        value={state.min_stock_value}
        onChange={handleFilterChange}
      />
      <input
        type="number"
        name="max_stock_value"
        className="stock-value-input"
        placeholder="Max Value"
        value={state.max_stock_value}
        onChange={handleFilterChange}
      />
      <select
        className="stock-value-select"
        value={state.sort}
        onChange={handleSortChange}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="stock-value-clear-btn"
        onClick={clearFilters}
      >
        Clear
      </button>
    </div>
  );

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Stock Value Report"
            subtitle={subtitle}
          />
          <TableTopContainer
            //isMargin={true}
            mainActions={
              <>
                {filterBar}
                <div className="total-stock-value-box fs14 fw500">
                  <strong>All Stock Value:</strong>{" "}
                  {formatNumber(allSummaryData.total_inventory_value)}
                </div>
                <div className="total-stock-value-box fs14 fw500">
                  <strong>All-Time Item Count:</strong>{" "}
                  {allSummaryData.item_count || 0}
                </div>
                <div className="total-stock-value-box fs14 fw500">
                  <strong>Total Inventory Value:</strong>{" "}
                  {formatNumber(summaryData.total_inventory_value)}
                </div>
                <div className="total-stock-value-box fs14 fw500">
                  <strong>Filtered Item Count:</strong>{" "}
                  {summaryData.item_count || 0}
                </div>
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
                <DownloadButton
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  modalTitle="Download Stock Value Report"
                  modalBody="Download PDF with company header and current filters?"
                />
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
                {filterBar}
                <RefreshButton onClick={handleRefresh} isLoading={isFetching} />
                <DownloadButton
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  modalTitle="Download Stock Value Report"
                  modalBody="Download PDF with company header and current filters?"
                />
              </HStack>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : !hasData ? (
              <TableCaption item="Stock Value Report" />
            ) : (
              <div>
                <ListItem
                  title="All Stock Summary"
                  subtitle={
                    <>
                      <div>
                        <strong>
                          Value: {formatNumber(allSummaryData.total_inventory_value)}
                        </strong>
                      </div>
                      <div>Total Items: {allSummaryData.item_count || 0}</div>
                    </>
                  }
                />
                <ListItem
                  title="Filtered Inventory Value"
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
