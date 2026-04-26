import React, { useEffect, useState, useRef, useMemo, useCallback, useReducer } from "react";
import { useSearchParams } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import usePartnershipsPaginated from "@/hooks/api/partnership/usePartnershipsPaginated";
import useDeletePartnership from "@/hooks/api/partnership/useDeletePartnership";
import useAccountById from "@/hooks/api/account/useAccountById";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import InputField from "@/components/InputField";
import PopUpFilter from "@/components/PopUpFilter";
import TableFooter from "@/components/TableFooter";
import RangeField from "@/components/RangeField";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import PaymentStatusSelect from "@/components/Transaction/PaymentStatusSelect";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
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
  TdMenu,
  ThMenu,
  TdDate,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import PartnershipModal from "@/components/PartnershipModal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import StatusButton from "@/components/StatusButton";
import Partnership from "@/apps/user/pages/Transactions/Partnership";
import AmountSummary from "@/components/AmountSummary";
import TableTopContainer from "@/components/TableTopContainer";
import ExportMenu from "@/components/ExportMenu";
import DateFilter from "@/components/DateFilter";
import TextBadge from "@/apps/user/components/TextBadge";
import { format, isValid } from "date-fns";
import { usePartnershipExportAndPrint } from "@/hooks/api/exportAndPrint/usePartnershipExportAndPrint";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import "./style.scss";

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

// Component to display Account Name
const AccountNameDisplay = ({ accountId }) => {
  if (!accountId) return "_";
  // Assuming useAccountById is a custom hook that handles fetching logic
  const { data: account, isLoading } = useAccountById(accountId); 
  if (isLoading) return "...";
  return account ? account.name : `ID: ${accountId}`;
};

// Extracted Row Component using React.memo
const PartnershipRow = React.memo(({ p, index, page, pageSize, handlers }) => {
  const contribution = Number(p.contribution || 0);
  const paid = Number(p.contribution_payment_paid || 0);
  const balance = contribution - paid;

  return (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{p.created_at}</TdDate>
      <Td>{p.partner_name}</Td>
      <Td>{p.done_by_name || "N/A"}</Td>
      <Td>{p.cost_center_name || "N/A"}</Td>
      <Td>
        <TextBadge
          variant="paymentStatus"
          type={p.contribution_payment_status}
        >
          {p.contribution_payment_status}
        </TextBadge>
      </Td>
      <TdNumeric>{contribution}</TdNumeric>
      <TdNumeric>{paid > 0 ? paid : "-"}</TdNumeric>
      <TdNumeric>{balance > 0 ? balance : "-"}</TdNumeric>
      <TdNumeric>{p.profit_share || "-"}</TdNumeric>
      <Td>
        <AccountNameDisplay accountId={p.from_account} />
      </Td>
      <TdMenu
        onView={() => handlers.onView(p)}
        onEdit={() => handlers.onEdit(p)}
        onDelete={() => handlers.onDelete(p.id)}
      />
    </Tr>
  );
});

// Memoized Status Filter
const StatusFilter = React.memo(({ status, handleStatusFilterClick }) => {
  return (
    <HStack
      justifyContent="flex-start"
      className="partnership_report-status_filters"
    >
      <StatusButton
        variant="all"
        isSelected={status === ""}
        onClick={() => handleStatusFilterClick("")}
      >
        All
      </StatusButton>
      <StatusButton
        variant="available"
        isSelected={status === "paid"}
        onClick={() => handleStatusFilterClick("paid")}
      >
        Paid
      </StatusButton>
      <StatusButton
        variant="maintenance"
        isSelected={status === "partial"}
        onClick={() => handleStatusFilterClick("partial")}
      >
        Partial
      </StatusButton>
      <StatusButton
        variant="sold"
        isSelected={status === "unpaid"}
        onClick={() => handleStatusFilterClick("unpaid")}
      >
        Unpaid
      </StatusButton>
    </HStack>
  );
});

const PartnershipReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // UI States for filter inputs (Local State)
  const [showFilter, setShowFilter] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [contributionPaymentStatus, setContributionPaymentStatus] = useState("");
  const [minContribution, setMinContribution] = useState("");
  const [maxContribution, setMaxContribution] = useState("");
  const [minPaid, setMinPaid] = useState("");
  const [maxPaid, setMaxPaid] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [minProfitShare, setMinProfitShare] = useState("");
  const [maxProfitShare, setMaxProfitShare] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter);
  
  // Search/Sort Local States
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");

  // Header Filter Local States
  const [headerPartnerName, setHeaderPartnerName] = useState("");
  const [headerFromAccount, setHeaderFromAccount] = useState("");
  const [headerStatus, setHeaderStatus] = useState("");
  const [headerFilters, setHeaderFilters] = useState({
    partner_name: "",
    contribution: "",
    contribution_payment_paid: "",
    done_by_id: "",
    cost_center_id: defaltCostCenter,
  });

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    rangeType: "custom",
  });
  
  const [filterDatas, setFilterDatas] = useState({});

  // Modal States
  const [selectedPartnershipForEdit, setSelectedPartnershipForEdit] = useState(null);
  const [isEditViewModalOpen, setIsEditViewModalOpen] = useState(false);
  const [mode, setMode] = useState("view");


  // --- 1. Centralized state object initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || "",
    partner_name: searchParams.get("partnerName") || "",
    from_account: searchParams.get("fromAccount") || "",
    contribution_payment_status: searchParams.get("status") || "",
    min_contribution: searchParams.get("minContribution") || "",
    max_contribution: searchParams.get("maxContribution") || "",
    min_paid: searchParams.get("minPaid") || "",
    max_paid: searchParams.get("maxPaid") || "",
    min_balance: searchParams.get("minBalance") || "",
    max_balance: searchParams.get("maxBalance") || "",
    min_profit_share: searchParams.get("minProfitShare") || "",
    max_profit_share: searchParams.get("maxProfitShare") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    contribution: searchParams.get("contribution") || "",
    contribution_payment_paid: searchParams.get("contributionPaid") || "",
    profit_share: searchParams.get("profitShare") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
  });

  // --- 2. Sync state object to URL ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    partnerName: state.partner_name,
    fromAccount: state.from_account,
    status: state.contribution_payment_status,
    minContribution: state.min_contribution,
    maxContribution: state.max_contribution,
    minPaid: state.min_paid,
    maxPaid: state.max_paid,
    minBalance: state.min_balance,
    maxBalance: state.max_balance,
    minProfitShare: state.min_profit_share,
    maxProfitShare: state.max_profit_share,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    contribution: state.contribution,
    contributionPaid: state.contribution_payment_paid,
    profitShare: state.profit_share,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  const { data, isLoading, refetch, isRefetching } = usePartnershipsPaginated(state);
  const { mutateAsync: deletePartnership } = useDeletePartnership();

  // Derived Data using useMemo
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = useMemo(() => data?.page_count || 1, [data]);
  const totalItems = useMemo(() => data?.count || 0, [data]);
  const loading = isLoading || isRefetching;

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    // Sidebar filters
    setPartnerName(state.partner_name || "");
    setFromAccount(state.from_account || "");
    setContributionPaymentStatus(state.contribution_payment_status || "");
    setMinContribution(state.min_contribution || "");
    setMaxContribution(state.max_contribution || "");
    setMinPaid(state.min_paid || "");
    setMaxPaid(state.max_paid || "");
    setMinBalance(state.min_balance || "");
    setMaxBalance(state.max_balance || "");
    setMinProfitShare(state.min_profit_share || "");
    setMaxProfitShare(state.max_profit_share || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    
    // Sort/Search
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    
    // Header Filters
    setHeaderFilters({
      partner_name: state.partner_name || "",
      contribution: state.contribution || "",
      contribution_payment_paid: state.contribution_payment_paid || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || defaltCostCenter,
    });
    setHeaderPartnerName(state.partner_name || "");
    setHeaderFromAccount(state.from_account || "");
    setHeaderStatus(state.contribution_payment_status || "");
    
    // Date Filter
    setDateFilter({
        startDate: state.start_date || null,
        endDate: state.end_date || null,
        rangeType: 'custom',
    });
  }, [state, defaltCostCenter]);

  // 4. Update Filter Datas for Export
  useEffect(() => {
    setFilterDatas({
      partnerName,
      fromAccount,
      contributionPaymentStatus,
      minContribution,
      maxContribution,
      minPaid,
      maxPaid,
      minBalance,
      maxBalance,
      minProfitShare,
      maxProfitShare,
      doneById,
      costCenterId,
      headerPartnerName,
      headerFromAccount,
      headerStatus,
      ...headerFilters
    });
  }, [partnerName, fromAccount, contributionPaymentStatus, minContribution, maxContribution, minPaid, maxPaid, minBalance, maxBalance, minProfitShare, maxProfitShare, doneById, costCenterId, headerPartnerName, headerFromAccount, headerStatus, headerFilters]);

  const { exportToExcel, exportToPdf, printDocument } = usePartnershipExportAndPrint({
    listData: listData,
    reportType: "Partnership Report",
    duration: state.start_date && state.end_date ? `${state.start_date} to ${state.end_date}` : "",
    pageNumber: state.page,
    selectedPageCount: state.page_size,
    totalPage: totalPages,
    totalData: {
      totalContribution: data?.total_contribution || 0,
      totalPaid: data?.total_contribution_paid || 0,
      totalBalance: (data?.total_contribution || 0) - (data?.total_contribution_paid || 0)
    },
    filterDatas,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

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
      // Clear filters
      partner_name: "",
      contribution: "",
      contribution_payment_paid: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      contribution_payment_status: "",
      min_contribution: "",
      max_contribution: "",
    });
  }, [searchType, searchKey, defaltCostCenter]);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ // Simplified setState
      [key]: value,
      page: 1,
      // Clear generic search
      searchType: "",
      searchKey: "",
      // Clear ranges if exact search
      ...(key === "contribution" && { min_contribution: "", max_contribution: "" }),
      ...(key === "contribution_payment_paid" && { min_paid: "", max_paid: "" }),
    });
  }, []);

  const handleHeaderKeyDown = useCallback((e, key) => {
    if (e.key === "Enter") {
      handleHeaderSearch(key, headerFilters[key]);
    }
  }, [headerFilters, handleHeaderSearch]);

  const handleFilter = useCallback(() => {
    setState({ // Simplified setState
      page: 1,
      partner_name: partnerName,
      from_account: fromAccount,
      contribution_payment_status: contributionPaymentStatus,
      min_contribution: minContribution,
      max_contribution: maxContribution,
      min_paid: minPaid,
      max_paid: maxPaid,
      min_balance: minBalance,
      max_balance: maxBalance,
      min_profit_share: minProfitShare,
      max_profit_share: maxProfitShare,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      // Clear searches
      searchType: "",
      searchKey: "",
    });
    setShowFilter(false);
  }, [partnerName, fromAccount, contributionPaymentStatus, minContribution, maxContribution, minPaid, maxPaid, minBalance, maxBalance, minProfitShare, maxProfitShare, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    // Reset local UI states
    setPartnerName("");
    setFromAccount("");
    setContributionPaymentStatus("");
    setMinContribution("");
    setMaxContribution("");
    setMinPaid("");
    setMaxPaid("");
    setMinBalance("");
    setMaxBalance("");
    setMinProfitShare("");
    setMaxProfitShare("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId(defaltCostCenter);
    setHeaderPartnerName("");
    setHeaderFromAccount("");
    setHeaderStatus("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });
    setHeaderFilters({
      partner_name: "",
      contribution: "",
      contribution_payment_paid: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
    });

    // Reset Central State
    setState({ // Simplified setState
      page: 1,
      page_size: 10,
      partner_name: "",
      from_account: "",
      contribution: "",
      contribution_payment_paid: "",
      contribution_payment_status: "",
      min_contribution: "",
      max_contribution: "",
      min_paid: "",
      max_paid: "",
      min_balance: "",
      max_balance: "",
      min_profit_share: "",
      max_profit_share: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }); // Simplified setState
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value }); // Simplified setState
  }, []);

  const handleStatusFilterClick = useCallback((newStatus) => {
    setState({
      page: 1,
      contribution_payment_status: newStatus,
    });
  }, []);

  const handleEditClick = useCallback((partnership) => {
    setSelectedPartnershipForEdit(partnership);
    setMode("edit");
    setIsEditViewModalOpen(true);
  }, []);

  const handleViewClick = useCallback((partnership) => {
    setSelectedPartnershipForEdit(partnership);
    setMode("view");
    setIsEditViewModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await deletePartnership(id);
      showToast({
        crudItem: CRUDITEM.PARTNERSHIP,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      refetch();
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.PARTNERSHIP,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  }, [deletePartnership, refetch, showToast]);

  const rowHandlers = useMemo(() => ({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: handleDelete,
  }), [handleViewClick, handleEditClick, handleDelete]);


  const searchOptions = useMemo(() => ([
    { value: "partner_name", name: "Partner Name"},
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),  
  ]), [isDisableCostCenter]);

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    partnerName,
    setPartnerName,
    fromAccount,
    setFromAccount,
    contributionPaymentStatus,
    setContributionPaymentStatus,
    minContribution,
    setMinContribution,
    maxContribution,
    setMaxContribution,
    minPaid,
    setMinPaid,
    maxPaid,
    setMaxPaid,
    minBalance,
    setMinBalance,
    maxBalance,
    setMaxBalance,
    minProfitShare,
    setMinProfitShare,
    maxProfitShare,
    setMaxProfitShare,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter
  };

  const { startDate, endDate } = dateFilter;
  const isDateFilterActive =
    startDate &&
    endDate &&
    isValid(new Date(startDate)) &&
    isValid(new Date(endDate));

  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(startDate), "MMM d, yyyy")} → ${format(
        new Date(endDate),
        "MMM d, yyyy"
      )}`
    : null;

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
                <>
              {!loading && data && (
                <AmountSummary
                  total={data.total_contribution}
                  received={data.total_contribution_paid}
                  pending={
                    data.total_contribution - data.total_contribution_paid
                  }
                />
              )}
                </>
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
                <Partnership onSuccess={refetch} />

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
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "partner_name",
                                  headerFilters.partner_name
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Name"
                                value={headerFilters.partner_name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    partner_name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "partner_name")
                                }
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
                              sort={sort}
                              setSort={setSort}
                              value="done_by"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={false}
                              popoverWidth={220}
                            >
                              <DoneByAutoComplete
                                placeholder="Select Done By"
                                value={headerFilters.done_by_id}
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
                              sort={sort}
                              setSort={setSort}
                              value="cost_center"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={false}
                              popoverWidth={220}
                            >
                              <CostCenterAutoComplete
                                placeholder="Select Cost Center"
                                value={headerFilters.cost_center_id}
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
                          Status
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="contribution_payment_status"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover>
                              <PaymentStatusSelect
                                name="header_status"
                                value={headerStatus}
                                onChange={(e) =>
                                  handleHeaderSearch("contribution_payment_status", e.target.value)
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Contribution
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="contribution"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "contribution",
                                  headerFilters.contribution
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Amount"
                                type="number"
                                value={headerFilters.contribution}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    contribution: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "contribution")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Contribution Paid
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="contribution_payment_paid"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "contribution_payment_paid",
                                  headerFilters.contribution_payment_paid
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Amount"
                                type="number"
                                value={headerFilters.contribution_payment_paid}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    contribution_payment_paid: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(
                                    e,
                                    "contribution_payment_paid"
                                  )
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>Balance</Th>
                      <Th>
                        <ThContainer>
                          Profit Share
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="profit_share"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          From Account
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="from_account"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover>
                              <AccountAutoComplete
                                name="header_from_account"
                                value={headerFromAccount}
                                onChange={(e) =>
                                  handleHeaderSearch("from_account", e.target.value)
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <ThMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((p, index) => (
                        <PartnershipRow
                          key={p.id}
                          p={p}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={rowHandlers}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.Partnership}
                        noOfCol={12}
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
            <PageTitleWithBackButton title="Partnerships" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <Partnership onSuccess={refetch} className="w-100" />
                </HStack>
                <HStack>
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
              </PageHeader>
              <StatusFilter
                status={state.contribution_payment_status}
                handleStatusFilterClick={handleStatusFilterClick}
              />
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Partnership} />
              ) : (
                <div className="mobile-list-view">
                  {listData.map((p) => {
                    const contribution = Number(p.contribution || 0);
                    const paid = Number(p.contribution_payment_paid || 0);
                    const balance = contribution - paid;
                    return (
                      <ListItem
                        key={p.id}
                        title={p.partner_name}
                        subtitle={
                          <>
                            <div>
                              Paid via:{" "}
                              <AccountNameDisplay accountId={p.from_account} />
                            </div>
                            {p.done_by_name && (
                              <div>Done By: {p.done_by_name}</div>
                            )}
                            {p.cost_center_name && (
                              <div>Cost Center: {p.cost_center_name}</div>
                            )}
                            <div className="list-item-status-wrapper">
                              <TextBadge
                                variant="paymentStatus"
                                type={p.contribution_payment_status}
                              >
                                {p.contribution_payment_status || "-"}
                              </TextBadge>
                            </div>
                          </>
                        }
                        amount={
                          <div style={{ textAlign: "right" }}>
                            <div>{contribution}</div>
                            {paid > 0 && (
                              <div
                                style={{
                                  color: "green",
                                  fontSize: "0.8rem",
                                  marginTop: "4px",
                                }}
                              >
                                Paid: {paid}
                              </div>
                            )}
                            {balance > 0 && (
                              <div style={{ color: "red", fontSize: "0.8rem" }}>
                                Balance: {balance}
                              </div>
                            )}
                          </div>
                        }
                        onView={() => handleViewClick(p)}
                        onEdit={() => handleEditClick(p)}
                        onDelete={() => handleDelete(p.id)}
                      />
                    );
                  })}
                </div>
              )}
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

      <PartnershipModal
        isOpen={isEditViewModalOpen}
        onClose={() => setIsEditViewModalOpen(false)}
        mode={mode}
        selectedPartnership={selectedPartnershipForEdit}
        partnerId={selectedPartnershipForEdit?.partner_id}
        onSuccess={refetch}
      />
    </>
  );
};

export default PartnershipReport;

// Memoized List Filter
const ListFilter = React.memo(({
  showFilter,
  setShowFilter,
  handleFilter,
  partnerName,
  setPartnerName,
  fromAccount,
  setFromAccount,
  contributionPaymentStatus,
  setContributionPaymentStatus,
  minContribution,
  setMinContribution,
  maxContribution,
  setMaxContribution,
  minPaid,
  setMinPaid,
  maxPaid,
  setMaxPaid,
  minBalance,
  setMinBalance,
  maxBalance,
  setMaxBalance,
  minProfitShare,
  setMinProfitShare,
  maxProfitShare,
  setMaxProfitShare,
  doneById,
  setDoneById,
  costCenterId,
  setCostCenterId,
  disableCostCenter
}) => {
  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack>
        <InputField
          label="Partner Name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          name="partner_name"
          type="text"
        />
        <AccountAutoComplete
          name="from_account"
          value={fromAccount}
          onChange={(e) => setFromAccount(e.target.value)}
        />
        <PaymentStatusSelect
          name="contribution_payment_status"
          value={contributionPaymentStatus}
          onChange={(e) => setContributionPaymentStatus(e.target.value)}
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
        <RangeField
          label="Contribution"
          minValue={minContribution}
          maxValue={maxContribution}
          onMinChange={(value) => setMinContribution(value)}
          onMaxChange={(value) => setMaxContribution(value)}
        />
        <RangeField
          label="Paid"
          minValue={minPaid}
          maxValue={maxPaid}
          onMinChange={(value) => setMinPaid(value)}
          onMaxChange={(value) => setMaxPaid(value)}
        />
        <RangeField
          label="Balance"
          minValue={minBalance}
          maxValue={maxBalance}
          onMinChange={(value) => setMinBalance(value)}
          onMaxChange={(value) => setMaxBalance(value)}
        />
        <RangeField
          label="Profit Share"
          minValue={minProfitShare}
          maxValue={maxProfitShare}
          onMinChange={(value) => setMinProfitShare(value)}
          onMaxChange={(value) => setMaxProfitShare(value)}
        />
      </VStack>
    </PopUpFilter>
  );
});