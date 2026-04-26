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
import useCustomersPaginated from "@/hooks/api/customer/useCustomersPaginated";
import useDeleteCustomer from "@/hooks/api/customer/useDeleteCustomer";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  ThSL,
  TdSL,
  TdDate,
  TdMenu,
  ThMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import VStack from "@/components/VStack/component.jsx";
import HStack from "@/components/HStack/component.jsx";
import PageHeader from "@/components/PageHeader";
import InputField from "@/components/InputField";
import MobileSearchField from "@/components/MobileSearchField";
import PhoneNoField from "@/components/PhoneNoField";
import PopupSearchField from "@/components/PopupSearchField";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import TextArea from "@/components/TextArea";
import DateField from "@/components/DateField";
import AddCustomer from "./components/AddCustomer";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
import DateFilter from "@/components/DateFilter";
import TableTopContainer from "@/components/TableTopContainer";
import { format, isValid } from "date-fns";


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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
};

const CustomerRow = React.memo(
  ({ item, index, page, pageSize, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <Td>{item.name}</Td>
      <Td>{item.done_by?.name || "N/A"}</Td>
      <Td>{item.cost_center?.name || "N/A"}</Td>
      <Td>{item.address}</Td>
      <Td>{item.phone}</Td>
      <Td>{item.email}</Td>
      <Td>{item.credit_limit}</Td>
      <Td>{item.outstanding_balance}</Td>
      <TdDate>{item.created_at}</TdDate>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  )
);

const CustomerList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    address: searchParams.get("address") || "",
    creditLimit: "",
    outstandingBalance: "",
    phone: searchParams.get("phone") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    name: state.name,
    email: state.email,
    address: state.address,
    phone: state.phone,
    startDate: state.start_date,
    endDate: state.end_date,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchKey: state.searchKey,
    searchType: state.searchType,
  });

  // Local state for UI controls (filters, popups, etc.)
  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(state.name);
  const [email, setEmail] = useState(state.email);
  const [address, setAddress] = useState(state.address);
  const [phone, setPhone] = useState(state.phone);
  const [startDate, setStartDate] = useState(state.start_date);
  const [endDate, setEndDate] = useState(state.end_date);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  // Sync Header Filters UI
  const [headerFilters, setHeaderFilters] = useState({
    name: state.name || "",
    email: state.email || "",
    phone: state.phone || "",
    done_by_id: state.done_by_id || "",
    cost_center_id: state.cost_center_id || "",
  });

  const [dateFilter, setDateFilter] = useState({
    startDate: state.start_date || null,
    endDate: state.end_date || null,
    rangeType: "custom",
  });

  useEffect(() => {
    setName(state.name || "");
    setEmail(state.email || "");
    setAddress(state.address || "");
    setPhone(state.phone || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaultCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      name: state.name || "",
      email: state.email || "",
      phone: state.phone || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: "custom",
    });
  }, [state, defaultCostCenter]);

  const { data, isLoading } = useCustomersPaginated(state);
  const { mutateAsync: deleteCustomer } = useDeleteCustomer();

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

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 });
  }, []);

  const handlePageChange = useCallback((value) => {
    setState({ page: value });
  }, []);

  const handleDateFilterChange = useCallback((newDateValue) => {
    setDateFilter(newDateValue);
    setState({
      start_date: newDateValue.startDate || "",
      end_date: newDateValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleFilter = useCallback(() => {
    setState({
      name,
      address,
      phone,
      email,
      start_date: startDate,
      end_date: endDate,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      page: 1,
    });
    setShowFilter(false);
  }, [name, address, phone, email, startDate, endDate, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    setName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setStartDate("");
    setEndDate("");
    setDoneById("");
    setSort("");
    setSearchKey("");
    setSearchType("");
    if (!isDisableCostCenter) setCostCenterId("");
    setHeaderFilters({ name: "", email: "", phone: "" });
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });

    // Reset main state
    setState({
      page: 1,
      page_size: 10,
      name: "",
      email: "",
      address: "",
      creditLimit: "",
      outstandingBalance: "",
      phone: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaultCostCenter, isDisableCostCenter]);

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (customer) =>
      dispatchModal({ type: "OPEN", mode: "edit", payload: customer }),
    []
  );
  const handleViewClick = useCallback(
    (customer) =>
      dispatchModal({ type: "OPEN", mode: "view", payload: customer }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteCustomer(id);
        showToast({
          crudItem: CRUDITEM.CUSTOMER,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.CUSTOMER,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteCustomer, showToast]
  );

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "email", name: "Email" },
    { value: "address", name: "Address" },
    { value: "phone", name: "Phone" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ];

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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
  };

  const { startDate: dfStartDate, endDate: dfEndDate } = dateFilter;
  const isDateFilterActive =
    dfStartDate &&
    dfEndDate &&
    isValid(new Date(dfStartDate)) &&
    isValid(new Date(dfEndDate));
  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(dfStartDate), "MMM d, yyyy")} → ${format(
        new Date(dfEndDate),
        "MMM d, yyyy"
      )}`
    : null;

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
              isMargin={true}
              mainActions={
                <>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <PopupSearchField
                    {...{
                      searchRef,
                      searchKey,
                      setSearchKey,
                      searchType,
                      setSearchType,
                      handleSearch,
                      searchOptions,
                    }}
                  />
                  <AddButton onClick={handleAddClick}>Add Customer</AddButton>
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
                              isSearch={true}
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
                      <Th>Address</Th>
                      <Th>
                        <ThContainer>
                          Phone
                          <ThFilterContainer>
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
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
                          Email
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "email", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
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
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "email")
                                }
                                isLabel={false}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Credit Limit
                          <ThSort
                            {...{
                              sort,
                              setSort,
                              value: "credit_limit",
                              handleSort,
                            }}
                          />
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Outstanding Balance
                          <ThSort
                            {...{
                              sort,
                              setSort,
                              value: "outstanding_balance",
                              handleSort,
                            }}
                          />
                        </ThContainer>
                      </Th>
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
                      <ThMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((cust, index) => (
                        <CustomerRow
                          key={cust.id}
                          item={cust}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          onEdit={handleEditClick}
                          onView={handleViewClick}
                          onDelete={handleDelete}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Customer} noOfCol={11} />
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
            <PageTitleWithBackButton title="Customers" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    {...{
                      searchRef,
                      searchKey,
                      setSearchKey,
                      searchType,
                      setSearchType,
                      handleSearch,
                      searchOptions,
                    }}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>Add Customer</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Customer} />
              ) : (
                <div>
                  {listData.map((cust) => (
                    <ListItem
                      key={cust.id}
                      title={cust.name}
                      subtitle={
                        <>
                          <div>{formatDate(cust.date)}</div>
                          <div>{cust.phone || "No phone number"}</div>
                          {cust.done_by_name && (
                            <div>Done By: {cust.done_by_name}</div>
                          )}
                          {cust.cost_center_name && (
                            <div>Cost Center: {cust.cost_center_name}</div>
                          )}
                          <div>{cust.address || "No address"}</div>
                        </>
                      }
                      onView={() => handleViewClick(cust)}
                      onEdit={() => handleEditClick(cust)}
                      onDelete={() => handleDelete(cust.id)}
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

      <AddCustomer
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedCustomer={modalState.selected}
      />
    </>
  );
};

export default CustomerList;

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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter,
  }) => {
    const isMobile = useIsMobile();
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
          <InputField
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <PhoneNoField
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
            type="text"
          />
          {isMobile ? (
            <>
              <DateField
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(date) =>
                  setStartDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
              <DateField
                label="End Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(date) =>
                  setEndDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
            </>
          ) : (
            <HStack justifyContent="flex-start">
              <DateField
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(date) =>
                  setStartDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
              <DateField
                label="End Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(date) =>
                  setEndDate(date ? date.toISOString().split("T")[0] : "")
                }
              />
            </HStack>
          )}
        </VStack>
      </PopUpFilter>
    );
  }
);
