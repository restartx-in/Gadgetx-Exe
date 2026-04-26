import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useSuppliersPaginated from "@/hooks/api/supplier/useSuppliersPaginated";
import useDeleteSupplier from "@/hooks/api/supplier/useDeleteSupplier";
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
import TextArea from "@/components/TextArea";
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
  TdSL,
  ThSL,
  TdMenu,
  ThMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import AddSupplier from "./components/AddSupplier";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import Spacer from "@/components/Spacer";
import ScrollContainer from "@/components/ScrollContainer";
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

const SupplierRow = React.memo(
  ({ s, index, page, pageSize, onView, onEdit, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <Td>{s.name}</Td>
      <Td>{s.done_by_name || "N/A"}</Td>
      <Td>{s.cost_center_name || "N/A"}</Td>
      <Td>{s.email}</Td>
      <Td>{s.phone}</Td>
      <Td>{s.address}</Td>
      <Td>{s.payment_terms}</Td>
      <TdMenu
        onView={() => onView(s)}
        onEdit={() => onEdit(s)}
        onDelete={() => onDelete(s.id)}
      />
    </Tr>
  )
);

const SupplierList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaltCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaltCostCenter !== "";

  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter);
  const [sort, setSort] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchKey, setSearchKey] = useState("");

  const [headerFilters, setHeaderFilters] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "",
    done_by_id: "",
    cost_center_id: "",
  });

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    address: searchParams.get("address") || "",
    payment_terms: searchParams.get("paymentTerms") || "",
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
    email: state.email,
    phone: state.phone,
    address: state.address,
    paymentTerms: state.payment_terms,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  useEffect(() => {
    setName(state.name || "");
    setEmail(state.email || "");
    setPhone(state.phone || "");
    setAddress(state.address || "");
    setPaymentTerms(state.payment_terms || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      name: state.name || "",
      email: state.email || "",
      phone: state.phone || "",
      address: state.address || "",
      payment_terms: state.payment_terms || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
  }, [state, defaltCostCenter]);

  const { data, isLoading } = useSuppliersPaginated(state);
  const { mutateAsync: deleteSupplier } = useDeleteSupplier();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.total_pages || 1;
  const totalItems = data?.count || 0;

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ page: 1, sort: value });
  }, []);

  const handleSearch = useCallback(
    () => setState({ page: 1, searchType, searchKey }),
    [searchType, searchKey]
  );

  const applyHeaderSearch = useCallback(
    (key) => setState({ [key]: headerFilters[key], page: 1 }),
    [headerFilters]
  );
  const handleHeaderDropdownChange = useCallback(
    (key, value) => setState({ [key]: value, page: 1 }),
    []
  );

  const handlePageLimitSelect = useCallback(
    (value) => setState({ page_size: value, page: 1 }),
    []
  );
  const handlePageChange = useCallback(
    (value) => setState({ page: value }),
    []
  );

  const handleFilter = useCallback(() => {
    setState({
      page: 1,
      name,
      email,
      phone,
      address,
      payment_terms: paymentTerms,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [name, email, phone, address, paymentTerms, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setPaymentTerms("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderFilters({
      name: "",
      email: "",
      phone: "",
      address: "",
      payment_terms: "",
    });
    setState({
      page: 1,
      page_size: 10,
      name: "",
      email: "",
      phone: "",
      address: "",
      payment_terms: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaltCostCenter, isDisableCostCenter]);

  const searchOptions = [
    { value: "name", name: " Name" },
    { value: "email", name: "Email " },
    { value: "phone", name: "Phone " },
    { value: "address", name: "Address" },
    { value: "payment_terms", name: "Payment Term" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ];

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (supplier) =>
      dispatchModal({ type: "OPEN", mode: "edit", payload: supplier }),
    []
  );
  const handleViewClick = useCallback(
    (supplier) =>
      dispatchModal({ type: "OPEN", mode: "view", payload: supplier }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteSupplier(id);
        showToast({
          crudItem: CRUDITEM.SUPPLIER,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.SUPPLIER,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteSupplier, showToast]
  );

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    paymentTerms,
    setPaymentTerms,
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
            <PageTitleWithBackButton title="Suppliers" />
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
                  <AddButton size="medium" onClick={handleAddClick}>
                    Add Supplier
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
                              {...{ sort, setSort, value: "name", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={220}
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
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    applyHeaderSearch("name");
                                }}
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
                                value={state.done_by_id}
                                onChange={(e) =>
                                  handleHeaderDropdownChange(
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
                                value={state.cost_center_id}
                                onChange={(e) =>
                                  handleHeaderDropdownChange(
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
                          Email
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "email", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={220}
                            >
                              <InputField
                                placeholder="Enter Email"
                                value={headerFilters.email}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    applyHeaderSearch("email");
                                }}
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
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    applyHeaderSearch("phone");
                                }}
                                isLabel={false}
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
                              popoverWidth={240}
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
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    applyHeaderSearch("address");
                                }}
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Payment Terms
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "payment_terms",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={220}
                            >
                              <InputField
                                placeholder="Enter terms"
                                value={headerFilters.payment_terms}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    payment_terms: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    applyHeaderSearch("payment_terms");
                                }}
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
                      listData.map((s, index) => (
                        <SupplierRow
                          key={s.id}
                          s={s}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          onView={handleViewClick}
                          onEdit={handleEditClick}
                          onDelete={handleDelete}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Supplier} noOfCol={9} />
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
            <PageTitleWithBackButton title="Suppliers" />
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
                  <AddButton size="medium" onClick={handleAddClick}>
                    Add Supplier
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Supplier} />
              ) : (
                <div>
                  {listData.map((s) => (
                    <ListItem
                      key={s.id}
                      title={s.name}
                      subtitle={
                        <>
                          <div>{s.phone || "No phone number"}</div>
                          {s.done_by_name && (
                            <div>Done By: {s.done_by_name}</div>
                          )}
                          {s.cost_center_name && (
                            <div>Cost Center: {s.cost_center_name}</div>
                          )}
                          <div>{s.address || "No address"}</div>
                        </>
                      }
                      onView={() => handleViewClick(s)}
                      onEdit={() => handleEditClick(s)}
                      onDelete={() => handleDelete(s.id)}
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

      <AddSupplier
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedSupplier={modalState.selected}
      />
    </>
  );
};

export default SupplierList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    paymentTerms,
    setPaymentTerms,
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
            name="name"
          />
          <InputField
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <InputField
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            name="phone"
            type="number"
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
          />
          <InputField
            placeholder="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </VStack>
      </PopUpFilter>
    );
  }
);
