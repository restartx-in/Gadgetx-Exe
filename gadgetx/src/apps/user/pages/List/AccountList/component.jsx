import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useAccounts from "@/hooks/api/account/useAccounts";
import useDeleteAccount from "@/hooks/api/account/useDeleteAccount";
import useDoneById from "@/hooks/api/doneBy/useDoneById";
import useCostCenterById  from "@/hooks/api/costCenter/useCostCenterById";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";

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
  TableCaption,
  ThSort,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import AddAccount from "@/apps/user/pages/List/AccountList/components/AddAccount";
import CashBook from "@/apps/user/pages/Transactions/CashBook";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import TableTopContainer from "@/components/TableTopContainer";
import HStack from "@/components/HStack";
import TextBadge from "@/apps/user/components/TextBadge";
import InputField from "@/components/InputField";
import RangeField from "@/components/RangeField";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import PopUpFilter from "@/components/PopUpFilter";
import SelectField from "@/components/SelectField";
import VStack from "@/components/VStack";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";

import "./style.scss";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const DoneByCell = ({ doneById }) => {
  const { data } = useDoneById(doneById);
  
  if (!doneById) return <Td>N/A</Td>;

  return <Td>{data?.name || "N/A"}</Td>;
};

const CostCenterCell = ({ costCenterId }) => {
  const { data } = useCostCenterById(costCenterId);

  if (!costCenterId) return <Td>N/A</Td>;

  return <Td>{data?.name || "N/A"}</Td>;
};

const AccountRow = React.memo(
  ({ item, index, listLength, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={1} pageSize={listLength} />
      <TdDate>{item.created_at}</TdDate>
      <Td>{item.name}</Td>
      <DoneByCell doneById={item.done_by_id} />
      <CostCenterCell costCenterId={item.cost_center_id} />
      <Td style={{ textTransform: "capitalize" }}>{item.type}</Td>
      <Td>{item.balance}</Td>
      <Td>{item.description}</Td>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  )
);

const AccountList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const addButtonRef = useRef(null);
  const searchRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

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
    name: state.name,
    type: state.type,
    minBalance: state.min_balance,
    maxBalance: state.max_balance,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(state.name);
  const [type, setType] = useState(state.type);
  const [minBalance, setMinBalance] = useState(state.min_balance);
  const [maxBalance, setMaxBalance] = useState(state.max_balance);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);
  const [headerFilters, setHeaderFilters] = useState({
    name: state.name || "",
    amount: state.min_balance === state.max_balance ? state.min_balance : "",
    done_by_id: state.done_by_id || "",
    cost_center_id: state.cost_center_id || "",
  });

  useEffect(() => {
    setName(state.name || "");
    setType(state.type || "");
    setMinBalance(state.min_balance || "");
    setMaxBalance(state.max_balance || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || "");
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      name: state.name || "",
      amount: state.min_balance === state.max_balance ? state.min_balance : "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
  }, [state]);

  const { data, isLoading } = useAccounts(state);
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const listData = useMemo(() => data || [], [data]);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenAccountModal, setIsOpenAccountModal] = useState(false);
  const [isOpenCashBookModal, setIsOpenCashBookModal] = useState(false);
  const [selectedCashBookEntry, setSelectedCashBookEntry] = useState(null);
  const [cashBookMode, setCashBookMode] = useState("add");

  useEffect(() => {
    addButtonRef.current?.focus();
  }, []);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    setIsOpenAccountModal(false);
  }, [queryClient]);

  const handleAddClick = useCallback(() => {
    setMode("add");
    setSelectedAccount(null);
    setIsOpenAccountModal(true);
  }, []);

  const handleEditClick = useCallback((account) => {
    setSelectedAccount(account);
    setMode("edit");
    setIsOpenAccountModal(true);
  }, []);

  const handleViewClick = useCallback((account) => {
    setSelectedAccount(account);
    setMode("view");
    setIsOpenAccountModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteAccount(id);
        showToast({
          crudItem: CRUDITEM.ACCOUNT,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: error.response?.data?.error || "Failed to delete account.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deleteAccount, showToast]
  );

  const handleDepositClick = useCallback((account) => {
    setIsOpenAccountModal(false);
    setSelectedCashBookEntry({
      account_id: account.id,
      transaction_type: "deposit",
    });
    setCashBookMode("add");
    setIsOpenCashBookModal(true);
  }, []);

  const handleWithdrawalClick = useCallback((account) => {
    setIsOpenAccountModal(false);
    setSelectedCashBookEntry({
      account_id: account.id,
      transaction_type: "withdrawal",
    });
    setCashBookMode("add");
    setIsOpenCashBookModal(true);
  }, []);

  const handleShowTransactions = useCallback(
    (account) => {
      navigate("/cash-book-report", { state: { accountName: account.name } });
    },
    [navigate]
  );

  const handleCashBookSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }, [queryClient]);

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ sort: value });
  }, []);

  const handleSearch = useCallback(() => {
    setState({ searchType, searchKey });
  }, [searchType, searchKey]);

  const handleHeaderSearch = useCallback((key, value) => {
    if (key === "amount") {
      setState({
        min_balance: value,
        max_balance: value,
      });
    } else {
      setState({ [key]: value });
    }
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleFilter = useCallback(() => {
    setState({
      name,
      type,
      min_balance: minBalance,
      max_balance: maxBalance,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, type, minBalance, maxBalance, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    // Reset local UI state
    setName("");
    setType("");
    setMinBalance("");
    setMaxBalance("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderFilters({
      name: "",
      amount: "",
      done_by_id: "",
      cost_center_id: "",
    });

    setState({
      name: "",
      type: "",
      min_balance: "",
      max_balance: "",
      sort: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      searchType: "",
      searchKey: "",
    });

    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [defaultCostCenter, isDisableCostCenter, showToast]);

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "description", name: "Description" },
    { value: "amount", name: "Amount" },
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank" },
  ];

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    type,
    setType,
    typeOptions,
    minBalance,
    setMinBalance,
    maxBalance,
    setMaxBalance,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Accounts" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <PopupSearchField
                    searchRef={searchRef}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add Account
                  </AddButton>
                </>
              }
            />
            {isLoading ? (
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
                          {...{
                            sort,
                            setSort,
                            value: "created_at",
                            handleSort,
                          }}
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Name
                        <ThFilterContainer>
                          <ThSort
                            {...{ sort, setSort, value: "name", handleSort }}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              placeholder="Enter Name"
                              value={headerFilters.name}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => handleHeaderKeyDown(e, "name")}
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
                            {...{ sort, setSort, value: "done_by", handleSort }}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <DoneByAutoComplete
                              placeholder="Select Done By"
                              value={headerFilters.done_by_id}
                              onChange={(e) =>
                                handleHeaderSearch("done_by_id", e.target.value)
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
                            {...{
                              sort,
                              setSort,
                              value: "cost_center",
                              handleSort,
                            }}
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
                              disabled={isDisableCostCenter}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Type
                        <ThSort
                          {...{ sort, setSort, value: "type", handleSort }}
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Balance
                        <ThFilterContainer>
                          <ThSort
                            {...{ sort, setSort, value: "amount", handleSort }}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              placeholder="Enter Exact Amount"
                              value={headerFilters.amount}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  amount: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleHeaderKeyDown(e, "amount")
                              }
                              isLabel={false}
                              type="number"
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Description</Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {listData.length > 0 ? (
                    listData.map((acc, index) => (
                      <AccountRow
                        key={acc.id}
                        item={acc}
                        index={index}
                        listLength={listData.length}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.Account} noOfCol={9} />
                  )}
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
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchRef={searchRef}
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                </HStack>
                <div className="account_list__add_button">
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
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
                      onView={() => handleViewClick(acc)}
                      onEdit={() => handleEditClick(acc)}
                      onDelete={() => handleDelete(acc.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddAccount
        isOpen={isOpenAccountModal}
        onClose={() => setIsOpenAccountModal(false)}
        onSuccess={handleSuccess}
        mode={mode}
        selectedAccount={selectedAccount}
        onDeposit={handleDepositClick}
        onWithdrawal={handleWithdrawalClick}
        onShowTransactions={handleShowTransactions}
      />

      <CashBook
        isOpen={isOpenCashBookModal}
        onClose={() => setIsOpenCashBookModal(false)}
        mode={cashBookMode}
        selectedEntry={selectedCashBookEntry}
        onSuccess={handleCashBookSuccess}
      />
    </>
  );
};

export default AccountList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    type,
    setType,
    typeOptions,
    minBalance,
    setMinBalance,
    maxBalance,
    setMaxBalance,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter,
  }) => {
    return (
      <PopUpFilter
        isOpen={showFilter}
        setIsOpen={setShowFilter}
        onApply={handleFilter}
      >
        <VStack>
          <InputField
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <SelectField
            placeholder="Account Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={typeOptions}
          />
          <DoneByAutoComplete
            placeholder="Done By"
            value={doneById}
            onChange={(e) => setDoneById(e.target.value)}
            is_edit={false}
          />
          <CostCenterAutoComplete
            placeholder="Cost Center"
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            is_edit={false}
            disabled={disableCostCenter}
          />
          <RangeField
            label="Balance Range"
            minValue={minBalance}
            maxValue={maxBalance}
            onMinChange={(value) => setMinBalance(value)}
            onMaxChange={(value) => setMaxBalance(value)}
          />
        </VStack>
      </PopUpFilter>
    );
  }
);
