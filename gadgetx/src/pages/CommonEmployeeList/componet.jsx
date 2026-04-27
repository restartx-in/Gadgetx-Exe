import React, {
  useReducer,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  ThSL,
  TdSL,
  TdMenu,
  ThMenu,
  TdDate,
  TdNumeric,
  TableCaption,
  ThContainer,
  ThSort,
  ThFilterContainer,
  ThSearchOrFilterPopover,
} from "@/components/Table";
import ContainerWrapper from "@/components/ContainerWrapper";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import Loader from "@/components/Loader";
import TableFooter from "@/components/TableFooter";
import RefreshButton from "@/components/RefreshButton";
import AddButton from "@/components/AddButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack/component.jsx";
import HStack from "@/components/HStack/component.jsx";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import PhoneNoField from "@/components/PhoneNoField";
import RangeField from "@/components/RangeField";
import DateField from "@/components/DateField";
import ListItem from "@/components/ListItem/component";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";
import PayrollButton from "@/apps/user/components/PayrollButton";
import SettingsBackButton from "@/apps/user/components/SettingsBackButton";
import PageTitle from "@/components/PageTitle";
import SubmitButton from "@/components/SubmitButton";
import AccountAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/AccountAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";


const stateReducer = (state, newState) => ({ ...state, ...newState });

// --- UTILITIES RESTORED FROM ORIGINAL ---
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  } catch (e) {
    return dateString;
  }
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getTodayISO = () => new Date().toISOString().split("T")[0];

const CommonEmployeeList = ({
  useEmployeesHook,
  useDeleteHook,
  usePositionsHook,
  useBulkPayrollHook,
  AddModal,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  TableTopContainer,
  employeeItemConstant,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const addButtonRef = useRef(null);
  const [viewMode, setViewMode] = useState("list");
  const [showFilter, setShowFilter] = useState(false);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // 1. Unified State (Mapping matches your original mapping logic)
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    position: searchParams.get("position") || "",
    min_salary: searchParams.get("minSalary") || "",
    max_salary: searchParams.get("maxSalary") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  // 2. URL Synchronization
  useSyncURLParams({
    ...state,
    pageSize: state.page_size,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    minSalary: state.min_salary,
    maxSalary: state.max_salary,
  });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);


  const { data, isLoading, refetch } = useEmployeesHook(state);
  const { data: positions } = usePositionsHook();
    const { mutateAsync: deleteEmployee } = useDeleteHook();
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

  // Handle "Add" from URL
  useEffect(() => {
    if (searchParams.get("action") === "add" && !modal.isOpen) {
      setModal({ isOpen: true, mode: "add", item: null });
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams, modal.isOpen]);

  const positionOptions = useMemo(
    () => [
      { value: "", label: "All Positions" },
      ...(positions?.map((p) => ({ value: p.id, label: p.name })) || []),
    ],
    [positions],
  );

  const handleRefresh = () => {
    setState({
      page: 1,
      page_size: 10,
      name: "",
      email: "",
      phone: "",
      position: "",
      min_salary: "",
      max_salary: "",
      searchKey: "",
      searchType: "",
      sort: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
    });
    setSort("");
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Refreshed.",
      status: TOASTSTATUS.SUCCESS,
    });
  };

  const handlePageChange = useCallback((v) => setState({ page: v }), []);
  const handlePageLimitSelect = useCallback(
    (v) => setState({ page_size: v, page: 1 }),
    [],
  );
  const handleSort = useCallback((v) => {
    setSort(v);
    setState({ sort: v, page: 1 });
  }, []);
  const onHeaderSearch = (key) => setState({ [key]: uiState[key], page: 1 });

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "email", name: "Email" },
    { value: "phone", name: "Phone" },
    { value: "position", name: "Position" },
    { value: "salary", name: "Salary" },
  ];

  if (viewMode === "bulk_payroll") {
    return (
      <BulkPayrollView
        onBack={() => setViewMode("list")}
        positions={positions}
        useBulkPayrollHook={useBulkPayrollHook}
        useEmployeesHook={useEmployeesHook}
      />
    );
  }

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Employees" />
          <TableTopContainer
            mainActions={
              <>

                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={() => setState({ ...uiState, page: 1 })}
                >
                  <VStack>
                    <InputField
                      label="Name"
                      value={uiState.name}
                      onChange={(e) =>
                        setUiState({ ...uiState, name: e.target.value })
                      }
                    />
                    <InputField
                      label="Email"
                      value={uiState.email}
                      onChange={(e) =>
                        setUiState({ ...uiState, email: e.target.value })
                      }
                    />
                    <PhoneNoField
                      label="Phone"
                      value={uiState.phone}
                      onChange={(e) =>
                        setUiState({ ...uiState, phone: e.target.value })
                      }
                    />
                    <SelectField
                      label="Position"
                      value={uiState.position}
                      onChange={(e) =>
                        setUiState({ ...uiState, position: e.target.value })
                      }
                      options={positionOptions}
                    />
                    <RangeField
                      label="Salary Range"
                      minValue={uiState.min_salary}
                      maxValue={uiState.max_salary}
                      onMinChange={(v) =>
                        setUiState({ ...uiState, min_salary: v })
                      }
                      onMaxChange={(v) =>
                        setUiState({ ...uiState, max_salary: v })
                      }
                    />
                    <DoneByAutoComplete
                      value={uiState.done_by_id}
                      onChange={(e) =>
                        setUiState({ ...uiState, done_by_id: e.target.value })
                      }
                      is_edit={false}
                    />
                    <CostCenterAutoComplete
                      value={uiState.cost_center_id}
                      disabled={isDisableCostCenter}
                      onChange={(e) =>
                        setUiState({
                          ...uiState,
                          cost_center_id: e.target.value,
                        })
                      }
                    />
                  </VStack>
                </PopUpFilter>
                <RefreshButton onClick={handleRefresh} />
                <PopupSearchField
                  searchRef={searchRef}
                  searchKey={uiState.searchKey}
                  setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                  handleSearch={() => setState({ ...uiState, page: 1 })}
                  searchOptions={searchOptions}
                />
                <PayrollButton onClick={() => setViewMode("bulk_payroll")}>
                  Bulk Payroll
                </PayrollButton>
                <AddButton
                  onClick={() => setModal({ isOpen: true, mode: "add" })}
                  ref={addButtonRef}
                >
                  Add Employee
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
                      Hire Date
                      <ThSort
                        sort={sort}
                        setSort={setSort}
                        value="hire_date"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
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
                        <ThSearchOrFilterPopover isSearch>
                          <InputField
                            value={uiState.name}
                            onChange={(e) =>
                              setUiState({ ...uiState, name: e.target.value })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && onHeaderSearch("name")
                            }
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
                          sort={sort}
                          setSort={setSort}
                          value="email"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover isSearch>
                          <InputField
                            value={uiState.email}
                            onChange={(e) =>
                              setUiState({ ...uiState, email: e.target.value })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && onHeaderSearch("email")
                            }
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
                          sort={sort}
                          setSort={setSort}
                          value="phone"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover isSearch>
                          <InputField
                            value={uiState.phone}
                            onChange={(e) =>
                              setUiState({ ...uiState, phone: e.target.value })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && onHeaderSearch("phone")
                            }
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
                          sort={sort}
                          setSort={setSort}
                          value="position"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover isSearch={false}>
                          <SelectField
                            value={state.position}
                            options={positionOptions}
                            onChange={(e) =>
                              setState({ position: e.target.value, page: 1 })
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
                            value={state.done_by_id}
                            onChange={(e) =>
                              setState({ done_by_id: e.target.value, page: 1 })
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
                            value={state.cost_center_id}
                            disabled={isDisableCostCenter}
                            onChange={(e) =>
                              setState({
                                cost_center_id: e.target.value,
                                page: 1,
                              })
                            }
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th>
                    <ThContainer>
                      Salary
                      <ThSort
                        sort={sort}
                        setSort={setSort}
                        value="salary"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((emp, index) => (
                    <Tr key={emp.id}>
                      <TdSL
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                      />
                      <TdDate>{emp.hire_date}</TdDate>
                      <Td>{emp.name}</Td>
                      <Td>{emp.email}</Td>
                      <Td>{emp.phone}</Td>
                      <Td>
                        {positions?.find(
                          (p) =>
                            String(p.id) === String(emp.employee_position_id),
                        )?.name || "-"}
                      </Td>
                      <Td>{emp.done_by_name}</Td>
                      <Td>{emp.cost_center_name}</Td>
                      <TdNumeric>{emp.salary}</TdNumeric>
                      <TdMenu
                        onEdit={() =>
                          setModal({ isOpen: true, mode: "edit", item: emp })
                        }
                        onView={() =>
                          setModal({ isOpen: true, mode: "view", item: emp })
                        }
                        onDelete={() =>
                          deleteEmployee(emp.id).then(refetch)
                        }
                      />
                    </Tr>
                  ))
                ) : (
                  <TableCaption item={employeeItemConstant} noOfCol={10} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        /* Mobile View - Layout & Buttons Restored */
        <ScrollContainer>
          <PageTitleWithBackButton title="Employees" />
          <PageHeader>
            <HStack>
              <PopUpFilter
                isOpen={showFilter}
                setIsOpen={setShowFilter}
                onApply={() => setState({ ...uiState, page: 1 })}
              >
                <VStack>
                  <InputField
                    label="Name"
                    value={uiState.name}
                    onChange={(e) =>
                      setUiState({ ...uiState, name: e.target.value })
                    }
                  />
                  <DoneByAutoComplete
                    value={uiState.done_by_id}
                    onChange={(e) =>
                      setUiState({ ...uiState, done_by_id: e.target.value })
                    }
                    is_edit={false}
                  />
                </VStack>
              </PopUpFilter>
              <RefreshButton onClick={handleRefresh} />
              <MobileSearchField
                searchRef={searchRef}
                searchKey={uiState.searchKey}
                setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                handleSearch={() =>
                  setState({ searchKey: uiState.searchKey, page: 1 })
                }
                searchOptions={searchOptions}
              />
              <PayrollButton onClick={() => setViewMode("bulk_payroll")}>
                Bulk Payroll
              </PayrollButton>
            </HStack>
            <div className="employee_list__add_button">
              <AddButton
                onClick={() => setModal({ isOpen: true, mode: "add" })}
                ref={addButtonRef}
              >
                Add Employee
              </AddButton>
            </div>
          </PageHeader>
          {isLoading ? (
            <Loader />
          ) : listData.length === 0 ? (
            <TableCaption item={employeeItemConstant} />
          ) : (
            <div>
              {listData.map((emp) => (
                <ListItem
                  key={emp.id}
                  title={emp.name}
                  subtitle={
                    <>
                      <div>
                        {positions?.find(
                          (p) =>
                            String(p.id) === String(emp.employee_position_id),
                        )?.name || "-"}
                      </div>
                      <div>CC: {emp.cost_center_name || "-"}</div>
                      <div>{formatDate(emp.hire_date)}</div>
                    </>
                  }
                  amount={Number(emp.salary).toFixed(2)}
                  onEdit={() =>
                    setModal({ isOpen: true, mode: "edit", item: emp })
                  }
                  onView={() =>
                    setModal({ isOpen: true, mode: "view", item: emp })
                  }
                  onDelete={() =>
                    deleteEmployee(emp.id).then(refetch)
                  }
                />
              ))}
            </div>
          )}
          <Spacer />
        </ScrollContainer>
      )}

      {/* Global Pagination Fix for Mobile/Desktop */}
      {!isLoading && listData.length > 0 && (
        <TableFooter
          totalItems={totalItems}
          currentPage={state.page}
          itemsPerPage={state.page_size}
          totalPages={totalPages}
          handlePageChange={handlePageChange}
          handlePageLimitSelect={handlePageLimitSelect}
        />
      )}

      <AddModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedEmployee={modal.item}
        onSuccess={refetch}
      />
    </ContainerWrapper>
  );
};

// --- BULK PAYROLL VIEW (RESTORED EXACT DESIGN & CARD) ---
const BulkPayrollView = ({
  onBack,
  positions,
  useBulkPayrollHook,
  useEmployeesHook,
}) => {
  const { data, isLoading } = useEmployeesHook({ page: 1, page_size: 9999 });
  const { mutateAsync: createBulkPayroll, isPending } = useBulkPayrollHook();
  const showToast = useToast();
  const selectAllCheckboxRef = useRef();

  const [employees, setEmployees] = useState([]);
  const [entryData, setEntryData] = useState({});
  const [globalDate, setGlobalDate] = useState(getTodayISO());
  const [globalAccountId, setGlobalAccountId] = useState("");
  const [globalDoneById, setGlobalDoneById] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [globalCostCenterId, setGlobalCostCenterId] = useState(
    localStorage.getItem("DEFAULT_COST_CENTER") ?? "",
  );

  const isAllSelected =
    employees.length > 0 && selectedEmployees.length === employees.length;
  const isSomeSelected =
    selectedEmployees.length > 0 && selectedEmployees.length < employees.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current)
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
  }, [isSomeSelected]);

  useEffect(() => {
    if (data?.data) {
      setEmployees(data.data);
      setEntryData(
        data.data.reduce(
          (acc, emp) => ({ ...acc, [emp.id]: { salary: emp.salary || "" } }),
          {},
        ),
      );
    }
  }, [data]);

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedEmployees([]);
    else setSelectedEmployees(employees.map((emp) => emp.id));
  };

  const handleSubmit = async () => {
    if (!globalAccountId)
      return showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select an account.",
        status: TOASTSTATUS.ERROR,
      });
    const payload = selectedEmployees
      .map((id) => {
        const sal = entryData[id]?.salary;
        if (sal && String(sal).trim() !== "") {
          return {
            employee_id: Number(id),
            account_id: Number(globalAccountId),
            salary: Number(sal),
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

    if (payload.length === 0)
      return showToast({
        type: TOASTTYPE.GENARAL,
        message: "No salary data.",
        status: TOASTSTATUS.WARNING,
      });

    try {
      await createBulkPayroll(payload);
      showToast({
        type: TOASTTYPE.GENARAL,
        message: `Payroll submitted for ${payload.length} employees!`,
        status: TOASTSTATUS.SUCCESS,
      });
      onBack();
    } catch (e) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed.",
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
                value={globalCostCenterId}
                onChange={(e) => setGlobalCostCenterId(e.target.value)}
                placeholder="Cost Center"
              />
            </div>
            <div style={{ minWidth: "180px" }}>
              <DoneByAutoCompleteWithAddOption
                value={globalDoneById}
                onChange={(e) => setGlobalDoneById(e.target.value)}
                placeholder="Done By"
              />
            </div>
            <DateField
              label="Pay Date"
              value={globalDate ? new Date(globalDate) : null}
              onChange={(d) => setGlobalDate(d?.toISOString().split("T")[0])}
            />
          </div>
          <SubmitButton
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={selectedEmployees.length === 0}
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
                    position:
                      positions?.find(
                        (p) =>
                          String(p.id) === String(emp.employee_position_id),
                      )?.name || "Employee",
                  }}
                  payroll={entryData[emp.id]}
                  onSalaryChange={(v) =>
                    setEntryData((prev) => ({
                      ...prev,
                      [emp.id]: { salary: v },
                    }))
                  }
                  isSelected={selectedEmployees.includes(emp.id)}
                  onToggleSelection={() =>
                    setSelectedEmployees((prev) =>
                      prev.includes(emp.id)
                        ? prev.filter((i) => i !== emp.id)
                        : [...prev, emp.id],
                    )
                  }
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
}) => (
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
        label="Salary to Pay"
        className="fs16 fw500"
        type="number"
        value={payroll?.salary || ""}
        onChange={(e) => onSalaryChange(e.target.value)}
        placeholder="Enter salary"
      />
    </div>
  </div>
);

export default CommonEmployeeList;
