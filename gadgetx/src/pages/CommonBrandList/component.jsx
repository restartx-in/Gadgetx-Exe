import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
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
import { Transaction } from "@/constants/object/transaction";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import HStack from "@/components/HStack";
import RefreshButton from "@/components/RefreshButton";
import PopupSearchField from "@/components/PopupSearchField";
import MobileSearchField from "@/components/MobileSearchField";
import PopUpFilter from "@/components/PopUpFilter";
import VStack from "@/components/VStack";
import InputField from "@/components/InputField";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";

// --- Sub-Components ---
const BrandRow = React.memo(
  ({ item, index, listLength, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={1} pageSize={listLength} />
      <Td>{item.name}</Td>
      <Td>{item.done_by_name}</Td>
      <Td>{item.cost_center_name}</Td>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  )
);

const ListFilter = React.memo(
  ({
    showFilter,
    setShowFilter,
    handleFilter,
    name,
    setName,
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
            label="Name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
          />
          <DoneByAutoComplete
            placeholder="Done By"
            value={doneById}
            onChange={(e) => setDoneById(e.target.value)}
            is_edit={false}
          />
          <CostCenterAutoComplete
            placeholder="Cost Center"
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
            is_edit={false}
            disabled={disableCostCenter}
          />
        </VStack>
      </PopUpFilter>
    );
  }
);

// --- Main Component ---
const CommonBrandList = ({
  list,
  isLoading,
  deleteItem,
  AddBrandModal, // Component passed as prop
  // Filter/State Props
  filterState,
  onFilterChange,
  onRefresh,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";
  const isDisableCostCenter = defaultCostCenter !== "";

  // Local UI States for Popups (Not synced with URL immediately)
  const [showFilter, setShowFilter] = useState(false);
  const [name, setName] = useState(filterState.name || "");
  const [doneById, setDoneById] = useState(filterState.done_by_id || "");
  const [costCenterId, setCostCenterId] = useState(
    filterState.cost_center_id || defaultCostCenter
  );
  
  // Header filter local state
  const [headerFilters, setHeaderFilters] = useState({
    name: filterState.name || "",
    done_by_id: filterState.done_by_id || "",
    cost_center_id: filterState.cost_center_id || "",
  });

  // Sync local inputs when parent filterState changes
  useEffect(() => {
    setName(filterState.name || "");
    setDoneById(filterState.done_by_id || "");
    setCostCenterId(filterState.cost_center_id || defaultCostCenter);
    setHeaderFilters({
      name: filterState.name || "",
      done_by_id: filterState.done_by_id || "",
      cost_center_id: filterState.cost_center_id || "",
    });
  }, [filterState, defaultCostCenter]);


  // Modal & URL Action Logic
  const [selectedItem, setSelectedItem] = useState(null);
  const [mode, setMode] = useState("view");
  const [isOpenModal, setIsOpenModal] = useState(false);

  // Helper to find item if ID is in URL but data just loaded
  const findItemById = useCallback(
    (id) => list.find((item) => item.id.toString() === id),
    [list]
  );

  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action && !isOpenModal) {
      if (action === "add") {
        setMode("add");
        setSelectedItem(null);
        setIsOpenModal(true);
      } else if ((action === "edit" || action === "view") && id) {
        const item = findItemById(id);
        if (item) {
          setSelectedItem(item);
          setMode(action);
          setIsOpenModal(true);
        }
      }
    } else if (!action && isOpenModal) {
       setIsOpenModal(false);
    }
  }, [searchParams, isOpenModal, findItemById]);

  // --- FIXED HANDLERS START ---

  const handleCloseModal = useCallback(() => {
    // Preserve existing filters, only remove action and id
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("action");
      newParams.delete("id");
      return newParams;
    }, { replace: true });
    
    setIsOpenModal(false);
  }, [setSearchParams]);

  const handleAddClick = useCallback(() => {
    // Preserve existing filters, add action
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("action", "add");
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleEditClick = useCallback(
    (item) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("action", "edit");
        newParams.set("id", item.id);
        return newParams;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const handleViewClick = useCallback(
    (item) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("action", "view");
        newParams.set("id", item.id);
        return newParams;
      }, { replace: true });
    },
    [setSearchParams]
  );
  
  // --- FIXED HANDLERS END ---

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: CRUDITEM.BRAND,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        if (selectedItem?.id === id) handleCloseModal();
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.BRAND,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteItem, showToast, selectedItem, handleCloseModal]
  );

  // Filter Handlers
  const handleSort = (value) => onFilterChange({ sort: value });

  const handleSearch = () => {
    onFilterChange({
       searchType: filterState.searchType, 
       searchKey: filterState.searchKey 
    });
  };

  const handleHeaderSearch = (key, value) => {
      onFilterChange({ [key]: value });
  };
  
  const handleHeaderKeyDown = (e, key) => {
      if(e.key === "Enter") {
          handleHeaderSearch(key, headerFilters[key]);
      }
  }

  const handleApplyPopupFilter = () => {
    onFilterChange({
      name,
      done_by_id: doneById,
      cost_center_id: costCenterId,
    });
    setShowFilter(false);
  };

  const handleManualRefresh = () => {
      onRefresh(); 
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Report has been refreshed.",
        status: TOASTSTATUS.SUCCESS,
      });
  }

  const searchOptions = [{ value: "name", name: "Name" }];
  
  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter: handleApplyPopupFilter,
    name,
    setName,
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
            <PageTitleWithBackButton title="Brands" />
            <TableTopContainer
              mainActions={
                <>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleManualRefresh} />
                  <PopupSearchField
                    searchRef={searchRef}
                    searchKey={filterState.searchKey}
                    setSearchKey={(val) => onFilterChange({ searchKey: val }, false)} 
                    searchType={filterState.searchType}
                    setSearchType={(val) => onFilterChange({ searchType: val }, false)}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                  <AddButton onClick={handleAddClick}>Add Brand</AddButton>
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
                        Name
                        <ThFilterContainer>
                          <ThSort
                            sort={filterState.sort}
                            setSort={(val) => handleSort(val)}
                            value="name"
                            handleSort={handleSort}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                             <InputField
                              placeholder="Enter Name"
                              value={headerFilters.name}
                              onChange={(e) =>
                                setHeaderFilters((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => handleHeaderKeyDown(e, "name")}
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
                             sort={filterState.sort}
                             setSort={(val) => handleSort(val)}
                             value="done_by"
                             handleSort={handleSort}
                          />
                          <ThSearchOrFilterPopover
                            isSearch={false}
                            popoverWidth={220}
                          >
                             <DoneByAutoComplete
                              placeholder="Select Done By"
                              value={headerFilters.done_by_id}
                              onChange={(e) =>
                                handleHeaderSearch("done_by_id", e.target.value)
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
                             sort={filterState.sort}
                             setSort={(val) => handleSort(val)}
                             value="cost_center"
                             handleSort={handleSort}
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
                              disabled={isDisableCostCenter}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {list.length > 0 ? (
                    list.map((brand, index) => (
                      <BrandRow
                        key={brand.id}
                        item={brand}
                        index={index}
                        listLength={list.length}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.Brand} noOfCol={5} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Brands" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleManualRefresh} />
                  <MobileSearchField
                    searchRef={searchRef}
                    searchKey={filterState.searchKey}
                    setSearchKey={(val) => onFilterChange({ searchKey: val }, false)}
                    searchType={filterState.searchType}
                    setSearchType={(val) => onFilterChange({ searchType: val }, false)}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                  />
                </HStack>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>Add Brand</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : list.length === 0 ? (
                <TableCaption item={Transaction.Brand} />
              ) : (
                <div>
                  {list.map((brand) => (
                    <ListItem
                      key={brand.id}
                      title={brand.name}
                      subtitle={
                        <>
                          {brand.done_by_name && (
                            <div>Done By: {brand.done_by_name}</div>
                          )}
                          {brand.cost_center_name && (
                            <div>Cost Center: {brand.cost_center_name}</div>
                          )}
                        </>
                      }
                      onView={() => handleViewClick(brand)}
                      onEdit={() => handleEditClick(brand)}
                      onDelete={() => handleDelete(brand.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddBrandModal
        isOpen={isOpenModal}
        onClose={handleCloseModal}
        mode={mode}
        selectedItem={selectedItem}
      />
    </>
  );
};

export default CommonBrandList;