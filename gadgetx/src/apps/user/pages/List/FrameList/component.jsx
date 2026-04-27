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
import RangeField from "@/components/RangeField";
import ListItem from "@/components/ListItem/component";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";


import {useFramesPaginated} from "@/apps/user/hooks/api/frame/useFramesPaginated";
import useDeleteFrame from "@/apps/user/hooks/api/frame/useDeleteFrame";
import BrandAutoCompleteWithAddOption from "@/apps/user/components/BrandAutoCompleteWithAddOption";
import CategoryAutoCompleteWithAddOption from "@/apps/user/components/CategoryAutoCompleteWithAddOption";
import AddFrame from "./components/AddFrame";

import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const FrameList = () => {
   const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const addButtonRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);

  // 1. Unified State Management
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    model_no: searchParams.get("modelNo") || "",
    brand_id: searchParams.get("brandId") || "",
    category_id: searchParams.get("categoryId") || "",
    gender: searchParams.get("gender") || "",
    frame_type: searchParams.get("frameType") || "",
    min_price: searchParams.get("minPrice") || "",
    max_price: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  // 2. URL Synchronization (matches CommonEmployee logic)
  useSyncURLParams({
    ...state,
    pageSize: state.page_size,
    modelNo: state.model_no,
    brandId: state.brand_id,
    categoryId: state.category_id,
    frameType: state.frame_type,
    minPrice: state.min_price,
    maxPrice: state.max_price,
  });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);

  // 3. API Data Hooks
  const { data, isLoading, refetch } = useFramesPaginated(state);
  const { mutateAsync: deleteFrame } = useDeleteFrame();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;

  const [modal, setModal] = useState({
    isOpen: false,
    mode: "view",
    item: null,
  });

   const handleAddClick = useCallback(() => {
    setModal({ isOpen: true, mode: "add", item: null });
  }, []);

  // 2. Logic to detect ?action=add from Sidebar
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add") {
      handleAddClick();
      
      // Optional: Clean up the URL so it doesn't re-open if you refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, handleAddClick]);

  // Options
  const genderOptions = [
    { value: "", label: "All Genders" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "unisex", label: "Unisex" },
  ];

  const frameTypeOptions = [
    { value: "", label: "All Types" },
    { value: "full rim", label: "Full Rim" },
    { value: "rimless", label: "Rimless" },
    { value: "half rim", label: "Half Rim" },
  ];

  const handleRefresh = () => {
    setState({
      page: 1,
      page_size: 10,
      name: "",
      model_no: "",
      brand_id: "",
      category_id: "",
      gender: "",
      frame_type: "",
      min_price: "",
      max_price: "",
      searchKey: "",
      searchType: "",
      sort: "",
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
    { value: "model_no", name: "Model No" },
    { value: "brand_name", name: "Brand" },
    { value: "category_name", name: "Category" },
  ];

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Frames" />
          <div
            className="table-top-actions"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >

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
                  label="Model No"
                  value={uiState.model_no}
                  onChange={(e) =>
                    setUiState({ ...uiState, model_no: e.target.value })
                  }
                />
                <BrandAutoCompleteWithAddOption
                  value={uiState.brand_id}
                  onChange={(e) =>
                    setUiState({ ...uiState, brand_id: e.target.value })
                  }
                />
                <CategoryAutoCompleteWithAddOption
                  value={uiState.category_id}
                  onChange={(e) =>
                    setUiState({ ...uiState, category_id: e.target.value })
                  }
                />
                <SelectField
                  label="Gender"
                  value={uiState.gender}
                  options={genderOptions}
                  onChange={(e) =>
                    setUiState({ ...uiState, gender: e.target.value })
                  }
                />
                <SelectField
                  label="Frame Type"
                  value={uiState.frame_type}
                  options={frameTypeOptions}
                  onChange={(e) =>
                    setUiState({ ...uiState, frame_type: e.target.value })
                  }
                />
                <RangeField
                  label="Price Range"
                  minValue={uiState.min_price}
                  maxValue={uiState.max_price}
                  onMinChange={(v) => setUiState({ ...uiState, min_price: v })}
                  onMaxChange={(v) => setUiState({ ...uiState, max_price: v })}
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
            <AddButton
              onClick={() => setModal({ isOpen: true, mode: "add" })}
              ref={addButtonRef}
            >
              Add Frame
            </AddButton>
          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
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
                        <ThSearchOrFilterPopover isSearch onSearch={() => onHeaderSearch("name")}>
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
                  <Th>Brand</Th>
                  <Th>
                    <ThContainer>
                      Model No
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="model_no"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover isSearch onSearch={() => onHeaderSearch("model_no")}>
                          <InputField
                            value={uiState.model_no}
                            onChange={(e) =>
                              setUiState({
                                ...uiState,
                                model_no: e.target.value,
                              })
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && onHeaderSearch("model_no")
                            }
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th>Category</Th>
                  <Th>Gender</Th>
                  <Th>Type</Th>
                  <Th>
                    <ThContainer>
                      Price
                      <ThSort
                        sort={sort}
                        value="selling_price"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((frame, index) => (
                    <Tr key={frame.id}>
                      <TdSL
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                      />
                      <Td>{frame.name}</Td>
                      <Td>{frame.brand_name || "-"}</Td>
                      <Td>{frame.model_no}</Td>
                      <Td>{frame.category_name || "-"}</Td>
                      <Td style={{ textTransform: "capitalize" }}>
                        {frame.gender}
                      </Td>
                      <Td style={{ textTransform: "capitalize" }}>
                        {frame.frame_type}
                      </Td>
                      <TdNumeric>{frame.selling_price}</TdNumeric>
                      <TdMenu
                        onEdit={() =>
                          setModal({ isOpen: true, mode: "edit", item: frame })
                        }
                        onView={() =>
                          setModal({ isOpen: true, mode: "view", item: frame })
                        }
                        onDelete={() => deleteFrame(frame.id).then(refetch)}
                      />
                    </Tr>
                  ))
                ) : (
                  <TableCaption item="Frames" noOfCol={9} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        /* Mobile View */
        <ScrollContainer>
          <PageTitleWithBackButton title="Frames" />
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
                  <BrandAutoCompleteWithAddOption
                    value={uiState.brand_id}
                    onChange={(e) =>
                      setUiState({ ...uiState, brand_id: e.target.value })
                    }
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
            </HStack>
            <HStack style={{ marginLeft: "auto" }}>
              <AddButton onClick={() => setModal({ isOpen: true, mode: "add" })}>
                Add Frame
              </AddButton>
            </HStack>
          </PageHeader>
          {isLoading ? (
            <Loader />
          ) : listData.length === 0 ? (
            <TableCaption item="Frames" />
          ) : (
            <div>
              {listData.map((frame) => (
                <ListItem
                  key={frame.id}
                  title={frame.name}
                  subtitle={
                    <>
                      <div>Model: {frame.model_no}</div>
                      <div>Brand: {frame.brand_name || "-"}</div>
                    </>
                  }
                  amount={Number(frame.selling_price).toFixed(2)}
                  onEdit={() =>
                    setModal({ isOpen: true, mode: "edit", item: frame })
                  }
                  onView={() =>
                    setModal({ isOpen: true, mode: "view", item: frame })
                  }
                  onDelete={() => deleteFrame(frame.id).then(refetch)}
                />
              ))}
            </div>
          )}
          <Spacer />
        </ScrollContainer>
      )}

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

      <AddFrame
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedFrame={modal.item}
        onSuccess={refetch}
      />
    </ContainerWrapper>
  );
};

export default FrameList;
