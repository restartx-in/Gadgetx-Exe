// The purchase.repository.js section remains unchanged as it was already fixed.

import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import JsBarcode from 'jsbarcode';
import usePurchasesPaginated from "@/hooks/api/purchase/usePurchasesPaginated";
import useDeletePurchase from "@/hooks/api/purchase/useDeletePurchase";
import useSuppliers from "@/hooks/api/supplier/useSuppliers";
import useAccounts from "@/hooks/api/account/useAccounts";
import { usePurchaseById } from "@/hooks/api/purchase/usePurchaseById";
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
import SelectField from "@/components/SelectField";
import PageHeader from "@/components/PageHeader";
import TableTopContainer from "@/components/TableTopContainer";
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
import DotMenu from "@/components/DotMenu/component";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal/component";
import { getPurchaseMenuItems } from "@/config/menuItems.jsx";
import AmountSummary from "@/components/AmountSummary";
import DateFilter from "@/components/DateFilter";
import ReceiptPDF from "@/apps/user/components/ReceiptPDF";
import PaymentsModal from "@/apps/user/components/PaymentsModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TextBadge from "@/apps/user/components/TextBadge"; // ADDED
import { format, isValid } from "date-fns";
import { API_FILES as server } from '@/config/api'; 
import { usePurchaseExportAndPrint } from "@/hooks/api/exportAndPrint/usePurchaseExportAndPrint";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import "./style.scss";
import ExportMenu from "@/components/ExportMenu";

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

// Extracted Row Component using React.memo
const PurchaseRow = React.memo(({ prchs, index, page, pageSize, handlers }) => {
  const dueAmount = (prchs.total_amount || 0) - (prchs.paid_amount || 0);
  const menuItems = useMemo(() => getPurchaseMenuItems(prchs, handlers), [prchs, handlers]);

  return (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{prchs.date}</TdDate>
      <Td>{prchs.party_name}</Td>
      <Td>{prchs.invoice_number}</Td>
      <Td>
        {(prchs.payment_methods && prchs.payment_methods.length > 0
          ? prchs.payment_methods.map((p) => p.account_name).join(", ")
          : "N/A") || "N/A"}
      </Td>
      <Td>{prchs.done_by_name || "N/A"}</Td>
      <Td>{prchs.cost_center_name || "N/A"}</Td>
      <TdNumeric>{prchs.total_amount}</TdNumeric>
      <TdNumeric>{prchs.discount || 0}</TdNumeric>
      <TdNumeric>{prchs.paid_amount || 0}</TdNumeric>
      <TdNumeric>{dueAmount.toFixed(2)}</TdNumeric>
      <Td> {/* ADDED Status Cell */}
        <TextBadge variant="paymentStatus" type={prchs.status}>
          {prchs.status}
        </TextBadge>
      </Td>
      <Td>
        <DotMenu items={menuItems} />
      </Td>
    </Tr>
  );
});

// Extracted Mobile List Item using React.memo
const MobilePurchaseCard = React.memo(({ prchs, handlers }) => {
  const dueAmount = (prchs.total_amount || 0) - (prchs.paid_amount || 0);
  const menuItems = useMemo(() => getPurchaseMenuItems(prchs, handlers), [prchs, handlers]);

  return (
    <ListItem
      title={prchs.party_name}
      subtitle={
        <>
          <div>{new Date(prchs.date).toLocaleDateString("en-IN")}</div>
          <div>
            Account:{" "}
            {(prchs.payment_methods && prchs.payment_methods.length > 0
              ? prchs.payment_methods.map((p) => p.account_name).join(", ")
              : "N/A") || "N/A"}
          </div>
          {prchs.done_by_name && <div>Done By: {prchs.done_by_name}</div>}
          {prchs.cost_center_name && (
            <div>Cost Center: {prchs.cost_center_name}</div>
          )}
        </>
      }
      amount={
        <div style={{ display: 'flex'}}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 'bold' }}>{prchs.total_amount || 0}</div>
            {parseFloat(prchs.paid_amount || 0) !== 0 && (
              <div className="fs12 text-success">
                Paid: {prchs.paid_amount || 0}
              </div>
            )}
            {parseFloat(dueAmount.toFixed(2)) !== 0 && (
              <div className="fs12 text-danger">
                Balance: {dueAmount.toFixed(2)}
              </div>
            )}
            {prchs.status && (
              <TextBadge variant="paymentStatus" type={prchs.status}>
                {prchs.status}
              </TextBadge>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DotMenu items={menuItems} />
          </div>
        </div>
      }
      actions={null}
    />
  );
});

const PurchaseReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // UI States for filter inputs (Local State - Remain useState)
  const [partyId, setPartyId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter);
  const [status, setStatus] = useState(""); // ADDED Status UI State
  const [minTotalAmount, setMinTotalAmount] = useState("");
  const [maxTotalAmount, setMaxTotalAmount] = useState("");
  const [minPaidAmount, setMinPaidAmount] = useState("");
  const [maxPaidAmount, setMaxPaidAmount] = useState("");
  const [minDiscount, setMinDiscount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minDueAmount, setMinDueAmount] = useState("");
  const [maxDueAmount, setMaxDueAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("-date");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");
  
  // Other Component States
  const [showFilter, setShowFilter] = useState(false);
  const [headerSupplier, setHeaderSupplier] = useState("");
  const [headerAccount, setHeaderAccount] = useState("");
  const [purchaseIdToFetch, setPurchaseIdToFetch] = useState(null);
  const [actionAfterFetch, setActionAfterFetch] = useState(null);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [selectedPurchasePayments, setSelectedPurchasePayments] = useState([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPurchaseForReceipt, setSelectedPurchaseForReceipt] =
    useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    rangeType: "custom",
  });
  const [filterDatas, setFilterDatas] = useState({});
  const [headerFilters, setHeaderFilters] = useState({
    total_amount: "",
    paid_amount: "",
    due_amount: "",
    invoice_number: "",
  });

  // --- 1. Centralized state initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    party_id: searchParams.get("partyId") || "",
    account_id: searchParams.get("accountId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    status: searchParams.get("status") || "", // ADDED Status to central state
    min_total_amount: searchParams.get("minTotal") || "",
    max_total_amount: searchParams.get("maxTotal") || "",
    min_paid_amount: searchParams.get("minPaid") || "",
    max_paid_amount: searchParams.get("maxPaid") || "",
    min_discount: searchParams.get("minDiscount") || "",
    max_discount: searchParams.get("maxDiscount") || "",
    min_due_amount: searchParams.get("minDue") || "",
    max_due_amount: searchParams.get("maxDue") || "",
    total_amount: searchParams.get("totalAmount") || "",
    paid_amount: searchParams.get("paidAmount") || "",
    due_amount: searchParams.get("dueAmount") || "",
    invoice_number: searchParams.get("invoiceNumber") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });
  
  // --- 2. Sync state to URL using custom hook ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    partyId: state.party_id,
    accountId: state.account_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status, // ADDED
    minTotal: state.min_total_amount,
    maxTotal: state.max_total_amount,
    minPaid: state.min_paid_amount,
    maxPaid: state.max_paid_amount,
    minDiscount: state.min_discount,
    maxDiscount: state.max_discount,
    minDue: state.min_due_amount,
    maxDue: state.max_due_amount,
    totalAmount: state.total_amount,
    paidAmount: state.paid_amount,
    dueAmount: state.due_amount,
    invoiceNumber: state.invoice_number,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });


  // API Calls
  const { data, isLoading, refetch, isRefetching } = usePurchasesPaginated(state);
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { mutateAsync: deletePurchase, isLoading: isDeleting } = useDeletePurchase();
  const {
    data: purchaseDetails,
    isLoading: isDetailsLoading,
    isSuccess,
    isError,
  } = usePurchaseById(purchaseIdToFetch);

  // Derived Data (Matching ExpenseReport pattern)
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1; // Direct assignment
  const totalItems = data?.count || 0;      // Direct assignment
  const loading = isLoading || isRefetching || isDetailsLoading;

  // Options Memoization
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers]
  );
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts]
  );
  const statusOptions = useMemo(() => ([ // ADDED Status Options
    { value: "paid", label: "Paid" },
    { value: "partial", label: "Partial" },
    { value: "unpaid", label: "Unpaid" },
  ]), []);

  const [purchaseToDelete, setPurchaseToDelete] = useState(null);

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    setPartyId(state.party_id || "");
    setAccountId(state.account_id || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    setStatus(state.status || ""); // ADDED Status sync
    setMinTotalAmount(state.min_total_amount || "");
    setMaxTotalAmount(state.max_total_amount || "");
    setMinPaidAmount(state.min_paid_amount || "");
    setMaxPaidAmount(state.max_paid_amount || "");
    setMinDiscount(state.min_discount || "");
    setMaxDiscount(state.max_discount || "");
    setMinDueAmount(state.min_due_amount || "");
    setMaxDueAmount(state.max_due_amount || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setSort(state.sort || "-date");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      total_amount: state.total_amount || "",
      paid_amount: state.paid_amount || "",
      due_amount: state.due_amount || "",
      invoice_number: state.invoice_number || "",
    });
    setHeaderSupplier(state.party_id || "");
    setHeaderAccount(state.account_id || "");
    setDateFilter({
        startDate: state.start_date || null,
        endDate: state.end_date || null,
        rangeType: 'custom',
    });
  }, [state, defaltCostCenter]);


  // Update filterDatas for export
  useEffect(() => {
    setFilterDatas({
      partyId: partyId,
      accountId,
      doneById,
      costCenterId,
      status, // ADDED
      headerSupplier,
      headerAccount
    });
  }, [partyId, accountId, doneById, costCenterId, status, headerSupplier, headerAccount]);

  // Export Config
  const { exportToExcel, exportToPdf, printDocument } = usePurchaseExportAndPrint({
    listData: listData,
    reportType: "Purchase Report",
    duration: state.start_date && state.end_date ? `${state.start_date} to ${state.end_date}` : "",
    pageNumber: state.page,
    selectedPageCount: state.page_size,
    totalPage: totalPages,
    totalData: {
      totalAmount: data?.total_amount || 0,
      paidAmount: data?.paid_amount || 0,
      dueAmount: (data?.total_amount || 0) - (data?.paid_amount || 0),
    },
    filterDatas,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  // PDF/Receipt Logic
  useEffect(() => {
    const handlePurchaseDetails = async () => {
      if (!isSuccess || !purchaseDetails || !actionAfterFetch) {
        return;
      }
      
      try {
        const cleanedItems = (purchaseDetails.items || [])
          .filter((item) => item && item.item_name)
          .map((item) => ({
            name: item.item_name,
            quantity: parseFloat(item.quantity) || 0,
            price: parseFloat(item.unit_price) || 0,
          }));

        const subTotal =
          parseFloat(purchaseDetails.sub_total) ||
          cleanedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const printSettingsString = localStorage.getItem('PRINT_SETTINGS') || '{}';
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

        const formattedData = {
          id: purchaseDetails.id,
          invoice_number: purchaseDetails.invoice_number,
          store: storeDetails,
          date: purchaseDetails.date,
          partner: {
            label: "Supplier",
            name: purchaseDetails.party_name || "N/A",
          },
          items: cleanedItems,
          summary: {
            subTotal: subTotal,
            grandTotal: parseFloat(purchaseDetails.total_amount) || 0,
            discount: parseFloat(purchaseDetails.discount) || 0,
            orderTax: 0,
            shipping: 0,
          },
          payment: {
            amountPaid: parseFloat(purchaseDetails.paid_amount) || 0,
          },
        };

        if (actionAfterFetch === "downloadPdf") {
          const barcodeImage = generateBarcodeImage(purchaseDetails.invoice_number);
          
          const blob = await pdf(
            <ReceiptPDF 
              title="Purchase Order" 
              transactionData={formattedData} 
              barcodeImage={barcodeImage} 
            />
          ).toBlob();

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `PurchaseOrder-${purchaseDetails.id}.pdf`
          );
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          URL.revokeObjectURL(url);
          
          setPurchaseIdToFetch(null);
          setActionAfterFetch(null);

        } else if (actionAfterFetch === "downloadReceipt") {
          setSelectedPurchaseForReceipt(formattedData);
          setIsReceiptModalOpen(true);
        }
      } catch (error) {
        console.error("Error processing purchase details:", error);
        showToast({ message: "An unexpected error occurred.", crudType: "error" });
      }
    };
    
    handlePurchaseDetails();
    
    if (isError) {
      showToast({ message: "Failed to fetch purchase details.", crudType: "error" });
      setPurchaseIdToFetch(null);
      setActionAfterFetch(null);
    }
  }, [isSuccess, isError, purchaseDetails, showToast, actionAfterFetch]);

  // --- Handlers (Memoized) - UPDATED setState CALLS ---
  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState({ // Simplified setState
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleSort = useCallback((value) => {
    setState({ page: 1, sort: value }); // Simplified setState
  }, []);

  const handleSearch = useCallback(() => {
    setState({ // Simplified setState
      page: 1,
      searchType,
      searchKey,
    });
  }, [searchType, searchKey]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ // Simplified setState
      [key]: value,
      ...(key === "total_amount" && { min_total_amount: "", max_total_amount: "" }),
      ...(key === "paid_amount" && { min_paid_amount: "", max_paid_amount: "" }),
      ...(key === "due_amount" && { min_due_amount: "", max_due_amount: "" }),
      page: 1,
    });
  }, []);

  const handleHeaderKeyDown = useCallback((e, key) => {
    if (e.key === "Enter") {
      handleHeaderSearch(key, headerFilters[key]);
    }
  }, [headerFilters, handleHeaderSearch]);

  const handleFilter = useCallback(() => {
    setState({ // Simplified setState
      party_id: partyId,
      account_id: accountId,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      status: status, // ADDED
      min_total_amount: minTotalAmount,
      max_total_amount: maxTotalAmount,
      min_paid_amount: minPaidAmount,
      max_paid_amount: maxPaidAmount,
      min_discount: minDiscount,
      max_discount: maxDiscount,
      min_due_amount: minDueAmount,
      max_due_amount: maxDueAmount,
      start_date: startDate,
      end_date: endDate,
      page: 1,
    });
    setShowFilter(false);
  }, [partyId, accountId, doneById, costCenterId, status, minTotalAmount, maxTotalAmount, minPaidAmount, maxPaidAmount, minDiscount, maxDiscount, minDueAmount, maxDueAmount, startDate, endDate]);

  const handleRefresh = useCallback(() => {
    // Reset local state (UI)
    setPartyId("");
    setAccountId("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId(defaltCostCenter);
    setStatus(""); // ADDED
    setMinTotalAmount("");
    setMaxTotalAmount("");
    setMinPaidAmount("");
    setMaxPaidAmount("");
    setMinDiscount("");
    setMaxDiscount("");
    setMinDueAmount("");
    setMaxDueAmount("");
    setStartDate("");
    setEndDate("");
    setSearchKey("");
    setSearchType("");
    setHeaderSupplier("");
    setHeaderAccount("");
    setSort("-date");
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setHeaderFilters({ total_amount: "", paid_amount: "", due_amount: "", invoice_number: "" });
    
    // Reset Main State
    setState({ // Simplified setState
      party_id: "",
      account_id: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      status: "", // ADDED
      min_total_amount: "",
      max_total_amount: "",
      min_paid_amount: "",
      max_paid_amount: "",
      min_discount: "",
      max_discount: "",
      min_due_amount: "",
      max_due_amount: "",
      start_date: "",
      end_date: "",
      page: 1,
      page_size: 10,
      sort: "-date",
      searchType: "",
      searchKey: "",
      total_amount: "",
      paid_amount: "",
      due_amount: "",
      invoice_number: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const handleHeaderSupplierFilter = useCallback((value) => {
    setHeaderSupplier(value);
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

  const handleAddClick = useCallback(() => navigate(`/purchase/add`), [navigate]);
  const handleEditClick = useCallback((id) => navigate(`/purchase/edit/${id}`), [navigate]);
  const handleViewClick = useCallback((id) => navigate(`/purchase/view/${id}`, { state: { mode: "view" } }), [navigate]);
  const handleCreatePurchaseReturn = useCallback((id) => navigate(`/purchase-return/add`, { state: { purchaseId: id } }), [navigate]);

  const handleDownloadPdf = useCallback((id) => {
    setActionAfterFetch("downloadPdf");
    setPurchaseIdToFetch(id);
  }, []);

  const handleDownloadReceipt = useCallback((id) => {
    setActionAfterFetch("downloadReceipt");
    setPurchaseIdToFetch(id);
  }, []);

  const handleShowPayments = useCallback((purchaseData) => {
    const payments = (purchaseData.payment_methods || []).map((p, index) => ({
      id: index + 1,
      date: purchaseData.date,
      reference: `Purchase #${purchaseData.id}`,
      amount: p.amount || 0,
      paidFrom: p.account_name || "N/A",
    }));
    setSelectedPurchasePayments(payments);
    setIsPaymentsModalOpen(true);
  }, []);

  const handleClosePaymentsModal = useCallback(() => {
    setIsPaymentsModalOpen(false);
    setSelectedPurchasePayments([]);
  }, []);

  const handleCloseReceiptModal = useCallback(() => {
    setIsReceiptModalOpen(false);
    setSelectedPurchaseForReceipt(null);
    setPurchaseIdToFetch(null);
    setActionAfterFetch(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!purchaseToDelete) return;
    try {
      await deletePurchase(purchaseToDelete.id);
      showToast({
        crudItem: CRUDITEM.PURCHASE,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      setPurchaseToDelete(null);
      refetch();
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.PURCHASE,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  }, [purchaseToDelete, deletePurchase, showToast, refetch]);


  // Memoized Handlers passed to rows
  const rowHandlers = useMemo(() => ({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: setPurchaseToDelete,
    onDownloadPdf: handleDownloadPdf,
    onDownloadReceipt: handleDownloadReceipt,
    onCreatePurchaseReturn: handleCreatePurchaseReturn,
    onShowPayments: handleShowPayments,
  }), [handleViewClick, handleEditClick, handleDownloadPdf, handleDownloadReceipt, handleCreatePurchaseReturn, handleShowPayments]);

  const searchOptions = useMemo(() => ([
    { value: "party_name", name: "Supplier" },
    { value: "invoice_number", name: "Invoice No" },
    { value: "total_amount", name: "Total Amount" },
    { value: "done_by_name", name: "Done By" },
    { value: "status", name: "Status" }, // ADDED Search Option
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ]), [isDisableCostCenter]);

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    partyId,
    setPartyId,
    supplierOptions,
    isLoadingSuppliers,
    accountId,
    setAccountId,
    accountOptions,
    isLoadingAccounts,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    status, // ADDED
    setStatus, // ADDED
    statusOptions, // ADDED
    minTotalAmount,
    setMinTotalAmount,
    maxTotalAmount,
    setMaxTotalAmount,
    minPaidAmount,
    setMinPaidAmount,
    maxPaidAmount,
    setMaxPaidAmount,
    minDiscount,
    setMinDiscount,
    maxDiscount,
    setMaxDiscount,
    minDueAmount,
    setMinDueAmount,
    maxDueAmount,
    setMaxDueAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    disableCostCenter: isDisableCostCenter,
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
            <PageTitleWithBackButton
              title="Purchases"
              subtitle={dateSubtitle}
            />
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
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                  <AddButton onClick={handleAddClick}>Add Purchase</AddButton>

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
                          Supplier
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="party_name"
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <SelectField
                                value={headerSupplier}
                                onChange={(e) =>
                                  handleHeaderSupplierFilter(e.target.value)
                                }
                                options={[
                                  { value: "", label: "All Suppliers" },
                                  ...supplierOptions,
                                ]}
                                isLoading={isLoadingSuppliers}
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
                                value={headerAccount}
                                onChange={(e) =>
                                  handleHeaderAccountFilter(e.target.value)
                                }
                                options={[
                                  { value: "", label: "All Accounts" },
                                  ...accountOptions,
                                ]}
                                isLoading={isLoadingAccounts}
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
                                placeholder="Search Amount"
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
                          Discount
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="discount"
                            />
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
                                placeholder="Search Amount"
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
                        <ThContainer>
                          Balance
                          <ThFilterContainer>
                            <ThSort
                              handleSort={handleSort}
                              sort={sort}
                              setSort={setSort}
                              value="due_amount"
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "due_amount",
                                  headerFilters.due_amount
                                )
                              }
                            >
                              <InputField
                              
                                placeholder="Search Amount"
                                type="number"
                                value={headerFilters.due_amount}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    due_amount: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "due_amount")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Status {/* ADDED Status Header */}
                          <ThSort
                            handleSort={handleSort}
                            sort={sort}
                            setSort={setSort}
                            value="status"
                          />
                        </ThContainer>
                      </Th>
                      <ThDotMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((prchs, index) => (
                        <PurchaseRow
                          key={prchs.id}
                          prchs={prchs}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={rowHandlers}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Purchase} noOfCol={12} />
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
            <PageTitleWithBackButton title="Purchases" />
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
                <div className="purchase_report__add_button">
                  <AddButton fullWidth onClick={handleAddClick} />
                </div>
              </PageHeader>
              <div className="purchase_report" style={{ marginTop: "0" }}>
                {loading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.Purchase} />
                ) : (
                  <div>
                    {listData.map((prchs) => (
                      <MobilePurchaseCard 
                        key={prchs.id} 
                        prchs={prchs} 
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
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={handleDelete}
        transactionName={`purchase for ${purchaseToDelete?.party_name}`}
        isLoading={isDeleting}
      />
      <PaymentsModal
        isOpen={isPaymentsModalOpen}
        onClose={handleClosePaymentsModal}
        payments={selectedPurchasePayments}
        type="purchase"
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceiptModal}
        transactionData={selectedPurchaseForReceipt}
      />
    </>
  );
};

export default PurchaseReport;

// Memoized List Filter
const ListFilter = React.memo(({ ...props }) => {
  const {
    showFilter,
    setShowFilter,
    handleFilter,
    partyId,
    setPartyId,
    supplierOptions,
    isLoadingSuppliers,
    accountId,
    setAccountId,
    accountOptions,
    isLoadingAccounts,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    status, // ADDED
    setStatus, // ADDED
    statusOptions, // ADDED
    minTotalAmount,
    setMinTotalAmount,
    maxTotalAmount,
    setMaxTotalAmount,
    minPaidAmount,
    setMinPaidAmount,
    maxPaidAmount,
    setMaxPaidAmount,
    minDiscount,
    setMinDiscount,
    maxDiscount,
    setMaxDiscount,
    minDueAmount,
    setMinDueAmount,
    maxDueAmount,
    setMaxDueAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    disableCostCenter
  } = props;

  const isMobile = useIsMobile();
  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack spacing={4}>
        <SelectField
          label="Supplier"
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          options={[{ value: "", label: "All Suppliers" }, ...supplierOptions]}
          isLoading={isLoadingSuppliers}
        />
        <AccountAutoComplete
          label="Account"
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
          disabled={disableCostCenter} 

        />
        <SelectField // ADDED Status Select Field
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
        <RangeField
          label="Discount Range"
          minValue={minDiscount}
          maxValue={maxDiscount}
          onMinChange={setMinDiscount}
          onMaxChange={setMaxDiscount}
        />
        <RangeField
          label="Balance Range"
          minValue={minDueAmount}
          maxValue={maxDueAmount}
          onMinChange={setMinDueAmount}
          onMaxChange={setMaxDueAmount}
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