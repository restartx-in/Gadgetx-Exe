import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useDeleteSaleReturns from '@/hooks/api/saleReturns/useDeleteSaleReturns'
import useSaleReturnsPaginated from '@/hooks/api/saleReturns/useSaleReturnsPaginated'
import { useCustomers } from '@/hooks/api/customer/useCustomers'

import useItemsPaginated from '@/hooks/api/item/useItemPaginated'
import useAccounts from '@/hooks/api/account/useAccounts'
import useDoneBys from '@/hooks/api/doneBy/useDoneBys'
import useCostCenters from '@/hooks/api/costCenter/useCostCenters'
import { Transaction } from '@/constants/object/transaction'
import { useIsMobile } from '@/utils/useIsMobile'
import isAllFiltersEmpty from '@/utils/isAllFiltersEmpty'
import { useToast } from '@/context/ToastContext'
import { CRUDTYPE, CRUDITEM } from '@/constants/object/crud'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdSL,
  TdDate,
  ThDotMenu,
  TableCaption,
  ThContainer,
  ThSearchOrFilterPopover,
  ThFilterContainer,
  ThSL,
} from '@/components/Table'

import AddButton from '@/components/AddButton'
import DateFilter from '@/components/DateFilter'
import DateField from '@/components/DateField'
import HStack from '@/components/HStack/component.jsx'
import VStack from '@/components/VStack'
import PageHeader from '@/components/PageHeader'
import TableTopContainer from '@/components/TableTopContainer'
import PageTitleWithBackButton from '@/components/PageTitleWithBackButton'
import PopupSearchField from '@/components/PopupSearchField'
import MobileSearchField from '@/components/MobileSearchField'
import RefreshButton from '@/components/RefreshButton'
import TableFooter from '@/components/TableFooter'
import PopUpFilter from '@/components/PopUpFilter'
import Loader from '@/components/Loader'
import ContainerWrapper from '@/components/ContainerWrapper'
import Spacer from '@/components/Spacer'
import ScrollContainer from '@/components/ScrollContainer'
import ListItem from '@/apps/user/components/ListItem/component'
import SelectField from '@/components/SelectField'
import CustomerAutoComplete from '@/apps/user/components/CustomerAutoComplete'
import DoneByAutoComplete from '@/apps/user/components/DoneByAutoComplete'
import CostCenterAutoComplete from '@/apps/user/components/CostCenterAutoComplete'
import DotMenu from '@/components/DotMenu'
import PaymentsModal from '@/apps/user/components/PaymentsModal'
import AmountSymbol from '@/components/AmountSymbol'
import { getSaleReturnMenuItems } from '@/config/menuItems'
import { format, isValid } from 'date-fns'
import { useSaleReturnExportAndPrint } from '@/hooks/api/exportAndPrint/useSaleReturnExportAndPrint'
import useSyncURLParams from '@/hooks/useSyncURLParams'
import './style.scss'

import ExportMenu from '@/components/ExportMenu'
import TextBadge from '@/apps/user/components/TextBadge' // Import added in the previous step

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });

// Extracted Row Component using React.memo
const SaleReturnRow = React.memo(({ sr, index, page, pageSize, handlers }) => {
  return (
    <Tr key={sr.id}>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{sr.date}</TdDate>
      <Td>{sr.party_name || `Sale ID: ${sr.sale_id}`}</Td>
      <Td>{sr.item_name || `Item ID: ${sr.item_id}`}</Td>
      <Td>{sr.done_by_name || 'N/A'}</Td>
      <Td>{sr.cost_center_name || 'N/A'}</Td>
      <Td>{sr.return_quantity}</Td>
      <Td>
        <AmountSymbol>{sr.total_refund_amount}</AmountSymbol>
      </Td>
      {/* MODIFIED: Use TextBadge for status column */}
      <Td>
        <TextBadge variant="paymentStatus" type={sr.status}>
          {sr.status}
        </TextBadge>
      </Td>
      {/* END MODIFIED */}
      <Td>{sr.reason}</Td>
      <Td>
        <DotMenu items={getSaleReturnMenuItems(sr, handlers)} />
      </Td>
    </Tr>
  )
})

const SaleReturnReport = () => {
  const [searchParams] = useSearchParams()
  const showToast = useToast()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  const defaltCostCenter = localStorage.getItem('DEFAULT_COST_CENTER') ?? ''
  const isDisableCostCenter = defaltCostCenter !== ''

  // UI States for filter inputs (Local State - Remain useState)
  const [partyId, setPartyId] = useState('')
  const [itemId, setItemId] = useState('')
  const [doneById, setDoneById] = useState('')
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sort, setSort] = useState('-date')
  const [searchType, setSearchType] = useState('')
  const [searchKey, setSearchKey] = useState('')

  // Other component states
  const [showFilter, setShowFilter] = useState(false)
  const [headerCustomer, setHeaderCustomer] = useState('')
  const [headerItem, setHeaderItem] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    rangeType: 'custom',
  })
  const [filterDatas, setFilterDatas] = useState({})
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false)
  const [selectedSaleReturnPayments, setSelectedSaleReturnPayments] = useState([])

  // --- 1. Centralized state initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get('page')) || 1,
    page_size: parseInt(searchParams.get('pageSize')) || 10,
    sort: searchParams.get('sort') || '-date',
    party_id: searchParams.get('partyId') || '',
    item_id: searchParams.get('itemId') || '',
    done_by_id: searchParams.get('doneById') || '',
    cost_center_id: searchParams.get('costCenterId') || defaltCostCenter,
    searchType: searchParams.get('searchType') || '',
    searchKey: searchParams.get('searchKey') || '',
    start_date: searchParams.get('startDate') || '',
    end_date: searchParams.get('endDate') || '',
  })

  // --- 2. Sync state to URL using custom hook ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    partyId: state.party_id,
    itemId: state.item_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  })

  const { data, isLoading, refetch, isRefetching } = useSaleReturnsPaginated(state)
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers({
    type: 'customer',
  })

  const { data: itemsData, isLoading: isLoadingItems } = useItemsPaginated({
    page_size: 1000,
    sort: 'name',
  })
  const { mutateAsync: deleteSaleReturn } = useDeleteSaleReturns()

  // Derived Data (Memoized)
  const listData = useMemo(() => data?.data || [], [data])
  const totalPages = data?.page_count || 1
  const totalItems = data?.count || 0
  const loading = isLoading || isRefetching

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    setPartyId(state.party_id || '')
    setItemId(state.item_id || '')
    setDoneById(state.done_by_id || '')
    setCostCenterId(state.cost_center_id || defaltCostCenter)
    setSort(state.sort || '-date')
    setSearchKey(state.searchKey || '')
    setSearchType(state.searchType || '')
    setStartDate(state.start_date || '')
    setEndDate(state.end_date || '')
    setHeaderCustomer(state.party_id || '')
    setHeaderItem(state.item_id || '')
    setDateFilter({
      startDate: state.start_date || '',
      endDate: state.end_date || '',
      rangeType: 'custom',
    })
  }, [state, defaltCostCenter])

  // Memoized Options
  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: c.name })),
    [customers]
  )

  const itemOptions = useMemo(
    () => itemsData?.data?.map((item) => ({ value: item.id, label: item.name })) || [],
    [itemsData]
  )

  // Update filterDatas for export
  useEffect(() => {
    setFilterDatas({
      party_id: partyId,
      item_id: itemId,
      doneById,
      costCenterId,
      headerCustomer,
      headerItem,
    })
  }, [partyId, itemId, doneById, costCenterId, headerCustomer, headerItem])

  const { exportToExcel, exportToPdf, printDocument } =
    useSaleReturnExportAndPrint({
      listData: listData,
      reportType: 'Sale Return Report',
      // FIXED: String interpolation error here
      duration: startDate && endDate ? `${startDate} to ${endDate}` : '', 
      pageNumber: state.page,
      selectedPageCount: state.page_size,
      totalPage: totalPages,
      totalData: {
        totalRefundAmount: data?.total_refund_amount || 0,
      },
      filterDatas,
      searchType: state.searchType,
      searchKey: state.searchKey,
    })

  // --- Handlers (Memoized & UPDATED setState CALLS) ---

  const handleSort = useCallback((value) => {
    setState({ page: 1, sort: value }) // Simplified setState
  }, [])

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ page: 1, [key]: value }) // Simplified setState
  }, [])

  const handleSearch = useCallback(() => {
    // Note: When using generic search, you typically want to clear other filters.
    // The reducer automatically handles merging, so we only need to specify the changes.
    setState({ // Simplified setState
      page: 1,
      searchType,
      searchKey,
      // Clear specific filters
      party_id: '',
      item_id: '',
      done_by_id: '',
      cost_center_id: defaltCostCenter, // Optionally clear to default
      start_date: '',
      end_date: '',
    })
  }, [searchType, searchKey, defaltCostCenter])

  const handleFilter = useCallback(() => {
    setState({ // Simplified setState
      party_id: partyId,
      item_id: itemId,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      start_date: startDate,
      end_date: endDate,
      page: 1,
      // Clear search to prevent conflict
      searchType: '',
      searchKey: '',
    })
    setShowFilter(false)
  }, [partyId, itemId, doneById, costCenterId, startDate, endDate])

  const handleRefresh = useCallback(() => {
    // Reset local UI states
    setPartyId('')
    setItemId('')
    setDoneById('')
    if (!isDisableCostCenter) setCostCenterId(defaltCostCenter)
    setHeaderCustomer('')
    setHeaderItem('')
    setEndDate('')
    setStartDate('')
    setSearchKey('')
    setSearchType('')
    setSort('-date')
    setDateFilter({ startDate: '', endDate: '', rangeType: 'custom' })
    
    // Reset Main State
    setState({ // Simplified setState (full reset object)
      party_id: '',
      item_id: '',
      done_by_id: '',
      cost_center_id: defaltCostCenter,
      start_date: '',
      end_date: '',
      page: 1,
      page_size: 10,
      sort: '-date',
      searchType: '',
      searchKey: '',
    })
  }, [defaltCostCenter, isDisableCostCenter])

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue)
    setState({ // Simplified setState
      start_date: newFilterValue.startDate || '',
      end_date: newFilterValue.endDate || '',
      page: 1,
    })
  }, [])

  const handleHeaderCustomerFilter = useCallback((value) => {
    setHeaderCustomer(value)
    setState({ page: 1, party_id: value }) // Simplified setState
  }, [])

  const handleHeaderItemFilter = useCallback((value) => {
    setHeaderItem(value)
    setState({ page: 1, item_id: value }) // Simplified setState
  }, [])

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }) // Simplified setState
  }, [])

  const handlePageChange = useCallback((value) => {
    setState({ page: value }) // Simplified setState
  }, [])

  const searchOptions = useMemo(() => ([
    { value: 'invoice_number', name: 'Invoice No.' },
    { value: 'reason', name: 'Reason' },
    { value: 'item_name', name: 'Item Name' },
    { value: 'party_name', name: 'Customer Name' },
    { value: 'done_by_name', name: 'Done By' },
    ...(!isDisableCostCenter
      ? [{ value: 'cost_center_name', name: 'Cost Center' }]
      : []),
  ]), [isDisableCostCenter])

  const handleAddClick = useCallback(() => navigate(`/sale-return/add`), [navigate])
  
  const handleEditClick = useCallback((id, returnData) =>
    navigate(`/sale-return/edit/${id}`, { state: { returnData } }), [navigate])
    
  const handleViewClick = useCallback((id, returnData) =>
    navigate(`/sale-return/view/${id}`, { state: { returnData } }), [navigate])

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteSaleReturn(id)
      showToast({
        crudItem: CRUDITEM.SALE_RETURN,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
      refetch()
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.SALE_RETURN,
        crudType: CRUDTYPE.DELETE_ERROR,
      })
    }
  }, [deleteSaleReturn, refetch, showToast])

  const handleShowPayments = useCallback((returnData) => {
    const paymentData = (returnData.payment_methods || []).map(
      (payment, index) => ({
        id: `${returnData.id}-${index}`,
        date: returnData.date,
        amount: payment.amount || 0,
        customerName: returnData.party_name || 'N/A',
        returnedTo: payment.account_name || 'N/A',
      }),
    )

    setSelectedSaleReturnPayments(paymentData)
    setIsPaymentsModalOpen(true)
  }, [])

  const handleClosePaymentsModal = useCallback(() => {
    setIsPaymentsModalOpen(false)
    setSelectedSaleReturnPayments([])
  }, [])

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    partyId,
    setPartyId,
    customerOptions,
    isLoadingCustomers,
    itemId,
    setItemId,
    itemOptions,
    isLoadingItems,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isDisableCostCenter,
  }

  const handlers = useMemo(() => ({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onShowPayments: handleShowPayments,
  }), [handleViewClick, handleEditClick, handleDelete, handleShowPayments])

  const { startDate: dfStartDate, endDate: dfEndDate } = dateFilter
  const isDateFilterActive =
    dfStartDate &&
    dfEndDate &&
    isValid(new Date(dfStartDate)) &&
    isValid(new Date(dfEndDate))

  const dateSubtitle = isDateFilterActive
    ? `${format(new Date(dfStartDate), 'MMM d, yyyy')} → ${format(
        new Date(dfEndDate),
        'MMM d, yyyy',
      )}`
    : null

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton
              title="Sale Returns"
              subtitle={dateSubtitle}
            />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />

                  <ListFilter {...filterProps} />

                  <RefreshButton onClick={handleRefresh} />

                  {!loading && (
                    <ExportMenu
                      onExcel={exportToExcel}
                      onPdf={exportToPdf}
                      onPrint={printDocument}
                    />
                  )}

                  <PopupSearchField
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />

                  <AddButton onClick={handleAddClick} />
                </>
              }
            />

            {loading ? (
              <Loader />
            ) : (
              <>
                <Table>
                  <Thead>
                    <Tr>
                      <ThSL />
                      <Th>
                        <ThContainer>
                          Return Date
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              handleSort={handleSort}
                              value="date"
                            />
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Customer
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="party_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <CustomerAutoComplete
                                name="headerCustomerId"
                                value={headerCustomer}
                                onChange={(e) =>
                                  handleHeaderCustomerFilter(e.target.value)
                                }
                                placeholder="Search & select customer"
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Item
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="item_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <SelectField
                                placeholder="Select Item"
                                value={headerItem}
                                onChange={(e) =>
                                  handleHeaderItemFilter(e.target.value)
                                }
                                options={[
                                  { value: '', label: 'All Items' },
                                  ...itemOptions,
                                ]}
                                isLoading={isLoadingItems}
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
                              sort={sort}
                              setSort={setSort}
                              value="done_by"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <DoneByAutoComplete
                                placeholder="Select Done By"
                                value={state.done_by_id}
                                onChange={(e) =>
                                  handleHeaderSearch(
                                    'done_by_id',
                                    e.target.value,
                                  )
                                }
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
                              sort={sort}
                              setSort={setSort}
                              value="cost_center"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <CostCenterAutoComplete
                                placeholder="Select Cost Center"
                                value={state.cost_center_id}
                                onChange={(e) =>
                                  handleHeaderSearch(
                                    'cost_center_id',
                                    e.target.value,
                                  )
                                }
                              />
                            </ThSearchOrFilterPopover>
                          </ThFilterContainer>
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Quantity
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            handleSort={handleSort}
                            value="return_quantity"
                          />
                        </ThContainer>
                      </Th>
                      <Th>
                        <ThContainer>
                          Refund Amount
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="total_refund_amount"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      {/* ADDED: Status Header */}
                      <Th>Status</Th> 
                      <Th>Reason</Th>
                      <ThDotMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((sr, index) => (
                        <SaleReturnRow
                          key={sr.id}
                          sr={sr}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={handlers}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.SaleReturn}
                        noOfCol={11} 
                      />
                    )}
                  </Tbody>
                </Table>
              </>
            )}
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
        ) : (
          <>
            <PageTitleWithBackButton title="Sale Returns" />
            <ScrollContainer>
              <PageHeader>
                <HStack>
                  <DateFilter
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                  />
                  <ListFilter {...filterProps} />
                  <RefreshButton onClick={handleRefresh} />

                  <MobileSearchField
                    searchKey={searchKey}
                    setSearchKey={setSearchKey}
                    searchType={searchType}
                    setSearchType={setSearchType}
                    handleSearch={handleSearch}
                    searchOptions={searchOptions}
                    searchRef={searchRef}
                  />
                </HStack>
                <div className="sale_return_report__add_button">
                  <AddButton onClick={handleAddClick} />
                </div>
              </PageHeader>
              <div className="sale_report" style={{ marginTop: '0' }}>
                {isLoading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.SaleReturn} />
                ) : (
                  <div className="mobile-list-view">
                    {listData.map((sr) => (
                      <ListItem
                        key={sr.id}
                        title={sr.item_name || `Item ID: ${sr.item_id}`}
                        subtitle={
                          <>
                            <div>
                              Customer:{' '}
                              {sr.party_name || `Sale ID: ${sr.sale_id}`}
                            </div>
                            <div>Qty: {sr.return_quantity}</div>
                            {/* MODIFIED: Use TextBadge for status in mobile view */}
                            <div>Status: <TextBadge variant="paymentStatus" type={sr.status}>{sr.status}</TextBadge></div>
                            {/* END MODIFIED */}
                            <div>{sr.reason}</div>
                          </>
                        }
                        amount={
                          <div style={{ display: 'flex' }}>
                            <div style={{ textAlign: 'right' }}>
                              <AmountSymbol>
                                {sr.total_refund_amount}
                              </AmountSymbol>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  marginTop: '4px',
                                }}
                              >
                                {new Date(sr.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DotMenu
                                items={getSaleReturnMenuItems(sr, handlers)}
                              />
                            </div>
                          </div>
                        }
                        actions={null}
                      />
                    ))}
                  </div>
                )}
              </div>
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

      <PaymentsModal
        isOpen={isPaymentsModalOpen}
        onClose={handleClosePaymentsModal}
        payments={selectedSaleReturnPayments}
        type="sale_return"
      />
    </>
  )
}

export default SaleReturnReport

const ListFilter = React.memo(({ ...props }) => {
  const {
    showFilter,
    setShowFilter,
    handleFilter,
    partyId,
    setPartyId,
    itemId,
    setItemId,
    itemOptions,
    isLoadingItems,
    doneById,
    setDoneById,
    costCenterId,
    setCostCenterId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isDisableCostCenter,
  } = props;

  const isMobile = useIsMobile()

  return (
    <PopUpFilter
      isOpen={showFilter}
      setIsOpen={setShowFilter}
      onApply={handleFilter}
    >
      <VStack spacing={4}>
        <CustomerAutoComplete
          name="partyId"
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          placeholder="select a customer"
        />
        <SelectField
          label="Item"
          placeholder="Item"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          options={[{ value: '', label: 'All Items' }, ...itemOptions]}
          isLoading={isLoadingItems}
        />
        <DoneByAutoComplete
          placeholder="Done By"
          value={doneById}
          onChange={(e) => setDoneById(e.target.value)}
          name="done_by_id"
        />
        <CostCenterAutoComplete
          placeholder="Cost Center"
          value={costCenterId}
          onChange={(e) => setCostCenterId(e.target.value)}
          name="cost_center_id"
          disabled={isDisableCostCenter}
        />
        {isMobile ? (
          <>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split('T') : '')
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split('T') : '')
              }
            />
          </>
        ) : (
          <HStack>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split('T') : '')
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split('T') : '')
              }
            />
          </HStack>
        )}
      </VStack>
    </PopUpFilter>
  )
})