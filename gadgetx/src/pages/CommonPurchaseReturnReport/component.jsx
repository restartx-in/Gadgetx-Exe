import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdSL,
  TdDate,
  ThDotMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  ThSL,
  TdOverflow,
} from "@/components/Table";
import DateField from "@/components/DateField";
import DateFilter from "@/components/DateFilter";
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
import SelectField from "@/components/SelectField";
import { format, isValid } from "date-fns";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import ExportMenu from "@/components/ExportMenu";
import TextBadge from "@/components/TextBadge";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";


const stateReducer = (state, newState) => ({ ...state, ...newState });

const PurchaseReturnRow = React.memo(
  ({
    pr,
    index,
    page,
    pageSize,
    handlers,
    columns,
    getPurchaseReturnMenuItems,
    DotMenu,
    AmountSymbol,
  }) => {
    const menuItems = useMemo(
      () => getPurchaseReturnMenuItems(pr, handlers),
      [pr, handlers],
    );

    return (
      <Tr key={pr.id}>
        <TdSL index={index} page={page} pageSize={pageSize} />
        {columns.map((field) => {
          if (field.value === "return_date")
            return <TdDate key={field.value}>{pr.date}</TdDate>;
          if (field.value === "supplier")
            return <TdOverflow key={field.value}>{pr.party_name}</TdOverflow>;
          if (field.value === "item")
            return <TdOverflow key={field.value}>{pr.item_name}</TdOverflow>;
          if (field.value === "status")
            return (
              <Td>
                <TextBadge variant="paymentStatus" type={pr.status}>
                  {pr.status}
                </TextBadge>
              </Td>
            );
          if (field.value === "quantity") return <Td>{pr.return_quantity}</Td>;
          if (field.value === "amount")
            return (
              <Td>
                <AmountSymbol>{pr.total_refund_amount}</AmountSymbol>
              </Td>
            );
          if (field.value === "reason")
            return (
              <TdOverflow key={field.value}>{pr.reason || "N/A"}</TdOverflow>
            );
          if (field.value === "done_by")
            return <TdOverflow key={field.value}>{pr.done_by_name}</TdOverflow>;
          if (field.value === "cost_center")
            return (
              <TdOverflow key={field.value}>{pr.cost_center_name}</TdOverflow>
            );
          return null;
        })}
        <Td>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  },
);

const MobilePurchaseReturnCard = React.memo(
  ({ pr, handlers, DotMenu, getPurchaseReturnMenuItems, AmountSymbol }) => {
    const menuItems = useMemo(
      () => getPurchaseReturnMenuItems(pr, handlers),
      [pr, handlers],
    );

    return (
      <ListItem
        title={pr.item_name}
        subtitle={
          <div>
            <div>Supplier: {pr.party_name || "NA"}</div>
            {pr.reason && (
              <div style={{ color: "#666", fontSize: "0.8rem" }}>
                Reason: {pr.reason}
              </div>
            )}
            <div
              style={{
                marginTop: "4px",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Status:{" "}
              <TextBadge variant="paymentStatus" type={pr.status}>
                {pr.status}
              </TextBadge>
            </div>
          </div>
        }
        amount={
          <div style={{ display: "flex" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "bold" }}>
                <AmountSymbol>{pr.total_refund_amount}</AmountSymbol>
              </div>
              <div>Qty: {pr.return_quantity}</div>
              <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                {new Date(pr.date).toLocaleDateString()}
              </div>
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

const CommonPurchaseReturnReport = ({
  hooks = {},
  components = {},
  config = {},
}) => {
  const {
    useDeletePurchaseReturns,
    usePurchaseReturnsPaginated,
    usePurchaseReturnById,
    useItemsPaginated,
    useSuppliersPaginated,
    useAccounts,
    useModeOfPayments,
    usePurchaseReturnExportAndPrint,
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
    PaymentsModal,
    ReceiptModal,
    ReceiptPDF,
    DoneByAutoComplete,
    CostCenterAutoComplete,
    AmountSymbol,
  } = components;

  const {
    getPurchaseReturnMenuItems,
    API_UPLOADS_BASE,
    buildUploadUrl,
    Report,
  } = config;

  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [selectedPurchaseReturnPayments, setSelectedPurchaseReturnPayments] =
    useState([]);
  const [returnIdToFetch, setReturnIdToFetch] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReturnForReceipt, setSelectedReturnForReceipt] =
    useState(null);
  const [extraFields, setExtraFields] = useState([]);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    item_id: searchParams.get("itemId") || "",
    party_id: searchParams.get("partyId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    status: searchParams.get("status") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  const { getExtraFields, getReportSettingsKey } = useReportTableFieldsSettings(
    Report.PurchaseReturn,
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
    sort: state.sort,
    itemId: state.item_id,
    partyId: state.party_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const { data: itemsData, isLoading: isLoadingItems } = useItemsPaginated({
    page_size: 1000,
    sort: "name",
  });
  const { data: suppliersData, isLoading: isLoadingSuppliers } =
    useSuppliersPaginated({ page_size: 1000, sort: "name" });
  const { data: accounts = [] } = useAccounts();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();
  const {
    data: purchaseReturnDetails,
    isLoading: isDetailsLoading,
    isSuccess,
  } = usePurchaseReturnById(returnIdToFetch);
  const { data, isLoading, refetch, isRefetching } =
    usePurchaseReturnsPaginated(state);
  const { mutateAsync: deletePurchaseReturn } = useDeletePurchaseReturns();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching || isLoadingPermissions;

  const itemOptions = useMemo(
    () =>
      itemsData?.data?.map((item) => ({ value: item.id, label: item.name })) ||
      [],
    [itemsData],
  );
  const supplierOptions = useMemo(
    () =>
      suppliersData?.data?.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
      })) || [],
    [suppliersData],
  );
  const statusOptions = useMemo(
    () => [
      { value: "refunded", label: "Refunded" },
      { value: "partial", label: "Partial" },
      { value: "pending", label: "Pending" },
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

  useEffect(() => {
    if (isSuccess && purchaseReturnDetails) {
      const subTotal = Number(purchaseReturnDetails.total_refund_amount || 0);
      const unitPrice =
        purchaseReturnDetails.unit_price ??
        subTotal / (purchaseReturnDetails.return_quantity || 1) ??
        0;
      const formattedData = {
        id: purchaseReturnDetails.id,
        invoice_number: purchaseReturnDetails.invoice_number,
        date: purchaseReturnDetails.date,
        partner: {
          label: "Return to Supplier",
          name: purchaseReturnDetails.party_name || "N/A",
        },
        items: [
          {
            name: purchaseReturnDetails.item_name,
            quantity: purchaseReturnDetails.return_quantity,
            price: unitPrice,
          },
        ],
        summary: {
          subTotal,
          grandTotal: subTotal,
          orderTax: 0,
          discount: 0,
          shipping: 0,
        },
        payment: { amountPaid: purchaseReturnDetails.refunded_amount || 0 },
        payment_methods: (purchaseReturnDetails.payment_methods || []).map(
          (pm) => ({
            ...pm,
            mode_of_payment:
              modeOfPaymentNameMap[pm.mode_of_payment_id] ||
              accountNameMap[pm.account_id] ||
              "Unknown",
          }),
        ),
      };
      setSelectedReturnForReceipt(formattedData);
      setIsReceiptModalOpen(true);
      setReturnIdToFetch(null);
    }
  }, [isSuccess, purchaseReturnDetails, accountNameMap, modeOfPaymentNameMap]);

  const { exportToExcel, exportToPdf, printDocument } =
    usePurchaseReturnExportAndPrint({
      listData,
      reportType: "Purchase Return Report",
      duration:
        state.start_date && state.end_date
          ? `${state.start_date} to ${state.end_date}`
          : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: {
        totalRefundAmount: data?.total_refund_amount || 0,
        totalRefundedAmount: data?.total_refunded_amount || 0,
      },
      filterDatas: {
        item_id: state.item_id,
        party_id: state.party_id,
        doneById: state.done_by_id,
        costCenterId: state.cost_center_id,
      },
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

  const handleStatusFilterClick = useCallback(
    (newStatus) =>
      setState({
        page: 1,
        status: state.status === newStatus ? "" : newStatus,
      }),
    [state.status],
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
        start_date: "",
        end_date: "",
        item_id: "",
        party_id: "",
        done_by_id: "",
        cost_center_id: defaltCostCenter,
        status: "",
      }),
    [defaltCostCenter, state.searchType, state.searchKey],
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

  const handleApplyFilter = useCallback((newFilters) => {
    setState({ ...newFilters, page: 1, searchType: "", searchKey: "" });
    setShowFilter(false);
  }, []);

  const handleRefresh = useCallback(
    () =>
      setState({
        start_date: "",
        end_date: "",
        item_id: "",
        party_id: "",
        done_by_id: "",
        cost_center_id: defaltCostCenter,
        status: "",
        page: 1,
        page_size: 10,
        sort: "-date",
        searchType: "",
        searchKey: "",
      }),
    [defaltCostCenter],
  );
  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    [],
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    [],
  );
  const handleEditClick = useCallback(
    (id, returnData) =>
      navigate(`/purchase-return/edit/${id}`, { state: { returnData } }),
    [navigate],
  );
  const handleViewClick = useCallback(
    (id) => navigate(`/purchase-return/view/${id}`),
    [navigate],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deletePurchaseReturn(id);
        showToast({
          crudItem: CRUDITEM.PURCHASE_RETURN,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.PURCHASE_RETURN,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deletePurchaseReturn, refetch, showToast],
  );

  const handlePrint = useCallback((pr) => setReturnIdToFetch(pr.id), []);

  const handleShowPayments = useCallback((returnData) => {
    const paymentData = (returnData.payment_methods || []).map(
      (payment, index) => ({
        id: `${returnData.id}-${index}`,
        date: payment.payment_date || returnData.date,
        amount: payment.amount || 0,
        customerName: returnData.party_name || "N/A",
        returnedTo: payment.account_name || "N/A",
      }),
    );
    setSelectedPurchaseReturnPayments(paymentData);
    setIsPaymentsModalOpen(true);
  }, []);

  const handleClosePaymentsModal = useCallback(() => {
    setIsPaymentsModalOpen(false);
    setSelectedPurchaseReturnPayments([]);
  }, []);
  const rowHandlers = useMemo(
    () => ({
      onView: handleViewClick,
      onEdit: handleEditClick,
      onDelete: handleDelete,
      onShowPayments: handleShowPayments,
      onPrint: handlePrint,
    }),
    [
      handleViewClick,
      handleEditClick,
      handleDelete,
      handleShowPayments,
      handlePrint,
    ],
  );

  const searchOptions = useMemo(
    () => [
      { value: "item_name", name: "Item Name" },
      { value: "party_name", name: "Supplier Name" },
      { value: "purchase_id", name: "Purchase ID" },
      { value: "reason", name: "Reason" },
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
    itemOptions,
    isLoadingItems,
    supplierOptions,
    isLoadingSuppliers,
    statusOptions,
    isDisableCostCenter,
    components,
  };
  const dateFilterValue = {
    startDate: state.start_date || "",
    endDate: state.end_date || "",
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
              title="Purchase Returns"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              summary={
                !loading &&
                data && (
                  <div className="summary-with-status">
                    <HStack>
                      <AmountSummary
                        total={data.total_refund_amount || 0}
                        received={data.total_refunded_amount || 0}
                        pending={
                          (data.total_refund_amount || 0) -
                          (data.total_refunded_amount || 0)
                        }
                      />
                      <StatusFilter
                        status={state.status}
                        handleStatusFilterClick={handleStatusFilterClick}
                        StatusButton={StatusButton}
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
                          if (field.value === "return_date")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Return Date
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
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
                                      sort={state.sort}
                                      setSort={setState}
                                      value="party_name"
                                      handleSort={handleSort}
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
                          if (field.value === "item")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Item
                                  <ThFilterContainer>
                                    <ThSort
                                      sort={state.sort}
                                      setSort={setState}
                                      value="item_name"
                                      handleSort={handleSort}
                                    />
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <SelectField
                                        value={state.item_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            item_id: e.target.value,
                                          })
                                        }
                                        options={[
                                          { value: "", label: "All Items" },
                                          ...itemOptions,
                                        ]}
                                        isLoading={isLoadingItems}
                                        isLabel={false}
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
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="status"
                                    handleSort={handleSort}
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "quantity")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Quantity
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="return_quantity"
                                    handleSort={handleSort}
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "amount")
                            return (
                              <Th key={field.value}>
                                <ThContainer>
                                  Refund Amount
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="total_refund_amount"
                                    handleSort={handleSort}
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "reason")
                            return <Th key={field.value}>Reason</Th>;
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
                                          setState({
                                            page: 1,
                                            done_by_id: e.target.value,
                                          })
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
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <CostCenterAutoComplete
                                        value={state.cost_center_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            cost_center_id: e.target.value,
                                          })
                                        }
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
                      listData.map((pr, index) => (
                        <PurchaseReturnRow
                          key={pr.id}
                          pr={pr}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={rowHandlers}
                          columns={extraFields.filter((f) => f.show)}
                          getPurchaseReturnMenuItems={
                            getPurchaseReturnMenuItems
                          }
                          DotMenu={DotMenu}
                          AmountSymbol={AmountSymbol}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.PurchaseReturn}
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
            <PageTitleWithBackButton title="Purchase Returns" />
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
              </PageHeader>
              <div className="purchase_report" style={{ marginTop: "0" }}>
                {loading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.PurchaseReturn} />
                ) : (
                  <div className="mobile-list-view">
                    {listData.map((pr) => (
                      <MobilePurchaseReturnCard
                        key={pr.id}
                        pr={pr}
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
      <PaymentsModal
        isOpen={isPaymentsModalOpen}
        onClose={handleClosePaymentsModal}
        payments={selectedPurchaseReturnPayments}
        type="purchase_return"
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen || isDetailsLoading}
        onClose={() => setIsReceiptModalOpen(false)}
        transactionData={selectedReturnForReceipt}
      />
    </>
  );
};

const ListFilter = React.memo(
  ({ onApply, initialFilters, components, ...props }) => {
    const {
      showFilter,
      setShowFilter,
      itemOptions,
      isLoadingItems,
      supplierOptions,
      isLoadingSuppliers,
      statusOptions,
      isDisableCostCenter,
    } = props;
    const { DoneByAutoComplete, CostCenterAutoComplete } = components;
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
            label="Select Item"
            value={localState.item_id}
            onChange={(e) => setLocalState({ item_id: e.target.value })}
            options={[{ value: "", label: "All Items" }, ...itemOptions]}
            isLoading={isLoadingItems}
          />
          <SelectField
            label="Select Supplier"
            value={localState.party_id}
            onChange={(e) => setLocalState({ party_id: e.target.value })}
            options={[
              { value: "", label: "All Suppliers" },
              ...supplierOptions,
            ]}
            isLoading={isLoadingSuppliers}
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
            disabled={isDisableCostCenter}
          />
          <SelectField
            label="Status"
            placeholder="Status"
            value={localState.status}
            onChange={(e) => setLocalState({ status: e.target.value })}
            options={[{ value: "", label: "All Statuses" }, ...statusOptions]}
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

const StatusFilter = ({ status, handleStatusFilterClick, StatusButton}) => {
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
          isSelected={status === "refunded"}
          onClick={() => handleStatusFilterClick("refunded")}
        >
          Refunded
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
          isSelected={status === "pending"}
          onClick={() => handleStatusFilterClick("pending")}
        >
          Pending
        </StatusButton>
      </div>
    </div>
  );
};

export default CommonPurchaseReturnReport;
