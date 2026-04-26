import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"; 
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useJobSheetsPaginated from "@/hooks/api/jobSheets/useJobSheetsPaginated";
import useDeleteJobSheet from "@/hooks/api/jobSheets/useDeleteJobSheet";
import useEmployees from "@/hooks/api/employee/useEmployees";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import JobSheet from "@/apps/user/pages/Transactions/JobSheet";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import PopUpFilter from "@/components/PopUpFilter";
import Loader from "@/components/Loader";
import RangeField from "@/components/RangeField";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdNumeric,
  TdSL,
  ThSL,
  TdDate,
  ThMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  ThDotMenu,
} from "@/components/Table";
import HStack from "@/components/HStack";
import AddButton from "@/components/AddButton";
import DateField from "@/components/DateField";
import Select from "@/components/Select";
import InputField from "@/components/InputField";
import VStack from "@/components/VStack";
import TableFooter from "@/components/TableFooter";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import DateFilter from "@/components/DateFilter";
import TableTopContainer from "@/components/TableTopContainer";
import DotMenu from "@/components/DotMenu";
import { getJobSheetMenuItems } from "@/config/menuItems";
import JobSheetInvoiceModal from "@/apps/user/components/JobSheetInvoiceModal";
import StatusButton from "@/components/StatusButton";
import ExportMenu from "@/components/ExportMenu";
import TextBadge from "@/apps/user/components/TextBadge";
import { format, isValid } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import { useJobSheetById } from "@/hooks/api/jobSheets/useJobSheetById";
import JobSheetPDF from "@/apps/user/components/JobSheetPDF";
import { API_FILES as server } from "@/config/api";
import { useJobSheetExportAndPrint } from "@/hooks/api/exportAndPrint/useJobSheetExportAndPrint";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

const generateBarcodeImage = (invoiceNumber) => {
  if (!invoiceNumber) return null;
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, invoiceNumber, {
      format: "CODE128",
      width: 2,
      height: 70,
      displayValue: true,
      fontSize: 14,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to generate barcode:", error);
    return null;
  }
};

const StatusFilter = React.memo(({ status, handleStatusFilterClick, isMobile }) => (
  <HStack
    justifyContent="flex-start"
    className="jobsheet_report-status_filters"
  >
    {!isMobile && (
      <StatusButton
        variant="all"
        isSelected={status === ""}
        onClick={() => handleStatusFilterClick("")}
      >
        All
      </StatusButton>
    )}
    <StatusButton
      variant="maintenance"
      isSelected={status === "Pending"}
      onClick={() => handleStatusFilterClick("Pending")}
    >
      Pending
    </StatusButton>
    <StatusButton
      variant="maintenance"
      isSelected={status === "In Progress"}
      onClick={() => handleStatusFilterClick("In Progress")}
    >
      In Progress
    </StatusButton>
    <StatusButton
      variant="available"
      isSelected={status === "Completed"}
      onClick={() => handleStatusFilterClick("Completed")}
    >
      Completed
    </StatusButton>
    <StatusButton
      variant="sold"
      isSelected={status === "Cancelled"}
      onClick={() => handleStatusFilterClick("Cancelled")}
    >
      Cancelled
    </StatusButton>
  </HStack>
));

// Extracted Row Component using React.memo
const JobSheetRow = React.memo(({
  js,
  index,
  page,
  pageSize,
  handlers,
}) => {
  const charges = parseFloat(js.service_charges) || 0;
  const cost = parseFloat(js.service_cost) || 0;
  const profit = charges - cost;

  return (
    <Tr key={js.job_id}>
      <TdSL
        index={index}
        page={page}
        pageSize={pageSize}
      />
      <TdDate>{js.created_at}</TdDate>
      <Td>{js.party_name}</Td>
      <Td>{js.invoice_number}</Td>
      <Td>{js.item_name}</Td>
      <Td>{js.servicer_name || "-"}</Td>
      <Td>{js.done_by_name || "N/A"}</Td>
      <Td>{js.cost_center_name || "N/A"}</Td>
      <Td>
        <TextBadge
          variant="jobSheetStatus"
          type={js.status}
        >
          {js.status}
        </TextBadge>
      </Td>
      <TdNumeric>{charges}</TdNumeric>
      <TdNumeric>{cost}</TdNumeric>
      {js.status === "Completed" ? (
        <TdNumeric>{profit.toFixed(2)}</TdNumeric>
      ) : (
        <Td />
      )}
      <Td>{js.bar_code}</Td>
      <Td>
        <DotMenu
          items={getJobSheetMenuItems(js, handlers)}
        />
      </Td>
    </Tr>
  );
});


const JobSheetReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);

  // Filter States (Sidebar/Local) - Remain useState for local UI binding
  const [status, setStatus] = useState("");
  const [partyName, setCustomerName] = useState("");
  const [servicerName, setServicerName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minCharges, setMinCharges] = useState("");
  const [maxCharges, setMaxCharges] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter);

  // Header Filter States (Header Popover/Local) - Remain useState for local UI binding
  const [headerStatus, setHeaderStatus] = useState("");
  const [headerFilters, setHeaderFilters] = useState({
    party_name: "",
    item_name: "",
    servicer_name: "",
    service_charges: "",
    service_cost: "",
    done_by_id: "",
    cost_center_id: "",
    invoice_number: "",
    bar_code: "",
  });

  const [filterDatas, setFilterDatas] = useState({});

  // Search/Sort Local States (for UI bindings) - Remain useState for local UI binding
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    rangeType: "custom",
  });

  // Modal/CRUD State
  const [selectedJobSheet, setSelectedJobSheet] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenJobSheetModal, setIsOpenJobSheetModal] = useState(false);
  const [isOpenInvoiceModal, setIsOpenInvoiceModal] = useState(false);
  const [jobSheetIdToFetch, setJobSheetIdToFetch] = useState(null);
  const [actionAfterFetch, setActionAfterFetch] = useState(null);

  // --- Centralized State initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    status: searchParams.get("status") || "",
    party_name: searchParams.get("partyName") || "",
    item_name: searchParams.get("itemName") || "",
    servicer_name: searchParams.get("servicerName") || "",
    service_charges: searchParams.get("serviceCharges") || "",
    service_cost: searchParams.get("serviceCost") || "",
    min_charges: searchParams.get("minCharges") || "",
    max_charges: searchParams.get("maxCharges") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    bar_code: searchParams.get("barCode") || "",
    invoice_number: searchParams.get("invoiceNumber") || "",
  });

  // ADDED: Sync state to URL
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    status: state.status,
    partyName: state.party_name,
    itemName: state.item_name,
    servicerName: state.servicer_name,
    serviceCharges: state.service_charges,
    serviceCost: state.service_cost,
    minCharges: state.min_charges,
    maxCharges: state.max_charges,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
    barCode: state.bar_code,
    invoiceNumber: state.invoice_number,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  // API Calls
  const { data, isLoading, refetch, isRefetching } =
    useJobSheetsPaginated(state);
  const { mutateAsync: deleteJobSheet } = useDeleteJobSheet();
  const { data: employeesData = [] } = useEmployees();

  // Derived Data (Matching ExpenseReport pattern)
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching;
  
  const totalData = useMemo(() => ({
    totalCharges: data?.total_charges || 0,
    totalCost: data?.total_cost || 0,
    totalProfit: (data?.total_charges || 0) - (data?.total_cost || 0),
  }), [data]);

  const {
    data: jobSheetDetails,
    isSuccess: isDetailsSuccess,
    isError: isDetailsError,
  } = useJobSheetById(jobSheetIdToFetch, {
    enabled: !!jobSheetIdToFetch && actionAfterFetch === "downloadPdf",
  });

  // Options Memoization - use useMemo
  const statusOptions = useMemo(() => ([
    { value: "", label: "All Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ]), []);

  const employeeOptions = useMemo(() => ([
    { value: "", label: "All Servicers" },
    ...(employeesData || []).map((emp) => ({ value: emp.name, label: emp.name })),
  ]), [employeesData]);


  // ADDED: Sync local states from URL state
  useEffect(() => {
    // Sync Sidebar Filter States (Local UI)
    setStatus(state.status || "");
    setCustomerName(state.party_name || "");
    setServicerName(state.servicer_name || "");
    setMinCharges(state.min_charges || "");
    setMaxCharges(state.max_charges || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);

    // Sync Sort/Search (Local UI)
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");

    // Sync Header Filter State (Local UI for InputFields/Selects)
    setHeaderFilters((prev) => ({
      ...prev,
      party_name: state.party_name || "",
      item_name: state.item_name || "",
      servicer_name: state.servicer_name || "",
      service_charges: state.service_charges || "",
      service_cost: state.service_cost || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || defaltCostCenter,
      bar_code: state.bar_code || "",
      invoice_number: state.invoice_number || "",
    }));
    setHeaderStatus(state.status || "");

    // Sync Date Filter UI
    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: 'custom',
    });
  }, [state, defaltCostCenter]);


  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Update filterDatas for export (use local states which are synced from URL state)
  useEffect(() => {
    setFilterDatas({
      status,
      partyName,
      servicerName,
      minCharges,
      maxCharges,
      startDate,
      endDate,
      doneById,
      costCenterId,
      ...headerFilters, // Include header filters too, as they are part of the state
    });
  }, [
    status,
    partyName,
    servicerName,
    minCharges,
    maxCharges,
    startDate,
    endDate,
    doneById,
    costCenterId,
    headerFilters,
  ]);

  // --- EXPORT CONFIGURATION START ---
  const { exportToExcel, exportToPdf, printDocument } =
    useJobSheetExportAndPrint({
      listData: listData,
      reportType: "Job Sheet Report",
      duration: state.start_date && state.end_date ? `${state.start_date} to ${state.end_date}` : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData,
      filterDatas,
      searchType: state.searchType,
      searchKey: state.searchKey,
    });
  // --- EXPORT CONFIGURATION END ---

  // --- PDF DOWNLOAD LOGIC ---
  useEffect(() => {
    const handlePdfDownload = async () => {
      if (
        !isDetailsSuccess ||
        !jobSheetDetails ||
        actionAfterFetch !== "downloadPdf"
      )
        return;

      try {
        const printSettingsString =
          localStorage.getItem("PRINT_SETTINGS") || "{}";
        const printSettings = JSON.parse(printSettingsString);
        const storeDetails = {
          company_name: printSettings.company_name || "Your Company",
          address: printSettings.address || "Your Address",
          email: printSettings.email,
          phone: printSettings.phone,
          full_header_image_url: printSettings.header_image_url
            ? `${server}${printSettings.header_image_url}`
            : null,
        };

        const formattedData = { ...jobSheetDetails, store: storeDetails };
        const barcodeImage = generateBarcodeImage(
          jobSheetDetails.invoice_number
        );

        const blob = await pdf(
          <JobSheetPDF
            jobSheetData={formattedData}
            barcodeImage={barcodeImage}
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `JobSheet-${jobSheetDetails.invoice_number || jobSheetDetails.job_id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error generating PDF:", error);
        showToast({ message: "Failed to generate PDF.", crudType: "error" });
      } finally {
        setJobSheetIdToFetch(null);
        setActionAfterFetch(null);
      }
    };
    handlePdfDownload();

    if (isDetailsError) {
      showToast({
        message: "Failed to fetch job sheet details.",
        crudType: "error",
      });
      setJobSheetIdToFetch(null);
      setActionAfterFetch(null);
    }
  }, [
    isDetailsSuccess,
    isDetailsError,
    jobSheetDetails,
    actionAfterFetch,
    showToast,
  ]);
  // --- END PDF DOWNLOAD LOGIC ---

  // --- MEMOIZED HANDLERS (useCallback) - UPDATED setState CALLS ---

  const handleSort = useCallback((value) => {
    setState({ page: 1, sort: value }); // Simplified setState
  }, []);

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState({ // Simplified setState
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleStatusFilterClick = useCallback((newStatus) => {
    setState({ status: newStatus, page: 1 }); // Simplified setState
  }, []);

  const handleSearch = useCallback(() => {
    // Clear all specific filters when using global search
    setState({ // Simplified setState
      page: 1,
      searchType,
      searchKey,
      // Clear sidebar range filters
      min_charges: "",
      max_charges: "",
      // Clear header specific filters (exact match filters)
      service_charges: "",
      service_cost: "",
      party_name: "",
      item_name: "",
      servicer_name: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      bar_code: "",
      invoice_number: "",
      status: "", 
      start_date: "",
      end_date: "",
    });
  }, [searchType, searchKey, defaltCostCenter]);

  const handleHeaderSearch = useCallback((key, value) => {
    // Clear min/max range if searching for an exact amount/charge
    setState({ // Simplified setState
      [key]: value,
      ...(key === "service_charges" && { min_charges: "", max_charges: "" }),
      page: 1,
      // Clear global search/type
      searchType: "",
      searchKey: "",
    });
  }, []);

  const handleHeaderKeyDown = useCallback((e, key) => {
    if (e.key === "Enter") {
      handleHeaderSearch(key, headerFilters[key]);
    }
  }, [headerFilters, handleHeaderSearch]);


  const handleFilter = useCallback(() => {
    // This function updates the main state based on sidebar filter states
    setState({ // Simplified setState
      page: 1,
      status,
      party_name: partyName,
      servicer_name: servicerName,
      min_charges: minCharges,
      max_charges: maxCharges,
      start_date: startDate,
      end_date: endDate,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      // Clear search keys when applying filter
      searchType: "",
      searchKey: "",
      // Clear exact amount filter when applying range filter
      service_charges: "",
      service_cost: "",
      invoice_number: "",
      bar_code: "",
      item_name: "",
    });
    setShowFilter(false);
  }, [status, partyName, servicerName, minCharges, maxCharges, startDate, endDate, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    // Reset local filter states (UI visibility)
    setStatus("");
    setCustomerName("");
    setServicerName("");
    setStartDate("");
    setEndDate("");
    setMinCharges("");
    setMaxCharges("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId(defaltCostCenter);

    // Reset header filter states (UI visibility)
    setSearchKey("");
    setSearchType("");
    setSort("");
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setHeaderFilters({
      party_name: "",
      item_name: "",
      servicer_name: "",
      service_charges: "",
      service_cost: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      bar_code: "",
      invoice_number: "",
    });
    setHeaderStatus("");

    // Reset main state to clear URL and trigger refetch
    setState({ // Simplified setState
      page: 1,
      page_size: 10,
      status: "",
      party_name: "",
      item_name: "",
      servicer_name: "",
      service_charges: "",
      service_cost: "",
      min_charges: "",
      max_charges: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
      bar_code: "",
      invoice_number: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }); // Simplified setState
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value }); // Simplified setState
  }, []);

  const handleAddClick = useCallback(() => {
    setMode("add");
    setSelectedJobSheet(null);
    setIsOpenJobSheetModal(true);
  }, []);

  const handleEditClick = useCallback((jobsheet) => {
    setSelectedJobSheet(jobsheet);
    setMode("edit");
    setIsOpenJobSheetModal(true);
  }, []);

  const handleViewClick = useCallback((jobsheet) => {
    setSelectedJobSheet(jobsheet);
    setMode("view");
    setIsOpenJobSheetModal(true);
  }, []);

  const handlePrintClick = useCallback((jobsheet) => {
    setSelectedJobSheet(jobsheet);
    setIsOpenInvoiceModal(true);
  }, []);

  const handleDownloadPdfClick = useCallback((jobSheetId) => {
    setActionAfterFetch("downloadPdf");
    setJobSheetIdToFetch(jobSheetId);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteJobSheet(id);
      showToast({
        crudItem: CRUDITEM.JOBSHEET,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      refetch();
    } catch (error) {
      showToast({
        type: "GENARAL",
        message:
          error.response?.data?.error || "Failed to delete the jobsheet.",
        status: "ERROR",
      });
    }
  }, [deleteJobSheet, refetch, showToast]);

  const searchOptions = useMemo(() => ([
    { value: "party_name", name: "Customer" },
    { value: "invoice_number", name: "Invoice No" },
    { value: "item_name", name: "Item Name" },
    { value: "servicer_name", name: "Servicer" },
    { value: "issue_reported", name: "Issue Reported" },
    { value: "status", name: "Status" },
    { value: "bar_code", name: "Bar Code" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ]), [isDisableCostCenter]);
  // --- END MEMOIZED HANDLERS ---

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    status,
    setStatus,
    partyName,
    setCustomerName,
    servicerName,
    setServicerName,
    employeeOptions,
    minCharges,
    setMinCharges,
    maxCharges,
    setMaxCharges,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusOptions,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
  };

  const handlers = useMemo(() => ({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onDownloadPdf: handleDownloadPdfClick,
    onPrint: handlePrintClick,
  }), [handleViewClick, handleEditClick, handleDelete, handleDownloadPdfClick, handlePrintClick]);


  const { startDate: dfStartDate, endDate: dfEndDate } = dateFilter;
  const isDateFilterActive =
    dfStartDate &&
    dfEndDate &&
    isValid(new Date(dfStartDate)) &&
    isValid(new Date(dfEndDate));

  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(dfStartDate), "MMM d, yyyy")} → ${format(
        new Date(dfEndDate),
        "MMM d, yyyy"
      )}`
    : null;

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Job Sheets"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              isMargin={true}
              summary={
                <>
                  <StatusFilter
                    status={state.status}
                    handleStatusFilterClick={handleStatusFilterClick}
                  />
                </>
              }
              mainActions={
                <>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />

                  {!loading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )}
                  <PopupSearchField
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                  <AddButton onClick={handleAddClick}>Add Job Sheet</AddButton>
                </>
              }
            />

            {loading ? (
              <Loader />
            ) : (
              <>
                <Table>
                  <Thead>
                    <Tr>
                      <ThSL />
                      <Th>
                        <ThContainer>
                          Date
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="created_at"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Customer
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="party_name"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "party_name",
                                  headerFilters.party_name
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Customer"
                                value={headerFilters.party_name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    party_name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "party_name")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Invoice No
                          <ThSearchOrFilterPopover
                            isSearch={true}
                            popoverWidth={220}
                            onSearch={() =>
                              handleHeaderSearch(
                                "invoice_number",
                                headerFilters.invoice_number
                              )
                            }
                          >
                            <InputField
                              placeholder="Search Invoice No"
                              value={headerFilters.invoice_number}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  invoice_number: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "invoice_number")
                              }
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Item Name
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="item_name"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "item_name",
                                  headerFilters.item_name
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Item"
                                value={headerFilters.item_name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    item_name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "item_name")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Servicer
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="servicer_name"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "servicer_name",
                                  headerFilters.servicer_name
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Servicer"
                                value={headerFilters.servicer_name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    servicer_name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "servicer_name")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Done By
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="done_by"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={false}
                              popoverWidth={220}
                            >
                              <DoneByAutoComplete
                                placeholder="Select Done By"
                                value={state.done_by_id}
                                onChange={(e) =>
                                  handleHeaderSearch(
                                    "done_by_id",
                                    e.target.value
                                  )
                                }
                                is_edit={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Cost Center
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="cost_center"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={false}
                              popoverWidth={220}
                            >
                              <CostCenterAutoComplete
                                placeholder="Select Cost Center"
                                value={state.cost_center_id}
                                onChange={(e) =>
                                  handleHeaderSearch(
                                    "cost_center_id",
                                    e.target.value
                                  )
                                }
                                is_edit={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Status
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="status"
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <Select
                                name="header_status_filter"
                                value={headerStatus} // Use local header status for UI
                                onChange={(e) =>
                                  handleHeaderSearch("status", e.target.value)
                                }
                                options={statusOptions}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Charges
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="service_charges"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "service_charges",
                                  headerFilters.service_charges
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Exact Charges"
                                type="number"
                                value={headerFilters.service_charges}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    service_charges: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "service_charges")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Cost
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="service_cost"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "service_cost",
                                  headerFilters.service_cost
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Exact Cost"
                                type="number"
                                value={headerFilters.service_cost}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    service_cost: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "service_cost")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>Profit</Th>
                      <Th>
                        <ThContainer>
                          Bar Code
                          <ThSearchOrFilterPopover
                            isSearch={true}
                            popoverWidth={220}
                            onSearch={() =>
                              handleHeaderSearch(
                                "bar_code",
                                headerFilters.bar_code
                              )
                            }
                          >
                            <InputField
                              placeholder="Search Bar Code"
                              value={headerFilters.bar_code}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  bar_code: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "bar_code")
                              }
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThContainer>
                      </Th>
                      <ThDotMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((js, index) => (
                        <JobSheetRow
                          key={js.job_id}
                          js={js}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={handlers}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.JobSheet} noOfCol={13} />
                    )}
                  </Tbody>
                </Table>
              </>
            )}
            {!loading && listData.length > 0 && (
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
        ) : (
          <>
            <PageTitleWithBackButton title="Job Sheets" />
            <ScrollContainer>
              <PageHeader className="jobsheet_report_header">
                <HStack justifyContent="flex-end" style={{ width: "100%" }}>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />

                  <MobileSearchField
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                </HStack>
                <div className="jobsheet_report__add_button">
                  <AddButton onClick={handleAddClick}>Add Job Sheet</AddButton>
                </div>
              </PageHeader>

              <StatusFilter
                isMobile={isMobile}
                status={state.status}
                handleStatusFilterClick={handleStatusFilterClick}
              />
              {loading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.JobSheet} />
              ) : (
                <div>
                  {listData.map((js) => {
                    const charges = parseFloat(js.service_charges) || 0;
                    const cost = parseFloat(js.service_cost) || 0;
                    const profit = charges - cost;
                    return (
                      <ListItem
                        key={js.job_id}
                        title={js.item_name}
                        subtitle={
                          <>
                            <div>Customer: {js.party_name}</div>
                            <div>Servicer: {js.servicer_name || "N/A"}</div>

                            <div>
                              {new Date(js.created_at).toLocaleDateString(
                                "en-IN"
                              )}
                            </div>
                          </>
                        }
                        amount={
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: "bold" }}>
                              Charges: {charges}
                            </div>
                            <div className="fs14 text-danger">Cost: {cost}</div>
                            <div className="fs14 text-success">
                              {js.status === "Completed" ? `Profit: ${profit.toFixed(2)}` : 'Profit: -'}
                            </div>
                          </div>
                        }
                        onView={() => handleViewClick(js)}
                        onEdit={() => handleEditClick(js)}
                        onDelete={() => handleDelete(js.job_id)}
                        onDownloadPdf={() => handleDownloadPdfClick(js.job_id)}
                        onPrint={() => handlePrintClick(js)}
                      />
                    );
                  })}
                </div>
              )}
              <Spacer />
              {!loading && listData.length > 0 && (
                <TableFooter
                  totalItems={totalItems}
                  currentPage={state.page}
                  itemsPerPage={state.page_size}
                  totalPages={totalPages}
                  handlePageLimitSelect={handlePageLimitSelect}
                  handlePageChange={handlePageChange}
                />
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>
      {isOpenInvoiceModal && (
        <JobSheetInvoiceModal
          isOpen={isOpenInvoiceModal}
          onClose={() => setIsOpenInvoiceModal(false)}
          invoiceData={selectedJobSheet}
        />
      )}
      <JobSheet
        isOpen={isOpenJobSheetModal}
        onClose={() => setIsOpenJobSheetModal(false)}
        mode={mode}
        selectedJobSheet={selectedJobSheet}
        onSuccess={refetch}
      />
    </>
  );
};

// ADDED: ListFilter component using React.memo and spread props
const ListFilter = React.memo(({ ...props }) => {
  const {
    showFilter,
    setShowFilter,
    handleFilter,
    status,
    setStatus,
    partyName,
    setCustomerName,
    servicerName,
    setServicerName,
    employeeOptions,
    minCharges,
    setMinCharges,
    maxCharges,
    setMaxCharges,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    statusOptions,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter,
  } = props;
  
  const isMobile = useIsMobile();
  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack>
        <Select
          label="Status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={statusOptions}
        />
        <InputField
          label="Customer Name"
          placeholder="Customer Name"
          name="party_name"
          value={partyName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <Select
          label="Servicer"
          name="servicer_name"
          value={servicerName}
          onChange={(e) => setServicerName(e.target.value)}
          options={employeeOptions}
        />
        <DoneByAutoComplete
          placeholder="Done By"
          value={doneById}
          onChange={(e) => setDoneById(e.target.value)}
          name="done_by_id"
          is_edit={false}
        />
        <CostCenterAutoComplete
          placeholder="Cost Center"
          value={costCenterId}
          onChange={(e) => setCostCenterId(e.target.value)}
          name="cost_center_id"
          is_edit={false}
          disabled={disableCostCenter}
        />
        <RangeField
          label="Service Charges"
          minValue={minCharges}
          maxValue={maxCharges}
          onMinChange={(value) => setMinCharges(value)}
          onMaxChange={(value) => setMaxCharges(value)}
        />
        {isMobile ? (
          <>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split("T")[0] : "")
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split("T")[0] : "")
              }
            />
          </>
        ) : (
          <HStack justifyContent="flex-start">
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split("T")[0] : "")
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split("T")[0] : "")
              }
            />
          </HStack>
        )}
      </VStack>
    </PopUpFilter>
  );
});

export default JobSheetReport;