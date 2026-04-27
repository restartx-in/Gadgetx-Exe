import React, { useReducer, useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "./style.scss";
import { useIsMobile } from "@/utils/useIsMobile";
import useSyncURLParams from "@/hooks/useSyncURLParams";
import {
  Table, Thead, Tbody, Tr, Th, Td, ThSL, TdSL, TdMenu, ThMenu, TdNumeric,
  TableCaption, ThContainer, ThSort, ThFilterContainer, ThSearchOrFilterPopover,
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


// Import your custom hooks
import { useLenses } from "@/apps/user/hooks/api/lens/useLenses"; // Adjust path as needed
import { useDeleteLens } from "@/apps/user/hooks/api/lens/useDeleteLens";
import AddLense from "./components/AddLense"; // Create this component similar to AddFrame

import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const LensList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    pageSize: parseInt(searchParams.get("pageSize")) || 10,
    name: searchParams.get("name") || "",
    index_value: searchParams.get("index_value") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  useSyncURLParams(state);

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);


  const { data, isLoading, refetch } = useLenses(state);
  const { mutateAsync: deleteLens } = useDeleteLens();

  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1;
  const totalItems = data?.count || 0;

  const [modal, setModal] = useState({ isOpen: false, mode: "view", item: null });

  // Handle "Add" from URL
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setSearchParams(
        (prev) => {
          prev.delete("action");
          return prev;
        },
        { replace: true }
      );
      setModal({ isOpen: true, mode: "add", item: null });
    }
  }, [searchParams, setSearchParams]);

  const handleRefresh = () => {
    setState({ page: 1, name: "", index_value: "", searchKey: "", searchType: "", sort: "" });
    setSort("");
    showToast({ type: TOASTTYPE.GENARAL, message: "Refreshed.", status: TOASTSTATUS.SUCCESS });
  };

  const handleSort = useCallback((v) => {
    setSort(v);
    setState({ sort: v, page: 1 });
  }, []);

  const onHeaderSearch = (key) => setState({ [key]: uiState[key], page: 1 });

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "index_value", name: "Index Value" },
  ];

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Lenses" />
          <div className="table-top-actions" style={{ display: "flex", gap: "10px", marginBottom: "15px", justifyContent: "flex-end" }}>

            <PopUpFilter isOpen={showFilter} setIsOpen={setShowFilter} onApply={() => setState({ ...uiState, page: 1 })}>
              <VStack>
                <InputField label="Name" value={uiState.name} onChange={(e) => setUiState({ ...uiState, name: e.target.value })} />
                <InputField label="Index Value" value={uiState.index_value} onChange={(e) => setUiState({ ...uiState, index_value: e.target.value })} />
              </VStack>
            </PopUpFilter>
            <RefreshButton onClick={handleRefresh} />
            <PopupSearchField searchRef={searchRef} searchKey={uiState.searchKey} setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })} handleSearch={() => setState({ ...uiState, page: 1 })} searchOptions={searchOptions} />
            <AddButton onClick={() => setModal({ isOpen: true, mode: "add" })}>Add Lens</AddButton>
          </div>

          {isLoading ? <Loader /> : (
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>
                    <ThContainer>
                      Name
                      <ThFilterContainer>
                        <ThSort sort={sort} setSort={setSort} value="name" handleSort={handleSort} />
                        <ThSearchOrFilterPopover isSearch onSearch={() => onHeaderSearch("name")}>
                          <InputField
                            value={uiState.name}
                            onChange={(e) => setUiState({ ...uiState, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && onHeaderSearch("name")}
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th>
                    <ThContainer>
                      Index Value
                      <ThFilterContainer>
                        <ThSort sort={sort} setSort={setSort} value="index_value" handleSort={handleSort} />
                        <ThSearchOrFilterPopover isSearch onSearch={() => onHeaderSearch("index_value")}>
                          <InputField
                            value={uiState.index_value}
                            onChange={(e) => setUiState({ ...uiState, index_value: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && onHeaderSearch("index_value")}
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th>
                    <ThContainer>
                      Base Price
                      <ThSort sort={sort} setSort={setSort} value="base_price" handleSort={handleSort} />
                    </ThContainer>
                  </Th>
                  <Th>
                    <ThContainer>
                      Stock
                      <ThSort sort={sort} setSort={setSort} value="stock" handleSort={handleSort} />
                    </ThContainer>
                  </Th>
                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? listData.map((lens, index) => (
                  <Tr key={lens.id}>
                    <TdSL index={index} page={state.page} pageSize={state.pageSize} />
                    <Td>{lens.name}</Td>
                    <Td>{lens.index_value}</Td>
                    <TdNumeric>{lens.base_price}</TdNumeric>
                    <Td>
                      {/* <span style={{ 
                        fontWeight: 700, 
                        color: lens.stock <= 5 ? "#ef4444" : "#10b981" 
                      }}> */}
                        {Math.round(Number(lens.stock || 0))}
                      {/* </span> */}
                    </Td>
                    <TdMenu
                      onEdit={() => setModal({ isOpen: true, mode: "edit", item: lens })}
                      onView={() => setModal({ isOpen: true, mode: "view", item: lens })}
                      onDelete={() => deleteLens(lens.id).then(refetch)}
                    />
                  </Tr>
                )) : <TableCaption item="Lenses" noOfCol={6} />}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        <ScrollContainer>
          <PageTitleWithBackButton title="Lenses" />
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
                    onChange={(e) => setUiState({ ...uiState, name: e.target.value })}
                  />
                  <InputField
                    label="Index Value"
                    value={uiState.index_value}
                    onChange={(e) => setUiState({ ...uiState, index_value: e.target.value })}
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
                Add Lens
              </AddButton>
            </HStack>
          </PageHeader>
          {isLoading ? (
            <Loader />
          ) : listData.length === 0 ? (
            <TableCaption item="Lenses" />
          ) : (
            <div>
              {listData.map((lens) => (
                <ListItem
                  key={lens.id}
                  title={lens.name}
                  subtitle={<div>Index: {lens.index_value}</div>}
                  amount={Number(lens.base_price).toFixed(2)}
                  onEdit={() => setModal({ isOpen: true, mode: "edit", item: lens })}
                  onView={() => setModal({ isOpen: true, mode: "view", item: lens })}
                  onDelete={() => deleteLens(lens.id).then(refetch)}
                />
              ))}
            </div>
          )}
          <Spacer />
        </ScrollContainer>
      )}

      {/* Footer and Modals */}
      <TableFooter totalItems={totalItems} currentPage={state.page} itemsPerPage={state.pageSize} totalPages={totalPages} handlePageChange={(v) => setState({ page: v })} handlePageLimitSelect={(v) => setState({ pageSize: v, page: 1 })} />
      <AddLense isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} mode={modal.mode} selectedLens={modal.item} onSuccess={refetch} />
    </ContainerWrapper>
  );
};

export default LensList;