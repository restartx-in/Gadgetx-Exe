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
import RangeField from "@/components/RangeField";
import DateField from "@/components/DateField";
import ListItem from "@/components/ListItem/component";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";
import Select from "@/components/Select";
import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const formatCurrency = (amount) => {
  const number = Number(amount);
  return isNaN(number)
    ? "$ 0.00"
    : `$ ${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CommonPayrollList = ({
  usePayrollHook,
  useDeleteHook,
  useCostCentersHook,
  AddModal,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  AccountAutoComplete,
  TableTopContainer,
  payrollConstant,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const showToast = useToast();
  const searchRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // 1. Initial State from URL
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    min_salary: searchParams.get("minSalary") || "",
    max_salary: searchParams.get("maxSalary") || "",
    salary: searchParams.get("salary") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    done_by_id: searchParams.get("doneById") || "",
    cost_center_id: searchParams.get("costCenterId") || defaultCostCenter,
    employee_name: searchParams.get("employeeName") || "",
    account_id: searchParams.get("accountId") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

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

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);


  const { data, isLoading, refetch } = usePayrollHook(state);
    const { mutateAsync: deletePayroll } = useDeleteHook();
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
      setModal({ isOpen: true, mode: "add" });
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams, modal.isOpen]);

  const handleRefresh = () => {
    setState({
      page: 1,
      page_size: 10,
      min_salary: "",
      max_salary: "",
      salary: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      employee_name: "",
      account_id: "",
      sort: "",
      searchType: "",
      searchKey: "",
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
  const onHeaderSearch = (key) => setState({ [key]: uiState[key], page: 1 });

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Payroll" />
          <TableTopContainer
            mainActions={
              <>
                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={() => setState({ ...uiState, page: 1 })}
                >
                  <VStack>
                    <DoneByAutoComplete
                      label="Done By"
                      value={uiState.done_by_id}
                      onChange={(e) =>
                        setUiState({ ...uiState, done_by_id: e.target.value })
                      }
                      is_edit={false}
                    />
                    <CostCenterAutoComplete
                      label="Cost Center"
                      value={uiState.cost_center_id}
                      disabled={isDisableCostCenter}
                      onChange={(e) =>
                        setUiState({
                          ...uiState,
                          cost_center_id: e.target.value,
                        })
                      }
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
                    <HStack>
                      <DateField
                        label="Start Date"
                        value={
                          uiState.start_date
                            ? new Date(uiState.start_date)
                            : null
                        }
                        onChange={(d) =>
                          setUiState({
                            ...uiState,
                            start_date: d?.toISOString().split("T")[0],
                          })
                        }
                      />
                      <DateField
                        label="End Date"
                        value={
                          uiState.end_date ? new Date(uiState.end_date) : null
                        }
                        onChange={(d) =>
                          setUiState({
                            ...uiState,
                            end_date: d?.toISOString().split("T")[0],
                          })
                        }
                      />
                    </HStack>
                  </VStack>
                </PopUpFilter>
                <RefreshButton onClick={handleRefresh} />
                <PopupSearchField
                  searchRef={searchRef}
                  searchKey={uiState.searchKey}
                  setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                  searchType={uiState.searchType}
                  setSearchType={(v) =>
                    setUiState({ ...uiState, searchType: v })
                  }
                  handleSearch={() => setState({ ...uiState, page: 1 })}
                  searchOptions={[
                    { value: "employee_name", name: "Employee" },
                    { value: "account_name", name: "Account" },
                    { value: "salary", name: "Salary" },
                  ]}
                />
                <AddButton
                  onClick={() => setModal({ isOpen: true, mode: "add" })}
                >
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
                        sort={sort}
                        setSort={setSort}
                        value="pay_date"
                        handleSort={(v) => setState({ sort: v, page: 1 })}
                      />
                    </ThContainer>
                  </Th>

                  {/* Employee Filter */}
                  <Th>
                    <ThContainer>
                      Employee
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="employee_name"
                          handleSort={(v) => setState({ sort: v, page: 1 })}
                        />
                        <ThSearchOrFilterPopover isSearch>
                          <InputField
                            placeholder="Search Employee"
                            value={uiState.employee_name}
                            onChange={(e) =>
                              setUiState({
                                ...uiState,
                                employee_name: e.target.value,
                              })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              onHeaderSearch("employee_name")
                            }
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>

                  {/* Account Filter */}
                  <Th>
                    <ThContainer>
                      Account
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="account"
                          handleSort={(v) => setState({ sort: v, page: 1 })}
                        />
                        <ThSearchOrFilterPopover isSearch={false}>
                          <AccountAutoComplete
                            value={state.account_id}
                            onChange={(e) =>
                              setState({ account_id: e.target.value, page: 1 })
                            }
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>

                  {/* Salary Filter */}
                  <Th>
                    <ThContainer>
                      Salary
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="salary"
                          handleSort={(v) => setState({ sort: v, page: 1 })}
                        />
                        <ThSearchOrFilterPopover isSearch>
                          <InputField
                            type="number"
                            placeholder="Search Salary"
                            value={uiState.salary}
                            onChange={(e) =>
                              setUiState({ ...uiState, salary: e.target.value })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && onHeaderSearch("salary")
                            }
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>

                  {/* RESTORED: Cost Center Filter */}
                  <Th>
                    <ThContainer>
                      Cost Center
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="cost_center"
                          handleSort={(v) => setState({ sort: v, page: 1 })}
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
                            is_edit={false}
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>

                  {/* RESTORED: Done By Filter */}
                  <Th>
                    <ThContainer>
                      Done By
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="done_by"
                          handleSort={(v) => setState({ sort: v, page: 1 })}
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

                  {/* RESTORED: Created Sort */}
                  <Th>
                    <ThContainer>
                      Created
                      <ThSort
                        sort={sort}
                        setSort={setSort}
                        value="created_at"
                        handleSort={(v) => setState({ sort: v, page: 1 })}
                      />
                    </ThContainer>
                  </Th>

                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((rec, index) => (
                    <Tr key={rec.id}>
                      <TdSL
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                      />
                      <TdDate>{rec.pay_date}</TdDate>
                      <Td>{rec.employee_name}</Td>
                      <Td>{rec.account_name || "-"}</Td>
                      <TdNumeric>{rec.salary}</TdNumeric>
                      <Td>{rec.cost_center_name || "-"}</Td>
                      <Td>{rec.done_by_name || "-"}</Td>
                      <TdDate>{rec.created_at}</TdDate>
                      <TdMenu
                        onEdit={() =>
                          setModal({ isOpen: true, mode: "edit", item: rec })
                        }
                        onView={() =>
                          setModal({ isOpen: true, mode: "view", item: rec })
                        }
                        onDelete={() =>
                          deletePayroll(rec.id).then(refetch)
                        }
                      />
                    </Tr>
                  ))
                ) : (
                  <TableCaption item={payrollConstant} noOfCol={9} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        /* Mobile View Restored */
        <>
          <PageTitleWithBackButton title="Payroll" />
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={() => setState({ ...uiState, page: 1 })}
                >
                  <VStack>
                    <InputField
                      label="Employee Name"
                      value={uiState.employee_name}
                      onChange={(e) =>
                        setUiState({
                          ...uiState,
                          employee_name: e.target.value,
                        })
                      }
                    />
                    <DoneByAutoComplete
                      label="Done By"
                      value={uiState.done_by_id}
                      onChange={(e) =>
                        setUiState({ ...uiState, done_by_id: e.target.value })
                      }
                      is_edit={false}
                    />
                    <CostCenterAutoComplete
                      label="Cost Center"
                      value={uiState.cost_center_id}
                      disabled={isDisableCostCenter}
                      onChange={(e) =>
                        setUiState({
                          ...uiState,
                          cost_center_id: e.target.value,
                        })
                      }
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
                    <DateField
                      label="Start Date"
                      value={
                        uiState.start_date ? new Date(uiState.start_date) : null
                      }
                      onChange={(d) =>
                        setUiState({
                          ...uiState,
                          start_date: d?.toISOString().split("T")[0],
                        })
                      }
                    />
                    <DateField
                      label="End Date"
                      value={
                        uiState.end_date ? new Date(uiState.end_date) : null
                      }
                      onChange={(d) =>
                        setUiState({
                          ...uiState,
                          end_date: d?.toISOString().split("T")[0],
                        })
                      }
                    />
                  </VStack>
                </PopUpFilter>
                <RefreshButton onClick={handleRefresh} />
                <MobileSearchField
                  searchKey={uiState.searchKey}
                  setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                  handleSearch={() =>
                    setState({ searchKey: uiState.searchKey, page: 1 })
                  }
                  searchOptions={[{ value: "employee_name", name: "Employee" }]}
                />
              </HStack>
              <div style={{ marginLeft: "auto" }}>
                <AddButton
                  onClick={() => setModal({ isOpen: true, mode: "add" })}
                >
                  Add Payroll
                </AddButton>
              </div>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : listData.length === 0 ? (
              <TableCaption item={payrollConstant} />
            ) : (
              <div>
                {listData.map((rec) => (
                  <ListItem
                    key={rec.id}
                    title={rec.employee_name}
                    subtitle={
                      <>
                        <div>Acc: {rec.account_name || "-"}</div>
                        <div>Date: {rec.pay_date}</div>
                      </>
                    }
                    amount={formatCurrency(rec.salary)}
                    onEdit={() =>
                      setModal({ isOpen: true, mode: "edit", item: rec })
                    }
                    onView={() =>
                      setModal({ isOpen: true, mode: "view", item: rec })
                    }
                    onDelete={() =>
                      deletePayroll(rec.id).then(refetch)
                    }
                  />
                ))}
              </div>
            )}
            <Spacer />
          </ScrollContainer>
        </>
      )}

      {/* Pagination Fix for Mobile (Outside scroll container) */}
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
        selectedPayroll={modal.item}
        onSuccess={refetch}
      />
    </ContainerWrapper>
  );
};

export default CommonPayrollList;
