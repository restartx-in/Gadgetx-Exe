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
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import demoLogo from "@/assets/user/demo-logo.svg";

import { useFrameVariantsPaginated } from "@/apps/user/hooks/api/frameVariant/useFrameVariantsPaginated";
import { useDeleteFrameVariant } from "@/apps/user/hooks/api/frameVariant/useDeleteFrameVariant";
import FrameAutoCompleteWithAddOption from "@/apps/user/components/FrameAutoCompleteWithAddOption";
import AddFrameVariant from "./components/AddFrameVariant";

import { useToast } from "@/context/ToastContext";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const FrameVariant = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const searchRef = useRef(null);
  const [showFilter, setShowFilter] = useState(false);

  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sku: searchParams.get("sku") || "",
    color: searchParams.get("color") || "",
    frame_id: searchParams.get("frameId") || "",
    sort: searchParams.get("sort") || "",
    searchType: searchParams.get("searchType") || "",
    searchKey: searchParams.get("searchKey") || "",
  });

  const [uiState, setUiState] = useState(state);
  const [sort, setSort] = useState(state.sort);

  useSyncURLParams({
    ...state,
    pageSize: state.page_size,
    frameId: state.frame_id,
  });

  useEffect(() => {
    setUiState(state);
    setSort(state.sort);
  }, [state]);

  const { data, isLoading, refetch } = useFrameVariantsPaginated(state);
  const { mutateAsync: deleteVariant } = useDeleteFrameVariant();

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

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      handleAddClick();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, handleAddClick]);

  const handleRefresh = () => {
    setState({
      page: 1,
      page_size: 10,
      sku: "",
      color: "",
      frame_id: "",
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

  const handleSort = useCallback((v) => {
    setSort(v);
    setState({ sort: v, page: 1 });
  }, []);

  const onHeaderSearch = (key) => setState({ [key]: uiState[key], page: 1 });

  return (
    <ContainerWrapper>
      {!isMobile ? (
        <>
          <PageTitleWithBackButton title="Frame Variants (Stock)" />
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
                  label="SKU"
                  value={uiState.sku}
                  onChange={(e) =>
                    setUiState({ ...uiState, sku: e.target.value })
                  }
                />
                <InputField
                  label="Color"
                  value={uiState.color}
                  onChange={(e) =>
                    setUiState({ ...uiState, color: e.target.value })
                  }
                />
                <FrameAutoCompleteWithAddOption
                  value={uiState.frame_id}
                  onChange={(e) =>
                    setUiState({ ...uiState, frame_id: e.target.value })
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
              searchOptions={[
                { value: "sku", name: "SKU" },
                { value: "color", name: "Color" },
                { value: "frame_name", name: "Frame Name" },
              ]}
            />
            <AddButton onClick={handleAddClick}>Add Variant</AddButton>
          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <ThSL />
                  <Th>Image</Th>
                  <Th>Frame Name</Th>
                  <Th>
                    <ThContainer>
                      SKU
                      <ThFilterContainer>
                        <ThSort
                          sort={sort}
                          setSort={setSort}
                          value="sku"
                          handleSort={handleSort}
                        />
                        <ThSearchOrFilterPopover
                          isSearch
                          onSearch={() => onHeaderSearch("sku")}
                        >
                          <InputField
                            value={uiState.sku}
                            onChange={(e) =>
                              setUiState({ ...uiState, sku: e.target.value })
                            }
                          />
                        </ThSearchOrFilterPopover>
                      </ThFilterContainer>
                    </ThContainer>
                  </Th>
                  <Th>Color</Th>
                  <Th>Barcode</Th>
                  <Th>Size</Th>
                  <Th>
                    <ThContainer>
                      Stock Qty
                      <ThSort
                        sort={sort}
                        setSort={setSort}
                        value="stock_qty"
                        handleSort={handleSort}
                      />
                    </ThContainer>
                  </Th>
                  <ThMenu />
                </Tr>
              </Thead>
              <Tbody>
                {listData.length > 0 ? (
                  listData.map((variant, index) => (
                    <Tr key={variant.id}>
                      <TdSL
                        index={index}
                        page={state.page}
                        pageSize={state.page_size}
                      />
                      <Td>
                        <img
                          src={buildUploadUrl(API_UPLOADS_BASE, variant.image) || demoLogo}
                          alt={variant.sku}
                          style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px" }}
                          onError={(e) => (e.target.src = demoLogo)}
                        />
                      </Td>
                      <Td>
                        {variant.frame_name} ({variant.frame_model_no})
                      </Td>
                      <Td className="fw600">{variant.sku}</Td>
                      <Td>{variant.color || "-"}</Td>
                      <Td className="fw600">{variant.barcode || "-"}</Td>
                      <Td>{variant.size || "-"}</Td>
                      <Td
                        className={variant.stock_qty <= 0 ? "text-danger" : ""}
                      >
                        {variant.stock_qty}
                      </Td>
                      <TdMenu
                        onEdit={() =>
                          setModal({
                            isOpen: true,
                            mode: "edit",
                            item: variant,
                          })
                        }
                        onView={() =>
                          setModal({
                            isOpen: true,
                            mode: "view",
                            item: variant,
                          })
                        }
                        onDelete={() => deleteVariant(variant.id).then(refetch)}
                      />
                    </Tr>
                  ))
                ) : (
                  <TableCaption item="Variants" noOfCol={8} />
                )}
              </Tbody>
            </Table>
          )}
        </>
      ) : (
        /* Mobile View */
        <ScrollContainer>
          <PageTitleWithBackButton title="Variants" />
          <PageHeader>
            <HStack>
              <PopUpFilter
                isOpen={showFilter}
                setIsOpen={setShowFilter}
                onApply={() => setState({ ...uiState, page: 1 })}
              >
                <InputField
                  label="SKU"
                  value={uiState.sku}
                  onChange={(e) =>
                    setUiState({ ...uiState, sku: e.target.value })
                  }
                />
                {/* </VStack> */}
                <RefreshButton onClick={handleRefresh} />
                <MobileSearchField
                  searchKey={uiState.searchKey}
                  setSearchKey={(v) => setUiState({ ...uiState, searchKey: v })}
                  handleSearch={() => setState({ ...uiState, page: 1 })}
                />
              </PopUpFilter>
            </HStack>
            <AddButton onClick={handleAddClick}>Add</AddButton>
          </PageHeader>
          {isLoading ? (
            <Loader />
          ) : (
            listData.map((v) => (
              <ListItem
                key={v.id}
                title={v.sku}
                subtitle={`${v.frame_name} | Color: ${v.color}`}
                amount={v.stock_qty}
                onEdit={() => setModal({ isOpen: true, mode: "edit", item: v })}
                onDelete={() => deleteVariant(v.id).then(refetch)}
              />
            ))
          )}
        </ScrollContainer>
      )}
      {!isLoading && listData.length > 0 && (
        <TableFooter
          totalItems={totalItems}
          currentPage={state.page}
          itemsPerPage={state.page_size}
          totalPages={totalPages}
          handlePageChange={(v) => setState({ page: v })}
          handlePageLimitSelect={(v) => setState({ page_size: v, page: 1 })}
        />
      )}
      <AddFrameVariant
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        mode={modal.mode}
        selectedVariant={modal.item}
        onSuccess={refetch}
      />
    </ContainerWrapper>
  );
};

export default FrameVariant;
