import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useVouchersPaginated from "@/hooks/api/voucher/useVouchersPaginated";
import useDeleteVoucher from "@/hooks/api/voucher/useDeleteVoucher";
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
import HStack from "@/components/HStack/component.jsx";
import VStack from "@/components/VStack";
import TableTopContainer from "@/components/TableTopContainer";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import RefreshButton from "@/components/RefreshButton";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import Loader from "@/components/Loader";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import DotMenu from "@/components/DotMenu/component";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal/component";
import AmountSummary from "@/components/AmountSummary";
import DateFilter from "@/components/DateFilter";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import VoucherAddButton from "@/apps/user/components/VoucherAddButton";
import useSyncURLParams from "@/hooks/useSyncURLParams";

// --- Reducer & Memoized Components ---
const stateReducer = (state, newState) => ({ ...state, ...newState });

const ReceiptRow = React.memo(
  ({ voucher, index, page, pageSize, handlers }) => {
    const menuItems = useMemo(
      () => handlers.getMenuItems(voucher),
      [voucher, handlers]
    );
    return (
      <Tr>
        <TdSL index={index} page={page} pageSize={pageSize} />
        <TdDate>{voucher.date}</TdDate>
        <Td>{voucher.voucher_no}</Td>
        <Td>{voucher.invoice_type || "N/A"}</Td>
        <Td>{voucher.from_ledger_name}</Td>
        <Td>{voucher.to_ledger_name}</Td>
        <Td>{voucher.done_by_name || "N/A"}</Td>
        <Td>{voucher.cost_center_name || "N/A"}</Td>
        <TdNumeric>{voucher.amount}</TdNumeric>
        <Td onClick={(e) => e.stopPropagation()}>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  }
);

const MobileReceiptCard = React.memo(({ voucher, handlers }) => {
  const menuItems = useMemo(
    () => handlers.getMenuItems(voucher),
    [voucher, handlers]
  );
  return (
    <ListItem
      title={voucher.voucher_no}
      subtitle={
        <>
          <div className="fs14">From: {voucher.from_ledger_name}</div>
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

const ReceiptReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // --- 1. State Management ---
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
    invoice_types: searchParams.get("invoiceTypes") || "",
    voucher_type: 1, // 1 for Receipt
  });

  // Local UI state for form inputs
  const [showFilter, setShowFilter] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    done_by_id: "",
    cost_center_id: "",
    min_amount: "",
    max_amount: "",
    start_date: "",
    end_date: "",
  });
  const [headerFilters, setHeaderFilters] = useState({
    voucher_no: "",
    amount: "",
  });
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  // --- 2. URL Synchronization ---
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
  });

  // Sync local UI states when main state changes
  useEffect(() => {
    setLocalFilters((prev) => ({
      ...prev,
      done_by_id: state.done_by_id,
      cost_center_id: state.cost_center_id,
      min_amount: state.min_amount,
      max_amount: state.max_amount,
      start_date: state.start_date,
      end_date: state.end_date,
    }));
    setHeaderFilters((prev) => ({
      ...prev,
      voucher_no: state.voucher_no,
      amount: state.amount,
    }));
  }, [state]);

  // --- 3. Data Fetching ---
  const { data, isLoading, isRefetching, refetch } =
    useVouchersPaginated(state);
  const { mutateAsync: deleteVoucher, isPending: isDeleting } =
    useDeleteVoucher();
  const loading = isLoading || isRefetching;
  const listData = useMemo(() => data?.data || [], [data]);

  // --- 4. Memoized Callbacks for Handlers ---
  const handleSort = useCallback(
    (value) => setState({ sort: value, page: 1 }),
    []
  );
  const handlePageChange = useCallback((p) => setState({ page: p }), []);
  const handlePageLimitSelect = useCallback(
    (l) => setState({ page_size: l, page: 1 }),
    []
  );

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
      invoice_types: "",
      voucher_type: 1,
    });
    refetch();
  }, [refetch]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({
      [key]: value,
      page: 1,
      ...(key === "amount" && { min_amount: "", max_amount: "" }),
    });
  }, []);

  const handleFilterApply = useCallback(() => {
    setState({ ...localFilters, page: 1, amount: "" });
    setShowFilter(false);
  }, [localFilters]);

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
          onClick: () =>
            navigate(
              `/${
                v.invoice_type === "PURCHASERETURN"
                  ? "receipt-against-purchase-return"
                  : "receipt-against-sale"
              }/view/${v.id}`
            ),
        },
        {
          label: "Edit",
          onClick: () =>
            navigate(
              `/${
                v.invoice_type === "PURCHASERETURN"
                  ? "receipt-against-purchase-return"
                  : "receipt-against-sale"
              }/edit/${v.id}`
            ),
        },
        {
          label: "Delete",
          onClick: () => setVoucherToDelete(v),
          isDelete: true,
        },
      ],
    }),
    [navigate]
  );

  // --- 5. Memoized Derived Data ---
  const finalSubtitle = useMemo(() => {
    const dateSubtitle =
      state.start_date && state.end_date
        ? `${state.start_date} → ${state.end_date}`
        : null;
    const invoiceTypeSubtitle = state.invoice_types
      ? `Filtered by: ${state.invoice_types.toUpperCase()}`
      : null;
    return [dateSubtitle, invoiceTypeSubtitle].filter(Boolean).join(" | ");
  }, [state.start_date, state.end_date, state.invoice_types]);

  // --- 6. Render ---
  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Receipt Report"
            subtitle={finalSubtitle}
          />
          <TableTopContainer
            summary={
              !loading &&
              data && (
                <AmountSummary
                  total={data.total_amount}
                  received={data.total_amount}
                  pending={0}
                />
              )
            }
            mainActions={
              <>
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
                <RefreshButton onClick={handleRefresh} />
                <VoucherAddButton
                  title="New Receipt"
                  items={[
                    {
                      label: "Against Sales",
                      onClick: () => navigate("/receipt-against-sale"),
                    },
                    {
                      label: "Against Purchase Return",
                      onClick: () =>
                        navigate("/receipt-against-purchase-return"),
                    },
                  ]}
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
                              headerFilters.voucher_no
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
                    <ReceiptRow
                      key={v.id}
                      voucher={v}
                      index={i}
                      page={state.page}
                      pageSize={state.page_size}
                      handlers={rowHandlers}
                    />
                  ))
                ) : (
                  <TableCaption item="Receipts" noOfCol={10} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton title="Receipt Report" />
          <ScrollContainer>
            <HStack spacing={2} style={{ padding: "10px" }}>
              <DateFilter
                value={{ startDate: state.start_date, endDate: state.end_date }}
                onChange={(v) =>
                  setState({
                    start_date: v.startDate,
                    end_date: v.endDate,
                    page: 1,
                  })
                }
              />
              <RefreshButton onClick={handleRefresh} />
            </HStack>
            {loading ? (
              <Loader />
            ) : (
              <div style={{ padding: "0 10px" }}>
                {finalSubtitle && (
                  <div
                    style={{
                      marginBottom: "10px",
                      padding: "5px",
                      backgroundColor: "#e6f7ff",
                      borderLeft: "3px solid #1890ff",
                      fontSize: "12px",
                    }}
                  >
                    {finalSubtitle}.
                  </div>
                )}
                {listData.map((v) => (
                  <MobileReceiptCard
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
      {!loading && (
        <TableFooter
          totalItems={data?.count || 0}
          currentPage={state.page}
          itemsPerPage={state.page_size}
          handlePageChange={handlePageChange}
          handlePageLimitSelect={handlePageLimitSelect}
        />
      )}
      <DeleteConfirmationModal
        isOpen={!!voucherToDelete}
        onClose={() => setVoucherToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        transactionName={`Receipt ${voucherToDelete?.voucher_no}`}
      />
    </ContainerWrapper>
  );
};

export default ReceiptReport;
