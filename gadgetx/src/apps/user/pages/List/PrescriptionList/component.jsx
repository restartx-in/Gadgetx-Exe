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
import TableFooter from "@/components/TableFooter";
import DateFilter from "@/components/DateFilter";
import useSyncURLParams from "@/hooks/useSyncURLParams";

import usePrescriptionsPaginated from "@/apps/user/hooks/api/prescription/usePrescriptionsPaginated";
import useDeletePrescription from "@/apps/user/hooks/api/prescription/useDeletePrescription";
import AddPrescription from "./components/AddPrescription";
import TableTopContainer from "@/apps/user/components/TableTopContainer";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const PrescriptionList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    customer_name: searchParams.get("customer_name") || "",
    doctor_name: searchParams.get("doctor_name") || "",
    prescription_date: searchParams.get("prescription_date") || "",
    start_date: searchParams.get("startDate") || "",
    end_date: searchParams.get("endDate") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [showFilter, setShowFilter] = useState(false);
  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  useSyncURLParams({
    ...state,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort || "");
  }, [state]);

  const { data, isLoading } = usePrescriptionsPaginated(state);
  const { mutateAsync: deletePrescription } = useDeletePrescription();
  const listData = useMemo(() => data?.data || [], [data]);

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

  const handleRefresh = useCallback(() => {
    setState({
      page: 1,
      customer_name: "",
      doctor_name: "",
      prescription_date: "",
      start_date: "",
      end_date: "",
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, []);

  const handleHeaderSearch = (key, val) => setState({ [key]: val, page: 1 });
  const handleSort = (val) => {
    setSort(val);
    setState({ sort: val, page: 1 });
  };

  const searchOptions = [
    { value: "customer_name", name: "Customer Name" },
    { value: "doctor_name", name: "Doctor Name" },
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
        label="Customer Name"
        value={uiState.customer_name}
        onChange={(e) =>
          setUiState({ ...uiState, customer_name: e.target.value })
        }
      />
      <InputField
        label="Doctor Name"
        value={uiState.doctor_name}
        onChange={(e) =>
          setUiState({ ...uiState, doctor_name: e.target.value })
        }
      />
      <InputField
        label="Prescription Date"
        type="date"
        value={uiState.prescription_date}
        onChange={(e) =>
          setUiState({ ...uiState, prescription_date: e.target.value })
        }
      />
    </VStack>
  );

  const footerProps = {
    totalItems: data?.totalCount || 0,
    currentPage: state.page,
    itemsPerPage: state.page_size,
    totalPages: Math.ceil((data?.totalCount || 0) / state.page_size),
    handlePageLimitSelect: (v) => setState({ page_size: v, page: 1 }),
    handlePageChange: (v) => setState({ page: v }),
  };

  const formatEyeSummary = (item, prefix) => {
    const sph = item[`${prefix}_sph`];
    const cyl = item[`${prefix}_cyl`];
    const axis = item[`${prefix}_axis`];
    if (!sph && !cyl && !axis) return "-";
    return `S:${sph || 0} C:${cyl || 0} A:${axis || 0}`;
  };

  const handleDelete = async (id) => {
    try {
      await deletePrescription(id);
      showToast({
        crudItem: CRUDITEM.PRESCRIPTION,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.ERROR,
        message: "Failed to delete.",
      });
    }
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Prescriptions"
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
                    Add Prescription
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
                              onSearch={() =>
                                handleHeaderSearch(
                                  "customer_name",
                                  uiState.customer_name,
                                )
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.customer_name}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    customer_name: e.target.value,
                                  })
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Doctor
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="doctor_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              onSearch={() =>
                                handleHeaderSearch(
                                  "doctor_name",
                                  uiState.doctor_name,
                                )
                              }
                            >
                              <InputField
                                isLabel={false}
                                value={uiState.doctor_name}
                                onChange={(e) =>
                                  setUiState({
                                    ...uiState,
                                    doctor_name: e.target.value,
                                  })
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Prescription Date
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="prescription_date"
                              handleSort={handleSort}
                            />
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>Right Eye (OD)</Th>
                      <Th>Left Eye (OS)</Th>
                      <Th>
                        <ThContainer>
                          Created At
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
                          <Td>{item.customer_name || "-"}</Td>
                          <Td>{item.doctor_name || "-"}</Td>
                          <TdDate>{item.prescription_date}</TdDate>
                          <Td>{formatEyeSummary(item, "right")}</Td>
                          <Td>{formatEyeSummary(item, "left")}</Td>
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
                      <TableCaption item="Prescription" noOfCol={8} />
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
            <PageTitleWithBackButton title="Prescriptions" />
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
                  Add
                </AddButton>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : (
                listData.map((item) => (
                  <ListItem
                    key={item.id}
                    title={item.customer_name}
                    subtitle={
                      <div>
                        Dr. {item.doctor_name || "N/A"} | OD:{" "}
                        {formatEyeSummary(item, "right")}
                      </div>
                    }
                    onEdit={() =>
                      setModal({ isOpen: true, mode: "edit", item })
                    }
                    onView={() =>
                      setModal({ isOpen: true, mode: "view", item })
                    }
                    onDelete={() => handleDelete(item.id)}
                  />
                ))
              )}
              <Spacer />
            </ScrollContainer>
            <TableFooter {...footerProps} />
          </>
        )}
      </ContainerWrapper>
      <AddPrescription
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedItem={modal.item}
      />
    </>
  );
};

export default PrescriptionList;
