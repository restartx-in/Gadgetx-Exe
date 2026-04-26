import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/utils/useIsMobile";
import { useQueryClient } from "@tanstack/react-query";
import usePayrollPaginated from "@/hooks/api/payroll/usePayrollPaginated";
import useDeletePayroll from "@/hooks/api/payroll/useDeletePayroll";
import { useCostCenters } from "@/hooks/api/costCenter/useCostCenters";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import PageHeader from "@/components/PageHeader";
import TableTopContainer from "@/components/TableTopContainer";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TdDate,
  TdNumeric,
  TableCaption,
  ThSL,
  TdSL,
  ThSort,
  ThMenu,
  TdMenu,
  ThContainer,
  ThFilterContainer,
  ThSearchOrFilterPopover,
} from "@/components/Table";
import TableFooter from "@/components/TableFooter";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import RefreshButton from "@/components/RefreshButton";
import AddButton from "@/components/AddButton";
import PopUpFilter from "@/components/PopUpFilter";
import DateField from "@/components/DateField";
import RangeField from "@/components/RangeField";
import InputField from "@/components/InputField";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import AddPayroll from "./AddPayroll";
import ScrollContainer from "@/components/ScrollContainer";
import useSyncURLParams from "@/hooks/useSyncURLParams";

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

const PayrollRow = React.memo(
  ({ record, index, page, pageSize, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{record.pay_date}</TdDate>
      <Td>{record.employee_name}</Td>
      <Td>{record.account_name || "-"}</Td>
      <TdNumeric>{record.salary}</TdNumeric>
      <Td>{record.cost_center_name || "-"}</Td>
      <Td>{record.done_by_name || "-"}</Td>
      <TdDate>{record.created_at}</TdDate>
      <TdMenu
        onEdit={() => onEdit(record)}
        onView={() => onView(record)}
        onDelete={() => onDelete(record.id)}
      />
    </Tr>
  )
);

const PayrollList = () => {
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
    min_salary: searchParams.get("minSalary") || "",
    max_salary: searchParams.get("maxSalary") || "",
    salary: searchParams.get("salary") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    employee_name: searchParams.get("employeeName") || "",
    account_id: searchParams.get("accountId") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    minSalary: state.min_salary,
    maxSalary: state.max_salary,
    salary: state.salary,
    startDate: state.start_date,
    endDate: state.end_date,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    employeeName: state.employee_name,
    accountId: state.account_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  const [showFilter, setShowFilter] = useState(false);
  const [minSalary, setMinSalary] = useState(state.min_salary);
  const [maxSalary, setMaxSalary] = useState(state.max_salary);
  const [startDate, setStartDate] = useState(state.start_date);
  const [endDate, setEndDate] = useState(state.end_date);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [headerFilters, setHeaderFilters] = useState({});
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  useEffect(() => {
    setMinSalary(state.min_salary || "");
    setMaxSalary(state.max_salary || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");
    setHeaderFilters({
      employee_name: state.employee_name || "",
      salary: state.salary || "",
    });
  }, [state, defaltCostCenter]);

  const { data: payrollData, isLoading } = usePayrollPaginated(state);
  const { data: costCentersData } = useCostCenters();
  const { mutateAsync: deletePayroll } = useDeletePayroll();

  const listData = useMemo(() => payrollData?.data || [], [payrollData]);
  const totalPages = payrollData?.page_count || 1;
  const totalItems = payrollData?.count || 0;

  const costCenterOptions = useMemo(
    () => [
      { value: "", name: "All Cost Centers" },
      ...(costCentersData || []).map((cc) => ({ value: cc.id, name: cc.name })),
    ],
    [costCentersData]
  );

  useEffect(() => {
    addButtonRef.current?.focus();
  }, []);

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ sort: value, page: 1 });
  }, []);

  const handleSearch = useCallback(
    () => setState({ searchType, searchKey, page: 1 }),
    [searchType, searchKey]
  );

  const applyHeaderSearchWithValue = useCallback(
    (key, value) => setState({ page: 1, [key]: value }),
    []
  );
  const handleHeaderDropdownChange = useCallback(
    (key, value) => setState({ page: 1, [key]: value }),
    []
  );

  const handleFilter = useCallback(() => {
    setState({
      min_salary: minSalary,
      max_salary: maxSalary,
      start_date: startDate,
      end_date: endDate,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      page: 1,
    });
    setShowFilter(false);
  }, [minSalary, maxSalary, startDate, endDate, doneById, costCenterId]);

  const handleRefresh = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setMinSalary("");
    setMaxSalary("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setHeaderFilters({ employee_name: "", salary: "" });

    setState({
      page: 1,
      page_size: 10,
      min_salary: "",
      max_salary: "",
      salary: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaltCostCenter,
      employee_name: "",
      account_id: "",
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

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (record) => dispatchModal({ type: "OPEN", mode: "edit", payload: record }),
    []
  );
  const handleViewClick = useCallback(
    (record) => dispatchModal({ type: "OPEN", mode: "view", payload: record }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deletePayroll(id);
        showToast({
          crudItem: CRUDITEM.PAYROLL,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: error.response?.data?.error || "Failed to delete payroll.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deletePayroll, showToast]
  );

  const formatCurrency = (amount) => {
    const number = Number(amount);
    if (isNaN(number)) return "$ 0.00";
    return `$ ${number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    minSalary,
    setMinSalary,
    maxSalary,
    setMaxSalary,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    costCenterOptions,
    disableCostCenter: isDisableCostCenter,
  };

  const searchOptions = [
    { value: "employee_name", name: "Employee" },
    { value: "account_name", name: "Account" },
    { value: "salary", name: "Salary" },
    { value: "done_by_name", name: "Done By" },
    ...(!isDisableCostCenter
      ? [{ value: "cost_center_name", name: "Cost Center" }]
      : []),
  ];

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Payroll" />
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
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add Payroll
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
                        Pay Date
                        <ThSort
                          {...{ sort, setSort, value: "pay_date", handleSort }}
                        />
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Employee
                        <ThFilterContainer>
                          <ThSort
                            {...{
                              sort,
                              setSort,
                              value: "employee_name",
                              handleSort,
                            }}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              placeholder="Enter Name"
                              value={headerFilters.employee_name}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  employee_name: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                applyHeaderSearchWithValue(
                                  "employee_name",
                                  headerFilters.employee_name
                                )
                              }
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>
                        Account
                        <ThFilterContainer>
                          <ThSort
                            {...{ sort, setSort, value: "account", handleSort }}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                            <AccountAutoComplete
                              placeholder="Select Account"
                              value={state.account_id}
                              onChange={(e) =>
                                handleHeaderDropdownChange(
                                  "account_id",
                                  e.target.value
                                )
                              }
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
                            {...{ sort, setSort, value: "salary", handleSort }}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              placeholder="Enter Salary"
                              type="number"
                              value={headerFilters.salary}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  salary: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                applyHeaderSearchWithValue(
                                  "salary",
                                  headerFilters.salary
                                )
                              }
                              isLabel={false}
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
                              disabled={isDisableCostCenter}
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
                        Created
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
                    listData.map((record, index) => (
                      <PayrollRow
                        key={record.id}
                        record={record}
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item="Payroll Record" noOfCol={9} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Payroll" />
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
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add Payroll
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <div>No Payroll Records Found</div>
              ) : (
                <div>
                  {listData.map((record) => (
                    <ListItem
                      key={record.id}
                      title={record.employee_name}
                      subtitle={
                        <>
                          <div>Account: {record.account_name || "-"}</div>
                          <div>Done By: {record.done_by_name || "-"}</div>
                          <div>
                            Cost Center: {record.cost_center_name || "-"}
                          </div>
                          <div>
                            Pay Date:{" "}
                            {record.pay_date
                              ? new Date(record.pay_date).toLocaleDateString(
                                  "en-GB"
                                )
                              : "-"}
                          </div>
                        </>
                      }
                      amount={formatCurrency(record.salary)}
                      onView={() => handleViewClick(record)}
                      onEdit={() => handleEditClick(record)}
                      onDelete={() => handleDelete(record.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}

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
      </ContainerWrapper>

      <AddPayroll
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedPayroll={modalState.selected}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["payrolls"] });
        }}
      />
    </>
  );
};

export default PayrollList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    minSalary,
    setMinSalary,
    maxSalary,
    setMaxSalary,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    costCenterOptions,
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
          <DoneByAutoComplete
            label="Done By"
            value={doneById}
            onChange={(e) => setDoneById(e.target.value)}
            is_edit={false}
          />
          <CostCenterAutoComplete
            label="Cost Center"
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            options={costCenterOptions}
            disabled={disableCostCenter}
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
            <HStack>
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
