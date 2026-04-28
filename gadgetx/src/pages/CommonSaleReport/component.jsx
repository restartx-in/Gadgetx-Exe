import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import JsBarcode from "jsbarcode";
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
  TdOverflow,
  ThDotMenu,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import HStack from "@/components/HStack/component.jsx";
import VStack from "@/components/VStack";
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
import ListItem from "@/components/ListItem/component";
import TextBadge from "@/components/TextBadge";
import { format, isValid } from "date-fns";
import ExportMenu from "@/components/ExportMenu";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";
import FullScreenButton from "@/components/FullScreenButton";
import DateFilter from "@/components/DateFilter";

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

const SaleRow = React.memo(
  ({
    sls,
    index,
    page,
    pageSize,
    handlers,
    columns,
    getSaleMenuItems,
    DotMenu,
    accountNameMap,
    modeOfPaymentList,
  }) => {
    const balance = (parseFloat(sls.total_amount) || 0) - ((parseFloat(sls.paid_amount) || 0) - (parseFloat(sls.change_return) || 0));

    const menuItems = useMemo(
      () => getSaleMenuItems(sls, handlers),
      [sls, handlers, getSaleMenuItems],
    );

    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        
        {columns.map((field) => {
          if (field.value === "date") {
            return <TdDate key={field.value}>{sls.date}</TdDate>;
          }
          if (field.value === "party_name" || field.value === "customer") {
            return (
              <TdOverflow key={field.value}>
                {sls.party_name || "Walk-in"}
              </TdOverflow>
            );
          }
          if (field.value === "invoice_number") {
            return (
              <TdOverflow key={field.value}>{sls.invoice_number}</TdOverflow>
            );
          }
          if (field.value === "payment_status" || field.value === "status") {
            return (
              <Td key={field.value}>
                <TextBadge variant="paymentStatus" type={sls.status}>
                  {sls.status}
                </TextBadge>
              </Td>
            );
          }
          
          // --- UPDATED ACCOUNT LOGIC ---
          if (field.value === "account") {
            const fromPayments = (sls.payment_methods || [])
              .map((p) => p.account_name)
              .filter(Boolean)
              .join(", ");
            
            let accountDisplay = 
              sls.ledger_name || 
              fromPayments || 
              accountNameMap[sls.ledger_id] || 
              "";
  
            if (!accountDisplay && sls.mode_of_payment_id) {
              const mop = modeOfPaymentList.find(m => String(m.id) === String(sls.mode_of_payment_id));
              if (mop) {
                accountDisplay = accountNameMap[mop.default_ledger_id] || mop.name;
              }
            }

            return (
              <TdOverflow key={field.value}>
                {accountDisplay || "N/A"}
              </TdOverflow>
            );
          }
          
          if (field.value === "total_amount") {
            return <TdNumeric key={field.value}>{sls.total_amount}</TdNumeric>;
          }
          if (field.value === "paid_amount") {
            return (
              <TdNumeric key={field.value}>{sls.paid_amount || 0}</TdNumeric>
            );
          }
          if (field.value === "balance") {
            return (
              <TdNumeric key={field.value}>{balance.toFixed(2)}</TdNumeric>
            );
          }
          if (field.value === "done_by") {
            return (
              <TdOverflow key={field.value}>
                {sls.done_by_name || "N/A"}
              </TdOverflow>
            );
          }
          if (field.value === "cost_center") {
            return (
              <TdOverflow key={field.value}>
                {sls.cost_center_name || "N/A"}
              </TdOverflow>
            );
          }
          if (field.value === "is_online") {
            return (
              <Td key={field.value}>
                 {sls.is_online ? "Yes" : "No"}
              </Td>
            );
          }

          return <Td key={field.value}>-</Td>;
        })}
        <Td>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  },
);

const MobileSaleCard = React.memo(
  ({ sls, handlers, getSaleMenuItems, DotMenu, accountNameMap, modeOfPaymentList }) => {
    const fromPayments = (sls.payment_methods || [])
      .map((p) => p.account_name)
      .filter(Boolean)
      .join(", ");
    
    let accountDisplay = 
      sls.ledger_name || 
      fromPayments || 
      accountNameMap[sls.ledger_id] || 
      "";

    if (!accountDisplay && sls.mode_of_payment_id) {
      const mop = modeOfPaymentList.find(m => String(m.id) === String(sls.mode_of_payment_id));
      if (mop) {
        accountDisplay = accountNameMap[mop.default_ledger_id] || mop.name;
      }
    }
    const menuItems = useMemo(
      () => getSaleMenuItems(sls, handlers),
      [sls, handlers, getSaleMenuItems],
    );
    return (
      <ListItem
        title={sls.party_name || "N/A"}
        subtitle={
          <>
            <div className="fs14">
              Account: {accountDisplay || "N/A"}
            </div>
            {sls.done_by_name && (
              <div className="fs14">Done By: {sls.done_by_name}</div>
            )}
          </>
        }
        amount={
          <div style={{ display: "flex" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "bold" }}>{sls.total_amount || 0}</div>
              {parseFloat(sls.paid_amount || 0) !== 0 && (
                <div className="fs14 text-success">
                  Received: {sls.paid_amount}
                </div>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DotMenu items={menuItems} />
            </div>
          </div>
        }
      />
    );
  },
);

const CommonSaleReport = ({ hooks, components, config }) => {
  const {
    useSalesPaginated,
    useAccounts,
    useCustomers,
    useDoneBys,
    useCostCenters,
    useDeleteSales,
    useSalesById,
    useModeOfPayments,
    useSaleExportAndPrint,
    useReportFieldPermissions,
    useReportTableFieldsSettings,
    useUpdateReportFieldPermissions,
    useCreateReportFieldPermissions,
  } = hooks;
  const {
    TableTopContainer,
    DotMenu,
    DeleteConfirmationModal,
    InvoiceModal,
    ReceiptModal,
    ReceiptPDF,
    AmountSummary,
    PaymentsModal,
    AccountAutoComplete,
    CustomerAutoComplete,
    DoneByAutoComplete,
    CostCenterAutoComplete,
    StatusButton,
  } = components;
  const { getSaleMenuItems, API_UPLOADS_BASE, buildUploadUrl, Report } = config;

  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
  const [saleIdToFetch, setSaleIdToFetch] = useState(null);
  const [actionAfterFetch, setActionAfterFetch] = useState(null);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [selectedSalePayments, setSelectedSalePayments] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [extraFields, setExtraFields] = useState([]);

  const [headerFilters, setHeaderFilters] = useState({
    total_amount: "",
    paid_amount: "",
    invoice_number: "",
  });
  const [localFilterState, setLocalFilterState] = useState({
    party_id: "",
    account_id: "",
    done_by_id: "",
    cost_center_id: "",
  });

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    party_id: searchParams.get("customerId") || "",
    account_id: searchParams.get("accountId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    status: searchParams.get("status") || "",
    total_amount: searchParams.get("totalAmount") || "",
    paid_amount: searchParams.get("paidAmount") || "",
    invoice_number: searchParams.get("invoiceNumber") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  useEffect(() => {
    setHeaderFilters({
      total_amount: state.total_amount,
      paid_amount: state.paid_amount,
      invoice_number: state.invoice_number,
    });
    setLocalFilterState({
      party_id: state.party_id,
      account_id: state.account_id,
      done_by_id: state.done_by_id,
      cost_center_id: state.cost_center_id,
    });
  }, [state]);

  const { getExtraFields, getReportSettingsKey } = useReportTableFieldsSettings(
    Report.Sale,
  );
  const allPossibleFields = useMemo(() => getExtraFields(), [getExtraFields]);
  const reportSettingsKey = useMemo(
    () => getReportSettingsKey(),
    [getReportSettingsKey],
  );
  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useReportFieldPermissions();
  const { mutate: updatePermissions, isLoading: isUpdatingPermissions } = useUpdateReportFieldPermissions();
  const { mutate: createPermissions, isLoading: isCreatingPermissions } = useCreateReportFieldPermissions();

  const isSavingColumns = isUpdatingPermissions || isCreatingPermissions;

  const authDetails = useMemo(
    () => JSON.parse(localStorage.getItem("AUTH_DETAILS") || "{}"),
    [],
  );
  const currentUserId = authDetails?.data?.id;

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
    customerId: state.party_id,
    accountId: state.account_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
    totalAmount: state.total_amount,
    paidAmount: state.paid_amount,
    invoiceNumber: state.invoice_number,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const {
    data,
    isLoading: isListLoading,
    refetch: refetchList,
    isRefetching,
  } = useSalesPaginated(state);
  const { data: accounts = [] } = useAccounts();
  const { data: customers = [] } = useCustomers();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();
  const { mutateAsync: deleteSale, isLoading: isDeleting } = useDeleteSales();
  const { data: doneBy = [] } = useDoneBys();
  const { data: costCenter = [] } = useCostCenters();
  const { data: saleDetails, isSuccess } = useSalesById(saleIdToFetch);

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isListLoading || isRefetching || isLoadingPermissions;

  const customerNameMap = useMemo(
    () => customers.reduce((m, c) => ({ ...m, [c.id]: c.name }), {}),
    [customers],
  );
  const accountNameMap = useMemo(
    () => accounts.reduce((m, a) => ({ ...m, [a.id]: a.name }), {}),
    [accounts],
  );
  const modeOfPaymentNameMap = useMemo(
    () => modeOfPaymentList.reduce((m, mo) => ({ ...m, [mo.id]: mo.name }), {}),
    [modeOfPaymentList],
  );

  const handleHeaderSearch = useCallback(
    (key, value) => setState({ [key]: value, page: 1 }),
    [],
  );

  const handleRefresh = () => {
    setState({
      page: 1,
      page_size: 10,
      sort: "-date",
      party_id: "",
      account_id: "",
      done_by_id: "",
      status: "",
      cost_center_id: defaultCostCenter,
      total_amount: "",
      paid_amount: "",
      invoice_number: "",
      searchType: "",
      searchKey: "",
      start_date: "",
      end_date: "",
    });
    refetchList();
  };

  const { exportToExcel, exportToPdf, printDocument } = useSaleExportAndPrint({
    listData,
    reportType: "Sale Report",
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
      balance: (data?.total_amount || 0) - ((data?.paid_amount || 0) - (data?.change_return || 0)),
    },
    filterDatas: {
      customerId: state.party_id,
      account_id: state.account_id,
      done_by_id: state.done_by_id,
      cost_center_id: state.cost_center_id,
      status: state.status,
    },
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  useEffect(() => {
    if (isSuccess && saleDetails && actionAfterFetch) {
      const processDetails = async () => {
        const cleanedItems = (saleDetails.items || [])
          .filter((i) => i?.item_name)
          .map((i) => ({
            name: i.item_name,
            quantity: parseFloat(i.quantity) || 0,
            price: parseFloat(i.unit_price) || 0,
          }));
        const printSettings = JSON.parse(
          localStorage.getItem("PRINT_SETTINGS") || "{}",
        );
        const formatted = {
          id: saleDetails.id,
          invoice_number: saleDetails.invoice_number,
          date: saleDetails.date,
          store: {
            company_name: printSettings.company_name,
            store: printSettings.store_name,
            address: printSettings.address,
            email: printSettings.email,
            phone: printSettings.phone,
            full_header_image_url: buildUploadUrl(
              API_UPLOADS_BASE,
              printSettings.header_image_url,
            ),
          },
          partner: {
            label: "Customer",
            name: customerNameMap[saleDetails.party_id] || "Walk-in",
          },
          items: cleanedItems,
          summary: {
            subTotal: parseFloat(saleDetails.sub_total),
            grandTotal: parseFloat(saleDetails.total_amount),
            orderTax: parseFloat(saleDetails.tax_amount),
            discount: parseFloat(saleDetails.discount),
            shipping: parseFloat(saleDetails.shipping_charge),
          },
          payment: {
            amountPaid: parseFloat(saleDetails.paid_amount),
            changeReturn: parseFloat(saleDetails.change_return),
          },
          payment_methods: (saleDetails.payment_methods || []).map((pm) => ({
            ...pm,
            mode_of_payment:
              modeOfPaymentNameMap[pm.mode_of_payment_id] ||
              accountNameMap[pm.account_id] ||
              "Unknown",
          })),
        };
        if (actionAfterFetch === "showInvoiceModal") {
          setSelectedSaleForInvoice(formatted);
          setIsInvoiceModalOpen(true);
        } else if (actionAfterFetch === "downloadPdf") {
          const barcode = generateBarcodeImage(saleDetails.invoice_number);
          const blob = await pdf(
            <ReceiptPDF transactionData={formatted} barcodeImage={barcode} />,
          ).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Invoice-${saleDetails.id}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
        } else if (actionAfterFetch === "showReceiptModal") {
          setSelectedSaleForReceipt(formatted);
          setIsReceiptModalOpen(true);
        }
        setActionAfterFetch(null);
        setSaleIdToFetch(null);
      };
      processDetails();
    }
  }, [isSuccess, saleDetails, actionAfterFetch]);

  const rowHandlers = useMemo(
    () => ({
      onView: (id) => navigate(`/sale/view/${id}`, { state: { mode: "view" } }),
      onEdit: (id) => navigate(`/sale/edit/${id}`),
      onDelete: setSaleToDelete,
      onDownloadPdf: (id) => {
        setActionAfterFetch("downloadPdf");
        setSaleIdToFetch(id);
      },
      onPrintInvoice: (id) => {
        setActionAfterFetch("showInvoiceModal");
        setSaleIdToFetch(id);
      },
      onDownloadReceipt: (id) => {
        setActionAfterFetch("showReceiptModal");
        setSaleIdToFetch(id);
      },
      onCreateSaleReturn: (id) => navigate(`/sale-return/add/${id}`),
      onShowPayments: (sls) => {
        setSelectedSalePayments(
          (sls.payment_methods || []).map((p, i) => ({
            id: i + 1,
            date: sls.date,
            reference: `Sale #${sls.id}`,
            amount: p.amount || 0,
            customerName: customerNameMap[sls.party_id] || "N/A",
            receivedTo: p.account_name || "N/A",
          })),
        );
        setIsPaymentsModalOpen(true);
      },
    }),
    [navigate, customerNameMap],
  );

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    try {
      await deleteSale(saleToDelete.id);
      showToast({ crudItem: CRUDITEM.SALE, crudType: CRUDTYPE.DELETE_SUCCESS });
      setSaleToDelete(null);
      refetchList();
    } catch (e) {
      showToast({ crudItem: CRUDITEM.SALE, crudType: CRUDTYPE.DELETE_ERROR });
      setSaleToDelete(null);
    }
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Sales"
              subtitle={
                state.start_date && state.end_date
                  ? `${state.start_date} to ${state.end_date}`
                  : null
              }
            />
            <TableTopContainer
              summary={
                !loading &&
                data && (
                  <HStack>
                    <AmountSummary
                      total={data.total_amount}
                      received={data.paid_amount}
                      pending={data.total_amount - data.paid_amount}
                    />
                    <StatusFilter
                      status={state.status}
                      handleStatusFilterClick={(s) =>
                        setState({
                          status: state.status === s ? "" : s,
                          page: 1,
                        })
                      }
                      StatusButton={StatusButton}
                    />
                  </HStack>
                )
              }
              mainActions={
                <>
                  <ColumnSelectorModal
                    allPossibleFields={allPossibleFields}
                    savedColumnKeys={extraFields
                      .filter((f) => f.show)
                      .map((f) => f.value)}
                    onApply={handleSaveColumns}
                    isLoading={isSavingColumns}
                  />
                  <PopUpFilter
                    isOpen={showFilter}
                    setIsOpen={setShowFilter}
                    onApply={() => {
                      setState({ ...localFilterState, page: 1 });
                      setShowFilter(false);
                    }}
                  >
                    <VStack spacing={4}>
                      <CustomerAutoComplete
                        value={localFilterState.party_id}
                        onChange={(e) =>
                          setLocalFilterState((p) => ({
                            ...p,
                            party_id: e.target.value,
                          }))
                        }
                      />
                      <AccountAutoComplete
                        value={localFilterState.account_id}
                        onChange={(e) =>
                          setLocalFilterState((p) => ({
                            ...p,
                            account_id: e.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All Ledgers" },
                          ...accounts.map((a) => ({
                            value: a.id,
                            label: a.name,
                          })),
                        ]}
                      />
                      <DoneByAutoComplete
                        value={localFilterState.done_by_id}
                        onChange={(e) =>
                          setLocalFilterState((p) => ({
                            ...p,
                            done_by_id: e.target.value,
                          }))
                        }
                      />
                      <CostCenterAutoComplete
                        value={localFilterState.cost_center_id}
                        onChange={(e) =>
                          setLocalFilterState((p) => ({
                            ...p,
                            cost_center_id: e.target.value,
                          }))
                        }
                        disabled={isDisableCostCenter}
                      />
                    </VStack>
                  </PopUpFilter>
                  <PopupSearchField
                    searchKey={state.searchKey}
                    setSearchKey={(v) => setState({ searchKey: v })}
                    searchType={state.searchType}
                    setSearchType={(v) => setState({ searchType: v })}
                    handleSearch={() => setState({ page: 1 })}
                    searchOptions={[
                      { value: "party_name", name: "Customer" },
                      { value: "invoice_number", name: "Invoice No" },
                    ]}
                    searchRef={searchRef}
                  />
                  <AddButton onClick={() => navigate(`/sale/add`)}>
                    Add New
                  </AddButton>
                </>
              }
              topRight={
                <>
                  <FullScreenButton />
                  <RefreshButton onClick={handleRefresh} />
                  <DateFilter
                    value={{
                      startDate: state.start_date,
                      endDate: state.end_date,
                    }}
                    onChange={(v) =>
                      setState({
                        start_date: v.startDate,
                        end_date: v.endDate,
                        page: 1,
                      })
                    }
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
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    {extraFields
                      .filter((f) => f.show)
                      .map((field) => {
                        if (field.value === "date")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Date
                                <ThSort
                                  sort={state.sort}
                                  setSort={setState}
                                  value="date"
                                  handleSort={(v) => setState({ sort: v, page: 1 })}
                                />
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "party_name")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Customer
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="party_name"
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover isSearch={false} popoverWidth={220}>
                                    <CustomerAutoComplete
                                      value={state.party_id}
                                      onChange={(e) =>
                                        setState({ party_id: e.target.value, page: 1 })
                                      }
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
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="invoice_number"
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch("invoice_number", headerFilters.invoice_number)
                                    }
                                  >
                                    <InputField
                                      placeholder="Search Invoice"
                                      value={headerFilters.invoice_number}
                                      onChange={(e) =>
                                        setHeaderFilters((p) => ({ ...p, invoice_number: e.target.value }))
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleHeaderSearch("invoice_number", headerFilters.invoice_number)
                                      }
                                      isLabel={false}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "payment_status")
                          return <Th key={field.value}>Status</Th>;
                        if (field.value === "account")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Account
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="account"
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover isSearch={false} popoverWidth={220}>
                                    <AccountAutoComplete
                                      value={state.account_id}
                                      onChange={(e) =>
                                        setState({ account_id: e.target.value, page: 1 })
                                      }
                                      options={[
                                        { value: "", label: "All Ledgers" },
                                        ...accounts.map((a) => ({ value: a.id, label: a.name })),
                                      ]}
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
                                Total
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="total_amount"
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch("total_amount", headerFilters.total_amount)
                                    }
                                  >
                                    <InputField
                                      type="number"
                                      placeholder="Exact Amount"
                                      value={headerFilters.total_amount}
                                      onChange={(e) =>
                                        setHeaderFilters((p) => ({ ...p, total_amount: e.target.value }))
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleHeaderSearch("total_amount", headerFilters.total_amount)
                                      }
                                      isLabel={false}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "paid_amount")
                          return (
                            <Th key={field.value}>
                              <ThContainer>
                                Paid
                                <ThFilterContainer>
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="paid_amount"
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover
                                    isSearch={true}
                                    popoverWidth={220}
                                    onSearch={() =>
                                      handleHeaderSearch("paid_amount", headerFilters.paid_amount)
                                    }
                                  >
                                    <InputField
                                      type="number"
                                      placeholder="Exact Amount"
                                      value={headerFilters.paid_amount}
                                      onChange={(e) =>
                                        setHeaderFilters((p) => ({ ...p, paid_amount: e.target.value }))
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleHeaderSearch("paid_amount", headerFilters.paid_amount)
                                      }
                                      isLabel={false}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
                              </ThContainer>
                            </Th>
                          );
                        if (field.value === "balance")
                          return <Th key={field.value}>Balance</Th>;
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
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover isSearch={false} popoverWidth={220}>
                                    <DoneByAutoComplete
                                      value={state.done_by_id}
                                      onChange={(e) =>
                                        setState({ done_by_id: e.target.value, page: 1 })
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
                                    handleSort={(v) => setState({ sort: v, page: 1 })}
                                  />
                                  <ThSearchOrFilterPopover isSearch={false} popoverWidth={220}>
                                    <CostCenterAutoComplete
                                      value={state.cost_center_id}
                                      onChange={(e) =>
                                        setState({ cost_center_id: e.target.value, page: 1 })
                                      }
                                      disabled={isDisableCostCenter}
                                      is_edit={false}
                                    />
                                  </ThSearchOrFilterPopover>
                                </ThFilterContainer>
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
                    listData.map((sls, index) => (
                      <SaleRow
                        key={sls.id}
                        sls={sls}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        handlers={rowHandlers}
                        columns={extraFields.filter((f) => f.show)}
                        getSaleMenuItems={getSaleMenuItems}
                        DotMenu={DotMenu}
                        accountNameMap={accountNameMap}
                        modeOfPaymentList={modeOfPaymentList}
                      />
                    ))
                  ) : (
                    <TableCaption
                      item={Transaction.Sale}
                      noOfCol={extraFields.filter((f) => f.show).length + 2}
                    />
                  )}
                </Tbody>
              </Table>
            )}
            {!loading && (
              <TableFooter
                totalItems={totalItems}
                currentPage={state.page}
                itemsPerPage={state.page_size}
                totalPages={totalPages}
                handlePageLimitSelect={(v) =>
                  setState({ page_size: v, page: 1 })
                }
                handlePageChange={(v) => setState({ page: v })}
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
                    value={{
                      startDate: state.start_date,
                      endDate: state.end_date,
                    }}
                    onChange={(v) =>
                      setState({
                        start_date: v.startDate,
                        end_date: v.endDate,
                        page: 1,
                      })
                    }
                  />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchKey={state.searchKey}
                    setSearchKey={(v) => setState({ searchKey: v })}
                    handleSearch={() => setState({ page: 1 })}
                    searchOptions={[{ value: "party_name", name: "Customer" }]}
                  />
                </HStack>
                <div className="sale_report__add_button">
                  <AddButton fullWidth onClick={() => navigate(`/sale/add`)} />
                </div>
              </PageHeader>
              <div className="sale_report">
                {loading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.Sale} />
                ) : (
                  listData.map((sls) => (
                    <MobileSaleCard
                      key={sls.id}
                      sls={sls}
                      handlers={rowHandlers}
                      getSaleMenuItems={getSaleMenuItems}
                      DotMenu={DotMenu}
                      accountNameMap={accountNameMap}
                      modeOfPaymentList={modeOfPaymentList}
                    />
                  ))
                )}
              </div>
              <Spacer />
              {!loading && listData.length > 0 && (
                <TableFooter
                  totalItems={totalItems}
                  currentPage={state.page}
                  itemsPerPage={state.page_size}
                  totalPages={totalPages}
                  handlePageLimitSelect={(v) =>
                    setState({ page_size: v, page: 1 })
                  }
                  handlePageChange={(v) => setState({ page: v })}
                />
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>
      <DeleteConfirmationModal
        isOpen={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        transactionName={`sale for ${saleToDelete ? customerNameMap[saleToDelete.party_id] : ""}`}
        isLoading={isDeleting}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        saleData={selectedSaleForInvoice}
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transactionData={selectedSaleForReceipt}
      />
      <PaymentsModal
        isOpen={isPaymentsModalOpen}
        onClose={() => setIsPaymentsModalOpen(false)}
        payments={selectedSalePayments}
        type="sale"
      />
    </>
  );
};

const StatusFilter = ({ status, handleStatusFilterClick, StatusButton }) => (
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

export default CommonSaleReport;