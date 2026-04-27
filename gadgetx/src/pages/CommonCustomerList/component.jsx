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
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
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
import TextArea from "@/components/TextArea";
import DateFilter from "@/components/DateFilter";
import TableFooter from "@/components/TableFooter";
import useSyncURLParams from "@/hooks/useSyncURLParams";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const CommonCustomerList = ({
  useCustomersPaginatedHook,
  useDeleteCustomerHook,
  AddCustomerModal,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  TableTopContainer,
  customerItemConstant,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const defaultCC = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    address: searchParams.get("address") || "",
    phone: searchParams.get("phone") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCC,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [showFilter, setShowFilter] = useState(false);
  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  useSyncURLParams({ ...state });
  useEffect(() => {
    setUiState(state);
    setSort(state.sort || "");
  }, [state]);


  const { data, isLoading } = useCustomersPaginatedHook(state);
  const { mutateAsync: deleteCustomer } = useDeleteCustomerHook();
  const listData = useMemo(() => data?.data || [], [data]);
  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

  // Handle "Add" from URL
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setSearchParams((prev) => {
        prev.delete("action");
        return prev;
      }, { replace: true });
      setModal({ isOpen: true, mode: "add", item: null });
    }
  }, [searchParams, setSearchParams]);

  const handleRefresh = useCallback(() => {
    setState({
      page: 1,
      name: "",
      email: "",
      address: "",
      phone: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCC,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaultCC]);

  const handleHeaderSearch = (key, val) => setState({ [key]: val, page: 1 });
  const handleSort = (val) => {
    setSort(val);
    setState({ sort: val, page: 1 });
  };

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "email", name: "Email" },
    { value: "phone", name: "Phone" },
  ];

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

  const filterContent = (
    <VStack>
      <InputField
        label="Name"
        value={uiState.name}
        onChange={(e) => setUiState({ ...uiState, name: e.target.value })}
      />
      <InputField
        label="Email"
        value={uiState.email}
        onChange={(e) => setUiState({ ...uiState, email: e.target.value })}
      />
      <InputField
        label="Phone"
        value={uiState.phone}
        onChange={(e) => setUiState({ ...uiState, phone: e.target.value })}
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
      <TextArea
        label="Address"
        value={uiState.address}
        onChange={(e) => setUiState({ ...uiState, address: e.target.value })}
      />
    </VStack>
  );

  const footerProps = {
    totalItems: data?.count || 0,
    currentPage: state.page,
    itemsPerPage: state.page_size,
    totalPages: data?.total_pages || 1,
    handlePageLimitSelect: (v) => setState({ page_size: v, page: 1 }),
    handlePageChange: (v) => setState({ page: v }),
  };

  const handleDeleteCustomer = useCallback(
    async (customerId) => {
      try {
        await deleteCustomer(customerId);
        showToast({
          crudItem: CRUDITEM.CUSTOMER,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          status: TOASTSTATUS.ERROR,
          message:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to delete customer.",
        });
      }
    },
    [deleteCustomer, showToast],
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Customers"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              mainActions={
                <>
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
                    Add Customer
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
                      {/* NAME */}
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
                      {/* DONE BY */}
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
                      {/* COST CENTER */}
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
                                disabled={defaultCC !== ""}
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
                      {/* ADDRESS */}
                      <Th>
                        <ThContainer>
                          Address
                          <ThFilterContainer>
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch("address", uiState.address)
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.address}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    address: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleHeaderSearch("address", uiState.address)
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      {/* PHONE */}
                      <Th>
                        <ThContainer>
                          Phone
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="phone"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch("phone", uiState.phone)
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.phone}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    phone: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleHeaderSearch("phone", uiState.phone)
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      {/* EMAIL */}
                      <Th>
                        <ThContainer>
                          Email
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="email"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch("email", uiState.email)
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.email}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    email: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleHeaderSearch("email", uiState.email)
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      {/* <Th>
                        <ThContainer>
                          Credit Limit
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="credit_limit"
                              handleSort={handleSort}
                            />
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Outstanding
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="outstanding_balance"
                              handleSort={handleSort}
                            />
                          </ThFilterContainer>
                        </ThContainer>
                      </Th> */}
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
                          <Td>{item.done_by_name}</Td>
                          <Td>{item.cost_center_name}</Td>
                          <Td>{item.address}</Td>
                          <Td>{item.phone}</Td>
                          <Td>{item.email}</Td>
                          {/* <Td>{item.credit_limit}</Td>
                          <Td>{item.outstanding_balance}</Td> */}
                          <TdDate>{item.created_at}</TdDate>
                          <TdMenu
                            onEdit={() =>
                              setModal({ isOpen: true, mode: "edit", item })
                            }
                            onView={() =>
                              setModal({ isOpen: true, mode: "view", item })
                            }
                            onDelete={() => handleDeleteCustomer(item.id)}
                          />
                        </Tr>
                      ))
                    ) : (
                      <TableCaption item={customerItemConstant} noOfCol={11} />
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
            <PageTitleWithBackButton title="Customers" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
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
                  Add Customer
                </AddButton>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : (
                <>
                  {listData.map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.name}
                      subtitle={
                        <div>
                          {item.phone} | {item.address}
                        </div>
                      }
                      onEdit={() =>
                        setModal({ isOpen: true, mode: "edit", item })
                      }
                      onView={() =>
                        setModal({ isOpen: true, mode: "view", item })
                      }
                      onDelete={() => {
                        handleDeleteCustomer(item.id);
                      }}
                    />
                  ))}
                </>
              )}
              <Spacer />
            </ScrollContainer>
            <TableFooter {...footerProps} />
          </>
        )}
      </ContainerWrapper>
      <AddCustomerModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedCustomer={modal.item}
      />
    </>
  );
};

export default CommonCustomerList;
