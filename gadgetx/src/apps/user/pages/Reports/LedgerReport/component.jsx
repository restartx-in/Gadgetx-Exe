import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLedgerReport } from "@/apps/user/hooks/api/ledger/useLedgerReport";
import { useLedger } from "@/apps/user/hooks/api/ledger/useLedger";
import useDeleteVoucher from "@/apps/user/hooks/api/voucher/useDeleteVoucher";
import { useIsMobile } from "@/utils/useIsMobile";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import InputField from "@/components/InputField";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  ThSort,
  TdOverflow,
  TdNumeric,
  TdSL,
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
import DateFilter from "@/components/DateFilter";
import SelectField from "@/components/SelectField";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import TextBadge from "@/components/TextBadge";

// --- Constants ---
const filterOptions = [
  { value: "", label: "All Types" },
  { value: "SALE", label: "Sale" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "SALERETURN", label: "Sale Return" },
  { value: "PURCHASERETURN", label: "Purchase Return" },
  { value: "0", label: "Payment" },
  { value: "1", label: "Receipt" },
];

const getVoucherTypeName = (typeIdOrName) => {
  // Check if it matches a specific label in our options
  const found = filterOptions.find((opt) => opt.value === String(typeIdOrName));
  return found ? found.label : typeIdOrName || "Voucher";
};

// --- Reducer ---
const stateReducer = (state, newState) => ({ ...state, ...newState });

// --- Memoized Components ---

const LedgerRow = React.memo(
  ({ row, index, page, pageSize, isDetailedMode, handlers, onRowClick }) => {
    const menuItems = useMemo(
      () => handlers.getMenuItems(row),
      [row, handlers]
    );

    // Use invoice_type if present, otherwise map voucher_type ID to label
    const displayType = row.invoice_type
      ? getVoucherTypeName(row.invoice_type)
      : getVoucherTypeName(row.voucher_type);

    return (
      <Tr
        onClick={() => onRowClick(row)}
        style={{ cursor: "pointer", transition: "background-color 0.2s" }}
      >
        <TdSL index={index} page={page} pageSize={pageSize} />
        <TdDate>{row.date}</TdDate>
        <TdOverflow>{row.voucher_no}</TdOverflow>

        <Td>
          <TextBadge variant={row.invoice_type ? "outline" : "default"}>
            {displayType}
          </TextBadge>
        </Td>

        <TdOverflow style={{ fontSize: "0.9em", color: "#555" }}>
          {row.invoice_no || "-"}
        </TdOverflow>

        {isDetailedMode && (
          <TdOverflow style={{ fontWeight: 500, color: "#555" }}>
            {row.particular_name || "-"}
          </TdOverflow>
        )}

        {isDetailedMode ? (
          <>
            <TdNumeric style={{ color: row.debit > 0 ? "#1f2937" : "#d1d5db" }}>
              {parseFloat(row.debit || 0) !== 0
                ? parseFloat(row.debit).toFixed(2)
                : "-"}
            </TdNumeric>
            <TdNumeric
              style={{ color: row.credit > 0 ? "#1f2937" : "#d1d5db" }}
            >
              {parseFloat(row.credit || 0) !== 0
                ? parseFloat(row.credit).toFixed(2)
                : "-"}
            </TdNumeric>
            <TdNumeric style={{ fontWeight: 500 }}>
              {row.balance !== undefined
                ? parseFloat(row.balance).toFixed(2)
                : "-"}
            </TdNumeric>
          </>
        ) : (
          <>
            <TdOverflow>{row.from_ledger_name}</TdOverflow>
            <TdOverflow>{row.to_ledger_name}</TdOverflow>
            <TdNumeric>{row.amount}</TdNumeric>
          </>
        )}

        <Td onClick={(e) => e.stopPropagation()}>
          <DotMenu items={menuItems} />
        </Td>
      </Tr>
    );
  }
);

const MobileLedgerCard = React.memo(
  ({ row, isDetailedMode, handlers, onRowClick }) => {
    const menuItems = useMemo(
      () => handlers.getMenuItems(row),
      [row, handlers]
    );

    const displayType = row.invoice_type
      ? getVoucherTypeName(row.invoice_type)
      : getVoucherTypeName(row.voucher_type);

    const subtitle = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        <span>
          {row.voucher_no} •{" "}
          <span style={{ fontWeight: 600 }}>{displayType}</span>
        </span>
        {row.invoice_no && <span>Inv: {row.invoice_no}</span>}
        {isDetailedMode && (
          <span style={{ fontWeight: 600, color: "#555" }}>
            Part: {row.particular_name}
          </span>
        )}
        {row.description && <span>{row.description}</span>}
        {!isDetailedMode && (
          <span>
            {row.from_ledger_name} ➔ {row.to_ledger_name}
          </span>
        )}
      </div>
    );

    const amountDisplay = (
      <div style={{ textAlign: "right" }}>
        {isDetailedMode ? (
          <>
            {parseFloat(row.debit) > 0 && (
              <div style={{ color: "#16a34a", fontSize: "12px" }}>
                Dr: {parseFloat(row.debit).toFixed(2)}
              </div>
            )}
            {parseFloat(row.credit) > 0 && (
              <div style={{ color: "#dc2626", fontSize: "12px" }}>
                Cr: {parseFloat(row.credit).toFixed(2)}
              </div>
            )}
            <div
              style={{ fontWeight: "bold", color: "#1f2937", marginTop: "4px" }}
            >
              Bal: {parseFloat(row.balance).toFixed(2)}
            </div>
          </>
        ) : (
          <div style={{ fontWeight: "bold", color: "#1f2937" }}>
            {parseFloat(row.amount).toFixed(2)}
          </div>
        )}
      </div>
    );

    return (
      <div onClick={() => onRowClick(row)}>
        <ListItem
          title={row.date}
          subtitle={subtitle}
          amount={
            <div style={{ display: "flex", gap: "8px" }}>
              {amountDisplay}
              <div onClick={(e) => e.stopPropagation()}>
                <DotMenu items={menuItems} />
              </div>
            </div>
          }
        />
      </div>
    );
  }
);

const LedgerReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [localLedgerId, setLocalLedgerId] = useState(
    searchParams.get("ledgerId") || ""
  );
  const [localVoucherType, setLocalVoucherType] = useState(
    searchParams.get("voucherType") || ""
  );
  const [showFilter, setShowFilter] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const [headerFilters, setHeaderFilters] = useState({
    voucher_no: "",
    description: "",
    amount: "",
    particular_name: "",
    from_ledger_name: "",
    to_ledger_name: "",
  });

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "-date",
    ledger_id: searchParams.get("ledgerId") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    voucher_no: searchParams.get("voucherNo") || "",
    description: searchParams.get("description") || "",
    amount: searchParams.get("exactAmount") || "",
    voucher_type: searchParams.get("voucherType") || "", // This filters Sale, Purchase, etc.
    particular_name: searchParams.get("particularName") || "",
    from_ledger_name: searchParams.get("fromLedger") || "",
    to_ledger_name: searchParams.get("toLedger") || "",
  });

  // --- URL Synchronization ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    ledgerId: state.ledger_id,
    startDate: state.start_date,
    endDate: state.end_date,
    voucherNo: state.voucher_no,
    description: state.description,
    exactAmount: state.amount,
    voucherType: state.voucher_type,
    particularName: state.particular_name,
    fromLedger: state.from_ledger_name,
    toLedger: state.to_ledger_name,
  });

  // Sync state to local input filters
  useEffect(() => {
    setLocalLedgerId(state.ledger_id);
    setLocalVoucherType(state.voucher_type);
    setHeaderFilters((prev) => ({
      ...prev,
      voucher_no: state.voucher_no || "",
      description: state.description || "",
      amount: state.amount || "",
      particular_name: state.particular_name || "",
      from_ledger_name: state.from_ledger_name || "",
      to_ledger_name: state.to_ledger_name || "",
    }));
  }, [state]);

  // --- API Hooks ---
  const { data: ledgersList = [] } = useLedger();

  const ledgerOptions = useMemo(
    () =>
      Array.isArray(ledgersList)
        ? ledgersList.map((l) => ({ value: l.id, label: l.name }))
        : [],
    [ledgersList]
  );

  const {
    data: reportData,
    isLoading,
    isRefetching,
    refetch,
  } = useLedgerReport(state);
  const { mutateAsync: deleteVoucher, isPending: isDeleting } =
    useDeleteVoucher();

  const loading = isLoading || isRefetching;
  const rows = reportData?.data || [];
  const totalCount = reportData?.total_count || 0;
  const isDetailedMode = !!state.ledger_id;

  // --- Handlers ---

  const handleSort = useCallback((value) => {
    setState({ sort: value, page: 1 });
  }, []);

  const handlePageChange = useCallback((p) => {
    setState({ page: p });
  }, []);

  const handlePageLimitSelect = useCallback((l) => {
    setState({ page_size: l, page: 1 });
  }, []);

  const handleRefresh = useCallback(() => {
    setState({
      page: 1,
      sort: "-date",
      ledger_id: "",
      start_date: "",
      end_date: "",
      voucher_no: "",
      description: "",
      amount: "",
      voucher_type: "",
      particular_name: "",
      from_ledger_name: "",
      to_ledger_name: "",
    });
    refetch();
  }, [refetch]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ [key]: value, page: 1 });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [headerFilters, handleHeaderSearch]
  );

  const handleFilterApply = useCallback(() => {
    setState({
      ledger_id: localLedgerId,
      voucher_type: localVoucherType,
      page: 1,
    });
    setShowFilter(false);
  }, [localLedgerId, localVoucherType]);

  const handleRowClick = useCallback(
    (row) => {
      const type = (row.invoice_type || "").toUpperCase().replace(/\s+/g, "");
      const transactionId = row.invoice_no;

      if (transactionId) {
        if (type === "SALERETURN")
          return navigate(`/sale-return/view/${transactionId}`);
        if (type === "PURCHASERETURN")
          return navigate(`/purchase-return/view/${transactionId}`);
        if (type === "SALE") return navigate(`/sale/view/${transactionId}`);
        if (type === "PURCHASE")
          return navigate(`/purchase/view/${transactionId}`);
      }
      navigate(`/voucher/${row.id}`);
    },
    [navigate]
  );

  const rowHandlers = useMemo(
    () => ({
      getMenuItems: (v) => [
        {
          label: "Edit Voucher",
          onClick: () => {
            const type = (v.invoice_type || "")
              .toUpperCase()
              .replace(/\s+/g, "");
            const transactionId = v.invoice_no;

            if (transactionId) {
              if (type === "SALERETURN")
                return navigate(`/sale-return/edit/${transactionId}`);
              if (type === "PURCHASERETURN")
                return navigate(`/purchase-return/edit/${transactionId}`);
              if (type === "SALE")
                return navigate(`/sale/edit/${transactionId}`);
              if (type === "PURCHASE")
                return navigate(`/purchase/edit/${transactionId}`);
            }
            navigate(`/voucher/${v.id}`);
          },
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

  const selectedLedgerName = useMemo(
    () =>
      state.ledger_id
        ? ledgerOptions.find((l) => String(l.value) === String(state.ledger_id))
            ?.label || "Unknown Ledger"
        : "All Vouchers",
    [ledgerOptions, state.ledger_id]
  );

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

  // --- Render ---
  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton
            title="Ledger Report"
            subtitle={selectedLedgerName}
          />
          <TableTopContainer
            //isMargin={true}
            summary={
              isDetailedMode &&
              !loading && (
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    Opening:{" "}
                    <span style={{ fontWeight: "bold", color: "#333" }}>
                      {parseFloat(reportData?.opening_balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
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
                <div style={{ minWidth: "220px" }}>
                  <SelectField
                    placeholder="All Vouchers"
                    options={[
                      { value: "", label: "All Vouchers" },
                      ...ledgerOptions,
                    ]}
                    value={state.ledger_id}
                    onChange={(e) =>
                      setState({ ledger_id: e.target.value, page: 1 })
                    }
                    isSearchable={true}
                  />
                </div>
                {/* Advanced Filter Popover */}
                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={handleFilterApply}
                >
                  <VStack spacing={4}>
                    <SelectField
                      label="Ledger"
                      placeholder="All Vouchers"
                      options={[
                        { value: "", label: "All Vouchers" },
                        ...ledgerOptions,
                      ]}
                      value={localLedgerId}
                      onChange={(e) => setLocalLedgerId(e.target.value)}
                      isSearchable={true}
                    />
                    <SelectField
                      label="Type"
                      options={filterOptions}
                      value={localVoucherType}
                      onChange={(e) => setLocalVoucherType(e.target.value)}
                    />
                  </VStack>
                </PopUpFilter>
                <RefreshButton onClick={handleRefresh} />
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
                              setHeaderFilters((prev) => ({
                                ...prev,
                                voucher_no: e.target.value,
                              }))
                            }
                            onKeyDown={(e) =>
                              handleHeaderKeyDown(e, "voucher_no")
                            }
                            isLabel={false}
                            placeholder="Search No"
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>

                  {/* INVOICE TYPE FILTER ADDED HERE */}
                  <Th>
                    <ThContainer>
                      Invoice Type
                      <ThFilterContainer>
                        <ThSort
                          sort={state.sort}
                          value="voucher_type"
                          handleSort={handleSort}
                        />
                        {/* Using the popover container for style, but select triggers immediately */}
                        <ThSearchOrFilterPopover>
                          <div style={{ minWidth: "150px" }}>
                            <SelectField
                              isLabel={false}
                              options={filterOptions}
                              value={state.voucher_type}
                              onChange={(e) =>
                                setState({
                                  voucher_type: e.target.value,
                                  page: 1,
                                })
                              }
                            />
                          </div>
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>

                  <Th>
                    <ThContainer>Invoice No</ThContainer>
                  </Th>

                  {isDetailedMode && (
                    <Th>
                      <ThContainer>
                        Particulars
                        <ThFilterContainer>
                          <ThSort
                            sort={state.sort}
                            value="particular_name"
                            handleSort={handleSort}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={true}
                            onSearch={() =>
                              handleHeaderSearch(
                                "particular_name",
                                headerFilters.particular_name
                              )
                            }
                          >
                            <InputField
                              value={headerFilters.particular_name}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  particular_name: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "particular_name")
                              }
                              isLabel={false}
                              placeholder="Search Ledger"
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                  )}
                  {isDetailedMode ? (
                    <>
                      <Th>Debit</Th>
                      <Th>Credit</Th>
                      <Th>Balance</Th>
                    </>
                  ) : (
                    <>
                      <Th>
                        <ThContainer>
                          Payment From
                          <ThFilterContainer>
                            <ThSort
                              sort={state.sort}
                              value="from_ledger_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "from_ledger_name",
                                  headerFilters.from_ledger_name
                                )
                              }
                            >
                              <InputField
                                value={headerFilters.from_ledger_name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    from_ledger_name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "from_ledger_name")
                                }
                                isLabel={false}
                                placeholder="Search From"
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Payment To
                          <ThFilterContainer>
                            <ThSort
                              sort={state.sort}
                              value="to_ledger_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "to_ledger_name",
                                  headerFilters.to_ledger_name
                                )
                              }
                            >
                              <InputField
                                value={headerFilters.to_ledger_name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    to_ledger_name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "to_ledger_name")
                                }
                                isLabel={false}
                                placeholder="Search To"
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Amount
                          <ThFilterContainer>
                            <ThSort
                              sort={state.sort}
                              value="amount"
                              handleSort={handleSort}
                            />
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                    </>
                  )}
                  <ThDotMenu />
                </Tr>
              </Thead>
              <Tbody>
                {rows.length > 0 ? (
                  rows.map((row, i) => (
                    <LedgerRow
                      key={row.id}
                      row={row}
                      index={i}
                      page={state.page}
                      pageSize={state.page_size}
                      isDetailedMode={isDetailedMode}
                      handlers={rowHandlers}
                      onRowClick={handleRowClick}
                    />
                  ))
                ) : (
                  <TableCaption
                    item="Transactions"
                    noOfCol={isDetailedMode ? 10 : 9}
                  />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <>
          <PageTitleWithBackButton title="Ledger Report" />
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
              <SelectField
                placeholder="All"
                options={[{ value: "", label: "All" }, ...ledgerOptions]}
                value={state.ledger_id}
                onChange={(e) =>
                  setState({ ledger_id: e.target.value, page: 1 })
                }
                isSearchable={false}
              />
              {/* Added Filter Icon on Mobile to access Type filter */}
              <PopUpFilter
                isOpen={showFilter}
                setIsOpen={setShowFilter}
                onApply={handleFilterApply}
              >
                <VStack spacing={4}>
                  <SelectField
                    label="Ledger"
                    placeholder="All Vouchers"
                    options={[
                      { value: "", label: "All Vouchers" },
                      ...ledgerOptions,
                    ]}
                    value={localLedgerId}
                    onChange={(e) => setLocalLedgerId(e.target.value)}
                    isSearchable={true}
                  />
                  <SelectField
                    label="Type"
                    options={filterOptions}
                    value={localVoucherType}
                    onChange={(e) => setLocalVoucherType(e.target.value)}
                  />
                </VStack>
              </PopUpFilter>
              <RefreshButton onClick={handleRefresh} />
            </HStack>

            {loading ? (
              <Loader />
            ) : (
              <div style={{ padding: "0 10px" }}>
                {rows.map((row) => (
                  <MobileLedgerCard
                    key={row.id}
                    row={row}
                    isDetailedMode={isDetailedMode}
                    handlers={rowHandlers}
                    onRowClick={handleRowClick}
                  />
                ))}
              </div>
            )}
          </ScrollContainer>
        </>
      )}

      {!loading && (
        <TableFooter
          totalItems={totalCount}
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
        transactionName={`Voucher ${voucherToDelete?.voucher_no}`}
      />
    </ContainerWrapper>
  );
};

export default LedgerReport;
