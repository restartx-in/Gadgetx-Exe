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
import useEmployeesPaginated from "@/hooks/api/employee/useEmployeesPaginated";
import useDeleteEmployee from "@/hooks/api/employee/useDeleteEmployee";
import useCreateBulkPayroll from "@/hooks/api/payroll/useCreateBulkPayroll";
import { useEmployeePosition } from "@/hooks/api/employeePosition/useEmployeePosition";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import InputField from "@/components/InputField";
import Loader from "@/components/Loader";
import RangeField from "@/components/RangeField";
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
  TdDate,
  TdMenu,
  ThMenu,
  ThContainer,
  ThSearchOrFilterPopover,
  TableCaption,
  ThFilterContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import TableTopContainer from "@/components/TableTopContainer";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import DateField from "@/components/DateField";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import PhoneNoField from "@/components/PhoneNoField";
import SelectField from "@/components/SelectField";
import AddEmployee from "./components/AddEmployee";
import { useToast } from "@/context/ToastContext";
import Spacer from "@/components/Spacer";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import SettingsBackButton from "@/components/SettingsBackButton";
import PayrollButton from "@/apps/user/components/PayrollButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import AccountAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/AccountAutoCompleteWithAddOptionWithBalance";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import PageTitle from "@/components/PageTitle";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import "./style.scss";

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

const getTodayISO = () => new Date().toISOString().split("T")[0];

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const EmployeeRow = React.memo(
  ({ emp, index, page, pageSize, positionName, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{emp.hire_date}</TdDate>
      <Td>{emp.name}</Td>
      <Td>{emp.email}</Td>
      <Td>{emp.phone}</Td>
      <Td>{positionName}</Td>
      <Td>{emp.done_by_name}</Td>
      <Td>{emp.cost_center_name}</Td>
      <TdNumeric>{emp.salary}</TdNumeric>
      <TdMenu
        onEdit={() => onEdit(emp)}
        onView={() => onView(emp)}
        onDelete={() => onDelete(emp.id)}
      />
    </Tr>
  )
);

const EmployeeList = ({}) => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const addButtonRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    start_date: "",
    end_date: "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    position: searchParams.get("position") || "",
    min_salary: searchParams.get("minSalary") || "",
    max_salary: searchParams.get("maxSalary") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
  });

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    name: state.name,
    email: state.email,
    phone: state.phone,
    position: state.position,
    minSalary: state.min_salary,
    maxSalary: state.max_salary,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
  });

  const [startDate, setStartDate] = useState(state.start_date);
  const [endDate, setEndDate] = useState(state.end_date);
  const [name, setName] = useState(state.name);
  const [email, setEmail] = useState(state.email);
  const [phone, setPhone] = useState(state.phone);
  const [position, setPosition] = useState(state.position);
  const [minSalary, setMinSalary] = useState(state.min_salary || 20000);
  const [maxSalary, setMaxSalary] = useState(state.max_salary || 100000);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [showFilter, setShowFilter] = useState(false);
  const [headerPosition, setHeaderPosition] = useState(state.position);
  const [headerFilters, setHeaderFilters] = useState({});
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    setName(state.name || "");
    setEmail(state.email || "");
    setPhone(state.phone || "");
    setPosition(state.position || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || "");
    setMinSalary(state.min_salary || 20000);
    setMaxSalary(state.max_salary || 100000);
    setHeaderFilters({
      name: state.name || "",
      email: state.email || "",
      phone: state.phone || "",
      salary: state.min_salary === state.max_salary ? state.min_salary : "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });
    setHeaderPosition(state.position || "");
  }, [state]);

  const { data, isLoading, refetch } = useEmployeesPaginated(state);
  const { mutateAsync: deleteEmployee } = useDeleteEmployee();
  const { data: positionsData } = useEmployeePosition();

  const positions = useMemo(() => positionsData || [], [positionsData]);
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;

  useEffect(() => {
    if (viewMode === "list") addButtonRef.current?.focus();
  }, [viewMode]);

  const getPositionName = useCallback(
    (id) => {
      if (!id || !positions.length) return "_";
      const pos = positions.find((p) => String(p.id) === String(id));
      return pos ? pos.name : `ID: ${id}`;
    },
    [positions]
  );

  const positionOptions = useMemo(
    () => [
      { value: "", label: "All Positions" },
      ...positions.map((p) => ({ value: p.id, label: p.name })),
    ],
    [positions]
  );

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ page: 1, sort: value });
  }, []);

  const handleSearch = useCallback(
    () => setState({ page: 1, searchType, searchKey }),
    [searchType, searchKey]
  );

  const handleHeaderSearch = useCallback((key, value) => {
    const update =
      key === "salary"
        ? { min_salary: value, max_salary: value }
        : { [key]: value };
    setState({ page: 1, ...update });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") handleHeaderSearch(key, headerFilters[key]);
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleHeaderPositionFilter = useCallback((positionId) => {
    setHeaderPosition(positionId);
    setState({ page: 1, position: positionId });
  }, []);

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
      name,
      start_date: startDate,
      end_date: endDate,
      email,
      phone,
      position,
      min_salary: minSalary,
      max_salary: maxSalary,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      page: 1,
    });
    setShowFilter(false);
  }, [
    name,
    startDate,
    endDate,
    email,
    phone,
    position,
    minSalary,
    maxSalary,
    doneById,
    costCenterId,
  ]);

  const handleRefresh = useCallback(() => {
    setName("");
    setStartDate("");
    setEndDate("");
    setEmail("");
    setPhone("");
    setPosition("");
    setMinSalary(20000);
    setMaxSalary(100000);
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderPosition("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setHeaderFilters({
      name: "",
      email: "",
      phone: "",
      salary: "",
      done_by_id: "",
      cost_center_id: "",
    });

    setState({
      page: 1,
      page_size: 10,
      name: "",
      start_date: "",
      end_date: "",
      email: "",
      phone: "",
      position: "",
      min_salary: "",
      max_salary: "",
      sort: "",
      searchType: "",
      searchKey: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
    });
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Report has been refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  }, [defaultCostCenter, isDisableCostCenter, showToast]);

  // Modal State and Handlers
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );
  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (employee) =>
      dispatchModal({ type: "OPEN", mode: "edit", payload: employee }),
    []
  );
  const handleViewClick = useCallback(
    (employee) =>
      dispatchModal({ type: "OPEN", mode: "view", payload: employee }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteEmployee(id);
        showToast({
          crudItem: CRUDITEM.EMPLOYEE,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: error.response?.data?.error || "Failed to delete employee.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deleteEmployee, refetch, showToast]
  );

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "email", name: "Email" },
    { value: "phone", name: "Phone" },
    { value: "position", name: "Position" },
    { value: "address", name: "Address" },
    { value: "salary", name: "Salary" },
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
    position,
    setPosition,
    positionOptions,
    minSalary,
    setMinSalary,
    maxSalary,
    setMaxSalary,
    startDate,
    handleStartDateChange: (date) =>
      setStartDate(date ? date.toISOString().split("T")[0] : ""),
    endDate,
    handleEndDateChange: (date) =>
      setEndDate(date ? date.toISOString().split("T")[0] : ""),
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    disableCostCenter: isDisableCostCenter,
  };

  if (viewMode === "bulk_payroll") {
    return (
      <BulkEntryPage onBack={() => setViewMode("list")} positions={positions} />
    );
  }

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Employees" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
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
                  <PayrollButton onClick={() => setViewMode("bulk_payroll")}>
                    Bulk Payroll
                  </PayrollButton>
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add Employee
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
                          Hire Date
                          <ThSort
                            {...{
                              sort,
                              setSort,
                              value: "hire_date",
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
                      {/* ... other table headers ... */}
                      <Th>
                        <ThContainer>
                          Email
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "email", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={200}
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
                          Position
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "position",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <SelectField
                                placeholder="Position"
                                value={headerPosition}
                                onChange={(e) =>
                                  handleHeaderPositionFilter(e.target.value)
                                }
                                options={positionOptions}
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
                                value={state.cost_center_id}
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
                          Salary
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "salary",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={200}
                            >
                              <InputField
                                placeholder="Enter Exact Amount"
                                value={headerFilters.salary}
                                type="number"
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    salary: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "salary")
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
                      listData.map((emp, index) => (
                        <EmployeeRow
                          key={emp.id}
                          emp={emp}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          positionName={getPositionName(
                            emp.employee_position_id
                          )}
                          onEdit={handleEditClick}
                          onView={handleViewClick}
                          onDelete={handleDelete}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Employee} noOfCol={10} />
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
            <PageTitleWithBackButton title="Employees" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
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
                  <PayrollButton onClick={() => setViewMode("bulk_payroll")}>
                    Bulk Payroll
                  </PayrollButton>
                </HStack>
                <div className="employee_list__add_button">
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add Employee
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Employee} />
              ) : (
                <div className="mobile-list-view">
                  {listData.map((emp) => (
                    <ListItem
                      key={emp.id}
                      title={emp.name}
                      subtitle={
                        <>
                          <div>
                            {getPositionName(emp.employee_position_id) ||
                              emp.id}
                          </div>
                          {emp.done_by_name && (
                            <div>Done By: {emp.done_by_name}</div>
                          )}
                          {emp.cost_center_name && (
                            <div>Cost Center: {emp.cost_center_name}</div>
                          )}
                          <div>{formatDate(emp.hire_date)}</div>
                        </>
                      }
                      amount={
                        emp.salary ? Number(emp.salary).toFixed(2) : "0.00"
                      }
                      onView={() => handleViewClick(emp)}
                      onEdit={() => handleEditClick(emp)}
                      onDelete={() => handleDelete(emp.id)}
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

      <AddEmployee
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedEmployee={modalState.selected}
        onSuccess={refetch}
      />
    </>
  );
};

const BulkEntryPage = ({ onBack, positions }) => {
  const { data, isLoading } = useEmployeesPaginated({
    page: 1,
    page_size: 9999,
  });
  const { mutateAsync: createBulkPayroll, isLoading: isSubmitting } =
    useCreateBulkPayroll();
  const showToast = useToast();
  const selectAllCheckboxRef = useRef();

  const [employees, setEmployees] = useState([]);
  const [entryData, setEntryData] = useState({});
  const [globalDate, setGlobalDate] = useState(getTodayISO());
  const [globalAccountId, setGlobalAccountId] = useState("");
  const [globalDoneById, setGlobalDoneById] = useState(""); // New State
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [globalCostCenterId, setGlobalCostCenterId] = useState(
    localStorage.getItem("DEFAULT_COST_CENTER") ?? ""
  );

  const isAllSelected =
    employees.length > 0 && selectedEmployees.length === employees.length;
  const isSomeSelected =
    selectedEmployees.length > 0 && selectedEmployees.length < employees.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const getPositionName = (id) => {
    if (!id || !positions || !positions.length) return "_";
    const pos = positions.find((p) => String(p.id) === String(id));
    return pos ? pos.name : `ID: ${id}`;
  };

  useEffect(() => {
    if (data?.data) {
      const activeEmployees = data.data;
      setEmployees(activeEmployees);
      const initialPayroll = activeEmployees.reduce((acc, emp) => {
        acc[emp.id] = { salary: emp.salary || "" };
        return acc;
      }, {});
      setEntryData(initialPayroll);
    }
  }, [data]);

  const handleToggleSelection = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp) => emp.id));
    }
  };

  const handleDataChange = (employeeId, salary) => {
    setEntryData((prev) => ({
      ...prev,
      [employeeId]: { salary },
    }));
  };

  const handleSubmit = async () => {
    if (!globalAccountId) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select an account to pay from.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    const payload = selectedEmployees
      .map((employeeId) => {
        const data = entryData[employeeId];
        if (data && data.salary && String(data.salary).trim() !== "") {
          return {
            employee_id: Number(employeeId),
            account_id: Number(globalAccountId),
            salary: Number(data.salary),
            pay_date: globalDate,
            done_by_id: globalDoneById ? Number(globalDoneById) : null,
            cost_center_id: globalCostCenterId
              ? Number(globalCostCenterId)
              : null,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (payload.length === 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "No selected employees have valid salary data to submit.",
        status: TOASTSTATUS.WARNING,
      });
      return;
    }

    if (payload.length < selectedEmployees.length) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          "Some selected employees are missing a salary. Only entries with a salary will be submitted.",
        status: TOASTSTATUS.INFO,
      });
    }

    try {
      await createBulkPayroll(payload);
      showToast({
        type: TOASTTYPE.GENARAL,
        message: `Successfully submitted payroll for ${payload.length} employees!`,
        status: TOASTSTATUS.SUCCESS,
      });
      onBack();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || "Failed to submit payroll data.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <ContainerWrapper>
      <div className="bulk-entry-view">
        <div className="bulk-entry-header">
          <SettingsBackButton onBackClick={onBack} />
          <PageTitle title="Bulk Payroll" />
        </div>

        <div className="bulk-entry-global-controls">
          <div className="select-all-container">
            <input
              type="checkbox"
              ref={selectAllCheckboxRef}
              checked={isAllSelected}
              onChange={handleSelectAll}
              id="select-all-checkbox"
            />
            <label htmlFor="select-all-checkbox" className="fs16 fw600">
              Select All
            </label>
            {selectedEmployees.length > 0 && (
              <span className="selection-counter">
                ({selectedEmployees.length} selected)
              </span>
            )}
          </div>
          <Spacer />

          <div style={{ minWidth: "200px" }}>
            <AccountAutoCompleteWithAddOptionWithBalance
              name="global_account_id"
              value={globalAccountId}
              onChange={(e) => setGlobalAccountId(e.target.value)}
              placeholder="Pay From Account"
              required
            />
          </div>

          <div
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <div style={{ minWidth: "180px" }}>
              <CostCenterAutoCompleteWithAddOption
                name="global_cost_center_id"
                value={globalCostCenterId}
                onChange={(e) => setGlobalCostCenterId(e.target.value)}
                placeholder="Cost Center"
              />
            </div>
            <div style={{ minWidth: "180px" }}>
              <DoneByAutoCompleteWithAddOption
                name="global_done_by_id"
                value={globalDoneById}
                onChange={(e) => setGlobalDoneById(e.target.value)}
                placeholder="Done By"
              />
            </div>
            <DateField
              label="Pay Date"
              value={globalDate ? new Date(globalDate) : null}
              onChange={(date) =>
                setGlobalDate(date ? date.toISOString().split("T")[0] : "")
              }
            />
          </div>

          <SubmitButton
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || selectedEmployees.length === 0}
            type="add"
          />
        </div>

        <div className="bulk-entry-scroll-container">
          {isLoading ? (
            <Loader />
          ) : (
            <div className="bulk-entry-grid">
              {employees.map((emp) => (
                <PayrollEntryCard
                  key={emp.id}
                  employee={{
                    ...emp,
                    position: getPositionName(emp.employee_position_id),
                  }}
                  payroll={entryData[emp.id]}
                  onSalaryChange={(salary) => handleDataChange(emp.id, salary)}
                  isSelected={selectedEmployees.includes(emp.id)}
                  onToggleSelection={() => handleToggleSelection(emp.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContainerWrapper>
  );
};

const PayrollEntryCard = ({
  employee,
  payroll,
  onSalaryChange,
  isSelected,
  onToggleSelection,
}) => {
  return (
    <div
      className={`employee-entry-card ${isSelected ? "_selected" : ""}`}
      onClick={onToggleSelection}
    >
      <div className="card-selection-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="employee-entry-card__header">
        <div className="avatar-placeholder">{getInitials(employee.name)}</div>
        <div className="employee-info">
          <span className="employee-entry-card__name fs16 fw600">
            {employee.name}
          </span>
          <span className="employee-entry-card__position fs14 fw400">
            {employee.position}
          </span>
        </div>
      </div>
      <div
        className="employee-entry-card__section"
        onClick={(e) => e.stopPropagation()}
      >
        <InputField
          label="Salary to Pay "
          className="fs16 fw500"
          type="number"
          value={payroll?.salary || ""}
          onChange={(e) => onSalaryChange(e.target.value)}
          placeholder="Enter salary"
        />
      </div>
    </div>
  );
};

export default EmployeeList;

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
    position,
    setPosition,
    positionOptions,
    minSalary,
    setMinSalary,
    maxSalary,
    setMaxSalary,
    startDate,
    handleStartDateChange,
    endDate,
    handleEndDateChange,
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
            label="Name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <InputField
            label="Email"
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
          <SelectField
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            options={positionOptions}
          />
          <RangeField
            label="Salary Range"
            minValue={minSalary}
            maxValue={maxSalary}
            onMinChange={(value) => setMinSalary(value)}
            onMaxChange={(value) => setMaxSalary(value)}
          />

          {isMobile ? (
            <>
              <DateField
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(date) => handleStartDateChange(date ? date : "")}
              />
              <DateField
                label="End Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(date) => handleEndDateChange(date ? date : "")}
              />
            </>
          ) : (
            <HStack>
              <DateField
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(date) => handleStartDateChange(date ? date : "")}
              />
              <DateField
                label="End Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(date) => handleEndDateChange(date ? date : "")}
              />
            </HStack>
          )}
        </VStack>
      </PopUpFilter>
    );
  }
);