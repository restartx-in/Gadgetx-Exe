import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TdMenu,
  ThMenu,
  TdDate,
  TdNumeric,
  TdOverflow,
  TableCaption,
  ThContainer,
  ThSort,
  ThFilterContainer,
  ThSearchOrFilterPopover,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import Spacer from "@/components/Spacer";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import RefreshButton from "@/components/RefreshButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import InputField from "@/components/InputField";
import RangeField from "@/components/RangeField";
import TableFooter from "@/components/TableFooter";
import DateFilter from "@/components/DateFilter";
import ExportMenu from "@/components/ExportMenu";
import useSyncURLParams from "@/hooks/useSyncURLParams";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const CommonPartnershipReport = ({
  usePartnershipsHook,
  useDeleteHook,
  PartnershipModal,
  // Project-specific UI Components
  AccountAutoComplete,
  PaymentStatusSelect,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  AmountSummary,
  StatusButton,
  TextBadge,
  TableTopContainer,
  useExportHook,
  partnershipItemConstant,
  appTag = "common",
}) => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const defaultCC = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";

  // 1. Centralized Reducer State
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "",
    partner_name: searchParams.get("partnerName") || "",
    from_account: searchParams.get("fromAccount") || "",
    status: searchParams.get("status") || "",
    min_contribution: searchParams.get("minContribution") || "",
    max_contribution: searchParams.get("maxContribution") || "",
    min_paid: searchParams.get("minPaid") || "",
    max_paid: searchParams.get("maxPaid") || "",
    min_balance: searchParams.get("minBalance") || "",
    max_balance: searchParams.get("maxBalance") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCC,
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  // 2. Local UI State for responsive/popover inputs
  const [showFilter, setShowFilter] = useState(false);
  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  // 3. URL Sync
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    partnerName: state.partner_name,
    fromAccount: state.from_account,
    status: state.status,
    minContribution: state.min_contribution,
    maxContribution: state.max_contribution,
    minPaid: state.min_paid,
    maxPaid: state.max_paid,
    minBalance: state.min_balance,
    maxBalance: state.max_balance,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort || "");
  }, [state]);

  const { data, isLoading, refetch, isRefetching } = usePartnershipsHook(state);
  const { mutateAsync: deletePartnership } = useDeleteHook();
  const listData = useMemo(() => data?.data || [], [data]);
  const loading = isLoading || isRefetching;

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

  const handleRefresh = useCallback(() => {
    const reset = {
      page: 1,
      page_size: 10,
      partner_name: "",
      from_account: "",
      status: "",
      min_contribution: "",
      max_contribution: "",
      min_paid: "",
      max_paid: "",
      min_balance: "",
      max_balance: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCC,
      sort: "",
      searchType: "",
      searchKey: "",
    };
    setState(reset);
  }, [defaultCC]);

  // Export Logic
  const { exportToExcel, exportToPdf, printDocument } = useExportHook({
    listData,
    state,
    totalData: data,
    totalPage: data?.page_count,
  });

  const handleHeaderSearch = (key, val) => setState({ [key]: val, page: 1 });
  const handleSort = (val) => {
    setSort(val);
    setState({ sort: val, page: 1 });
  };

  const filterContent = (
    <VStack>
      <InputField
        label="Partner Name"
        value={uiState.partner_name}
        onChange={(e) =>
          setUiState({ ...uiState, partner_name: e.target.value })
        }
      />
      <AccountAutoComplete
        value={uiState.from_account}
        onChange={(e) =>
          setUiState({ ...uiState, from_account: e.target.value })
        }
      />
      <PaymentStatusSelect
        value={uiState.status}
        onChange={(e) => setUiState({ ...uiState, status: e.target.value })}
      />
      <DoneByAutoComplete
        value={uiState.done_by_id}
        onChange={(e) => setUiState({ ...uiState, done_by_id: e.target.value })}
        is_edit={false}
      />
      <CostCenterAutoComplete
        value={uiState.cost_center_id}
        disabled={defaultCC !== ""}
        onChange={(e) =>
          setUiState({ ...uiState, cost_center_id: e.target.value })
        }
        is_edit={false}
      />
      <RangeField
        label="Contribution"
        minValue={uiState.min_contribution}
        maxValue={uiState.max_contribution}
        onMinChange={(v) => setUiState({ ...uiState, min_contribution: v })}
        onMaxChange={(v) => setUiState({ ...uiState, max_contribution: v })}
      />
      <RangeField
        label="Paid"
        minValue={uiState.min_paid}
        maxValue={uiState.max_paid}
        onMinChange={(v) => setUiState({ ...uiState, min_paid: v })}
        onMaxChange={(v) => setUiState({ ...uiState, max_paid: v })}
      />
      <RangeField
        label="Balance"
        minValue={uiState.min_balance}
        maxValue={uiState.max_balance}
        onMinChange={(v) => setUiState({ ...uiState, min_balance: v })}
        onMaxChange={(v) => setUiState({ ...uiState, max_balance: v })}
      />
    </VStack>
  );

  const dateSubtitle = useMemo(() => {
    if (
      state.start_date &&
      state.end_date &&
      isValid(new Date(state.start_date)) &&
      isValid(new Date(state.end_date))
    ) {
      return `${format(new Date(state.start_date), "MMM d, yyyy")} to ${format(new Date(state.end_date), "MMM d, yyyy")}`;
    }
    return null;
  }, [state.start_date, state.end_date]);

  const footerProps = {
    totalItems: data?.count || 0,
    currentPage: state.page,
    itemsPerPage: state.page_size,
    totalPages: data?.page_count || 1,
    handlePageLimitSelect: (v) => setState({ page_size: v, page: 1 }),
    handlePageChange: (v) => setState({ page: v }),
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Partnerships"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              summary={
                !loading &&
                data && (
                  <HStack>
                    <AmountSummary
                      total={data.total_contribution}
                      received={data.total_contribution_paid}
                      pending={
                        data.total_contribution - data.total_contribution_paid
                      }
                    />
                    <div className="status-filter-box">
                      {["", "paid", "partial", "unpaid"].map((s) => (
                        <StatusButton
                          key={s}
                          size="sm"
                          variant={s || "all"}
                          isSelected={state.status === s}
                          onClick={() => setState({ status: s, page: 1 })}
                        >
                          {s || "All"}
                        </StatusButton>
                      ))}
                    </div>
                  </HStack>
                )
              }
              mainActions={
                <>
                  <PopUpFilter
                    isOpen={showFilter}
                    setIsOpen={setShowFilter}
                    onApply={() => setState({ ...uiState, page: 1 })}
                  >
                    {filterContent}
                  </PopUpFilter>
                  <PopupSearchField
                    searchRef={searchRef}
                    searchKey={uiState.searchKey}
                    setSearchKey={(v) =>
                      setUiState({ ...uiState, searchKey: v })
                    }
                    searchType={uiState.searchType}
                    setSearchType={(v) =>
                      setUiState({ ...uiState, searchType: v })
                    }
                    handleSearch={() => setState({ ...uiState, page: 1 })}
                    searchOptions={[
                      { value: "partner_name", name: "Partner Name" },
                    ]}
                  />
                  <AddButton
                    onClick={() =>
                      setModal({ isOpen: true, mode: "add", item: null })
                    }
                  >
                    Add Partnership
                  </AddButton>
                </>
              }
              topRight={
                <>
                  <RefreshButton onClick={handleRefresh} />
                  <DateFilter
                    value={{
                      startDate: state.start_date,
                      endDate: state.end_date,
                      rangeType: "custom",
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

            {isLoading ? (
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
                            value="created_at"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      {/* Name Column with Interactive Search */}
                      <Th>
                        <ThContainer>
                          Partner Name
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="partner_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch(
                                  "partner_name",
                                  uiState.partner_name,
                                )
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.partner_name}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    partner_name: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleHeaderSearch(
                                    "partner_name",
                                    uiState.partner_name,
                                  )
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>Done By</Th>
                      <Th>Status</Th>
                      <Th>Contribution</Th>
                      <Th>Paid</Th>
                      <Th>Balance</Th>
                      <Th>Profit %</Th>
                      <ThMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((item, index) => {
                        const contribution = Number(item.contribution || 0);
                        const paid = Number(
                          item.contribution_payment_paid || 0,
                        );
                        return (
                          <Tr key={item.id}>
                            <TdSL
                              index={index}
                              page={state.page}
                              pageSize={state.page_size}
                            />
                            <TdDate>{item.created_at}</TdDate>
                            <TdOverflow>{item.partner_name}</TdOverflow>
                            <TdOverflow>{item.done_by_name}</TdOverflow>
                            <Td>
                              <TextBadge
                                variant="paymentStatus"
                                type={item.contribution_payment_status}
                              >
                                {item.contribution_payment_status}
                              </TextBadge>
                            </Td>
                            <TdNumeric>{contribution}</TdNumeric>
                            <TdNumeric>{paid}</TdNumeric>
                            <TdNumeric>{contribution - paid}</TdNumeric>
                            <TdNumeric>{item.profit_share}</TdNumeric>
                            <TdMenu
                              onEdit={() =>
                                setModal({ isOpen: true, mode: "edit", item })
                              }
                              onView={() =>
                                setModal({ isOpen: true, mode: "view", item })
                              }
                              onDelete={async () => {
                                await deletePartnership(item.id);
                                refetch();
                                showToast({
                                  crudItem: CRUDITEM.PARTNERSHIP,
                                  crudType: CRUDTYPE.DELETE_SUCCESS,
                                });
                              }}
                            />
                          </Tr>
                        );
                      })
                    ) : (
                      <TableCaption
                        item={partnershipItemConstant}
                        noOfCol={10}
                      />
                    )}
                  </Tbody>
                </Table>
                <TableFooter {...footerProps} />
              </>
            )}
          </>
        ) : (
          /* Mobile View */
          <>
            <PageTitleWithBackButton title="Partnerships" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <PopUpFilter
                    isOpen={showFilter}
                    setIsOpen={setShowFilter}
                    onApply={() => setState({ ...uiState, page: 1 })}
                  >
                    {filterContent}
                  </PopUpFilter>
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchKey={uiState.searchKey}
                    setSearchKey={(v) =>
                      setUiState({ ...uiState, searchKey: v })
                    }
                    handleSearch={() => setState({ ...uiState, page: 1 })}
                    searchOptions={[
                      { value: "partner_name", name: "Partner Name" },
                    ]}
                  />
                </HStack>
                <AddButton
                  style={{ marginLeft: "auto" }}
                  onClick={() =>
                    setModal({ isOpen: true, mode: "add", item: null })
                  }
                >
                  Add
                </AddButton>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : (
                <>
                  {listData.map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.partner_name}
                      subtitle={
                        <>
                          <TextBadge
                            variant="paymentStatus"
                            type={item.contribution_payment_status}
                          >
                            {item.contribution_payment_status}
                          </TextBadge>
                          <div>By: {item.done_by_name}</div>
                        </>
                      }
                      amount={
                        <div style={{ textAlign: "right" }}>
                          <div>{item.contribution}</div>
                          <div style={{ color: "red", fontSize: "12px" }}>
                            Bal:{" "}
                            {item.contribution - item.contribution_payment_paid}
                          </div>
                        </div>
                      }
                      onEdit={() =>
                        setModal({ isOpen: true, mode: "edit", item })
                      }
                      onView={() =>
                        setModal({ isOpen: true, mode: "view", item })
                      }
                      onDelete={() => deletePartnership(item.id).then(refetch)}
                    />
                  ))}
                  <TableFooter {...footerProps} />
                </>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>
      <PartnershipModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedPartnership={modal.item}
        partnerId={modal.item?.partner_id}
        onSuccess={refetch}
      />
    </>
  );
};

export default CommonPartnershipReport;
