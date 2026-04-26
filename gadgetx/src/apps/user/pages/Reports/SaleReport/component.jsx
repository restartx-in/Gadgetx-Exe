import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import useDeleteSales from "@/hooks/api/sales/useDeleteSales";
import useSalesPaginated from "@/hooks/api/sales/useSalesPaginated";
import useAccounts from "@/hooks/api/account/useAccounts";
import { useCustomers } from "@/hooks/api/customer/useCustomers";
import { useDoneBys } from "@/hooks/api/doneBy/useDoneBys";
import { useCostCenters } from "@/hooks/api/costCenter/useCostCenters";
import { useSalesById } from "@/hooks/api/sales/useSalesById";
import { useModeOfPayments } from "@/hooks/api/modeOfPayment/useModeOfPayments";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import RangeField from "@/components/RangeField";
import InputField from "@/components/InputField";
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
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import DateField from "@/components/DateField";
import HStack from "@/components/HStack/component.jsx";
import VStack from "@/components/VStack";
import TableTopContainer from "@/components/TableTopContainer";
import PageHeader from "@/components/PageHeader";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import Loader from "@/components/Loader";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import SelectField from "@/components/SelectField";
import DotMenu from "@/components/DotMenu/component";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal/component";
import { getSaleMenuItems } from "@/config/menuItems.jsx";
import InvoiceModal from "@/apps/user/components/InvoiceModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ReceiptPDF from "@/apps/user/components/ReceiptPDF";
import AmountSummary from "@/components/AmountSummary";
import DateFilter from "@/components/DateFilter";
import PaymentsModal from "@/apps/user/components/PaymentsModal";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import CustomerAutoComplete from "@/apps/user/components/CustomerAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TextBadge from "@/apps/user/components/TextBadge";
import { format, isValid } from "date-fns";
import { API_FILES as server } from "@/config/api";
import { useSaleExportAndPrint } from "@/hooks/api/exportAndPrint/useSaleExportAndPrint";
import "./style.scss";

import ExportMenu from "@/components/ExportMenu";
import useSyncURLParams from "@/hooks/useSyncURLParams";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

const generateBarcodeImage = (invoiceNumber) => {
  if (!invoiceNumber) {
    return null;
  }
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

// --- Extracted & Memoized Desktop Row ---
const SaleRow = React.memo(({ sls, index, page, pageSize, customerNameMap, accountNameMap, doneByNameMap, costCenterNameMap, handlers }) => {
  const balance = (sls.total_amount || 0) - (sls.paid_amount || 0);
  const menuItems = useMemo(() => getSaleMenuItems(sls, handlers), [sls, handlers]);

  return (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{sls.date}</TdDate>
      <Td>{customerNameMap[sls.party_id] || "N/A"}</Td>
      <Td>{sls.invoice_number}</Td>
      <Td>
        {(sls.payment_methods && sls.payment_methods.length > 0
          ? sls.payment_methods.map((p) => p.account_name || p.account_id || "N/A").join(", ")
          : "N/A")}
      </Td>
      <Td>{doneByNameMap[sls.done_by_id] || "N/A"}</Td>
      <Td>{costCenterNameMap[sls.cost_center_id] || "N/A"}</Td>
      <TdNumeric>{sls.total_amount}</TdNumeric>
      <TdNumeric className="text-success">{sls.paid_amount || 0}</TdNumeric>
      <TdNumeric className="text-danger">{balance.toFixed(2)}</TdNumeric>
      <Td>
        <TextBadge variant="paymentStatus" type={sls.status}>
          {sls.status}
        </TextBadge>
      </Td>
      <Td>
        <DotMenu items={menuItems} />
      </Td>
    </Tr>
  );
});

// --- Extracted & Memoized Mobile Card ---
const MobileSaleCard = React.memo(({ sls, customerNameMap, accountNameMap, doneByNameMap, costCenterNameMap, handlers }) => {
  const balance = (sls.total_amount || 0) - (sls.paid_amount || 0);
  const menuItems = useMemo(() => getSaleMenuItems(sls, handlers), [sls, handlers]);

  return (
    <ListItem
      title={customerNameMap[sls.party_id] || "N/A"}
      subtitle={
        <>
          <div className="fs14">
            Account:{" "}
            {(sls.payment_methods && sls.payment_methods.length > 0
              ? sls.payment_methods.map((p) => p.account_name || p.account_id || "N/A").join(", ")
              : "N/A")}
          </div>
          {sls.done_by_id && (
            <div className="fs14">
              Done By: {doneByNameMap[sls.done_by_id]}
            </div>
          )}
          {sls.cost_center_id && (
            <div className="fs14">
              Cost Center: {costCenterNameMap[sls.cost_center_id]}
            </div>
          )}
        </>
      }
      amount={
        <div style={{ display: "flex" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>{sls.total_amount || 0}</div>
            {parseFloat(sls.paid_amount || 0) !== 0 && (
              <div className="fs14 text-success">
                Received: {sls.paid_amount || 0}
              </div>
            )}
            {parseFloat(balance.toFixed(2)) !== 0 && (
              <div className="fs14 text-danger">
                Balance: {balance.toFixed(2)}
              </div>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DotMenu items={menuItems} />
          </div>
        </div>
      }
      actions={<DotMenu items={menuItems} />}
    />
  );
});

const SaleReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // UI States for filter inputs (These remain useState as they are only for local UI control)
  const [customerId, setCustomerId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaultCostCenter);
  const [status, setStatus] = useState("");
  const [minTotalAmount, setMinTotalAmount] = useState("");
  const [maxTotalAmount, setMaxTotalAmount] = useState("");
  const [minPaidAmount, setMinPaidAmount] = useState("");
  const [maxPaidAmount, setMaxPaidAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("-date");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");

  // Other component states
  const [showFilter, setShowFilter] = useState(false);
  const [headerCustomer, setHeaderCustomer] = useState("");
  const [headerAccount, setHeaderAccount] = useState("");
  const [saleIdToFetch, setSaleIdToFetch] = useState(null);
  const [actionAfterFetch, setActionAfterFetch] = useState(null);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [selectedSalePayments, setSelectedSalePayments] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);
  const [filterDatas, setFilterDatas] = useState({});
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    rangeType: "custom",
  });
  const [headerFilters, setHeaderFilters] = useState({
    party_name: "",
    total_amount: "",
    paid_amount: "",
    balance: "",
    invoice_number: "",
  });

  // --- 1. Centralized state initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    party_id: searchParams.get("customerId") || "",
    party_name: searchParams.get("customerName") || "",
    account_id: searchParams.get("accountId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    status: searchParams.get("status") || "",
    min_total_amount: searchParams.get("minTotal") || "",
    max_total_amount: searchParams.get("maxTotal") || "",
    min_paid_amount: searchParams.get("minPaid") || "",
    max_paid_amount: searchParams.get("maxPaid") || "",
    total_amount: searchParams.get("totalAmount") || "",
    paid_amount: searchParams.get("paidAmount") || "",
    balance: searchParams.get("balance") || "",
    invoice_number: searchParams.get("invoiceNumber") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  // --- 2. Use the custom hook to sync state with URL ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    customerId: state.party_id,
    customerName: state.party_name,
    accountId: state.account_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
    minTotal: state.min_total_amount,
    maxTotal: state.max_total_amount,
    minPaid: state.min_paid_amount,
    maxPaid: state.max_paid_amount,
    totalAmount: state.total_amount,
    paidAmount: state.paid_amount,
    balance: state.balance,
    invoiceNumber: state.invoice_number,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  // --- 3. Sync UI filter controls from main state ---
  useEffect(() => {
    setCustomerId(state.party_id || "");
    setAccountId(state.account_id || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaultCostCenter);
    setStatus(state.status || "");
    setMinTotalAmount(state.min_total_amount || "");
    setMaxTotalAmount(state.max_total_amount || "");
    setMinPaidAmount(state.min_paid_amount || "");
    setMaxPaidAmount(state.max_paid_amount || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setSort(state.sort || "-date");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      party_name: state.party_name || "",
      total_amount: state.total_amount || "",
      paid_amount: state.paid_amount || "",
      balance: state.balance || "",
      invoice_number: state.invoice_number || "",
    });
    setHeaderCustomer(state.party_id || "");
    setHeaderAccount(state.account_id || "");
    setDateFilter({
        startDate: state.start_date || null,
        endDate: state.end_date || null,
        rangeType: 'custom',
    });
  }, [state, defaultCostCenter]);


  const {
    data,
    isLoading: isListLoading,
    refetch: refetchList,
    isRefetching
  } = useSalesPaginated(state);
  
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers();
  const { data: doneByList = [] } = useDoneBys();
  const { data: costCenterList = [] } = useCostCenters();
  const { data: modeOfPaymentList = [] } = useModeOfPayments(); 

  const { mutateAsync: deleteSale, isLoading: isDeleting } = useDeleteSales();
  const {
    data: saleDetails,
    isLoading: isDetailsLoading,
    isSuccess,
    isError,
  } = useSalesById(saleIdToFetch);

  // Derived Data (Memoized)
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isListLoading || isRefetching || isDetailsLoading;

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts]
  );
  
  const statusOptions = useMemo(() => ([
    { value: "Paid", label: "Paid" },
    { value: "Partial", label: "Partial" },
    { value: "Unpaid", label: "Unpaid" },
  ]), []);

  const customerNameMap = useMemo(
    () =>
      customers.reduce((map, customer) => {
        map[customer.id] = customer.name;
        return map;
      }, {}),
    [customers]
  );

  const accountNameMap = useMemo(
    () =>
      accounts.reduce((map, account) => {
        map[account.id] = account.name;
        return map;
      }, {}),
    [accounts]
  );

  const doneByNameMap = useMemo(
    () =>
      doneByList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [doneByList]
  );

  const costCenterNameMap = useMemo(
    () =>
      costCenterList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [costCenterList]
  );

  const modeOfPaymentNameMap = useMemo(
    () =>
      modeOfPaymentList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [modeOfPaymentList]
  );

  const [saleToDelete, setSaleToDelete] = useState(null);

  // Update Filter Datas
  useEffect(() => {
    setFilterDatas({
      costCenterId,
      doneById,
      customerId,
      status,
      headerCustomer,
      invoiceNumber: headerFilters.invoice_number,
    });
  }, [
    costCenterId,
    doneById,
    customerId,
    status,
    headerCustomer,
    headerFilters,
  ]);

  const { exportToExcel, exportToPdf, printDocument } = useSaleExportAndPrint({
    listData: listData,
    reportType: "Sale Report",
    duration: startDate && endDate ? `${startDate} to ${endDate}` : "",
    pageNumber: state.page,
    selectedPageCount: state.page_size,
    totalPage: totalPages,
    totalData: {
      totalAmount: data?.total_amount || 0,
      paidAmount: data?.paid_amount || 0,
      balance: (data?.total_amount || 0) - (data?.paid_amount || 0),
    },
    filterDatas,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  // PDF/Invoice Logic
  useEffect(() => {
    const handleSaleDetails = async () => {
      if (!isSuccess || !saleDetails || !actionAfterFetch) {
        return;
      }

      try {
        const cleanedItems = (saleDetails.items || [])
          .filter((item) => item && item.item_name)
          .map((item) => ({
            name: item.item_name,
            quantity: parseFloat(item.quantity) || 0,
            price: parseFloat(item.unit_price) || 0,
          }));

        const subTotal =
          parseFloat(saleDetails.sub_total) ||
          cleanedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

        const printSettingsString =
          localStorage.getItem("PRINT_SETTINGS") || "{}";
        const printSettings = JSON.parse(printSettingsString);

        const storeDetails = {
          company_name: printSettings.company_name || "Your Company",
          store: printSettings.store_name || "Main Store",
          address: printSettings.address || "123 Main St",
          email: printSettings.email || "contact@example.com",
          phone: printSettings.phone || "555-1234",
          full_header_image_url: printSettings.header_image_url
            ? `${server}${printSettings.header_image_url}`
            : null,
        };

        const enrichedPaymentMethods = (saleDetails.payment_methods || []).map((pm) => ({
          ...pm,
          mode_of_payment: 
            modeOfPaymentNameMap[pm.mode_of_payment_id] || 
            accountNameMap[pm.account_id] || 
            "Unknown"
        }));

        const formattedData = {
          id: saleDetails.id,
          invoice_number: saleDetails.invoice_number,
          date: saleDetails.date,
          store: storeDetails,
          partner: {
            label: "Customer",
            name: customerNameMap[saleDetails.party_id] || "Walk-in Customer",
          },
          items: cleanedItems,
          summary: {
            subTotal: subTotal,
            grandTotal: parseFloat(saleDetails.total_amount) || 0,
            orderTax: parseFloat(saleDetails.tax_amount) || 0,
            discount: parseFloat(saleDetails.discount) || 0,
            shipping: parseFloat(saleDetails.shipping_charge) || 0,
          },
          payment: {
            amountPaid: parseFloat(saleDetails.paid_amount) || 0,
            changeReturn:parseFloat(saleDetails.change_return) || 0
          },
          payment_methods: enrichedPaymentMethods
        };
        

        if (actionAfterFetch === "showInvoiceModal") {
          setSelectedSaleForInvoice(formattedData);
          setIsInvoiceModalOpen(true);
        } else if (
          actionAfterFetch === "downloadFullInvoice" ||
          actionAfterFetch === "downloadReceiptPdf"
        ) {
          const barcodeImage = generateBarcodeImage(saleDetails.invoice_number);
          const blob = await pdf(
            <ReceiptPDF
              transactionData={formattedData}
              barcodeImage={barcodeImage}
            />
          ).toBlob();

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const fileName =
            actionAfterFetch === "downloadFullInvoice" ? "Invoice" : "Receipt";
          link.setAttribute("download", `${fileName}-${saleDetails.id}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          URL.revokeObjectURL(url);

          setSaleIdToFetch(null);
          setActionAfterFetch(null);
        } else if (actionAfterFetch === "showReceiptModal") {
          setSelectedSaleForReceipt(formattedData);
          setIsReceiptModalOpen(true);
        }
      } catch (error) {
        console.error("Error processing sale details:", error);
        showToast({
          message: "An unexpected error occurred.",
          crudType: "error",
        });
      }
    };

    handleSaleDetails();

    if (isError) {
      showToast({
        message: "Failed to fetch sale details.",
        crudType: "error",
      });
      setSaleIdToFetch(null);
      setActionAfterFetch(null);
    }
  }, [
    isSuccess,
    isError,
    saleDetails,
    actionAfterFetch,
    customerNameMap,
    modeOfPaymentNameMap,
    accountNameMap,
    showToast,
  ]);

  // --- Handlers (Memoized & UPDATED setState CALLS) ---

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState({ // Simplified setState
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ // Simplified setState
      [key]: value,
      page: 1,
      searchType: "",
      searchKey: "",
      // If we are searching for 'party_name', explicitly clear 'party_id'.
      // Otherwise, the existing 'party_id' will be merged from 'state'.
      ...(key === "party_name" && { party_id: "" }),
      // Clear ranges
      ...(key === "total_amount" && { min_total_amount: "", max_total_amount: "" }),
      ...(key === "paid_amount" && { min_paid_amount: "", max_paid_amount: "" }),
    });
  }, []);

  const handleHeaderKeyDown = useCallback((e, key) => {
    if (e.key === "Enter") {
      handleHeaderSearch(key, headerFilters[key]);
    }
  }, [headerFilters, handleHeaderSearch]);

  const handleSort = useCallback((value) => {
    setState({ page: 1, sort: value }); // Simplified setState
  }, []);

  const handleSearch = useCallback(() => {
    // A full update object to clear all conflicting filters.
    setState({ // Simplified setState
      page: 1, 
      searchType, 
      searchKey,
      // Clear specific filters
      party_id: "",
      account_id: "",
      done_by_id: "",
      status: "",
      min_total_amount: "",
      max_total_amount: "",
      min_paid_amount: "",
      max_paid_amount: "",
      start_date: "",
      end_date: "",
      party_name: "",
      total_amount: "",
      paid_amount: "",
      balance: "",
      invoice_number: ""
    });
  }, [searchType, searchKey]);

  const handleFilter = useCallback(() => {
    // A full update object to set all filter values and clear conflicting search/header filters.
    setState({ // Simplified setState
      party_id: customerId,
      account_id: accountId,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      status: status,
      min_total_amount: minTotalAmount,
      max_total_amount: maxTotalAmount,
      min_paid_amount: minPaidAmount,
      max_paid_amount: maxPaidAmount,
      start_date: startDate,
      end_date: endDate,
      page: 1,
      // Clear other conflicting filters
      party_name: "", 
      total_amount: "",
      paid_amount: "",
      balance: "",
      searchType: "",
      searchKey: "",
      invoice_number: "",
    });
    setShowFilter(false);
  }, [customerId, accountId, doneById, costCenterId, status, minTotalAmount, maxTotalAmount, minPaidAmount, maxPaidAmount, startDate, endDate]);

  const handleRefresh = useCallback(() => {
    // Reset UI states (local state managed by useState)
    setCustomerId("");
    setAccountId("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId(defaultCostCenter);
    setStatus("");
    setMinTotalAmount("");
    setMaxTotalAmount("");
    setMinPaidAmount("");
    setMaxPaidAmount("");
    setStartDate("");
    setEndDate("");
    setSearchKey("");
    setSearchType("");
    setHeaderCustomer("");
    setHeaderAccount("");
    setSort("-date");
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setHeaderFilters({ party_name: "", total_amount: "", invoice_number: "" });
    
    // Reset Main State (useReducer state)
    setState({ // Simplified setState (full reset object)
      page: 1,
      page_size: 10,
      sort: "-date",
      party_id: "",
      party_name: "",
      account_id: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      status: "",
      min_total_amount: "",
      max_total_amount: "",
      min_paid_amount: "",
      max_paid_amount: "",
      total_amount: "",
      paid_amount: "",
      balance: "",
      invoice_number: "",
      searchType: "",
      searchKey: "",
      start_date: "",
      end_date: "",
    });
  }, [defaultCostCenter, isDisableCostCenter]);

  const handleHeaderCustomerFilter = useCallback((value) => {
    setHeaderCustomer(value);
    setState({ page: 1, party_id: value }); // Simplified setState
  }, []);

  const handleHeaderAccountFilter = useCallback((value) => {
    setHeaderAccount(value);
    setState({ page: 1, account_id: value }); // Simplified setState
  }, []);

  const handlePageLimitSelect = useCallback((value) =>
    setState({ page_size: value, page: 1 }), []); // Simplified setState
    
  const handlePageChange = useCallback((value) => 
    setState({ page: value }), []); // Simplified setState

  const handleAddClick = useCallback(() => navigate(`/sale/add`), [navigate]);
  const handleEditClick = useCallback((id) => navigate(`/sale/edit/${id}`), [navigate]);
  const handleViewClick = useCallback((id) => navigate(`/sale/view/${id}`, { state: { mode: "view" } }), [navigate]);

  const handleDownloadPdf = useCallback((id) => {
    setActionAfterFetch("downloadFullInvoice");
    setSaleIdToFetch(id);
  }, []);

  const handleDownloadReceipt = useCallback((id) => {
    setActionAfterFetch("showReceiptModal");
    setSaleIdToFetch(id);
  }, []);

  const handleCreatePayment = useCallback((id) => alert(`Create Payment for sale ${id}`), []);
  const handleCreateSaleReturn = useCallback((id) => navigate(`/sale-return/add/${id}`), [navigate]);

  const handleShowPayments = useCallback((saleData) => {
    const payments = (saleData.payment_methods || []).map((p, index) => ({
      id: index + 1,
      date: saleData.date,
      reference: `Sale #${saleData.id}`,
      amount: p.amount || 0,
      customerName: customerNameMap[saleData.party_id] || "N/A",
      receivedTo: p.account_name || p.account_id || "N/A",
    }));
    setSelectedSalePayments(payments);
    setIsPaymentsModalOpen(true);
  }, [customerNameMap]);

  const handleClosePaymentsModal = useCallback(() => {
    setIsPaymentsModalOpen(false);
    setSelectedSalePayments([]);
  }, []);

  const handleCloseInvoiceModal = useCallback(() => {
    setIsInvoiceModalOpen(false);
    setSelectedSaleForInvoice(null);
    setSaleIdToFetch(null);
    setActionAfterFetch(null);
  }, []);

  const handleCloseReceiptModal = useCallback(() => {
    setIsReceiptModalOpen(false);
    setSelectedSaleForReceipt(null);
    setSaleIdToFetch(null);
    setActionAfterFetch(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!saleToDelete) return;
    try {
      await deleteSale(saleToDelete.id);
      showToast({ crudItem: CRUDITEM.SALE, crudType: CRUDTYPE.DELETE_SUCCESS });
      setSaleToDelete(null);
      refetchList();
    } catch (error) {
      showToast({ crudItem: CRUDITEM.SALE, crudType: CRUDTYPE.DELETE_ERROR });
    }
  }, [saleToDelete, deleteSale, showToast, refetchList]);

  // Memoized Handlers for Rows
  const rowHandlers = useMemo(() => ({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: setSaleToDelete,
    onDownloadPdf: handleDownloadPdf,
    onDownloadReceipt: handleDownloadReceipt,
    onCreatePayment: handleCreatePayment,
    onCreateSaleReturn: handleCreateSaleReturn,
    onShowPayments: handleShowPayments,
  }), [handleViewClick, handleEditClick, handleDownloadPdf, handleDownloadReceipt, handleCreatePayment, handleCreateSaleReturn, handleShowPayments]);


  const searchOptions = useMemo(() => ([
    { value: "party_name", name: "Customer" },
    { value: "invoice_number", name: "Invoice No" },
    { value: "status", name: "Status" },
    { value: "total_amount", name: "Total Amount" },
    { value: "done_by_name", name: "Done By" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ]), [isDisableCostCenter]);

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    customerId,
    setCustomerId,
    accountId,
    setAccountId,
    accountOptions,
    isLoadingAccounts,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    status,
    setStatus,
    statusOptions,
    minTotalAmount,
    setMinTotalAmount,
    maxTotalAmount,
    setMaxTotalAmount,
    minPaidAmount,
    setMinPaidAmount,
    maxPaidAmount,
    setMaxPaidAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isDisableCostCenter,
  };

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
            <PageTitleWithBackButton title="Sales" subtitle={dateSubtitle} />
            <TableTopContainer
              summary={
                !loading &&
                data && (
                  <AmountSummary
                    total={data.total_amount}
                    received={data.paid_amount}
                    pending={data.total_amount - data.paid_amount}
                  />
                )
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
                  <AddButton onClick={handleAddClick}>Add New</AddButton>
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
                            value="date"
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
                            <ThSearchOrFilterPopover isSearch={false}>
                              <CustomerAutoComplete
                                name="headerCustomerId"
                                value={headerCustomer}
                                onChange={(e) =>
                                  handleHeaderCustomerFilter(e.target.value)
                                }
                                placeholder="Search & select customer"
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
                            label="Invoice No"
                              placeholder="Search Bar Code"
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
                          Account
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="account_id"
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <AccountAutoComplete
                                placeholder="Select Account"
                                value={headerAccount}
                                onChange={(e) =>
                                  handleHeaderAccountFilter(e.target.value)
                                }
                                options={[
                                  { value: "", label: "All Accounts" },
                                  ...accountOptions,
                                ]}
                                isLoading={isLoadingAccounts}
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
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="done_by"
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
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="cost_center"
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
                          Total Amount
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="total_amount"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "total_amount",
                                  headerFilters.total_amount
                                )
                              }
                            >
                              <InputField
                              label="Total Amount"
                                placeholder="Enter Exact Amount"
                                type="number"
                                value={headerFilters.total_amount}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    total_amount: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "total_amount")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Paid Amount
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="paid_amount"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "paid_amount",
                                  headerFilters.paid_amount
                                )
                              }
                            >
                              <InputField
                              label="Paid Amount"
                                placeholder="Enter Exact Amount"
                                type="number"
                                value={headerFilters.paid_amount}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    paid_amount: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "paid_amount")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>Balance</ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>Status</ThContainer>
                      </Th>
                      <ThDotMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((sls, index) => (
                        <SaleRow 
                          key={sls.id}
                          sls={sls}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          customerNameMap={customerNameMap}
                          accountNameMap={accountNameMap}
                          doneByNameMap={doneByNameMap}
                          costCenterNameMap={costCenterNameMap}
                          handlers={rowHandlers}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Sale} noOfCol={11} />
                    )}
                  </Tbody>
                </Table>
              </>
            )}
            {!loading && (
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
            <PageTitleWithBackButton title="Sales" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
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
                <div className="sale_report__add_button">
                  <AddButton fullWidth onClick={handleAddClick} />
                </div>
              </PageHeader>

              <div className="sale_report" style={{ marginTop: "0" }}>
                {loading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.Sale} />
                ) : (
                  <div>
                    {listData.map((sls) => (
                      <MobileSaleCard 
                        key={sls.id}
                        sls={sls}
                        customerNameMap={customerNameMap}
                        accountNameMap={accountNameMap}
                        doneByNameMap={doneByNameMap}
                        costCenterNameMap={costCenterNameMap}
                        handlers={rowHandlers}
                      />
                    ))}
                  </div>
                )}
              </div>
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

      <DeleteConfirmationModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDelete}
        transactionName={`sale for ${
          saleToDelete ? customerNameMap[saleToDelete.party_id] : ""
        }`}
        isLoading={isDeleting}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        saleData={selectedSaleForInvoice}
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceiptModal}
        transactionData={selectedSaleForReceipt}
      />
      <PaymentsModal
        isOpen={isPaymentsModalOpen}
        onClose={handleClosePaymentsModal}
        payments={selectedSalePayments}
        type="sale"
      />
    </>
  );
};

export default SaleReport;

// Memoized List Filter
const ListFilter = React.memo(({ ...props }) => {
  const {
    showFilter,
    setShowFilter,
    handleFilter,
    customerId,
    setCustomerId,
    accountId,
    setAccountId,
    accountOptions,
    isLoadingAccounts,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    status,
    setStatus,
    statusOptions,
    minTotalAmount,
    setMinTotalAmount,
    maxTotalAmount,
    setMaxTotalAmount,
    minPaidAmount,
    setMinPaidAmount,
    maxPaidAmount,
    setMaxPaidAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isDisableCostCenter,
  } = props;

  const isMobile = useIsMobile();
  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack spacing={4}>
        <CustomerAutoComplete
          name="customerId"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="select a customer"
        />
        <AccountAutoComplete
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={[{ value: "", label: "All Accounts" }, ...accountOptions]}
          isLoading={isLoadingAccounts}
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
          disabled={isDisableCostCenter}
        />
        <SelectField
        label="Status"
          placeholder="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[{ value: "", label: "All Statuses" }, ...statusOptions]}
        />
        <RangeField
          label="Total Amount Range"
          minValue={minTotalAmount}
          maxValue={maxTotalAmount}
          onMinChange={setMinTotalAmount}
          onMaxChange={setMaxTotalAmount}
        />
        <RangeField
          label="Paid Amount Range"
          minValue={minPaidAmount}
          maxValue={maxPaidAmount}
          onMinChange={setMinPaidAmount}
          onMaxChange={setMaxPaidAmount}
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
          <HStack>
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

