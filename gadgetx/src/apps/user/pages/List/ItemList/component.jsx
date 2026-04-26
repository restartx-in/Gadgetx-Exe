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
import useItemPaginated from "@/hooks/api/item/useItemPaginated";
import useDeleteItem from "@/hooks/api/item/useDeleteItem";
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import { useCategorys } from "@/hooks/api/category/useCategorys";
import { useBrands } from "@/hooks/api/brand/useBrands";
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
import PopupSearchField from "@/components/PopupSearchField";
import TableFooter from "@/components/TableFooter";
import PopUpFilter from "@/components/PopUpFilter";
import RefreshButton from "@/components/RefreshButton";
import Loader from "@/components/Loader";
import DateField from "@/components/DateField";
import DateFilter from "@/components/DateFilter";
import Select from "@/components/Select";
import AddItem from "./components/AddItem";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TableTopContainer from "@/components/TableTopContainer";
import ExportMenu from "@/components/ExportMenu";
import { useItemExportAndPrint } from "@/hooks/api/exportAndPrint/useItemExportAndPrint";

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

const ItemRow = React.memo(
  ({ item, index, page, pageSize, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <Td>{item.name}</Td>
      <Td>{item.category_name || "N/A"}</Td>
      <Td>{item.sku}</Td>
      <Td>{item.brand_name || "N/A"}</Td>
      <Td>{item.done_by_name || "N/A"}</Td>
      <Td>{item.cost_center_name || "N/A"}</Td>
      <Td>{item.unit_name || "N/A"}</Td>
      <Td>{item.bar_code || "N/A"}</Td>
      <Td>{item.stock_quantity}</Td>
      <Td>{item.selling_price}</Td>
      <Td>{item.selling_price_with_tax}</Td>
      <Td>{item.tax}%</Td>
      <TdDate>{item.created_at}</TdDate>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  )
);

const MobileItem = React.memo(({ item, onView, onEdit, onDelete }) => (
  <ListItem
    key={item.id}
    title={item.name}
    subtitle={
      <>
        <div>Brand: {item.brand_name || "No Brand"}</div>
        {item.category_name && <div>Category: {item.category_name}</div>}
        <div style={{ color: "var(--color-neutral-600)" }}>
          Stock: {item.stock_quantity} {item.unit_name || ""}
        </div>
      </>
    }
    amount={
      <div style={{ textAlign: "right" }}>
        <div className="fs18fw600" style={{ color: "green" }}>
          {item.selling_price_with_tax}
        </div>
        <div className="fs14" style={{ color: "var(--color-neutral-500)" }}>
          Tax: {item.tax}%
        </div>
        <div className="fs14" style={{ color: "var(--color-neutral-500)" }}>
          {formatDate(item.created_at)}
        </div>
      </div>
    }
    onView={() => onView(item)}
    onEdit={() => onEdit(item)}
    onDelete={() => onDelete(item.id)}
  />
));

const ItemList = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast();
  const searchRef = useRef(null);
  const isMobile = useIsMobile();

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    category: searchParams.get("category") || "",
    sku: searchParams.get("sku") || "",
    brand: searchParams.get("brand") || "",
    bar_code: searchParams.get("barCode") || "",
    stock_quantity: searchParams.get("stockQuantity") || "",
    selling_price: searchParams.get("sellingPrice") || "",
    tax: searchParams.get("tax") || "",
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
    category: state.category,
    sku: state.sku,
    brand: state.brand,
    barCode: state.bar_code,
    stockQuantity: state.stock_quantity,
    sellingPrice: state.selling_price,
    tax: state.tax,
    startDate: state.start_date,
    endDate: state.end_date,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    sort: state.sort,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  // Local UI states for controlled inputs
  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(state.name);
  const [category, setCategory] = useState(state.category);
  const [sku, setSku] = useState(state.sku);
  const [brand, setBrand] = useState(state.brand);
  const [barcode, setBarcode] = useState(state.bar_code);
  const [startDate, setStartDate] = useState(state.start_date);
  const [endDate, setEndDate] = useState(state.end_date);
  const [doneById, setDoneById] = useState(state.done_by_id);
  const [costCenterId, setCostCenterId] = useState(state.cost_center_id);
  const [headerFilters, setHeaderFilters] = useState({});
  const [headerCategory, setHeaderCategory] = useState(state.category || "");
  const [headerBrand, setHeaderBrand] = useState(state.brand || "");
  const [dateFilter, setDateFilter] = useState({});
  const [sort, setSort] = useState(state.sort);
  const [searchType, setSearchType] = useState(state.searchType);
  const [searchKey, setSearchKey] = useState(state.searchKey);

  useEffect(() => {
    setName(state.name || "");
    setCategory(state.category || "");
    setSku(state.sku || "");
    setBrand(state.brand || "");
    setBarcode(state.bar_code || "");
    setStartDate(state.start_date || "");
    setEndDate(state.end_date || "");
    setDoneById(state.done_by_id || "");
    setCostCenterId(state.cost_center_id || "");
    setSort(state.sort || "");
    setSearchKey(state.searchKey || "");
    setSearchType(state.searchType || "");

    setHeaderFilters({
      name: state.name || "",
      sku: state.sku || "",
      bar_code: state.bar_code || "",
      stock_quantity: state.stock_quantity || "",
      selling_price: state.selling_price || "",
      tax: state.tax || "",
      done_by_id: state.done_by_id || "",
      cost_center_id: state.cost_center_id || "",
    });

    setHeaderCategory(state.category || "");
    setHeaderBrand(state.brand || "");
    setDateFilter({
      startDate: state.start_date || null,
      endDate: state.end_date || null,
      rangeType: "custom",
    });
  }, [state]);

  const filterDatas = useMemo(
    () => ({
      name: state.name,
      category: state.category,
      sku: state.sku,
      brand: state.brand,
      barcode: state.bar_code,
      doneById: state.done_by_id,
      costCenterId: state.cost_center_id,
      ...headerFilters,
    }),
    [state, headerFilters]
  );

  const { data, isLoading } = useItemPaginated(state);
  const { mutateAsync: deleteItem } = useDeleteItem();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;

  const { exportToExcel, exportToPdf, printDocument } = useItemExportAndPrint({
    listData: listData,
    reportType: "Item List",
    duration: startDate && endDate ? `${startDate} to ${endDate}` : "",
    pageNumber: state.page,
    selectedPageCount: state.page_size,
    totalPage: totalPages,
    totalData: {
      totalItems: totalItems,
    },
    filterDatas,
    searchType: state.searchType,
    searchKey: state.searchKey,
  });

  const { data: categoriesData } = useCategorys();
  const { data: brandsData } = useBrands();

  const categoryOptions = useMemo(() => {
    if (!categoriesData) return [{ value: "", label: "All Categories" }];
    return [
      { value: "", label: "All Categories" },
      ...categoriesData.map((cat) => ({ value: cat.name, label: cat.name })),
    ];
  }, [categoriesData]);

  const brandOptions = useMemo(() => {
    if (!brandsData) return [{ value: "", label: "All Brands" }];
    return [
      { value: "", label: "All Brands" },
      ...brandsData.map((b) => ({ value: b.name, label: b.name })),
    ];
  }, [brandsData]);

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ page: 1, sort: value });
  }, []);

  const handleSearch = useCallback(
    () => setState({ page: 1, searchType, searchKey }),
    [searchType, searchKey]
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
      category,
      sku,
      brand,
      bar_code: barcode,
      start_date: startDate,
      end_date: endDate,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  }, [
    name,
    category,
    sku,
    brand,
    barcode,
    startDate,
    endDate,
    doneById,
    costCenterId,
  ]);

  const handleHeaderSearch = useCallback(
    (key, value) => setState({ [key]: value, page: 1 }),
    []
  );

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue);
    setState({
      start_date: newFilterValue.startDate || "",
      end_date: newFilterValue.endDate || "",
      page: 1,
    });
  }, []);

  const handleHeaderKeyDown = useCallback(
    (e, key) => {
      if (e.key === "Enter") handleHeaderSearch(key, headerFilters[key]);
    },
    [handleHeaderSearch, headerFilters]
  );

  const handleHeaderCategoryFilter = useCallback((value) => {
    setHeaderCategory(value);
    setState({ page: 1, category: value });
  }, []);

  const handleHeaderBrandFilter = useCallback((value) => {
    setHeaderBrand(value);
    setState({ page: 1, brand: value });
  }, []);

  const handleRefresh = useCallback(() => {
    setName("");
    setCategory("");
    setSku("");
    setBrand("");
    setBarcode("");
    setStartDate("");
    setEndDate("");
    setSearchKey("");
    setSearchType("");
    setSort("");
    setDoneById("");
    if (!isDisableCostCenter) setCostCenterId("");
    setHeaderFilters({
      name: "",
      sku: "",
      bar_code: "",
      stock_quantity: "",
      selling_price: "",
      tax: "",
      done_by_id: "",
      cost_center_id: "",
    });
    setHeaderCategory("");
    setHeaderBrand("");
    setDateFilter({ startDate: null, endDate: null, rangeType: "custom" });

    setState({
      page: 1,
      page_size: 10,
      name: "",
      category: "",
      sku: "",
      brand: "",
      bar_code: "",
      stock_quantity: "",
      selling_price: "",
      tax: "",
      start_date: "",
      end_date: "",
      done_by_id: "",
      cost_center_id: defaultCostCenter,
      sort: "",
      searchType: "",
      searchKey: "",
    });
  }, [defaultCostCenter, isDisableCostCenter]);

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (item) => dispatchModal({ type: "OPEN", mode: "edit", payload: item }),
    []
  );
  const handleViewClick = useCallback(
    (item) => dispatchModal({ type: "OPEN", mode: "view", payload: item }),
    []
  );
  const handleCloseModal = useCallback(
    () => dispatchModal({ type: "CLOSE" }),
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: CRUDITEM.ITEM,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({ crudItem: CRUDITEM.ITEM, crudType: CRUDTYPE.DELETE_ERROR });
      }
    },
    [deleteItem, showToast]
  );

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "category", name: "Category" },
    { value: "sku", name: "SKU" },
    { value: "brand", name: "Brand" },
    { value: "bar_code", name: "Barcode" },
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
    category,
    setCategory,
    sku,
    setSku,
    brand,
    setBrand,
    barcode,
    setBarcode,
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

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Items" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />

                  {!isLoading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )}

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
                  <AddButton onClick={handleAddClick}>Add Item</AddButton>
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
                                placeholder="Search Name"
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
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Category
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "category",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover>
                              <Select
                                value={headerCategory}
                                onChange={(e) =>
                                  handleHeaderCategoryFilter(e.target.value)
                                }
                                options={categoryOptions}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          SKU
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "sku", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch
                              popoverWidth={200}
                            >
                              <InputField
                                placeholder="Search SKU"
                                value={headerFilters.sku}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    sku: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => handleHeaderKeyDown(e, "sku")}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Brand
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "brand", handleSort }}
                            />
                            <ThSearchOrFilterPopover>
                              <Select
                                value={headerBrand}
                                onChange={(e) =>
                                  handleHeaderBrandFilter(e.target.value)
                                }
                                options={brandOptions}
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
                      <Th>Unit</Th>
                      <Th>
                        <ThContainer>
                          Barcode
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "bar_code",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={200}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "bar_code",
                                  headerFilters.bar_code
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Barcode"
                                value={headerFilters.bar_code}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    bar_code: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "bar_code")
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Stock
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "stock_quantity",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "stock_quantity",
                                  headerFilters.stock_quantity
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Stock"
                                type="number"
                                value={headerFilters.stock_quantity}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    stock_quantity: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "stock_quantity")
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Price
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "selling_price",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "selling_price",
                                  headerFilters.selling_price
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Price"
                                type="number"
                                value={headerFilters.selling_price}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    selling_price: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "selling_price")
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Price(W/TAX)
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "selling_price",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch(
                                  "selling_price",
                                  headerFilters.selling_price
                                )
                              }
                            >
                              <InputField
                                placeholder="Search Price"
                                type="number"
                                value={headerFilters.selling_price}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    selling_price: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) =>
                                  handleHeaderKeyDown(e, "selling_price")
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Tax
                          <ThFilterContainer>
                            <ThSort
                              {...{ sort, setSort, value: "tax", handleSort }}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={true}
                              popoverWidth={220}
                              onSearch={() =>
                                handleHeaderSearch("tax", headerFilters.tax)
                              }
                            >
                              <InputField
                                placeholder="Search Tax %"
                                type="number"
                                value={headerFilters.tax}
                                onChange={(e) =>
                                  setHeaderFilters((prev) => ({
                                    ...prev,
                                    tax: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => handleHeaderKeyDown(e, "tax")}
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Date
                          <ThFilterContainer>
                            <ThSort
                              {...{
                                sort,
                                setSort,
                                value: "created_at",
                                handleSort,
                              }}
                            />
                            <ThSearchOrFilterPopover>
                              <DateFilter
                                value={dateFilter}
                                onChange={handleDateFilterChange}
                                popover={true}
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
                      listData.map((item, index) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          onEdit={handleEditClick}
                          onView={handleViewClick}
                          onDelete={handleDelete}
                        />
                      ))
                    ) : (
                      <TableCaption item={Transaction.Item} noOfCol={14} />
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
            <PageTitleWithBackButton title="Items" />
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
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>Add Item</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={Transaction.Item} />
              ) : (
                <div>
                  {listData.map((item) => (
                    <MobileItem
                      key={item.id}
                      item={item}
                      onView={handleViewClick}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
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

      <AddItem
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedItem={modalState.selected}
      />
    </>
  );
};

export default ItemList;

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
    category,
    setCategory,
    sku,
    setSku,
    brand,
    setBrand,
    barcode,
    setBarcode,
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
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <InputField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            type="text"
          />
          <InputField
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            type="text"
          />
          <InputField
            label="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            type="text"
          />
          <InputField
            label="Barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
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
