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
import ListItem from "@/components/ListItem/component";
import ScrollContainer from "@/components/ScrollContainer";
import PageHeader from "@/components/PageHeader";
import Spacer from "@/components/Spacer";


import { useLensAddons } from "@/apps/user/hooks/api/lensAddon/useLensAddons";
import { useDeleteLensAddon } from "@/apps/user/hooks/api/lensAddon/useDeleteLensAddon";
import AddLensAddon from "./components/AddLensAddon";

import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const LensAddonsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    price: searchParams.get("price") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  useSyncURLParams({ ...state, pageSize: state.page_size });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);


  const { data, isLoading, refetch } = useLensAddons(state);
  const { mutateAsync: deleteAddon } = useDeleteLensAddon();

  const listData = useMemo(() => {
    if (data?.data) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);
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

  const handleRefresh = () => {
    setState({
      page: 1,
      name: "",
      price: "",
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

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "price", name: "Price" },
  ];

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Lens Addons" />
          <div
            className="table-top-actions"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "15px",
              justifyContent: "flex-end",
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
                  label="Price"
                  value={uiState.price}
                  onChange={(e) =>
                    setUiState({ ...uiState, price: e.target.value })
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
            <AddButton onClick={() => setModal({ isOpen: true, mode: "add" })}>
              Add Addon
            </AddButton>

          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Name</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((addon, index) => (
                    <Tr key={addon.id}>
                      <TdSL
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                      />
                      <Td>{addon.name}</Td>
                      <TdNumeric>{addon.price}</TdNumeric>
                      <Td>
                        {/* <span style={{ 
                          fontWeight: 700, 
                          color: addon.stock <= 5 ? "#ef4444" : "#10b981" 
                        }}> */}
                          {Math.round(Number(addon.stock || 0))}
                        {/* </span> */}
                      </Td>
                      <TdMenu
                        onEdit={() =>
                          setModal({ isOpen: true, mode: "edit", item: addon })
                        }
                        onView={() =>
                          setModal({ isOpen: true, mode: "view", item: addon })
                        }
                        onDelete={() => deleteAddon(addon.id).then(refetch)}
                      />
                    </Tr>
                  ))
                ) : (
                  <TableCaption item="Addons" noOfCol={5} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <ScrollContainer>
          <PageTitleWithBackButton title="Lens Addons" />
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
                </VStack>
              </PopUpFilter>
              <RefreshButton onClick={handleRefresh} />
              <MobileSearchField
                searchRef={searchRef}
                searchKey={uiState.searchKey}
                setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                handleSearch={() => setState({ searchKey: uiState.searchKey, page: 1 })}
                searchOptions={searchOptions}
              />
            </HStack>
            <HStack style={{ marginLeft: "auto" }}>
              <AddButton onClick={() => setModal({ isOpen: true, mode: "add" })}>
                Add Addon
              </AddButton>
            </HStack>
          </PageHeader>
          {isLoading ? (
            <Loader />
          ) : listData.length === 0 ? (
            <TableCaption item="Addons" />
          ) : (
            <div>
              {listData.map((addon) => (
                <ListItem
                  key={addon.id}
                  title={addon.name}
                  amount={Number(addon.price).toFixed(2)}
                  onEdit={() =>
                    setModal({ isOpen: true, mode: "edit", item: addon })
                  }
                  onView={() =>
                    setModal({ isOpen: true, mode: "view", item: addon })
                  }
                  onDelete={() => deleteAddon(addon.id).then(refetch)}
                />
              ))}
            </div>
          )}
          <Spacer />
        </ScrollContainer>
      )}

      <TableFooter
        totalItems={totalItems}
        currentPage={state.page}
        itemsPerPage={state.page_size}
        totalPages={totalPages}
        handlePageChange={(v) => setState({ page: v })}
        handlePageLimitSelect={(v) => setState({ page_size: v, page: 1 })}
      />

      <AddLensAddon
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedAddon={modal.item}
        onSuccess={refetch}
      />
    </ContainerWrapper>
  );
};

export default LensAddonsList;
