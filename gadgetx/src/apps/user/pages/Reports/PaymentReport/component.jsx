import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useVouchersPaginated from "@/apps/user/hooks/api/voucher/useVouchersPaginated";
import useDeleteVoucher from "@/apps/user/hooks/api/voucher/useDeleteVoucher";
import useVoucherById from "@/apps/user/hooks/api/voucher/useVoucherById";
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
  TdOverflow,
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
import HStack from "@/components/HStack/component.jsx";
import VStack from "@/components/VStack";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import RefreshButton from "@/components/RefreshButton";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import Loader from "@/components/Loader";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import DotMenu from "@/apps/user/components/DotMenu/component";
import DeleteConfirmationModal from "@/apps/user/components/DeleteConfirmationModal/component";
import AmountSummary from "@/apps/user/components/AmountSummary";
import DateFilter from "@/components/DateFilter";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import VoucherAddButton from "@/apps/user/components/VoucherAddButton";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { FiPrinter, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import StatusButton from "@/apps/user/components/StatusButton";

import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";


const stateReducer = (state, newState) => ({ ...state, ...newState });

const PaymentRow = React.memo(
  ({ voucher, index, page, pageSize, handlers }) => {
    const menuItems = useMemo(
      () => handlers.getMenuItems(voucher),
      [voucher, handlers],
    );
    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        <TdDate>{voucher.date}</TdDate>
        <TdOverflow>{voucher.voucher_no}</TdOverflow>
        <TdOverflow>{voucher.invoice_type || "N/A"}</TdOverflow>
        <TdOverflow>{voucher.from_ledger_name}</TdOverflow>
        <TdOverflow>{voucher.to_ledger_name}</TdOverflow>
        <TdOverflow>{voucher.done_by_name || "N/A"}</TdOverflow>
        <TdOverflow>{voucher.cost_center_name || "N/A"}</TdOverflow>
        <TdNumeric>{voucher.amount}</TdNumeric>
        <Td onClick={(e) => e.stopPropagation()}>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  },
);

const MobilePaymentCard = React.memo(({ voucher, handlers }) => {
  const menuItems = useMemo(
    () => handlers.getMenuItems(voucher),
    [voucher, handlers],
  );
  return (
    <ListItem
      title={voucher.voucher_no}
      subtitle={
        <>
          <div className="fs14">To: {voucher.to_ledger_name}</div>
          <div className="fs14">Type: {voucher.invoice_type}</div>
        </>
      }
      amount={
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>{voucher.amount}</div>
            <div className="fs12 text-muted">{voucher.date}</div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DotMenu items={menuItems} />
          </div>
        </div>
      }
    />
  );
});

const PaymentReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || "",
    min_amount: searchParams.get("minAmount") || "",
    max_amount: searchParams.get("maxAmount") || "",
    voucher_no: searchParams.get("voucherNo") || "",
    amount: searchParams.get("exactAmount") || "",
    voucher_type: 0,
    // UPDATED: Default to specific payment types only
    invoice_types: searchParams.get("invoiceTypes") || "PURCHASE,SALERETURN",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [showFilter, setShowFilter] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    done_by_id: "",
    cost_center_id: "",
    min_amount: "",
    max_amount: "",
  });
  const [headerFilters, setHeaderFilters] = useState({
    voucher_no: "",
    amount: "",
  });
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const [voucherIdToFetch, setVoucherIdToFetch] = useState(null);
  const [isVoucherPrintModalOpen, setIsVoucherPrintModalOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState(null);

  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    startDate: state.start_date,
    endDate: state.end_date,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    minAmount: state.min_amount,
    maxAmount: state.max_amount,
    voucherNo: state.voucher_no,
    exactAmount: state.amount,
    invoiceTypes: state.invoice_types,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  useEffect(() => {
    setState({
      page: parseInt(searchParams.get("page")) || 1,
      page_size: parseInt(searchParams.get("pageSize")) || 10,
      sort: searchParams.get("sort") || "-date",
      start_date: searchParams.get("startDate") || "",
      end_date: searchParams.get("endDate") || "",
      done_by_id: searchParams.get("doneById") || "",
      cost_center_id: searchParams.get("costCenterId") || "",
      min_amount: searchParams.get("minAmount") || "",
      max_amount: searchParams.get("maxAmount") || "",
      voucher_no: searchParams.get("voucherNo") || "",
      amount: searchParams.get("exactAmount") || "",
      // UPDATED: Sync explicitly
      invoice_types: searchParams.get("invoiceTypes") || "PURCHASE,SALERETURN",
      searchType: searchParams.get("searchType") || "",
      searchKey: searchParams.get("searchKey") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    setLocalFilters((prev) => ({
      ...prev,
      done_by_id: state.done_by_id,
      cost_center_id: state.cost_center_id,
      min_amount: state.min_amount,
      max_amount: state.max_amount,
    }));
    setHeaderFilters((prev) => ({
      ...prev,
      voucher_no: state.voucher_no,
      amount: state.amount,
    }));
    setSearchType(state.searchType || "");
    setSearchKey(state.searchKey || "");
  }, [state]);

  const { data, isLoading, isRefetching, refetch } =
    useVouchersPaginated(state);
  const { mutateAsync: deleteVoucher, isPending: isDeleting } =
    useDeleteVoucher();

  const {
    data: voucherDetails,
    isLoading: isDetailsLoading,
    isSuccess,
  } = useVoucherById(voucherIdToFetch);

  const loading = isLoading || isRefetching || isDetailsLoading;
  const listData = useMemo(() => data?.data || [], [data]);

  useEffect(() => {
    if (isSuccess && voucherDetails) {
      const formattedData = {
        id: voucherDetails.id,
        invoice_number: voucherDetails.voucher_no,
        date: voucherDetails.date,
        partner: {
          label: `Paid to`,
          name: voucherDetails.to_ledger_name,
        },
        items: [
          {
            name: `Payment from ${voucherDetails.from_ledger_name}`,
            quantity: 1,
            price: voucherDetails.amount,
          },
        ],
        summary: {
          subTotal: voucherDetails.amount,
          grandTotal: voucherDetails.amount,
          orderTax: 0,
          discount: 0,
          shipping: 0,
        },
        payment: {
          amountPaid: voucherDetails.amount,
        },
        payment_methods: [
          {
            amount: voucherDetails.amount,
            mode_of_payment: voucherDetails.from_ledger_name,
          },
        ],
      };

      setSelectedVoucherForPrint(formattedData);
      setIsVoucherPrintModalOpen(true);
      setVoucherIdToFetch(null);
    }
  }, [isSuccess, voucherDetails]);

  const searchOptions = useMemo(
    () => [
      { value: "voucher_no", name: "Voucher No" },
      { value: "invoice_type", name: "Invoice Type" },
      { value: "from_ledger_name", name: "Payment From" },
      { value: "to_ledger_name", name: "Payment To" },
      { value: "done_by_name", name: "Done By" },
      { value: "cost_center_name", name: "Cost Center" },
      { value: "amount", name: "Amount" },
    ],
    [],
  );

  const handleSort = useCallback(
    (value) => setState({ sort: value, page: 1 }),
    [],
  );
  const handlePageChange = useCallback((p) => setState({ page: p }), []);
  const handlePageLimitSelect = useCallback(
    (l) => setState({ page_size: l, page: 1 }),
    [],
  );

  const handleSearch = useCallback(() => {
    setState({
      page: 1,
      searchType,
      searchKey,
      voucher_no: "",
      amount: "",
      min_amount: "",
      max_amount: "",
      done_by_id: "",
      cost_center_id: "",
    });
  }, [searchType, searchKey]);

  const handleRefresh = useCallback(() => {
    setState({
      page: 1,
      sort: "-date",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: "",
      min_amount: "",
      max_amount: "",
      voucher_no: "",
      amount: "",
      voucher_type: 0,
      // UPDATED: Reset to explicit defaults
      invoice_types: "PURCHASE,SALERETURN",
      searchType: "",
      searchKey: "",
    });
    refetch();
  }, [refetch]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({
      [key]: value,
      page: 1,
      ...(key === "amount" && { min_amount: "", max_amount: "" }),
      searchType: "",
      searchKey: "",
      done_by_id: "",
      cost_center_id: "",
    });
  }, []);

  const handleFilterApply = useCallback(() => {
    setState({
      ...localFilters,
      page: 1,
      amount: "",
      searchType: "",
      searchKey: "",
    });
    setShowFilter(false);
  }, [localFilters]);

  const handleInvoiceTypeFilterClick = useCallback((newType) => {
    // UPDATED: Set to explicit pair if "All" is selected
    const typesToSet = newType === "" ? "PURCHASE,SALERETURN" : newType;
    setState({
      page: 1,
      invoice_types: typesToSet,
      searchType: "",
      searchKey: "",
    });
  }, []);

  const handlePrint = useCallback((voucherId) => {
    setVoucherIdToFetch(voucherId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!voucherToDelete) return;
    try {
      await deleteVoucher(voucherToDelete.id);
      showToast({
        crudItem: CRUDITEM.VOUCHER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      setVoucherToDelete(null);
      refetch();
    } catch (e) {
      showToast({
        crudItem: CRUDITEM.VOUCHER,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  }, [voucherToDelete, deleteVoucher, showToast, refetch]);

  const rowHandlers = useMemo(
    () => ({
      getMenuItems: (v) => [
        {
          label: "View",
          icon: <FiEye size={16} />,
          onClick: () =>
            navigate(
              `/${
                v.invoice_type === "SALERETURN"
                  ? "payment-against-sale-return"
                  : "payment-against-purchase"
              }/view/${v.id}`,
            ),
        },
        {
          label: "Edit",
          icon: <FiEdit size={16} />,
          onClick: () =>
            navigate(
              `/${
                v.invoice_type === "SALERETURN"
                  ? "payment-against-sale-return"
                  : "payment-against-purchase"
              }/edit/${v.id}`,
            ),
        },
        {
          label: "Print",
          icon: <FiPrinter size={16} />,
          onClick: () => handlePrint(v.id),
        },
        {
          label: "Delete",
          icon: <FiTrash2 size={16} />,
          onClick: () => setVoucherToDelete(v),
          isDelete: true,
        },
      ],
    }),
    [navigate, handlePrint],
  );

  const finalSubtitle = useMemo(() => {
    const dateSubtitle =
      state.start_date && state.end_date
        ? `${state.start_date} to ${state.end_date}`
        : null;
    const invoiceTypeSubtitle = state.invoice_types.includes(",")
      ? null
      : `Filtered by: ${state.invoice_types.toUpperCase()}`;
    const searchSubtitle = state.searchKey
      ? `Search: "${state.searchKey}" in ${
          searchOptions.find((opt) => opt.value === state.searchType)?.name ||
          "All"
        }`
      : null;
    return [dateSubtitle, invoiceTypeSubtitle, searchSubtitle]
      .filter(Boolean)
      .join(" | ");
  }, [
    state.start_date,
    state.end_date,
    state.invoice_types,
    state.searchKey,
    state.searchType,
    searchOptions,
  ]);

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Payment Report"
            subtitle={finalSubtitle}
          />
          <TableTopContainer
            summary={
              !loading &&
              data && (
                <div className="summary-with-status">
                  <AmountSummary
                    total={data.total_amount}
                    received={0}
                    pending={data.total_amount}
                  />
                </div>
              )
            }
            mainActions={
              <>

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
                      searchType: "",
                      searchKey: "",
                    })
                  }
                />
                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={handleFilterApply}
                >
                  <VStack spacing={4}>
                    <DoneByAutoComplete
                      label="Done By"
                      value={localFilters.done_by_id}
                      onChange={(e) =>
                        setLocalFilters((p) => ({
                          ...p,
                          done_by_id: e.target.value,
                        }))
                      }
                    />
                    <CostCenterAutoComplete
                      label="Cost Center"
                      value={localFilters.cost_center_id}
                      onChange={(e) =>
                        setLocalFilters((p) => ({
                          ...p,
                          cost_center_id: e.target.value,
                        }))
                      }
                    />
                    <RangeField
                      label="Amount Range"
                      minValue={localFilters.min_amount}
                      maxValue={localFilters.max_amount}
                      onMinChange={(val) =>
                        setLocalFilters((p) => ({ ...p, min_amount: val }))
                      }
                      onMaxChange={(val) =>
                        setLocalFilters((p) => ({ ...p, max_amount: val }))
                      }
                    />
                  </VStack>
                </PopUpFilter>
                <PopupSearchField
                  searchKey={searchKey}
                  setSearchKey={setSearchKey}
                  searchType={searchType}
                  setSearchType={setSearchType}
                  handleSearch={handleSearch}
                  searchOptions={searchOptions}
                  searchRef={searchRef}
                />
                <VoucherAddButton
                  title="New Payment"
                  items={[
                    {
                      label: "Supplier Payment Out",
                      onClick: () => navigate("/payment-against-purchase"),
                    },
                    {
                      label: "Other Payment Out",
                      onClick: () => navigate("/payment-against-sale-return"),
                    },
                  ]}
                />
              </>
            }
            topRight={
              <>
                <InvoiceTypeFilter
                  currentType={state.invoice_types}
                  onClick={handleInvoiceTypeFilterClick}
                />
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
                  <Th>
                    <ThContainer>
                      Date
                      <ThSort
                        sort={state.sort}
                        value="date"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
                  <Th>
                    <ThContainer>
                      Voucher No
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="voucher_no"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch={true}
                          onSearch={() =>
                            handleHeaderSearch(
                              "voucher_no",
                              headerFilters.voucher_no,
                            )
                          }
                        >
                          <InputField
                            value={headerFilters.voucher_no}
                            onChange={(e) =>
                              setHeaderFilters((p) => ({
                                ...p,
                                voucher_no: e.target.value,
                              }))
                            }
                            isLabel={false}
                            placeholder="Search No"
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th>Invoice Type</Th>
                  <Th>
                    <ThContainer>
                      Payment From
                      <ThSort
                        sort={state.sort}
                        value="from_ledger"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
                  <Th>
                    <ThContainer>
                      Payment To
                      <ThSort
                        sort={state.sort}
                        value="to_ledger"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
                  <Th>Done By</Th>
                  <Th>Cost Center</Th>
                  <Th>
                    <ThContainer>
                      Amount
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="amount"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch={true}
                          onSearch={() =>
                            handleHeaderSearch("amount", headerFilters.amount)
                          }
                        >
                          <InputField
                            type="number"
                            value={headerFilters.amount}
                            onChange={(e) =>
                              setHeaderFilters((p) => ({
                                ...p,
                                amount: e.target.value,
                              }))
                            }
                            isLabel={false}
                            placeholder="Exact Amount"
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <ThDotMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((v, i) => (
                    <PaymentRow
                      key={v.id}
                      voucher={v}
                      index={i}
                      page={state.page}
                      pageSize={state.page_size}
                      handlers={rowHandlers}
                    />
                  ))
                ) : (
                  <TableCaption item="Payments" noOfCol={10} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton title="Payment Report" />
          <ScrollContainer>
            <HStack>
              <DateFilter
                value={{ startDate: state.start_date, endDate: state.end_date }}
                onChange={(v) =>
                  setState({
                    start_date: v.startDate,
                    end_date: v.endDate,
                    page: 1,
                    searchType: "",
                    searchKey: "",
                  })
                }
              />
              <RefreshButton onClick={handleRefresh} />

              <PopUpFilter
                isOpen={showFilter}
                setIsOpen={setShowFilter}
                onApply={handleFilterApply}
              >
                <VStack spacing={4}>
                  <DoneByAutoComplete
                    label="Done By"
                    value={localFilters.done_by_id}
                    onChange={(e) =>
                      setLocalFilters((p) => ({
                        ...p,
                        done_by_id: e.target.value,
                      }))
                    }
                  />
                  <CostCenterAutoComplete
                    label="Cost Center"
                    value={localFilters.cost_center_id}
                    onChange={(e) =>
                      setLocalFilters((p) => ({
                        ...p,
                        cost_center_id: e.target.value,
                      }))
                    }
                  />
                  <RangeField
                    label="Amount Range"
                    minValue={localFilters.min_amount}
                    maxValue={localFilters.max_amount}
                    onMinChange={(val) =>
                      setLocalFilters((p) => ({ ...p, min_amount: val }))
                    }
                    onMaxChange={(val) =>
                      setLocalFilters((p) => ({ ...p, max_amount: val }))
                    }
                  />
                </VStack>
              </PopUpFilter>

              <MobileSearchField
                searchKey={searchKey}
                setSearchKey={setSearchKey}
                searchType={searchType}
                setSearchType={setSearchType}
                handleSearch={handleSearch}
                searchOptions={searchOptions}
                searchRef={searchRef}
              />
              <div style={{ marginLeft: "auto" }}>
                <VoucherAddButton
                  title="New Payment"
                  items={[
                    {
                      label: "Supplier Payment Out",
                      onClick: () => navigate("/payment-against-purchase"),
                    },
                    {
                      label: "Other Payment Out",
                      onClick: () => navigate("/payment-against-sale-return"),
                    },
                  ]}
                />
              </div>
            </HStack>

            {loading ? (
              <Loader />
            ) : (
              <div style={{ padding: "0 10px" }}>
                {listData.map((v) => (
                  <MobilePaymentCard
                    key={v.id}
                    voucher={v}
                    handlers={rowHandlers}
                  />
                ))}
              </div>
            )}
          </ScrollContainer>
        </>
      )}

      {!loading && listData.length > 0 && (
        <TableFooter
          totalItems={data?.count || 0}
          currentPage={state.page}
          itemsPerPage={state.page_size}
          totalPages={data?.page_count || 1}
          handlePageChange={handlePageChange}
          handlePageLimitSelect={handlePageLimitSelect}
        />
      )}
      <DeleteConfirmationModal
        isOpen={!!voucherToDelete}
        onClose={() => setVoucherToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        transactionName={`Payment ${voucherToDelete?.voucher_no}`}
      />
      <ReceiptModal
        isOpen={isVoucherPrintModalOpen || isDetailsLoading}
        onClose={() => {
          setIsVoucherPrintModalOpen(false);
          setVoucherIdToFetch(null);
        }}
        transactionData={selectedVoucherForPrint}
      />
    </ContainerWrapper>
  );
};

const InvoiceTypeFilter = React.memo(({ currentType, onClick }) => {
  // UPDATED: All is selected if the specific payment types are selected
  const isAllSelected =
    currentType === "PURCHASE,SALERETURN" || currentType === "";

  return (
    <div className="status-filter-boxs">
      <HStack gap={9}>
        <StatusButton
          variant="all"
          isSelected={isAllSelected}
          onClick={() => onClick("")}
        >
          All
        </StatusButton>
        <StatusButton
          variant="available"
          isSelected={currentType === "PURCHASE"}
          onClick={() => onClick("PURCHASE")}
        >
          Purchase
        </StatusButton>
        <StatusButton
          variant="maintenance"
          isSelected={currentType === "SALERETURN"}
          onClick={() => onClick("SALERETURN")}
        >
          Sale Return
        </StatusButton>
      </HStack>
    </div>
  );
});

export default PaymentReport;
