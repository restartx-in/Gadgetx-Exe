import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import PageTitleWithBackButton from '@/components/PageTitleWithBackButton'
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
} from '@/components/Table'
import AddButton from '@/components/AddButton'
import PageHeader from '@/components/PageHeader'
import ContainerWrapper from '@/components/ContainerWrapper'
import Loader from '@/components/Loader'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import { TOASTTYPE, TOASTSTATUS } from '@/constants/object/toastType'
import { useIsMobile } from '@/utils/useIsMobile'
import ScrollContainer from '@/components/ScrollContainer'
import ListItem from '@/components/ListItem/component'
import Spacer from '@/components/Spacer'
import HStack from '@/components/HStack'
import RefreshButton from '@/components/RefreshButton'
import PopupSearchField from '@/components/PopupSearchField'
import MobileSearchField from '@/components/MobileSearchField'
import PopUpFilter from '@/components/PopUpFilter'
import VStack from '@/components/VStack'
import InputField from '@/components/InputField'
import useSyncURLParams from '@/hooks/useSyncURLParams'

const stateReducer = (state, newState) => ({ ...state, ...newState })

const CommonCategoryList = ({
  useCategorysHook,
  useDeleteCategoryHook,
  AddCategoryModal,
  DoneByAutoComplete,
  CostCenterAutoComplete,
  TableTopContainer,
  categoryItemConstant, // e.g., Transaction.Category
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const showToast = useToast()
  const isMobile = useIsMobile()
  const searchRef = useRef(null)

  const defaultCostCenter = localStorage.getItem('DEFAULT_COST_CENTER') ?? ''
  const isDisableCostCenter = defaultCostCenter !== ''

  // 1. Core Logic State
  const [state, setState] = useReducer(stateReducer, {
    name: searchParams.get('name') || '',
    sort: searchParams.get('sort') || '',
    done_by_id: searchParams.get('doneById') || '',
    cost_center_id: searchParams.get('costCenterId') || defaultCostCenter,
    searchType: searchParams.get('searchType') || '',
    searchKey: searchParams.get('searchKey') || '',
  })

  // 2. Local UI State (for filter popover and header inputs)
  const [showFilter, setShowFilter] = useState(false)
  const [uiState, setUiState] = useState(state)

  useSyncURLParams({
    name: state.name,
    sort: state.sort,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
  })

  // Sync UI inputs when global state changes (e.g., on refresh)
  useEffect(() => {
    setUiState(state)
  }, [state])

  const { data: categorys, isLoading } = useCategorysHook(state)
  const { mutateAsync: deleteCategory } = useDeleteCategoryHook()
  const listData = useMemo(() => categorys || [], [categorys])

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    mode: 'view',
    item: null,
  })

  useEffect(() => {
    if (searchParams.get('action') === 'add' && !modal.isOpen) {
      setModal({ isOpen: true, mode: 'add', item: null })
    }
  }, [searchParams, modal.isOpen])

  const handleAddClick = useCallback(() => {
    setSearchParams(
      (prev) => {
        prev.set('action', 'add')
        return prev
      },
      { replace: true },
    )
  }, [setSearchParams])

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteCategory(id)
        showToast({
          crudItem: CRUDITEM.CATEGORY,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        })
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.CATEGORY,
          crudType: CRUDTYPE.DELETE_ERROR,
        })
      }
    },
    [deleteCategory, showToast],
  )

  const handleRefresh = useCallback(() => {
    const reset = {
      name: '',
      sort: '',
      done_by_id: '',
      cost_center_id: defaultCostCenter,
      searchType: '',
      searchKey: '',
    }
    setState(reset)
    showToast({
      type: TOASTTYPE.GENARAL,
      message: 'Report has been refreshed..',
      status: TOASTSTATUS.SUCCESS,
    })
  }, [defaultCostCenter, showToast])

  const searchOptions = [{ value: 'name', name: 'Name' }]

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Categories" />
            <TableTopContainer
              mainActions={
                <>
                  <PopUpFilter
                    isOpen={showFilter}
                    setIsOpen={setShowFilter}
                    onApply={() => setState(uiState)}
                  >
                    <VStack>
                      <InputField
                        label="Name"
                        value={uiState.name}
                        onChange={(e) =>
                          setUiState({ ...uiState, name: e.target.value })
                        }
                      />
                      <DoneByAutoComplete
                        value={uiState.done_by_id}
                        onChange={(e) =>
                          setUiState({ ...uiState, done_by_id: e.target.value })
                        }
                      />
                      <CostCenterAutoComplete
                        value={uiState.cost_center_id}
                        disabled={isDisableCostCenter}
                        onChange={(e) =>
                          setUiState({
                            ...uiState,
                            cost_center_id: e.target.value,
                          })
                        }
                      />
                    </VStack>
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
                    handleSearch={() => setState(uiState)}
                    searchOptions={searchOptions}
                  />
                  <AddButton onClick={handleAddClick}>Add Category</AddButton>
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
                            sort={state.sort}
                            value="name"
                            handleSort={(v) => setState({ sort: v })}
                          />
                          <ThSearchOrFilterPopover isSearch popoverWidth={200}>
                            <InputField
                              value={uiState.name}
                              onChange={(e) =>
                                setUiState({ ...uiState, name: e.target.value })
                              }
                              onKeyDown={(e) =>
                                e.key === 'Enter' &&
                                setState({ name: uiState.name })
                              }
                              isLabel={false}
                            />
                          </ThSearchOrFilterPopover>
                        </ThFilterContainer>
                      </ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>Done By</ThContainer>
                    </Th>
                    <Th>
                      <ThContainer>Cost Center</ThContainer>
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
                          page={1}
                          pageSize={listData.length}
                        />
                        <Td>{item.name}</Td>
                        <Td>{item.done_by_name}</Td>
                        <Td>{item.cost_center_name}</Td>
                        <TdMenu
                          onEdit={() =>
                            setModal({ isOpen: true, mode: 'edit', item })
                          }
                          onView={() =>
                            setModal({ isOpen: true, mode: 'view', item })
                          }
                          onDelete={() => handleDelete(item.id)}
                        />
                      </Tr>
                    ))
                  ) : (
                    <TableCaption item={categoryItemConstant} noOfCol={5} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Categories" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  {/* Mobile Filter & Search Implementation */}
                  <RefreshButton onClick={handleRefresh} />
                  <MobileSearchField
                    searchKey={uiState.searchKey}
                    setSearchKey={(v) =>
                      setUiState({ ...uiState, searchKey: v })
                    }
                    handleSearch={() => setState(uiState)}
                    searchOptions={searchOptions}
                  />
                </HStack>
                <AddButton onClick={handleAddClick}>Add Category</AddButton>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item={categoryItemConstant} />
              ) : (
                <div>
                  {listData.map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.name}
                      subtitle={
                        <>
                          <div>By: {item.done_by_name}</div>
                          <div>CC: {item.cost_center_name}</div>
                        </>
                      }
                      onView={() =>
                        setModal({ isOpen: true, mode: 'view', item })
                      }
                      onEdit={() =>
                        setModal({ isOpen: true, mode: 'edit', item })
                      }
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddCategoryModal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal({ ...modal, isOpen: false })
          setSearchParams(
            (prev) => {
              prev.delete('action')
              return prev
            },
            { replace: true },
          )
        }}
        mode={modal.mode}
        selectedCategory={modal.item}
      />
    </>
  )
}

export default CommonCategoryList
