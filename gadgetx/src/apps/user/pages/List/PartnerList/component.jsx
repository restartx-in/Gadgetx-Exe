import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import usePartnersPaginated from "@/hooks/api/partner/usePartnersPaginated";
import useDeletePartner from "@/hooks/api/partner/useDeletePartner";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import Loader from "@/components/Loader";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import InputField from "@/components/InputField";
import PopUpFilter from "@/components/PopUpFilter";
import TableFooter from "@/components/TableFooter";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
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
import AddPartner from "./components/AddPartner";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ScrollContainer from "@/components/ScrollContainer";
import TextArea from "@/components/TextArea";
import ListItem from "@/apps/user/components/ListItem/component";
import TableTopContainer from "@/components/TableTopContainer";
import useSyncURLParams from "@/hooks/useSyncURLParams";

// 2. Define Reducers
const stateReducer = (state, newState) => ({ ...state, ...newState });

const initialModalState = {
  isOpen: false,
  mode: "view",
  selected: null,
};

const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN":
      return {
        isOpen: true,
        mode: action.mode,
        selected: action.payload || null,
      };
    case "CLOSE":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const PartnerRow = React.memo(
  ({ p, index, page, pageSize, onView, onEdit, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{p.created_at}</TdDate>
      <Td>{p.name}</Td>
      <Td>{p.phone}</Td>
      <Td>{p.done_by_name}</Td>
      <Td>{p.cost_center_name}</Td>
      <Td>{p.address}</Td>
      <TdMenu
        onView={() => onView(p)}
        onEdit={() => onEdit(p)}
        onDelete={() => onDelete(p.id)}
      />
    </Tr>
  )
);

const PartnerList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const addButtonRef = useRef(null);
  const queryClient = useQueryClient();

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  // 3. Initialize state with useReducer
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    phone: searchParams.get("phone") || "",
    address: searchParams.get("address") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    name: state.name,
    phone: state.phone,
    address: state.address,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(state.name);
  const [phone, setPhone] = useState(state.phone);
  const [address, setAddress] = useState(state.address);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);

  const [headerFilters, setHeaderFilters] = useState({
    name: state.name || "",
    phone: state.phone || "",
    address: state.address || "",
    done_by_id: state.done_by_id || "",
    cost_center_id: state.cost_center_id || "",
  });

  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  useEffect(() => {
    setName(state.name || "");
    setPhone(state.phone || "");
    setAddress(state.address || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || "");
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      name: state.name || "",
      phone: state.phone || "",
      address: state.address || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
  }, [state]);

  const { data, isLoading } = usePartnersPaginated(state);
  const { mutateAsync: deletePartner } = useDeletePartner();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.total_pages || data?.page_count || 1;
  const totalItems = data?.count || 0;

  useEffect(() => {
    addButtonRef.current?.focus();
  }, []);

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handlePartnerSuccess = useCallback(() => {
    dispatchModal({ type: "CLOSE" });
    queryClient.invalidateQueries({ queryKey: ["partnersPaginated"] });
  }, [queryClient]);

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ page: 1, sort: value });
  }, []);

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ [key]: value, page: 1 });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") {
        handleHeaderSearch(key, headerFilters[key]);
      }
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleSearch = useCallback(() => {
    setState({ page: 1, searchType, searchKey });
  }, [searchType, searchKey]);

  const handleFilter = useCallback(() => {
    setState({
      page: 1,
      name,
      phone,
      address,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, phone, address, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    setName("");
    setPhone("");
    setAddress("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderFilters({
      name: "",
      phone: "",
      address: "",
      done_by_id: "",
      cost_center_id: "",
    });
    setState({
      page: 1,
      page_size: 10,
      name: "",
      phone: "",
      address: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    []
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    []
  );

  const searchOptions = [
    { value: "name", name: "Partner Name" },
    { value: "phone", name: "Phone Number" },
    { value: "address", name: "Address" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ];

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (partner) =>
      dispatchModal({ type: "OPEN", mode: "edit", payload: partner }),
    []
  );
  const handleViewClick = useCallback(
    (partner) =>
      dispatchModal({ type: "OPEN", mode: "view", payload: partner }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deletePartner(id, {
          onSuccess: () => {
            showToast({
              crudItem: CRUDITEM.PARTNER,
              crudType: CRUDTYPE.DELETE_SUCCESS,
            });
            queryClient.invalidateQueries({ queryKey: ["partnersPaginated"] });
          },
        });
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: error.response?.data?.error || "Failed to delete partner.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deletePartner, queryClient, showToast]
  );

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
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
            <PageTitleWithBackButton title="Partners" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <PopupSearchField
                    {...{
                      searchKey,
                      setSearchKey,
                      searchType,
                      setSearchType,
                      handleSearch,
                      searchOptions,
                      searchRef,
                    }}
                  />
                  <AddButton
                    size="medium"
                    onClick={handleAddClick}
                    ref={addButtonRef}
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
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={200}
                            >
                              <InputField
                                placeholder="Enter Name"
                                value={headerFilters.name}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "name")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Phone
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "phone", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={200}
                            >
                              <InputField
                                placeholder="Enter Phone"
                                value={headerFilters.phone}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "phone")
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
                              {...{
                                sort,
                                setSort,
                                value: "done_by",
                                handleSort,
                              }}
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
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Address
                          <ThFilterContainer>
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={220}
                            >
                              <InputField
                                placeholder="Enter Address"
                                value={headerFilters.address}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    address: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "address")
                                }
                                isLabel={false}
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
                        <PartnerRow
                          key={p.id}
                          p={p}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          onView={handleViewClick}
                          onEdit={handleEditClick}
                          onDelete={handleDelete}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Partner} noOfCol={8} />
                    )}
                  </Tbody>
                </Table>
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
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Partners" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    {...{
                      searchKey,
                      setSearchKey,
                      searchType,
                      setSearchType,
                      handleSearch,
                      searchOptions,
                      searchRef,
                    }}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton
                    size="medium"
                    onClick={handleAddClick}
                    ref={addButtonRef}
                  >
                    Add Partner
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Partner} />
              ) : (
                <div>
                  {listData.map((p) => (
                    <ListItem
                      key={p.id}
                      title={p.name}
                      subtitle={
                        <>
                          <div>{p.phone || "No phone number"}</div>
                          {p.done_by_name && (
                            <div>Done By: {p.done_by_name}</div>
                          )}
                          {p.cost_center_name && (
                            <div>Cost Center: {p.cost_center_name}</div>
                          )}
                          <div>{p.address || "No address"}</div>
                        </>
                      }
                      onView={() => handleViewClick(p)}
                      onEdit={() => handleEditClick(p)}
                      onDelete={() => handleDelete(p.id)}
                    />
                  ))}
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

      {/* 5. Update component props to use modalState */}
      <AddPartner
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedPartner={modalState.selected}
        onSuccess={handlePartnerSuccess}
      />
    </>
  );
};

export default PartnerList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter,
  }) => (
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
          name="name"
          type="text"
        />
        <InputField
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          name="phone"
          type="text"
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
        <TextArea
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          name="address"
          type="text"
        />
      </VStack>
    </PopUpFilter>
  )
);
