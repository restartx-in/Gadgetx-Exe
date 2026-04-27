import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useJobSheetsPaginated from "@/apps/user/hooks/api/jobSheets/useJobSheetsPaginated";
import useDeleteJobSheet from "@/apps/user/hooks/api/jobSheets/useDeleteJobSheet";
import useEmployees from "@/apps/user/hooks/api/employee/useEmployees";
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
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  ThDotMenu,
  TdOverflow,
} from "@/components/Table";
import HStack from "@/components/HStack";
import AddButton from "@/components/AddButton";
import DateField from "@/components/DateField";
import SelectField from "@/components/SelectField";
import InputField from "@/components/InputField";
import VStack from "@/components/VStack";
import TableFooter from "@/components/TableFooter";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import DateFilter from "@/components/DateFilter";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DotMenu from "@/apps/user/components/DotMenu";
import { getJobSheetMenuItems } from "@/config/menuItems";
import JobSheetInvoiceModal from "@/apps/user/components/JobSheetInvoiceModal";
import StatusButton from "@/apps/user/components/StatusButton";
import ExportMenu from "@/components/ExportMenu";
import TextBadge from "@/components/TextBadge";
import { format, isValid } from "date-fns";
import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import { useJobSheetById } from "@/apps/user/hooks/api/jobSheets/useJobSheetById";
import JobSheetPDF from "@/apps/user/components/JobSheetPDF";
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import { useJobSheetExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/useJobSheetExportAndPrint";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { Report } from "@/constants/object/report";
import { useReportTableFieldsSettings } from "@/apps/user/hooks/api/reportFieldPermissions/useReportTableFieldsSettings";
import { useReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useReportFieldPermissions";
import { useUpdateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useUpdateReportFieldPermissions";
import { useCreateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useCreateReportFieldPermissions";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";

import "./style.scss";

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
const StatusFilter = React.memo(
  ({ status, handleStatusFilterClick, isMobile }) => {
    return (
      <div className="status-filter-box">
        <div className="status-filter-row">
          {!isMobile && (
            <StatusButton
              size="sm"
              variant="all"
              isSelected={status === ""}
              onClick={() => handleStatusFilterClick("")}
            >
              All
            </StatusButton>
          )}

          <StatusButton
            size="sm"
            variant="maintenance"
            isSelected={status === "Pending"}
            onClick={() => handleStatusFilterClick("Pending")}
          >
            Pending
          </StatusButton>
          <StatusButton
            size="sm"
            variant="maintenance"
            isSelected={status === "In Progress"}
            onClick={() => handleStatusFilterClick("In Progress")}
          >
            Progress
          </StatusButton>
        </div>

        <div className="status-filter-row">
          <StatusButton
            size="sm"
            variant="available"
            isSelected={status === "Completed"}
            onClick={() => handleStatusFilterClick("Completed")}
          >
            Completed
          </StatusButton>

          <StatusButton
            size="sm"
            variant="sold"
            isSelected={status === "Cancelled"}
            onClick={() => handleStatusFilterClick("Cancelled")}
          >
            Cancelled
          </StatusButton>
        </div>
      </div>
    );
  },
);
const JobSheetRow = React.memo(
  ({ js, index, page, pageSize, handlers, columns }) => {
    const charges = parseFloat(js.service_charges) || 0;
    const cost = parseFloat(js.service_cost) || 0;
    const profit = charges - cost;

    return (
      <Tr key={js.job_id}>
        <TdSL index={index} page={page} pageSize={pageSize} />
        {columns.map((field) => {
          if (field.value === "date")
            return <TdDate key={field.value}>{js.created_at}</TdDate>;
          if (field.value === "customer")
            return <TdOverflow key={field.value}>{js.party_name}</TdOverflow>;
          if (field.value === "invoice_number")
            return (
              <TdOverflow key={field.value}>{js.invoice_number}</TdOverflow>
            );
          if (field.value === "item_name")
            return <TdOverflow key={field.value}>{js.item_name}</TdOverflow>;
          if (field.value === "servicer")
            return (
              <TdOverflow key={field.value}>
                {js.servicer_name || "-"}
              </TdOverflow>
            );
          if (field.value === "done_by")
            return (
              <TdOverflow key={field.value}>
                {js.done_by_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "cost_center")
            return (
              <TdOverflow key={field.value}>
                {js.cost_center_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "status")
            return (
              <Td>
                <TextBadge variant="jobSheetStatus" type={js.status}>
                  {js.status}
                </TextBadge>
              </Td>
            );
          if (field.value === "charges")
            return <TdNumeric key={field.value}>{charges}</TdNumeric>;
          if (field.value === "cost")
            return <TdNumeric key={field.value}>{cost}</TdNumeric>;
          if (field.value === "profit")
            return js.status === "Completed" ? (
              <TdNumeric key={field.value}>{profit.toFixed(2)}</TdNumeric>
            ) : (
              <Td key={field.value} />
            );
          if (field.value === "bar_code")
            return <TdOverflow key={field.value}>{js.bar_code}</TdOverflow>;
          return null;
        })}
        <Td>
          <DotMenu items={getJobSheetMenuItems(js, handlers)} />
        </Td>
      </Tr>
    );
  },
);

const JobSheetReport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
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
  const [selectedJobSheet, setSelectedJobSheet] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenJobSheetModal, setIsOpenJobSheetModal] = useState(false);
  const [isOpenInvoiceModal, setIsOpenInvoiceModal] = useState(false);
  const [jobSheetIdToFetch, setJobSheetIdToFetch] = useState(null);
  const [actionAfterFetch, setActionAfterFetch] = useState(null);
  const [extraFields, setExtraFields] = useState([]);

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
    sort: searchParams.get("sort") || "-created_at",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    bar_code: searchParams.get("barCode") || "",
    invoice_number: searchParams.get("invoiceNumber") || "",
  });

  const { getExtraFields, getReportSettingsKey } = useReportTableFieldsSettings(
    Report.Jobsheet,
  );
  const allPossibleFields = useMemo(() => getExtraFields(), [getExtraFields]);
  const reportSettingsKey = useMemo(
    () => getReportSettingsKey(),
    [getReportSettingsKey],
  );

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useReportFieldPermissions();
  const { mutate: updatePermissions, isLoading: isUpdatingPermissions } =
    useUpdateReportFieldPermissions();
  const { mutate: createPermissions, isLoading: isCreatingPermissions } =
    useCreateReportFieldPermissions();

  const authDetails = useMemo(
    () => JSON.parse(localStorage.getItem("AUTH_DETAILS") || "{}"),
    [],
  );
  const currentUserId = authDetails?.data?.id;
  const isSavingColumns = isUpdatingPermissions || isCreatingPermissions;

  useEffect(() => {
    if (isLoadingPermissions) return;
    const savedKeys = permissionsData?.[reportSettingsKey];
    if (savedKeys && savedKeys.length > 0) {
      const fieldMap = new Map(allPossibleFields.map((f) => [f.value, f]));
      const orderedVisible = savedKeys
        .map((key) => fieldMap.get(key))
        .filter(Boolean);
      const visibleValues = new Set(orderedVisible.map((f) => f.value));
      const hidden = allPossibleFields.filter(
        (f) => !visibleValues.has(f.value),
      );
      setExtraFields([
        ...orderedVisible.map((f) => ({ ...f, show: true })),
        ...hidden.map((f) => ({ ...f, show: false })),
      ]);
    } else {
      setExtraFields(allPossibleFields.map((f) => ({ ...f, show: true })));
    }
  }, [
    permissionsData,
    isLoadingPermissions,
    allPossibleFields,
    reportSettingsKey,
  ]);

  const handleSaveColumns = useCallback(
    (newColumnKeys, closeModalCallback) => {
      const payload = { [reportSettingsKey]: newColumnKeys };
      const onSuccess = () => closeModalCallback();
      if (permissionsData?.id) {
        updatePermissions(
          { id: permissionsData.id, permissionsData: payload },
          { onSuccess },
        );
      } else if (currentUserId) {
        createPermissions(
          { ...payload, user_id: currentUserId },
          { onSuccess },
        );
      } else {
        showToast({
          message: "Could not save settings. User not found.",
          crudType: "error",
        });
      }
    },
    [
      permissionsData,
      reportSettingsKey,
      updatePermissions,
      createPermissions,
      currentUserId,
      showToast,
    ],
  );

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

  const { data, isLoading, refetch, isRefetching } =
    useJobSheetsPaginated(state);
  const { mutateAsync: deleteJobSheet } = useDeleteJobSheet();
  const { data: employeesData = [] } = useEmployees();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching || isLoadingPermissions;

  const totalData = useMemo(
    () => ({
      totalCharges: data?.total_charges || 0,
      totalCost: data?.total_cost || 0,
      totalProfit: (data?.total_charges || 0) - (data?.total_cost || 0),
    }),
    [data],
  );

  const {
    data: jobSheetDetails,
    isSuccess: isDetailsSuccess,
    isError: isDetailsError,
  } = useJobSheetById(jobSheetIdToFetch, {
    enabled: !!jobSheetIdToFetch && actionAfterFetch === "downloadPdf",
  });

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All Statuses" },
      { value: "Pending", label: "Pending" },
      { value: "In Progress", label: "In Progress" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
    ],
    [],
  );
  const employeeOptions = useMemo(
    () => [
      { value: "", label: "All Servicers" },
      ...(employeesData || []).map((emp) => ({
        value: emp.name,
        label: emp.name,
      })),
    ],
    [employeesData],
  );

  useEffect(() => {
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
  }, [state, defaltCostCenter]);

  const { exportToExcel, exportToPdf, printDocument } =
    useJobSheetExportAndPrint({
      listData: listData,
      reportType: "Job Sheet Report",
      duration:
        state.start_date && state.end_date
          ? `${state.start_date} to ${state.end_date}`
          : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData,
      filterDatas: { ...state },
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

  useEffect(() => {
    const handlePdfDownload = async () => {
      if (
        !isDetailsSuccess ||
        !jobSheetDetails ||
        actionAfterFetch !== "downloadPdf"
      )
        return;
      try {
        const printSettings = JSON.parse(
          localStorage.getItem("PRINT_SETTINGS") || "{}",
        );
        const storeDetails = {
          company_name: printSettings.company_name || "Your Company",
          address: printSettings.address || "Your Address",
          email: printSettings.email,
          phone: printSettings.phone,
          full_header_image_url:
            buildUploadUrl(API_UPLOADS_BASE, printSettings.header_image_url) ||
            null,
        };
        const formattedData = { ...jobSheetDetails, store: storeDetails };
        const barcodeImage = generateBarcodeImage(
          jobSheetDetails.invoice_number,
        );
        const blob = await pdf(
          <JobSheetPDF
            jobSheetData={formattedData}
            barcodeImage={barcodeImage}
          />,
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

  const handleSort = useCallback(
    (value) => setState({ page: 1, sort: value }),
    [],
  );
  const handleDateFilterChange = useCallback(
    (newFilterValue) =>
      setState({
        start_date: newFilterValue.startDate || "",
        end_date: newFilterValue.endDate || "",
        page: 1,
      }),
    [],
  );
  const handleStatusFilterClick = useCallback(
    (newStatus) =>
      setState({
        status: state.status === newStatus ? "" : newStatus,
        page: 1,
      }),
    [state.status],
  );

  const handleSearch = useCallback(
    () =>
      setState({
        page: 1,
        searchType: state.searchType,
        searchKey: state.searchKey,
        min_charges: "",
        max_charges: "",
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
      }),
    [state.searchType, state.searchKey, defaltCostCenter],
  );

  const handleHeaderSearch = useCallback((key, value) => {
    setState({
      [key]: value,
      ...(key === "service_charges" && { min_charges: "", max_charges: "" }),
      page: 1,
      searchType: "",
      searchKey: "",
    });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") handleHeaderSearch(key, headerFilters[key]);
    },
    [headerFilters, handleHeaderSearch],
  );

  const handleApplyFilter = useCallback((newFilters) => {
    setState({
      ...newFilters,
      page: 1,
      searchType: "",
      searchKey: "",
      service_charges: "",
      service_cost: "",
      invoice_number: "",
      bar_code: "",
      item_name: "",
    });
    setShowFilter(false);
  }, []);

  const handleRefresh = useCallback(
    () =>
      setState({
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
        sort: "-created_at",
        searchType: "",
        searchKey: "",
        bar_code: "",
        invoice_number: "",
      }),
    [defaltCostCenter],
  );

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("action");
      setSearchParams(newSearchParams, { replace: true });
      setMode("add");
      setSelectedJobSheet(null);
      setIsOpenJobSheetModal(true);
    }
  }, [searchParams, setSearchParams]);

  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    [],
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    [],
  );
  const handleAddClick = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("action", "add");
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);
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

  const handleDelete = useCallback(
    async (id) => {
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
    },
    [deleteJobSheet, refetch, showToast],
  );

  const searchOptions = useMemo(
    () => [
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
    ],
    [isDisableCostCenter],
  );

  const filterProps = {
    showFilter,
    setShowFilter,
    onApply: handleApplyFilter,
    initialFilters: state,
    employeeOptions,
    statusOptions,
    disableCostCenter: isDisableCostCenter,
  };
  const handlers = useMemo(
    () => ({
      onView: handleViewClick,
      onEdit: handleEditClick,
      onDelete: handleDelete,
      onDownloadPdf: handleDownloadPdfClick,
      onPrint: handlePrintClick,
    }),
    [
      handleViewClick,
      handleEditClick,
      handleDelete,
      handleDownloadPdfClick,
      handlePrintClick,
    ],
  );
  const dateFilterValue = {
    startDate: state.start_date || null,
    endDate: state.end_date || null,
  };
  const isDateFilterActive =
    state.start_date &&
    state.end_date &&
    isValid(new Date(state.start_date)) &&
    isValid(new Date(state.end_date));
  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(state.start_date), "MMM d, yyyy")} to ${format(new Date(state.end_date), "MMM d, yyyy")}`
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
              summary={
                <StatusFilter
                  status={state.status}
                  handleStatusFilterClick={handleStatusFilterClick}
                />
              }
              mainActions={
                <>
                  <ColumnSelectorModal
                    onApply={handleSaveColumns}
                    allPossibleFields={allPossibleFields}
                    savedColumnKeys={extraFields
                      .filter((f) => f.show)
                      .map((f) => f.value)}
                    isLoading={isSavingColumns}
                  />
                  <ListFilter {...filterProps} />
                  <PopupSearchField
                    searchKey={state.searchKey}
                    setSearchKey={(v) => setState({ searchKey: v })}
                    searchType={state.searchType}
                    setSearchType={(v) => setState({ searchType: v })}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                  <AddButton onClick={handleAddClick}>Add Job Sheet</AddButton>
                </>
              }
              topRight={
                <>

                  <RefreshButton onClick={handleRefresh} />
                  <DateFilter
                    value={dateFilterValue}
                    onChange={handleDateFilterChange}
                  />
                  {!loading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )}
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
                      {extraFields
                        .filter((item) => item.show)
                        .map((field) => {
                          if (field.value === "date")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Date
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="created_at"
                                    handleSort={handleSort}
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "customer")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Customer
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="party_name"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "party_name",
                                          headerFilters.party_name,
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
                            );
                          if (field.value === "invoice_number")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Invoice No
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch(
                                        "invoice_number",
                                        headerFilters.invoice_number,
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
                            );
                          if (field.value === "item_name")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Item Name
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="item_name"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "item_name",
                                          headerFilters.item_name,
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
                            );
                          if (field.value === "servicer")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Servicer
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="servicer_name"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "servicer_name",
                                          headerFilters.servicer_name,
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
                                          handleHeaderKeyDown(
                                            e,
                                            "servicer_name",
                                          )
                                        }
                                        isLabel={false}
                                      />
                                    </ThSearchOrFilterPopover>
                                  </ThFilterContainer>
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "done_by")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Done By
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="done_by"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={false}
                                      popoverWidth={220}
                                    >
                                      <DoneByAutoComplete
                                        value={state.done_by_id}
                                        onChange={(e) =>
                                          handleHeaderSearch(
                                            "done_by_id",
                                            e.target.value,
                                          )
                                        }
                                        is_edit={false}
                                      />
                                    </ThSearchOrFilterPopover>
                                  </ThFilterContainer>
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "cost_center")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Cost Center
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="cost_center"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={false}
                                      popoverWidth={220}
                                    >
                                      <CostCenterAutoComplete
                                        value={state.cost_center_id}
                                        onChange={(e) =>
                                          handleHeaderSearch(
                                            "cost_center_id",
                                            e.target.value,
                                          )
                                        }
                                        is_edit={false}
                                      />
                                    </ThSearchOrFilterPopover>
                                  </ThFilterContainer>
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "status")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Status
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="status"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <SelectField
                                        value={state.status}
                                        onChange={(e) =>
                                          handleHeaderSearch(
                                            "status",
                                            e.target.value,
                                          )
                                        }
                                        options={statusOptions}
                                      />
                                    </ThSearchOrFilterPopover>
                                  </ThFilterContainer>
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "charges")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Charges
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="service_charges"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "service_charges",
                                          headerFilters.service_charges,
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
                                          handleHeaderKeyDown(
                                            e,
                                            "service_charges",
                                          )
                                        }
                                        isLabel={false}
                                      />
                                    </ThSearchOrFilterPopover>
                                  </ThFilterContainer>
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "cost")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Cost
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="service_cost"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "service_cost",
                                          headerFilters.service_cost,
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
                            );
                          if (field.value === "profit")
                            return <Th key={field.value}>Profit</Th>;
                          if (field.value === "bar_code")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Bar Code
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch(
                                        "bar_code",
                                        headerFilters.bar_code,
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
                            );
                          return <Th key={field.value}>{field.label}</Th>;
                        })}
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
                          columns={extraFields.filter((f) => f.show)}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.JobSheet}
                        noOfCol={extraFields.filter((f) => f.show).length + 2}
                      />
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
                    value={dateFilterValue}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchKey={state.searchKey}
                    setSearchKey={(v) => setState({ searchKey: v })}
                    searchType={state.searchType}
                    setSearchType={(v) => setState({ searchType: v })}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                </HStack>
                <div className="jobsheet_report__add_button">
                  <AddButton onClick={handleAddClick}>Add Job Sheet</AddButton>
                </div>
              </PageHeader>
              {loading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.JobSheet} />
              ) : (
                <div>
                  {listData.map((js) => (
                    <MobileJobSheetCard
                      key={js.job_id}
                      js={js}
                      handlers={handlers}
                    />
                  ))}
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

const ListFilter = React.memo(({ onApply, initialFilters, ...props }) => {
  const {
    showFilter,
    setShowFilter,
    employeeOptions,
    statusOptions,
    disableCostCenter,
  } = props;
  const [localState, setLocalState] = useReducer(stateReducer, initialFilters);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (showFilter) {
      setLocalState(initialFilters);
    }
  }, [showFilter, initialFilters]);

  const handleApplyClick = () => {
    onApply(localState);
  };

  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleApplyClick}
    >
      <VStack>
        <SelectField
          label="Status"
          name="status"
          value={localState.status}
          onChange={(e) => setLocalState({ status: e.target.value })}
          options={statusOptions}
        />
        <InputField
          label="Customer Name"
          placeholder="Customer Name"
          name="party_name"
          value={localState.party_name}
          onChange={(e) => setLocalState({ party_name: e.target.value })}
        />
        <SelectField
          label="Servicer"
          name="servicer_name"
          value={localState.servicer_name}
          onChange={(e) => setLocalState({ servicer_name: e.target.value })}
          options={employeeOptions}
        />
        <DoneByAutoComplete
          placeholder="Done By"
          value={localState.done_by_id}
          onChange={(e) => setLocalState({ done_by_id: e.target.value })}
          name="done_by_id"
          is_edit={false}
        />
        <CostCenterAutoComplete
          placeholder="Cost Center"
          value={localState.cost_center_id}
          onChange={(e) => setLocalState({ cost_center_id: e.target.value })}
          name="cost_center_id"
          is_edit={false}
          disabled={disableCostCenter}
        />
        <RangeField
          label="Service Charges"
          minValue={localState.min_charges}
          maxValue={localState.max_charges}
          onMinChange={(v) => setLocalState({ min_charges: v })}
          onMaxChange={(v) => setLocalState({ max_charges: v })}
        />
        {isMobile ? (
          <>
            <DateField
              label="Start Date"
              value={
                localState.start_date ? new Date(localState.start_date) : null
              }
              onChange={(date) =>
                setLocalState({
                  start_date: date ? date.toISOString().split("T")[0] : "",
                })
              }
            />
            <DateField
              label="End Date"
              value={localState.end_date ? new Date(localState.end_date) : null}
              onChange={(date) =>
                setLocalState({
                  end_date: date ? date.toISOString().split("T")[0] : "",
                })
              }
            />
          </>
        ) : (
          <HStack justifyContent="flex-start">
            <DateField
              label="Start Date"
              value={
                localState.start_date ? new Date(localState.start_date) : null
              }
              onChange={(date) =>
                setLocalState({
                  start_date: date ? date.toISOString().split("T")[0] : "",
                })
              }
            />
            <DateField
              label="End Date"
              value={localState.end_date ? new Date(localState.end_date) : null}
              onChange={(date) =>
                setLocalState({
                  end_date: date ? date.toISOString().split("T")[0] : "",
                })
              }
            />
          </HStack>
        )}
      </VStack>
    </PopUpFilter>
  );
});

const MobileJobSheetCard = React.memo(({ js, handlers }) => {
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
          <div>{new Date(js.created_at).toLocaleDateString("en-IN")}</div>
        </>
      }
      amount={
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "bold" }}>Charges: {charges}</div>
          <div className="fs14 text-danger">Cost: {cost}</div>
          <div className="fs14 text-success">
            {js.status === "Completed"
              ? `Profit: ${profit.toFixed(2)}`
              : "Profit: -"}
          </div>
        </div>
      }
      actions={<DotMenu items={getJobSheetMenuItems(js, handlers)} />}
    />
  );
});

export default JobSheetReport;
