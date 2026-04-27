import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { useToast } from "@/context/ToastContext";

import {
  Table, Thead, Tbody, Tr, Td, Th, ThSL, TdSL, TdMenu, ThMenu, TdDate,
  TableCaption, ThSort, ThContainer, ThSearchOrFilterPopover, ThFilterContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import HStack from "@/components/HStack";
import TextBadge from "@/components/TextBadge";
import InputField from "@/components/InputField";
import RangeField from "@/components/RangeField";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import PopUpFilter from "@/components/PopUpFilter";
import SelectField from "@/components/SelectField";
import VStack from "@/components/VStack";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const CommonAccountList = ({
  useAccountsHook,
  useDeleteAccountHook,
  DoneByCell, // App-specific component
  CostCenterCell, // App-specific component
  DoneByAutoComplete, // App-specific component
  CostCenterAutoComplete, // App-specific component
  AddAccountModal,
  CashBookModal,
  TableTopContainer, // App-specific container if layout differs
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // --- STATE MANAGEMENT ---
  const [state, setState] = useReducer(stateReducer, {
    name: searchParams.get("name") || "",
    type: searchParams.get("type") || "",
    min_balance: searchParams.get("minBalance") || "",
    max_balance: searchParams.get("maxBalance") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    name: state.name, type: state.type, minBalance: state.min_balance,
    maxBalance: state.max_balance, doneById: state.done_by_id,
    costCenterId: state.cost_center_id, sort: state.sort,
    searchType: state.searchType, searchKey: state.searchKey,
  });

  const [showFilter, setShowFilter] = useState(false);
  const [filterState, setFilterState] = useState(state); // Internal filter UI state

  const { data, isLoading } = useAccountsHook(state);
  const { mutateAsync: deleteAccount } = useDeleteAccountHook();
  const listData = useMemo(() => data || [], [data]);

  // --- MODAL STATES ---
  const [accountModal, setAccountModal] = useState({ isOpen: false, mode: "view", item: null });
  const [cashBookModal, setCashBookModal] = useState({ isOpen: false, mode: "add", entry: null });

  // Handle "Add" from URL
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setSearchParams((prev) => { prev.delete("action"); return prev; }, { replace: true });
      setAccountModal({ isOpen: true, mode: "add", item: null });
    }
  }, [searchParams, setSearchParams]);

  // --- HANDLERS ---
  const handleRefresh = useCallback(() => {
    const clearedState = {
      name: "", type: "", min_balance: "", max_balance: "", sort: "",
      done_by_id: "", cost_center_id: defaultCostCenter, searchType: "", searchKey: ""
    };
    setState(clearedState);
    setFilterState(clearedState);
    showToast({ type: TOASTTYPE.GENARAL, message: "Refreshed.", status: TOASTSTATUS.SUCCESS });
  }, [defaultCostCenter, showToast]);

  const handleHeaderSearch = useCallback((key, value) => {
    if (key === "amount") setState({ min_balance: value, max_balance: value });
    else setState({ [key]: value });
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteAccount(id);
      showToast({ crudItem: CRUDITEM.ACCOUNT, crudType: CRUDTYPE.DELETE_SUCCESS });
      } catch {
      showToast({ type: TOASTTYPE.GENARAL, message: "Failed to delete.", status: TOASTSTATUS.ERROR });
    }
  }, [deleteAccount, showToast]);

  const openCashBook = (account, type) => {
    setAccountModal(prev => ({ ...prev, isOpen: false }));
    setCashBookModal({
      isOpen: true,
      mode: "add",
      entry: { account_id: account.id, transaction_type: type }
    });
  };

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank" },
  ];

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Accounts" />
            <TableTopContainer
              mainActions={
                <>
                  <PopUpFilter isOpen={showFilter} setIsOpen={setShowFilter} onApply={() => setState(filterState)}>
                    <VStack>
                      <InputField placeholder="Name" value={filterState.name} onChange={(e) => setFilterState({ ...filterState, name: e.target.value })} />
                      <SelectField placeholder="Account Type" value={filterState.type} options={typeOptions} onChange={(e) => setFilterState({ ...filterState, type: e.target.value })} />
                      <DoneByAutoComplete value={filterState.done_by_id} onChange={(e) => setFilterState({ ...filterState, done_by_id: e.target.value })} />
                      <CostCenterAutoComplete value={filterState.cost_center_id} disabled={isDisableCostCenter} onChange={(e) => setFilterState({ ...filterState, cost_center_id: e.target.value })} />
                      <RangeField label="Balance Range" minValue={filterState.min_balance} maxValue={filterState.max_balance} onMinChange={(v) => setFilterState({ ...filterState, min_balance: v })} onMaxChange={(v) => setFilterState({ ...filterState, max_balance: v })} />
                    </VStack>
                  </PopUpFilter>
                  <RefreshButton onClick={handleRefresh} />
                  <PopupSearchField
                    searchRef={searchRef} searchKey={state.searchKey} setSearchKey={(v) => setState({ searchKey: v })}
                    searchType={state.searchType} setSearchType={(v) => setState({ searchType: v })}
                    handleSearch={() => setState({})} searchOptions={[{ value: "name", name: "Name" }, { value: "amount", name: "Amount" }]}
                  />
                  <AddButton onClick={() => setAccountModal({ isOpen: true, mode: "add", item: null })}>Add Account</AddButton>
                </>
              }
            />

            {isLoading ? <Loader /> : (
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th><ThContainer>Date <ThSort sort={state.sort} value="created_at" handleSort={(v) => setState({ sort: v })} /></ThContainer></Th>
                    <Th>
                        <ThContainer> Name 
                            <ThFilterContainer>
                                <ThSort sort={state.sort} value="name" handleSort={(v) => setState({ sort: v })} />
                                <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                                    <InputField placeholder="Name" value={state.name} onChange={(e) => handleHeaderSearch("name", e.target.value)} isLabel={false} />
                                </ThSearchOrFilterPopover>
                            </ThFilterContainer>
                        </ThContainer>
                    </Th>
                    <Th>Done By</Th>
                    <Th>Cost Center</Th>
                    <Th>Type</Th>
                    <Th>Partner Added At</Th>
                    <Th>Account Created At</Th>
                    <Th>Balance</Th>
                    <Th>Outstanding</Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {listData.length > 0 ? listData.map((item, index) => (
                    <Tr key={item.id}>
                      <TdSL index={index} page={1} pageSize={listData.length} />
                      <TdDate>{item.created_at}</TdDate>
                      <Td>{item.name}</Td>
                      <DoneByCell doneById={item.done_by_id} />
                      <CostCenterCell costCenterId={item.cost_center_id} />
                      <Td>{item.party_type || item.type}</Td>
                      <TdDate>{item.party_created_at}</TdDate>
                      <TdDate>{item.created_at}</TdDate>
                      <Td>{item.balance}</Td>
                      <Td>{item.party_outstanding_balance ?? item.outstanding_balance ?? 0}</Td>
                      <TdMenu
                        onEdit={() => setAccountModal({ isOpen: true, mode: "edit", item })}
                        onView={() => setAccountModal({ isOpen: true, mode: "view", item })}
                        onDelete={() => handleDelete(item.id)}
                      />
                    </Tr>
                  )) : <TableCaption item={Transaction.Account} noOfCol={10} />}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Accounts" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                    <PopUpFilter isOpen={showFilter} setIsOpen={setShowFilter} onApply={() => setState(filterState)}>
                      <VStack>
                        <InputField placeholder="Name" value={filterState.name} onChange={(e) => setFilterState({ ...filterState, name: e.target.value })} />
                        <SelectField placeholder="Account Type" value={filterState.type} options={typeOptions} onChange={(e) => setFilterState({ ...filterState, type: e.target.value })} />
                        <DoneByAutoComplete value={filterState.done_by_id} onChange={(e) => setFilterState({ ...filterState, done_by_id: e.target.value })} />
                        <CostCenterAutoComplete value={filterState.cost_center_id} disabled={isDisableCostCenter} onChange={(e) => setFilterState({ ...filterState, cost_center_id: e.target.value })} />
                      </VStack>
                    </PopUpFilter>
                    <RefreshButton onClick={handleRefresh} />
                    <MobileSearchField
                      searchRef={searchRef}
                      searchKey={state.searchKey}
                      setSearchKey={(v) => setState({ searchKey: v })}
                      searchType={state.searchType}
                      setSearchType={(v) => setState({ searchType: v })}
                      handleSearch={() => setState({})}
                      searchOptions={[{ value: "name", name: "Name" }, { value: "amount", name: "Amount" }]}
                    />
                </HStack>
                <div className="account_list__add_button">
                    <AddButton onClick={() => setAccountModal({ isOpen: true, mode: "add", item: null })}>
                    Add Account
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Account} />
              ) : (
                <div className="mobile_list_view">
                  {listData.map((acc) => (
                    <ListItem
                      key={acc.id}
                      title={acc.name}
                      subtitle={
                        <>
                          <div>
                            Balance: <strong>{acc.balance}</strong>
                          </div>
                          <div>
                            Outstanding: <strong>{acc.outstanding_balance ?? 0}</strong>
                          </div>
                          {acc.done_by_name && (
                            <div>Done By: {acc.done_by_name}</div>
                          )}
                          {acc.cost_center_name && (
                            <div>Cost Center: {acc.cost_center_name}</div>
                          )}
                          <div className="list-item-status-wrapper">
                            Type:{" "}
                            <TextBadge variant="accountType" type={acc.type}>
                              {acc.type}
                            </TextBadge>
                          </div>
                          <div>{acc.description || "No description"}</div>
                        </>
                      }
                      onView={() => setAccountModal({ isOpen: true, mode: "view", item: acc })}
                      onEdit={() => setAccountModal({ isOpen: true, mode: "edit", item: acc })}
                      onDelete={() => handleDelete(acc.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddAccountModal
        isOpen={accountModal.isOpen}
        onClose={() => setAccountModal({ ...accountModal, isOpen: false })}
        mode={accountModal.mode}
        selectedAccount={accountModal.item}
        onDeposit={(acc) => openCashBook(acc, "deposit")}
        onWithdrawal={(acc) => openCashBook(acc, "withdrawal")}
        onShowTransactions={(acc) => navigate("/cash-book-report", { state: { accountName: acc.name } })}
        onSuccess={() => queryClient.invalidateQueries(["accounts"])}
      />

      <CashBookModal
        isOpen={cashBookModal.isOpen}
        onClose={() => setCashBookModal({ ...cashBookModal, isOpen: false })}
        mode={cashBookModal.mode}
        selectedEntry={cashBookModal.entry}
        onSuccess={() => queryClient.invalidateQueries(["accounts"])}
      />
    </>
  );
};

export default CommonAccountList;