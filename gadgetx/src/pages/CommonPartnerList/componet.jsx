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
import TextArea from "@/components/TextArea"; // Added TextArea
import TableFooter from "@/components/TableFooter";
import useSyncURLParams from "@/hooks/useSyncURLParams";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const CommonPartnerList = ({
  usePartnersPaginatedHook,
  useDeletePartnerHook,
  AddPartnerModal,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  TableTopContainer,
  partnerItemConstant,
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
    phone: searchParams.get("phone") || "",
    address: searchParams.get("address") || "",
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


  const { data, isLoading } = usePartnersPaginatedHook(state);
  const { mutateAsync: deletePartner } = useDeletePartnerHook();
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
    setState({
      page: 1,
      name: "",
      phone: "",
      address: "",
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
    { value: "name", name: "Partner Name" },
    { value: "phone", name: "Phone Number" },
    { value: "address", name: "Address" },
  ];

  // Updated Filter Content to include Address
  const filterContent = (
    <VStack>
      <InputField
        label="Name"
        value={uiState.name}
        onChange={(e) => setUiState({ ...uiState, name: e.target.value })}
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
    totalPages: data?.page_count || 1,
    handlePageLimitSelect: (v) => setState({ page_size: v, page: 1 }),
    handlePageChange: (v) => setState({ page: v }),
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Partners" />
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
                    Add Partner
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
                          Date
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="created_at"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>

                      {/* Name Column */}
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

                      {/* Phone Column */}
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

                      {/* Done By Column */}
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

                      {/* Cost Center Column */}
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

                      {/* Address Column */}
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
                          <TdDate>{item.created_at}</TdDate>
                          <Td>{item.name}</Td>
                          <Td>{item.phone}</Td>
                          <Td>{item.done_by_name}</Td>
                          <Td>{item.cost_center_name}</Td>
                          <Td>{item.address}</Td>
                          <TdMenu
                            onEdit={() =>
                              setModal({ isOpen: true, mode: "edit", item })
                            }
                            onView={() =>
                              setModal({ isOpen: true, mode: "view", item })
                            }
                            onDelete={() => deletePartner(item.id)}
                          />
                        </Tr>
                      ))
                    ) : (
                      <TableCaption item={partnerItemConstant} noOfCol={9} />
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
            <PageTitleWithBackButton title="Partners" />
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
                  Add Partner
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
                        <>
                          <div>{item.phone}</div>
                          <div style={{ fontSize: "12px", color: "gray" }}>
                            {item.done_by_name} | {item.cost_center_name}
                          </div>
                        </>
                      }
                      onEdit={() =>
                        setModal({ isOpen: true, mode: "edit", item })
                      }
                      onView={() =>
                        setModal({ isOpen: true, mode: "view", item })
                      }
                      onDelete={() => deletePartner(item.id)}
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
      <AddPartnerModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedPartner={modal.item}
      />
    </>
  );
};

export default CommonPartnerList;
