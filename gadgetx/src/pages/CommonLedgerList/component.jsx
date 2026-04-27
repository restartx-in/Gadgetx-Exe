import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
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
import RefreshButton from "@/components/RefreshButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import InputField from "@/components/InputField";
import DateField from "@/components/DateField";
import TableFooter from "@/components/TableFooter";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import DateFilter from "@/components/DateFilter";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const CommonLedgerList = ({
  useLedgerPaginatedHook,
  useDeleteLedgerHook,
  AddLedgerModal,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  TableTopContainer,
  ledgerItemConstant,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // 1. Reducer State (for API and URL)
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    balance: searchParams.get("balance") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  // 2. Local UI State (for responsive inputs and icons)
  const [showFilter, setShowFilter] = useState(false);
  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort); // Local state for ThSort icons

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    name: state.name,
    balance: state.balance,
    startDate: state.start_date,
    endDate: state.end_date,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  // Keep UI inputs and Sort icon in sync with global state
  useEffect(() => {
    setUiState(state);
    setSort(state.sort || "");
  }, [state]);


  const { data, isLoading } = useLedgerPaginatedHook(state);
  const { mutateAsync: deleteLedger } = useDeleteLedgerHook();
  const listData = useMemo(() => data?.data || [], [data]);

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

  // Handle "Add" from URL
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
      setModal({ isOpen: true, mode: "add", item: null });
    }
  }, [searchParams, setSearchParams]);

  const handleRefresh = useCallback(() => {
    const reset = {
      page: 1,
      page_size: 10,
      name: "",
      balance: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    };
    setState(reset);
  }, [defaultCostCenter]);

  // Sort logic that updates both local UI and trigger API
  const handleSort = useCallback((value) => {
    setSort(value); // Update icon immediately
    setState({ sort: value, page: 1 }); // Trigger API fetch
  }, []);

  const handleHeaderSearch = (key, value) => {
    setState({ [key]: value, page: 1 });
  };

  const searchOptions = [
    { value: "name", name: "Name" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ];

  const filterContent = (
    <VStack>
      <InputField
        label="Name"
        value={uiState.name}
        onChange={(e) => setUiState({ ...uiState, name: e.target.value })}
      />
      <InputField
        label="Balance"
        type="number"
        value={uiState.balance}
        onChange={(e) => setUiState({ ...uiState, balance: e.target.value })}
      />
      <DoneByAutoComplete
        value={uiState.done_by_id}
        onChange={(e) => setUiState({ ...uiState, done_by_id: e.target.value })}
        is_edit={false}
      />
      <CostCenterAutoComplete
        value={uiState.cost_center_id}
        disabled={isDisableCostCenter}
        onChange={(e) =>
          setUiState({ ...uiState, cost_center_id: e.target.value })
        }
        is_edit={false}
      />
      {isMobile ? (
        <>
          <DateField
            label="Start Date"
            value={uiState.start_date ? new Date(uiState.start_date) : null}
            onChange={(d) =>
              setUiState({
                ...uiState,
                start_date: d?.toISOString().split("T")[0] || "",
              })
            }
          />
          <DateField
            label="End Date"
            value={uiState.end_date ? new Date(uiState.end_date) : null}
            onChange={(d) =>
              setUiState({
                ...uiState,
                end_date: d?.toISOString().split("T")[0] || "",
              })
            }
          />
        </>
      ) : (
        <HStack>
          <DateField
            label="Start Date"
            value={uiState.start_date ? new Date(uiState.start_date) : null}
            onChange={(d) =>
              setUiState({
                ...uiState,
                start_date: d?.toISOString().split("T")[0] || "",
              })
            }
          />
          <DateField
            label="End Date"
            value={uiState.end_date ? new Date(uiState.end_date) : null}
            onChange={(d) =>
              setUiState({
                ...uiState,
                end_date: d?.toISOString().split("T")[0] || "",
              })
            }
          />
        </HStack>
      )}
    </VStack>
  );

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
            <PageTitleWithBackButton title="Ledgers" />
            <TableTopContainer
              mainActions={
                <>
                  <PopUpFilter
                    isOpen={showFilter}
                    setIsOpen={setShowFilter}
                    onApply={() => setState({ ...uiState, page: 1 })}
                  >
                    {filterContent}
                  </PopUpFilter>
                  <RefreshButton onClick={handleRefresh} />
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
                    searchOptions={searchOptions}
                  />
                  <AddButton
                    onClick={() =>
                      setModal({ isOpen: true, mode: "add", item: null })
                    }
                  >
                    Add Ledger
                  </AddButton>
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
                          Name
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch("name", uiState.name)
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.name}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    name: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleHeaderSearch("name", uiState.name)
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Balance
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="balance"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch("balance", uiState.balance)
                              }
                            >
                              <InputField
                                isLabel={false}
                                type="number"
                                value={uiState.balance}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    balance: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleHeaderSearch("balance", uiState.balance)
                                }
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
                            <ThSearchOrFilterPopover isSearch={false}>
                              <DoneByAutoComplete
                                value={uiState.done_by_id}
                                onChange={(e) =>
                                  handleHeaderSearch(
                                    "done_by_id",
                                    e.target.value,
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
                            <ThSearchOrFilterPopover isSearch={false}>
                              <CostCenterAutoComplete
                                value={uiState.cost_center_id}
                                disabled={isDisableCostCenter}
                                onChange={(e) =>
                                  handleHeaderSearch(
                                    "cost_center_id",
                                    e.target.value,
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
                          Date
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="created_at"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <DateFilter
                                value={{
                                  startDate: uiState.start_date,
                                  endDate: uiState.end_date,
                                  rangeType: "custom",
                                }}
                                onChange={(val) =>
                                  setState({
                                    start_date: val.startDate,
                                    end_date: val.endDate,
                                    page: 1,
                                  })
                                }
                                popover={true}
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
                      listData.map((item, index) => (
                        <Tr key={item.id}>
                          <TdSL
                            index={index}
                            page={state.page}
                            pageSize={state.page_size}
                          />
                          <Td>{item.name}</Td>
                          <Td>{parseFloat(item.balance).toFixed(2)}</Td>
                          <Td>{item.done_by_name}</Td>
                          <Td>{item.cost_center_name}</Td>
                          <TdDate>{item.created_at}</TdDate>
                          <TdMenu
                            onEdit={() =>
                              setModal({ isOpen: true, mode: "edit", item })
                            }
                            onView={() =>
                              setModal({ isOpen: true, mode: "view", item })
                            }
                            onDelete={async () => {
                              await deleteLedger(item.id);
                              showToast({
                                crudItem: CRUDITEM.LEDGER,
                                crudType: CRUDTYPE.DELETE_SUCCESS,
                              });
                            }}
                          />
                        </Tr>
                      ))
                    ) : (
                      <TableCaption item={ledgerItemConstant} noOfCol={7} />
                    )}
                  </Tbody>
                </Table>
                <TableFooter {...footerProps} />
              </>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Ledgers" />
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
                    searchOptions={searchOptions}
                  />
                </HStack>
                <AddButton
                  style={{ marginLeft: "auto" }}
                  onClick={() =>
                    setModal({ isOpen: true, mode: "add", item: null })
                  }
                >
                  Add Ledger
                </AddButton>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={ledgerItemConstant} />
              ) : (
                <>
                  <div>
                    {listData.map((item) => (
                      <ListItem
                        key={item.id}
                        title={item.name}
                        subtitle={
                          <div>
                            By: {item.done_by_name} | CC:{" "}
                            {item.cost_center_name}
                          </div>
                        }
                        amount={
                          <div style={{ textAlign: "right" }}>
                            <div className="fs18fw600">
                              {parseFloat(item.balance).toFixed(2)}
                            </div>
                          </div>
                        }
                        onView={() =>
                          setModal({ isOpen: true, mode: "view", item })
                        }
                        onEdit={() =>
                          setModal({ isOpen: true, mode: "edit", item })
                        }
                        onDelete={async () => {
                          await deleteLedger(item.id);
                          showToast({
                            crudItem: CRUDITEM.LEDGER,
                            crudType: CRUDTYPE.DELETE_SUCCESS,
                          });
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
              <Spacer />
            </ScrollContainer>
            <TableFooter {...footerProps} />
          </>
        )}
      </ContainerWrapper>
      <AddLedgerModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedLedger={modal.item}
      />
    </>
  );
};

export default CommonLedgerList;
