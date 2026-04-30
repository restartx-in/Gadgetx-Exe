import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
import { format, isValid } from "date-fns";
import { Transaction } from "@/constants/object/transaction";
import { CRUDITEM, CRUDTYPE } from "@/constants/object/crud";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { useIsMobile } from "@/utils/useIsMobile";
import { useToast } from "@/context/ToastContext";

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
  TdOverflow,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  ThDotMenu,
} from "@/components/Table";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import StatusButton from "@/apps/user/components/StatusButton";
import PopUpFilter from "@/components/PopUpFilter";
import PopupSearchField from "@/components/PopupSearchField";
import AddButton from "@/components/AddButton";
import RefreshButton from "@/components/RefreshButton";
import DateFilter from "@/components/DateFilter";
import ExportMenu from "@/components/ExportMenu";
import TableFooter from "@/components/TableFooter";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";
import RangeField from "@/components/RangeField";
import InputField from "@/components/InputField";
import DateField from "@/components/DateField";
import HStack from "@/components/HStack/component.jsx";
import VStack from "@/components/VStack";
import SelectField from "@/components/SelectField";
import TextBadge from "@/components/TextBadge";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import MobileSearchField from "@/components/MobileSearchField";
import ListItem from "@/components/ListItem/component";
import Spacer from "@/components/Spacer";


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

const PurchaseRow = React.memo(
  ({
    prchs,
    index,
    page,
    pageSize,
    handlers,
    columns,
    getPurchaseMenuItems,
    DotMenu,
    accountNameMap = {},
  }) => {
    const dueAmount = (prchs.total_amount || 0) - (prchs.paid_amount || 0);
    const menuItems = useMemo(
      () => getPurchaseMenuItems(prchs, handlers),
      [prchs, handlers],
    );

    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        {columns.map((field) => {
          if (field.value === "date")
            return <TdDate key={field.value}>{prchs.date}</TdDate>;
          
          if (field.value === "supplier")
            return (
              <TdOverflow key={field.value}>{prchs.party_name}</TdOverflow>
            );
          
          if (field.value === "invoice_number" || field.value === "invoice_no")
            return (
              <TdOverflow key={field.value}>{prchs.invoice_number}</TdOverflow>
            );
          
          if (field.value === "status" || field.value === "payment_status")
            return (
              <Td key={field.value}>
                <TextBadge variant="paymentStatus" type={prchs.status}>
                  {prchs.status}
                </TextBadge>
              </Td>
            );
          
          if (field.value === "account") {
            const fromPayments = [...new Set(prchs.payment_methods?.map((p) => p.account_name).filter(Boolean))].join(", ");
            const fallbackAccount = prchs.payment_methods?.length > 0 
              ? accountNameMap[prchs.payment_methods[0].account_id] 
              : null;

            return (
              <TdOverflow key={field.value}>
                {fromPayments || fallbackAccount || prchs.default_account_name || "N/A"}
              </TdOverflow>
            );
          }
          
          if (field.value === "total_amount")
            return (
              <TdNumeric key={field.value}>{prchs.total_amount}</TdNumeric>
            );
          if (field.value === "discount")
            return (
              <TdNumeric key={field.value}>{prchs.discount || 0}</TdNumeric>
            );
          if (field.value === "paid_amount")
            return (
              <TdNumeric key={field.value}>{prchs.paid_amount || 0}</TdNumeric>
            );
          if (field.value === "balance" || field.value === "due_amount")
            return (
              <TdNumeric key={field.value}>{dueAmount.toFixed(2)}</TdNumeric>
            );
          
          if (field.value === "done_by")
            return (
              <TdOverflow key={field.value}>
                {prchs.done_by_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "cost_center")
            return (
              <TdOverflow key={field.value}>
                {prchs.cost_center_name || "N/A"}
              </TdOverflow>
            );

          return <Td key={field.value}></Td>;
        })}
        <Td>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  },
);

const MobilePurchaseCard = React.memo(
  ({ prchs, handlers, getPurchaseMenuItems, DotMenu, accountNameMap = {} }) => {
    const dueAmount = (prchs.total_amount || 0) - (prchs.paid_amount || 0);
    const menuItems = useMemo(
      () => getPurchaseMenuItems(prchs, handlers),
      [prchs, handlers],
    );

    return (
      <ListItem
        title={prchs.party_name}
        subtitle={
          <>
            <div>{new Date(prchs.date).toLocaleDateString("en-IN")}</div>
            <div>
              Account:{" "}
              {[...new Set(prchs.payment_methods?.map((p) => p.account_name).filter(Boolean))].join(", ") ||
                (prchs.payment_methods?.length > 0 && accountNameMap[prchs.payment_methods[0].account_id]) ||
                prchs.default_account_name ||
                "N/A"}
            </div>
            {prchs.done_by_name && <div>Done By: {prchs.done_by_name}</div>}
            {prchs.cost_center_name && (
              <div>Cost Center: {prchs.cost_center_name}</div>
            )}
          </>
        }
        amount={
          <div style={{ display: "flex" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "bold" }}>
                {prchs.total_amount || 0}
              </div>
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
  },
);

const CommonPurchaseReport = ({ hooks = {}, components = {}, config = {} }) => {
  const {
    usePurchasesPaginated,
    useDeletePurchase,
    useSuppliers,
    useAccounts,
    usePurchaseById,
    useModeOfPayments,
    usePurchaseExportAndPrint,
    useReportFieldPermissions,
    useReportTableFieldsSettings,
    useUpdateReportFieldPermissions,
    useCreateReportFieldPermissions,
  } = hooks;

  const {
    TableTopContainer,
    AmountSummary,
    StatusButton,
    DotMenu,
    DeleteConfirmationModal,
    PaymentsModal,
    ReceiptModal,
    ReceiptPDF,
    AccountAutoComplete,
    DoneByAutoComplete,
    CostCenterAutoComplete,
  } = components;

  const { getPurchaseMenuItems, API_UPLOADS_BASE, buildUploadUrl, Report } =
    config;

  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // UI-specific state
  const [showFilter, setShowFilter] = useState(false);
  const [purchaseIdToFetch, setPurchaseIdToFetch] = useState(null);
  const [actionAfterFetch, setActionAfterFetch] = useState(null);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [selectedPurchasePayments, setSelectedPurchasePayments] = useState([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPurchaseForReceipt, setSelectedPurchaseForReceipt] =
    useState(null);
  const [headerFilters, setHeaderFilters] = useState({
    total_amount: "",
    paid_amount: "",
    due_amount: "",
    invoice_number: "",
  });
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [extraFields, setExtraFields] = useState([]);

  // Centralized state for all query params and filters
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    party_id: searchParams.get("partyId") || "",
    account_id: searchParams.get("accountId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    status: searchParams.get("status") || "",
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

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useReportFieldPermissions();
  const { mutate: updatePermissions, isLoading: isUpdatingPermissions } =
    useUpdateReportFieldPermissions();
  const { mutate: createPermissions, isLoading: isCreatingPermissions } =
    useCreateReportFieldPermissions();
  const { getExtraFields, getReportSettingsKey } = useReportTableFieldsSettings(
    Report.Purchase,
  );

  const allPossibleFields = useMemo(() => getExtraFields(), [getExtraFields]);
  const reportSettingsKey = useMemo(
    () => getReportSettingsKey(),
    [getReportSettingsKey],
  );

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
    sort: state.sort,
    partyId: state.party_id,
    accountId: state.account_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
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

  const { data, isLoading, refetch, isRefetching } =
    usePurchasesPaginated(state);
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useSuppliers();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();
  const { mutateAsync: deletePurchase, isLoading: isDeleting } =
    useDeletePurchase();
  const {
    data: purchaseDetails,
    isLoading: isDetailsLoading,
    isSuccess,
    isError,
  } = usePurchaseById(purchaseIdToFetch);

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading =
    isLoading || isRefetching || isDetailsLoading || isLoadingPermissions;

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers],
  );
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );
  const statusOptions = useMemo(
    () => [
      { value: "paid", label: "Paid" },
      { value: "partial", label: "Partial" },
      { value: "unpaid", label: "Unpaid" },
    ],
    [],
  );

  const accountNameMap = useMemo(
    () =>
      accounts.reduce((map, account) => {
        map[account.id] = account.name;
        return map;
      }, {}),
    [accounts],
  );

  const modeOfPaymentNameMap = useMemo(
    () =>
      modeOfPaymentList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [modeOfPaymentList],
  );

  const { exportToExcel, exportToPdf, printDocument } =
    usePurchaseExportAndPrint({
      listData: listData,
      reportType: "Purchase Report",
      duration:
        state.start_date && state.end_date
          ? `${state.start_date} to ${state.end_date}`
          : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: {
        totalAmount: data?.total_amount || 0,
        paidAmount: data?.paid_amount || 0,
        dueAmount: (data?.total_amount || 0) - (data?.paid_amount || 0),
      },
      filterDatas: {
        partyId: state.party_id,
        accountId: state.account_id,
        doneById: state.done_by_id,
        costCenterId: state.cost_center_id,
        status: state.status,
      },
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

  useEffect(() => {
    const handlePurchaseDetails = async () => {
      if (!isSuccess || !purchaseDetails || !actionAfterFetch) return;
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
          cleanedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
        const printSettings = JSON.parse(
          localStorage.getItem("PRINT_SETTINGS") || "{}",
        );
        const storeDetails = {
          company_name: printSettings.company_name || "Your Company",
          store: printSettings.store_name || "Main Store",
          address: printSettings.address || "123 Main St",
          email: printSettings.email || "contact@example.com",
          phone: printSettings.phone || "555-1234",
          full_header_image_url:
            buildUploadUrl(API_UPLOADS_BASE, printSettings.header_image_url) ||
            null,
        };

        const enrichedPaymentMethods = (
          purchaseDetails.payment_methods || []
        ).map((pm) => ({
          ...pm,
          mode_of_payment:
            modeOfPaymentNameMap[pm.mode_of_payment_id] ||
            accountNameMap[pm.account_id] ||
            "Unknown",
        }));
        const formattedData = {
          id: purchaseDetails.id,
          invoice_number: purchaseDetails.invoice_number,
          date: purchaseDetails.date,
          store: storeDetails,
          partner: {
            label: "Supplier",
            name: purchaseDetails.party_name || "N/A",
          },
          items: cleanedItems,
          summary: {
            subTotal,
            grandTotal: parseFloat(purchaseDetails.total_amount) || 0,
            orderTax: parseFloat(purchaseDetails.tax_amount) || 0,
            discount: parseFloat(purchaseDetails.discount) || 0,
            shipping: parseFloat(purchaseDetails.shipping_charge) || 0,
          },
          payment: {
            amountPaid: parseFloat(purchaseDetails.paid_amount) || 0,
            changeReturn: parseFloat(purchaseDetails.change_return) || 0,
          },
          payment_methods: enrichedPaymentMethods,
        };
        if (actionAfterFetch === "downloadPdf") {
          const barcodeImage = generateBarcodeImage(
            purchaseDetails.invoice_number,
          );
          const blob = await pdf(
            <ReceiptPDF
              title="Purchase Order"
              transactionData={formattedData}
              barcodeImage={barcodeImage}
            />,
          ).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `PurchaseOrder-${purchaseDetails.id}.pdf`,
          );
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          URL.revokeObjectURL(url);
        } else if (actionAfterFetch === "print") {
          setSelectedPurchaseForReceipt(formattedData);
          setIsReceiptModalOpen(true);
        }
      } catch (error) {
        console.error("Error processing purchase details:", error);
        showToast({
          message: "An unexpected error occurred.",
          crudType: "error",
        });
      } finally {
        setPurchaseIdToFetch(null);
        setActionAfterFetch(null);
      }
    };
    handlePurchaseDetails();
    if (isError) {
      showToast({
        message: "Failed to fetch purchase details.",
        crudType: "error",
      });
      setPurchaseIdToFetch(null);
      setActionAfterFetch(null);
    }
  }, [
    isSuccess,
    isError,
    purchaseDetails,
    actionAfterFetch,
    accountNameMap,
    modeOfPaymentNameMap,
    showToast,
  ]);

  useEffect(() => {
    setHeaderFilters({
      total_amount: state.total_amount || "",
      paid_amount: state.paid_amount || "",
      due_amount: state.due_amount || "",
      invoice_number: state.invoice_number || "",
    });
  }, [
    state.total_amount,
    state.paid_amount,
    state.due_amount,
    state.invoice_number,
  ]);

  const handleStatusFilterClick = useCallback(
    (newStatus) =>
      setState({
        page: 1,
        status: state.status === newStatus ? "" : newStatus,
      }),
    [state.status],
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
  const handleSort = useCallback(
    (value) => setState({ page: 1, sort: value }),
    [],
  );
  const handleSearch = useCallback(
    () =>
      setState({
        page: 1,
        searchType: state.searchType,
        searchKey: state.searchKey,
      }),
    [state.searchType, state.searchKey],
  );

  const handleHeaderSearch = useCallback((key, value) => {
    setState({
      [key]: value,
      ...(key === "total_amount" && {
        min_total_amount: "",
        max_total_amount: "",
      }),
      ...(key === "paid_amount" && {
        min_paid_amount: "",
        max_paid_amount: "",
      }),
      ...(key === "due_amount" && { min_due_amount: "", max_due_amount: "" }),
      page: 1,
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
      total_amount: "",
      paid_amount: "",
      due_amount: "",
      invoice_number: "",
    });
    setShowFilter(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setHeaderFilters({
      total_amount: "",
      paid_amount: "",
      due_amount: "",
      invoice_number: "",
    });
    setState({
      page: 1,
      page_size: 10,
      sort: "-date",
      party_id: "",
      account_id: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      status: "",
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
      searchType: "",
      searchKey: "",
      total_amount: "",
      paid_amount: "",
      due_amount: "",
      invoice_number: "",
    });
  }, [defaltCostCenter]);

  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    [],
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    [],
  );
  const handleAddClick = useCallback(
    () => navigate(`/purchase/add`),
    [navigate],
  );
  const handleEditClick = useCallback(
    (id) => navigate(`/purchase/edit/${id}`),
    [navigate],
  );
  const handleViewClick = useCallback(
    (id) => navigate(`/purchase/view/${id}`, { state: { mode: "view" } }),
    [navigate],
  );
  const handleCreatePurchaseReturn = useCallback(
    (id) => navigate(`/purchase-return/add`, { state: { purchaseId: id } }),
    [navigate],
  );
  const handleDownloadPdf = useCallback((id) => {
    setActionAfterFetch("downloadPdf");
    setPurchaseIdToFetch(id);
  }, []);
  const handlePrint = useCallback((id) => {
    setActionAfterFetch("print");
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
    } catch {
      showToast({
        crudItem: CRUDITEM.PURCHASE,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  }, [purchaseToDelete, deletePurchase, showToast, refetch]);

  const rowHandlers = useMemo(
    () => ({
      onView: handleViewClick,
      onEdit: handleEditClick,
      onDelete: setPurchaseToDelete,
      onDownloadPdf: handleDownloadPdf,
      onPrint: handlePrint,
      onCreatePurchaseReturn: handleCreatePurchaseReturn,
      onShowPayments: handleShowPayments,
    }),
    [
      handleViewClick,
      handleEditClick,
      handleDownloadPdf,
      handlePrint,
      handleCreatePurchaseReturn,
      handleShowPayments,
    ],
  );

  const searchOptions = useMemo(
    () => [
      { value: "party_name", name: "Supplier" },
      { value: "invoice_number", name: "Invoice No" },
      { value: "total_amount", name: "Total Amount" },
      { value: "done_by_name", name: "Done By" },
      { value: "status", name: "Status" },
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
    supplierOptions,
    isLoadingSuppliers,
    accountOptions,
    isLoadingAccounts,
    statusOptions,
    disableCostCenter: isDisableCostCenter,
    components,
  };

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
              title="Purchases"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              summary={
                !loading &&
                data && (
                  <div className="summary-with-status">
                    <HStack>
                      <AmountSummary
                        total={data.total_amount}
                        received={data.paid_amount}
                        pending={data.total_amount - data.paid_amount}
                      />
                      <StatusFilter
                        status={state.status}
                        handleStatusFilterClick={handleStatusFilterClick}
                      />
                    </HStack>
                  </div>
                )
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
                  <AddButton onClick={handleAddClick}>Add Purchase</AddButton>
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
                                    value="date"
                                    handleSort={handleSort}
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "supplier")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Supplier
                                  <ThFilterContainer>
                                    <ThSort
                                      handleSort={handleSort}
                                      sort={state.sort}
                                      value="party_name"
                                    />
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <SelectField
                                        value={state.party_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            party_id: e.target.value,
                                          })
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
                            );
                          if (field.value === "invoice_no" || field.value === "invoice_number")
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
                          if (field.value === "status")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Status
                                  <ThSort
                                    handleSort={handleSort}
                                    sort={state.sort}
                                    value="status"
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "account")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Account
                                  <ThFilterContainer>
                                    <ThSort
                                      handleSort={handleSort}
                                      sort={state.sort}
                                      value="account_id"
                                    />
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <AccountAutoComplete
                                        value={state.account_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            account_id: e.target.value,
                                          })
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
                            );
                          if (field.value === "total_amount")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Total Amount
                                  <ThFilterContainer>
                                    <ThSort
                                      handleSort={handleSort}
                                      sort={state.sort}
                                      value="total_amount"
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "total_amount",
                                          headerFilters.total_amount,
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
                            );
                          if (field.value === "discount")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Discount
                                  <ThSort
                                    handleSort={handleSort}
                                    sort={state.sort}
                                    value="discount"
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "paid_amount")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Paid Amount
                                  <ThFilterContainer>
                                    <ThSort
                                      handleSort={handleSort}
                                      sort={state.sort}
                                      value="paid_amount"
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "paid_amount",
                                          headerFilters.paid_amount,
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
                            );
                          if (field.value === "balance" || field.value === "due_amount")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Balance
                                  <ThFilterContainer>
                                    <ThSort
                                      handleSort={handleSort}
                                      sort={state.sort}
                                      value="due_amount"
                                    />
                                    <ThSearchOrFilterPopover
                                      isSearch={true}
                                      popoverWidth={220}
                                      onSearch={() =>
                                        handleHeaderSearch(
                                          "due_amount",
                                          headerFilters.due_amount,
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
                            );
                          if (field.value === "done_by")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Done By
                                  <ThSort
                                    handleSort={handleSort}
                                    sort={state.sort}
                                    value="done_by"
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "cost_center")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Cost Center
                                  <ThSort
                                    handleSort={handleSort}
                                    sort={state.sort}
                                    value="cost_center"
                                  />
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
                      listData.map((prchs, index) => (
                        <PurchaseRow
                          key={prchs.id}
                          prchs={prchs}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={rowHandlers}
                          columns={extraFields.filter((f) => f.show)}
                          getPurchaseMenuItems={getPurchaseMenuItems}
                          DotMenu={DotMenu}
                          accountNameMap={accountNameMap}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.Purchase}
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
            <PageTitleWithBackButton title="Purchases" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
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
                <div className="purchase_report__add_button">
                  <AddButton fullWidth onClick={handleAddClick} />
                </div>
              </PageHeader>
              <div className="purchase_report" style={{ marginTop: "0" }}>
                {loading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <p className="table_caption fs18 fw500 text-center py-4">
                    No {Transaction.Purchase} found.
                  </p>
                ) : (
                  <div>
                    {listData.map((prchs) => (
                      <MobilePurchaseCard
                        key={prchs.id}
                        prchs={prchs}
                        handlers={rowHandlers}
                        getPurchaseMenuItems={getPurchaseMenuItems}
                        DotMenu={DotMenu}
                        accountNameMap={accountNameMap}
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

const ListFilter = React.memo(
  ({ onApply, initialFilters, components, ...props }) => {
    const {
      showFilter,
      setShowFilter,
      supplierOptions,
      isLoadingSuppliers,
      accountOptions,
      isLoadingAccounts,
      statusOptions,
      disableCostCenter,
    } = props;
    const { AccountAutoComplete, DoneByAutoComplete, CostCenterAutoComplete } =
      components;

    const [localState, setLocalState] = useReducer(
      stateReducer,
      initialFilters,
    );
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
        <VStack spacing={4}>
          <SelectField
            label="Supplier"
            value={localState.party_id}
            onChange={(e) => setLocalState({ party_id: e.target.value })}
            options={[
              { value: "", label: "All Suppliers" },
              ...supplierOptions,
            ]}
            isLoading={isLoadingSuppliers}
          />
          <AccountAutoComplete
            label="Account"
            value={localState.account_id}
            onChange={(e) => setLocalState({ account_id: e.target.value })}
            options={[{ value: "", label: "All Accounts" }, ...accountOptions]}
            isLoading={isLoadingAccounts}
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
          <SelectField
            label="Status"
            placeholder="Status"
            value={localState.status}
            onChange={(e) => setLocalState({ status: e.target.value })}
            options={[{ value: "", label: "All Statuses" }, ...statusOptions]}
          />
          <RangeField
            label="Total Amount Range"
            minValue={localState.min_total_amount}
            maxValue={localState.max_total_amount}
            onMinChange={(v) => setLocalState({ min_total_amount: v })}
            onMaxChange={(v) => setLocalState({ max_total_amount: v })}
          />
          <RangeField
            label="Paid Amount Range"
            minValue={localState.min_paid_amount}
            maxValue={localState.max_paid_amount}
            onMinChange={(v) => setLocalState({ min_paid_amount: v })}
            onMaxChange={(v) => setLocalState({ max_paid_amount: v })}
          />
          <RangeField
            label="Discount Range"
            minValue={localState.min_discount}
            maxValue={localState.max_discount}
            onMinChange={(v) => setLocalState({ min_discount: v })}
            onMaxChange={(v) => setLocalState({ max_discount: v })}
          />
          <RangeField
            label="Balance Range"
            minValue={localState.min_due_amount}
            maxValue={localState.max_due_amount}
            onMinChange={(v) => setLocalState({ min_due_amount: v })}
            onMaxChange={(v) => setLocalState({ max_due_amount: v })}
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
                value={
                  localState.end_date ? new Date(localState.end_date) : null
                }
                onChange={(date) =>
                  setLocalState({
                    end_date: date ? date.toISOString().split("T")[0] : "",
                  })
                }
              />
            </>
          ) : (
            <HStack>
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
                value={
                  localState.end_date ? new Date(localState.end_date) : null
                }
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
  },
);

const StatusFilter = ({ status, handleStatusFilterClick }) => {
  return (
    <div className="status-filter-box">
      <div className="status-filter-row">
        <StatusButton
          size="sm"
          variant="all"
          isSelected={status === ""}
          onClick={() => handleStatusFilterClick("")}
        >
          All
        </StatusButton>
        <StatusButton
          size="sm"
          variant="available"
          isSelected={status === "paid"}
          onClick={() => handleStatusFilterClick("paid")}
        >
          Paid
        </StatusButton>
      </div>
      <div className="status-filter-row">
        <StatusButton
          size="sm"
          variant="maintenance"
          isSelected={status === "partial"}
          onClick={() => handleStatusFilterClick("partial")}
        >
          Partial
        </StatusButton>
        <StatusButton
          size="sm"
          variant="sold"
          isSelected={status === "unpaid"}
          onClick={() => handleStatusFilterClick("unpaid")}
        >
          Unpaid
        </StatusButton>
      </div>
    </div>
  );
};

export default CommonPurchaseReport;