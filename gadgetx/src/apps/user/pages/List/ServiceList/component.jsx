import React, {
  useState,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import { format, isValid } from "date-fns";

// UI Components
import ContainerWrapper from "@/components/ContainerWrapper";
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
  ThContainer,
  ThFilterContainer,
  ThSort,
  ThSearchOrFilterPopover,
  TableCaption,
} from "@/components/Table";
import TableFooter from "@/components/TableFooter";
import AddButton from "@/components/AddButton";
import Loader from "@/components/Loader";
import RefreshButton from "@/components/RefreshButton";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import PopupSearchField from "@/components/PopupSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import DateFilter from "@/components/DateFilter";
import VStack from "@/components/VStack";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import Spacer from "@/components/Spacer";
import HStack from "@/components/HStack";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import MobileSearchField from "@/components/MobileSearchField";
import PageHeader from "@/components/PageHeader";

// Hooks & Logic
import AddService from "@/apps/user/pages/List/ServiceList/components/AddService";
import { useServicesPaginated } from "@/apps/user/hooks/api/services/useServicesPaginated";
import { useDeleteService } from "@/apps/user/hooks/api/services/useDeleteService";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import { useToast } from "@/context/ToastContext";
import { useIsMobile } from "@/utils/useIsMobile";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { Transaction } from "@/constants/object/transaction";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const ServiceList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();

  const searchRef = useRef(null);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    searchKey: searchParams.get("searchKey") || "",
    searchType: searchParams.get("searchType") || "description",
    status: searchParams.get("status") || "",
    customer_name: searchParams.get("customer_name") || "",
    sort: searchParams.get("sort") || "-created_at",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);
  const [showFilter, setShowFilter] = useState(false);

  useSyncURLParams({ ...state });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);

  const { data, isLoading } = useServicesPaginated(state);
  const { mutateAsync: deleteService } = useDeleteService();

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

  const handleRefresh = () =>
    setState({
      page: 1,
      searchKey: "",
      status: "",
      customer_name: "",
      sort: "-created_at",
    });
  const handleSort = (val) => {
    setSort(val);
    setState({ sort: val, page: 1 });
  };

  const onHeaderSearch = (key) => setState({ [key]: uiState[key], page: 1 });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await deleteService(id);
      showToast({
        crudItem: CRUDITEM.SERVICE || "Service",
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (e) {
      showToast({ type: "error", message: "Delete failed" });
    }
  };

  const footerProps = {
    totalItems: data?.count || 0,
    currentPage: state.page,
    itemsPerPage: state.page_size,
    totalPages: data?.page_count || 1,
    handlePageLimitSelect: (v) => setState({ page_size: v, page: 1 }),
    handlePageChange: (v) => setState({ page: v }),
  };

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Service Records" />

          <TableTopContainer
            mainActions={
              <>
                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={() => setState({ ...uiState, page: 1 })}
                >
                  <VStack>
                    <SelectField
                      label="Status"
                      value={uiState.status}
                      onChange={(e) =>
                        setUiState({ ...uiState, status: e.target.value })
                      }
                      options={[
                        { value: "", label: "All" },
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Completed" },
                      ]}
                    />
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
                    { value: "description", name: "Description" },
                    { value: "customer_name", name: "Customer" },
                  ]}
                />
                <AddButton
                  onClick={() =>
                    setModal({ isOpen: true, mode: "add", item: null })
                  }
                >
                  Add Service
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
                        Customer
                        <ThFilterContainer>
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="customer_name"
                            handleSort={handleSort}
                          />
                          <ThSearchOrFilterPopover
                            isSearch
                            onSearch={() => onHeaderSearch("customer_name")}
                          >
                            <InputField
                              value={uiState.customer_name}
                              onChange={(e) =>
                                setUiState({
                                  ...uiState,
                                  customer_name: e.target.value,
                                })
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                onHeaderSearch("customer_name")
                              }
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Item</Th>
                    <Th>Issue/Service</Th>
                    <Th>
                      <ThContainer>
                        Job Status
                        <ThFilterContainer>
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="status"
                            handleSort={handleSort}
                          />
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>Charge</Th>
                    <Th>Payment</Th>
                    <Th>Profit</Th>
                    <Th>Complete Date</Th>
                    <Th>Created At</Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.data?.length > 0 ? (
                    data.data.map((item, index) => (
                      <Tr key={item.id}>
                        <TdSL
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                        />
                        {/* DYNAMIC CUSTOMER NAME */}
                        <Td>{item.customer_name || "N/A"}</Td>
                        <Td>{item.item_name || "N/A"}</Td>
                        <Td>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            <strong>Issue:</strong>{" "}
                            {item.issue_report || item.description}
                          </div>
                          {item.service && (
                            <div style={{ fontSize: "12px", color: "#2d3748" }}>
                              <strong>Done:</strong> {item.service}
                            </div>
                          )}
                        </Td>
                        <Td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor:
                                item.status === "completed"
                                  ? "#dcfce7"
                                  : "#fef9c3",
                              color:
                                item.status === "completed"
                                  ? "#166534"
                                  : "#854d0e",
                            }}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </Td>
                        <Td>
                          <div style={{ fontWeight: 600 }}>
                            <AmountSymbol>
                              {item.service_charge || 0}
                            </AmountSymbol>
                          </div>
                        </Td>
                        <Td>
                          <span
                            style={{
                              fontSize: "11px",
                              color:
                                item.service_charge_status === "paid"
                                  ? "#059669"
                                  : "#dc2626",
                              fontWeight: 500,
                            }}
                          >
                            {(
                              item.service_charge_status || "unpaid"
                            ).toUpperCase()}
                          </span>
                        </Td>
                        <Td>
                          <div
                            style={{
                              fontWeight: 700,
                              color:
                                item.service_charge - item.cost >= 0
                                  ? "#059669"
                                  : "#dc2626",
                            }}
                          >
                            <AmountSymbol>
                              {(item.service_charge || 0) - (item.cost || 0)}
                            </AmountSymbol>
                          </div>
                        </Td>
                        <TdDate>{item.complete_date}</TdDate>
                        <TdDate>{item.created_at}</TdDate>
                        <TdMenu
                          onEdit={() =>
                            setModal({ isOpen: true, mode: "edit", item })
                          }
                          onView={() =>
                            setModal({ isOpen: true, mode: "view", item })
                          }
                          onDelete={() => handleDelete(item.id)}
                        />
                      </Tr>
                    ))
                  ) : (
                    <TableCaption item={Transaction.Service} noOfCol={11} />
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
          <PageTitleWithBackButton title="Service Records" />
          <ScrollContainer>
            <PageHeader>
              <HStack>
                <PopUpFilter
                  isOpen={showFilter}
                  setIsOpen={setShowFilter}
                  onApply={() => setState({ ...uiState, page: 1 })}
                >
                  <VStack>
                    <SelectField
                      label="Status"
                      value={uiState.status}
                      onChange={(e) =>
                        setUiState({ ...uiState, status: e.target.value })
                      }
                      options={[
                        { value: "", label: "All" },
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Completed" },
                      ]}
                    />
                  </VStack>
                </PopUpFilter>
                <RefreshButton onClick={handleRefresh} />
                <MobileSearchField
                  searchKey={uiState.searchKey}
                  setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                  handleSearch={() => setState({ ...uiState, page: 1 })}
                  searchOptions={[
                    { value: "description", name: "Description" },
                    { value: "customer_name", name: "Customer" },
                  ]}
                />
              </HStack>
              <AddButton
                style={{ marginLeft: "auto" }}
                onClick={() =>
                  setModal({ isOpen: true, mode: "add", item: null })
                }
              >
                Add
              </AddButton>
            </PageHeader>
            {isLoading ? (
              <Loader />
            ) : (
              data?.data?.map((item) => (
                <ListItem
                  key={item.id}
                  title={item.customer_name || "N/A"}
                  subtitle={
                    <div>
                      <div>{item.item_name} </div>
                      <div>{item.status.toUpperCase()} </div>
                      <div>
                        Charge:{" "}
                        <AmountSymbol>{item.service_charge || 0}</AmountSymbol>
                      </div>
                    </div>
                  }
                  onEdit={() => setModal({ isOpen: true, mode: "edit", item })}
                  onView={() => setModal({ isOpen: true, mode: "view", item })}
                  onDelete={() => handleDelete(item.id)}
                />
              ))
            )}
            <Spacer />
          </ScrollContainer>
          <TableFooter {...footerProps} />
        </>
      )}

      <AddService
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedService={modal.item}
      />
    </ContainerWrapper>
  );
};

export default ServiceList;
