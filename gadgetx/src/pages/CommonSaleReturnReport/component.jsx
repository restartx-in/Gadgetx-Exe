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
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  ThSL,
  TdOverflow,
  ThDotMenu,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import DateFilter from "@/components/DateFilter";
import DateField from "@/components/DateField";
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

const statusDisplayMap = {
  refunded: { text: "Paid", type: "paid" },
  pending: { text: "Pending", type: "unpaid" },
  partial: { text: "Partial", type: "partial" },
};

const SaleReturnRow = React.memo(
  ({
    sr,
    index,
    page,
    pageSize,
    handlers,
    columns,
    DotMenu,
    AmountSymbol,
    getSaleReturnMenuItems,
  }) => {
    const displayStatus = statusDisplayMap[sr.status?.toLowerCase()] || {
      text: sr.status,
      type: sr.status,
    };

    return (
      <Tr key={sr.id}>
        <TdSL index={index} page={page} pageSize={pageSize} />
        {columns.map((field) => {
          if (field.value === "return_date")
            return <TdDate key={field.value}>{sr.date}</TdDate>;
          if (field.value === "customer")
            return (
              <TdOverflow key={field.value}>
                {sr.party_name || `Sale ID: ${sr.sale_id}`}
              </TdOverflow>
            );
          if (field.value === "item")
            return (
              <TdOverflow key={field.value}>
                {sr.item_name || `Item ID: ${sr.item_id}`}
              </TdOverflow>
            );
          if (field.value === "quantity")
            return <Td key={field.value}>{sr.return_quantity}</Td>;
          if (field.value === "amount")
            return (
              <Td>
                <AmountSymbol>{sr.total_refund_amount}</AmountSymbol>
              </Td>
            );
          if (field.value === "status")
            return (
              <Td>
                <TextBadge variant="paymentStatus" type={displayStatus.type}>
                  {displayStatus.text}
                </TextBadge>
              </Td>
            );
          if (field.value === "reason")
            return <TdOverflow key={field.value}>{sr.reason}</TdOverflow>;
          if (field.value === "done_by")
            return (
              <TdOverflow key={field.value}>
                {sr.done_by_name || "N/A"}
              </TdOverflow>
            );
          if (field.value === "cost_center")
            return (
              <TdOverflow key={field.value}>
                {sr.cost_center_name || "N/A"}
              </TdOverflow>
            );
          return null;
        })}
        <Td>
          <DotMenu items={getSaleReturnMenuItems(sr, handlers)} />
        </Td>
      </Tr>
    );
  },
);

const CommonSaleReturnReport = ({
  hooks = {},
  components = {},
  config = {},
}) => {
  const {
    useDeleteSaleReturns,
    useSaleReturnsPaginated,
    useCustomers,
    useItemPaginated,
    useSaleReturnById,
    useModeOfPayments,
    useAccounts,
    useSaleReturnExportAndPrint,
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
    AmountSymbol,
    ReceiptModal,
    CustomerAutoComplete,
    DoneByAutoComplete,
    CostCenterAutoComplete,
  } = components;

  const { getSaleReturnMenuItems, Report } = config;
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // Local UI state
  const [showFilter, setShowFilter] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
  const [selectedSaleReturnPayments, setSelectedSaleReturnPayments] = useState(
    [],
  );
  const [returnIdToFetch, setReturnIdToFetch] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReturnForReceipt, setSelectedReturnForReceipt] =
    useState(null);
  const [extraFields, setExtraFields] = useState([]);

  // Central state management
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    party_id: searchParams.get("partyId") || "",
    item_id: searchParams.get("itemId") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    status: searchParams.get("status") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    partyId: state.party_id,
    itemId: state.item_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    status: state.status,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const { getExtraFields, getReportSettingsKey } = useReportTableFieldsSettings(
    Report.SaleReturn,
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

  const { data, isLoading, refetch, isRefetching } =
    useSaleReturnsPaginated(state);
  const { data: customers = [] } = useCustomers({ type: "customer" });
  const { data: accounts = [] } = useAccounts();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();
  const {
    data: saleReturnDetails,
    isLoading: isDetailsLoading,
    isSuccess,
  } = useSaleReturnById(returnIdToFetch);
  const { data: itemsData, isLoading: isLoadingItems } = useItemPaginated({
    page_size: 1000,
    sort: "name",
  });
  const { mutateAsync: deleteSaleReturn } = useDeleteSaleReturns();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;
  const loading = isLoading || isRefetching || isLoadingPermissions;

  const customerNameMap = useMemo(
    () =>
      customers.reduce((map, customer) => {
        map[customer.id] = customer.name;
        return map;
      }, {}),
    [customers],
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
    if (isSuccess && saleReturnDetails) {
      const formattedData = {
        id: saleReturnDetails.id,
        invoice_number: saleReturnDetails.invoice_number,
        date: saleReturnDetails.date,
        partner: {
          label: "Return from Customer",
          name: customerNameMap[saleReturnDetails.party_id] || "N/A",
        },
        items: [
          {
            name: saleReturnDetails.item_name,
            quantity: saleReturnDetails.return_quantity,
            price:
              saleReturnDetails.return_quantity > 0
                ? saleReturnDetails.total_refund_amount /
                  saleReturnDetails.return_quantity
                : 0,
          },
        ],
        summary: {
          subTotal: saleReturnDetails.total_refund_amount,
          grandTotal: saleReturnDetails.total_refund_amount,
          orderTax: 0,
          discount: 0,
          shipping: 0,
        },
        payment: {
          amountPaid: saleReturnDetails.total_refund_amount,
          changeReturn: 0,
        },
        payment_methods: (saleReturnDetails.payment_methods || []).map(
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
  }, [
    isSuccess,
    saleReturnDetails,
    customerNameMap,
    accountNameMap,
    modeOfPaymentNameMap,
  ]);

  const itemOptions = useMemo(
    () =>
      itemsData?.data?.map((item) => ({ value: item.id, label: item.name })) ||
      [],
    [itemsData],
  );
  const statusOptions = useMemo(
    () => [
      { value: "refunded", label: "Paid" },
      { value: "partial", label: "Partial" },
      { value: "pending", label: "Pending" },
    ],
    [],
  );

  const { exportToExcel, exportToPdf, printDocument } =
    useSaleReturnExportAndPrint({
      listData,
      reportType: "Sale Return Report",
      duration:
        state.start_date && state.end_date
          ? `${state.start_date} to ${state.end_date}`
          : "",
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: { totalRefundAmount: data?.total_refund_amount || 0 },
      filterDatas: {
        party_id: state.party_id,
        item_id: state.item_id,
        doneById: state.done_by_id,
        costCenterId: state.cost_center_id,
      },
      searchType: state.searchType,
      searchKey: state.searchKey,
    });

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
        party_id: "",
        item_id: "",
        done_by_id: "",
        status: "",
        cost_center_id: defaltCostCenter,
        start_date: "",
        end_date: "",
      }),
    [defaltCostCenter, state.searchType, state.searchKey],
  );

  const handleApplyFilter = useCallback((newFilters) => {
    setState({ ...newFilters, page: 1, searchType: "", searchKey: "" });
    setShowFilter(false);
  }, []);

  const handleRefresh = useCallback(
    () =>
      setState({
        party_id: "",
        item_id: "",
        done_by_id: "",
        cost_center_id: defaltCostCenter,
        status: "",
        start_date: "",
        end_date: "",
        page: 1,
        page_size: 10,
        sort: "-date",
        searchType: "",
        searchKey: "",
      }),
    [defaltCostCenter],
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
        page: 1,
        status: state.status === newStatus ? "" : newStatus,
      }),
    [state.status],
  );
  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    [],
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    [],
  );
  const handleAddClick = useCallback(
    () => navigate(`/sale-return/add`),
    [navigate],
  );
  const handleEditClick = useCallback(
    (id, returnData) =>
      navigate(`/sale-return/edit/${id}`, { state: { returnData } }),
    [navigate],
  );
  const handleViewClick = useCallback(
    (id, returnData) =>
      navigate(`/sale-return/view/${id}`, { state: { returnData } }),
    [navigate],
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteSaleReturn(id);
        showToast({
          crudItem: CRUDITEM.SALE_RETURN,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.SALE_RETURN,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteSaleReturn, refetch, showToast],
  );

  const handlePrint = useCallback(
    (saleReturn) => setReturnIdToFetch(saleReturn.id),
    [],
  );

  const handleShowPayments = useCallback((returnData) => {
    const paymentData = (returnData.payment_methods || []).map(
      (payment, index) => ({
        id: `${returnData.id}-${index}`,
        date: returnData.date,
        amount: payment.amount || 0,
        customerName: returnData.party_name || "N/A",
        returnedTo: payment.account_name || "N/A",
      }),
    );
    setSelectedSaleReturnPayments(paymentData);
    setIsPaymentsModalOpen(true);
  }, []);

  const handleClosePaymentsModal = useCallback(() => {
    setIsPaymentsModalOpen(false);
    setSelectedSaleReturnPayments([]);
  }, []);

  const handlers = useMemo(
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
      { value: "invoice_number", name: "Invoice No." },
      { value: "reason", name: "Reason" },
      { value: "item_name", name: "Item Name" },
      { value: "party_name", name: "Customer Name" },
      { value: "done_by_name", name: "Done By" },
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
              title="Sale Returns"
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
                  <AddButton onClick={handleAddClick} />
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
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <CustomerAutoComplete
                                        value={state.party_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            party_id: e.target.value,
                                          })
                                        }
                                        placeholder="Search & select customer"
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
                                        placeholder="Select Item"
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
                                      />
                                    </ThSearchOrFilterPopover>
                                  </ThFilterContainer>
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
                                  Amount
                                  <ThSort
                                    sort={state.sort}
                                    setSort={setState}
                                    value="total_refund_amount"
                                    handleSort={handleSort}
                                  />
                                </ThContainer>
                              </Th>
                            );
                          if (field.value === "status")
                            return (
                              <Th key={field.value}>
                                <ThContainer>Status</ThContainer>
                              </Th>
                            );
                          if (field.value === "reason")
                            return (
                              <Th key={field.value}>
                                <ThContainer>Reason</ThContainer>
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
                                    <ThSearchOrFilterPopover isSearch={false}>
                                      <DoneByAutoComplete
                                        placeholder="Select Done By"
                                        value={state.done_by_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            done_by_id: e.target.value,
                                          })
                                        }
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
                                        placeholder="Select Cost Center"
                                        value={state.cost_center_id}
                                        onChange={(e) =>
                                          setState({
                                            page: 1,
                                            cost_center_id: e.target.value,
                                          })
                                        }
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
                      listData.map((sr, index) => (
                        <SaleReturnRow
                          key={sr.id}
                          sr={sr}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={handlers}
                          columns={extraFields.filter((f) => f.show)}
                          DotMenu={DotMenu}
                          AmountSymbol={AmountSymbol}
                          getSaleReturnMenuItems={getSaleReturnMenuItems}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.SaleReturn}
                        noOfCol={extraFields.filter((f) => f.show).length + 2}
                      />
                    )}
                  </Tbody>
                </Table>
              </>
            )}
            {!isLoading && listData.length > 0 && (
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
            <PageTitleWithBackButton title="Sale Returns" />
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
                <div className="sale_return_report__add_button">
                  <AddButton onClick={handleAddClick} />
                </div>
              </PageHeader>
              <div className="sale_report" style={{ marginTop: "0" }}>
                {isLoading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.SaleReturn} />
                ) : (
                  <div className="mobile-list-view">
                    {listData.map((sr) => {
                      const displayStatus = statusDisplayMap[
                        sr.status?.toLowerCase()
                      ] || { text: sr.status, type: sr.status };
                      return (
                        <ListItem
                          key={sr.id}
                          title={sr.item_name || `Item ID: ${sr.item_id}`}
                          subtitle={
                            <>
                              <div>
                                Customer:{" "}
                                {sr.party_name || `Sale ID: ${sr.sale_id}`}
                              </div>
                              <div>Qty: {sr.return_quantity}</div>
                              <div>
                                Status:{" "}
                                <TextBadge
                                  variant="paymentStatus"
                                  type={sr.status}
                                >
                                  {sr.status}
                                </TextBadge>
                              </div>
                              <div>{sr.reason}</div>
                            </>
                          }
                          amount={
                            <div style={{ display: "flex" }}>
                              <div style={{ textAlign: "right" }}>
                                <AmountSymbol>
                                  {sr.total_refund_amount}
                                </AmountSymbol>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    marginTop: "4px",
                                  }}
                                >
                                  {new Date(sr.date).toLocaleDateString()}
                                </div>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <DotMenu
                                  items={getSaleReturnMenuItems(sr, handlers)}
                                />
                              </div>
                            </div>
                          }
                          actions={null}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <Spacer />
              {!isLoading && listData.length > 0 && (
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
        payments={selectedSaleReturnPayments}
        type="sale_return"
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen || isDetailsLoading}
        onClose={() => setIsReceiptModalOpen(false)}
        transactionData={selectedReturnForReceipt}
      />
    </>
  );
};

const ListFilter = React.memo(({ onApply, initialFilters, components, ...props }) => {
  const {
    showFilter,
    setShowFilter,
    itemOptions,
    isLoadingItems,
    statusOptions,
    isDisableCostCenter,
  } = props;
  const { CustomerAutoComplete, DoneByAutoComplete, CostCenterAutoComplete } = components;
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
      <VStack spacing={4}>
        <CustomerAutoComplete
          name="partyId"
          value={localState.party_id}
          onChange={(e) => setLocalState({ party_id: e.target.value })}
          placeholder="select a customer"
        />
        <SelectField
          label="Item"
          placeholder="Item"
          value={localState.item_id}
          onChange={(e) => setLocalState({ item_id: e.target.value })}
          options={[{ value: "", label: "All Items" }, ...itemOptions]}
          isLoading={isLoadingItems}
        />
        <DoneByAutoComplete
          placeholder="Done By"
          value={localState.done_by_id}
          onChange={(e) => setLocalState({ done_by_id: e.target.value })}
          name="done_by_id"
        />
        <CostCenterAutoComplete
          placeholder="Cost Center"
          value={localState.cost_center_id}
          onChange={(e) => setLocalState({ cost_center_id: e.target.value })}
          name="cost_center_id"
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
              value={localState.end_date ? new Date(localState.end_date) : null}
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

const StatusFilter = ({ status, handleStatusFilterClick,StatusButton }) => {
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
          isSelected={status === "pending"}
          onClick={() => handleStatusFilterClick("pending")}
        >
          Pending
        </StatusButton>
      </div>
    </div>
  );
};

export default CommonSaleReturnReport;
