import React, { useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useDeletePurchaseReturns from '@/hooks/api/purchaseReturns/useDeletePurchaseReturns'
import usePurchaseReturnsPaginated from '@/hooks/api/purchaseReturns/usePurchaseReturnsPaginated'
import useItemsPaginated from '@/hooks/api/item/useItemPaginated'
import useSuppliersPaginated from '@/hooks/api/supplier/useSuppliersPaginated'
import useAccounts from '@/hooks/api/account/useAccounts'
import { Transaction } from '@/constants/object/transaction'
import { useIsMobile } from '@/utils/useIsMobile'
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
import DateField from '@/components/DateField'
import DateFilter from '@/components/DateFilter'
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
import DotMenu from '@/components/DotMenu'
import PaymentsModal from '@/apps/user/components/PaymentsModal'
import DoneByAutoComplete from '@/apps/user/components/DoneByAutoComplete'
import CostCenterAutoComplete from '@/apps/user/components/CostCenterAutoComplete'
import { getPurchaseReturnMenuItems } from '@/config/menuItems'
import { format, isValid } from 'date-fns'
import { usePurchaseReturnExportAndPrint } from '@/hooks/api/exportAndPrint/usePurchaseReturnExportAndPrint'
import useSyncURLParams from '@/hooks/useSyncURLParams';
import './style.scss'

import ExportMenu from '@/components/ExportMenu'
import TextBadge from '@/apps/user/components/TextBadge' // <--- ADDED IMPORT

// REDUCER FUNCTION: Handles merging of state updates
const stateReducer = (state, newState) => ({ ...state, ...newState });


// Extracted Row Component using React.memo
const PurchaseReturnRow = React.memo(({ pr, index, page, pageSize, handlers }) => {
  const menuItems = useMemo(() => getPurchaseReturnMenuItems(pr, handlers), [pr, handlers]);

  return (
    <Tr key={pr.id}>
      <TdSL index={index} page={page} pageSize={pageSize} />
      <TdDate>{pr.date}</TdDate>
      <Td>{pr.party_name}</Td>
      <Td>{pr.item_name}</Td>
      <Td>{pr.done_by_name}</Td>
      <Td>{pr.cost_center_name}</Td>
      <Td>{pr.return_quantity}</Td>
      <Td>{pr.reason || 'N/A'}</Td>
      <Td> {/* <--- MODIFIED: Use TextBadge for status */}
        <TextBadge variant="paymentStatus" type={pr.status}>
          {pr.status}
        </TextBadge>
      </Td>
      <Td>
        <DotMenu items={menuItems} />
      </Td>
    </Tr>
  )
})

// Extracted Mobile Card Component using React.memo
const MobilePurchaseReturnCard = React.memo(({ pr, handlers }) => {
  const menuItems = useMemo(() => getPurchaseReturnMenuItems(pr, handlers), [pr, handlers]);

  return (
    <ListItem
      title={pr.item_name}
      subtitle={
        <div>
          <div>Supplier: {pr.party_name || 'NA'}</div>
          {pr.reason && (
            <div style={{ color: '#666', fontSize: '0.8rem' }}>
              Reason: {pr.reason}
            </div>
          )}
          <div style={{ marginTop: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}> {/* <--- MODIFIED: Added style for alignment */}
            Status:
            <TextBadge variant="paymentStatus" type={pr.status}> {/* <--- MODIFIED: Use TextBadge for status */}
              {pr.status}
            </TextBadge>
          </div>
        </div>
      }
      amount={
        <div style={{ display: 'flex' }}>
          <div style={{ textAlign: 'right' }}>
            <div>Qty: {pr.return_quantity}</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              {new Date(pr.date).toLocaleDateString()}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DotMenu items={menuItems} />
          </div>
        </div>
      }
      actions={null}
    />
  )
})

const PurchaseReturnReport = () => {
  const [searchParams] = useSearchParams();
  const showToast = useToast()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  const defaltCostCenter = localStorage.getItem('DEFAULT_COST_CENTER') ?? ''
  const isDisableCostCenter = defaltCostCenter !== ''

  // UI States for filter inputs (Local State - Remain useState)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [itemId, setItemId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [doneById, setDoneById] = useState('')
  const [costCenterId, setCostCenterId] = useState(defaltCostCenter)
  const [sort, setSort] = useState('-date')
  const [searchType, setSearchType] = useState('')
  const [searchKey, setSearchKey] = useState('')

  // Other component states
  const [showFilter, setShowFilter] = useState(false)
  const [headerItem, setHeaderItem] = useState('')
  const [headerParty, setHeaderParty] = useState('')
  const [headerDoneById, setHeaderDoneById] = useState('')
  const [headerCostCenterId, setHeaderCostCenterId] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    rangeType: 'custom',
  })
  const [filterDatas, setFilterDatas] = useState({})
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false)
  const [selectedPurchaseReturnPayments, setSelectedPurchaseReturnPayments] =
    useState([])

  // --- 1. Centralized state initialized from URL using useReducer (UPDATED) ---
  const [state, setState] = useReducer(stateReducer, {
    page: parseInt(searchParams.get("page")) || 1,
    page_size: parseInt(searchParams.get("pageSize")) || 10,
    sort: searchParams.get("sort") || '-date',
    item_id: searchParams.get("itemId") || '',
    party_id: searchParams.get("partyId") || '',
    done_by_id: searchParams.get("doneById") || '',
    cost_center_id: searchParams.get("costCenterId") || defaltCostCenter,
    searchType: searchParams.get("searchType") || '',
    searchKey: searchParams.get("searchKey") || '',
    start_date: searchParams.get("startDate") || '', // Re-synced dates for consistency
    end_date: searchParams.get("endDate") || '', // Re-synced dates for consistency
  })

  // --- 2. Sync state to URL using custom hook ---
  useSyncURLParams({
    page: state.page,
    pageSize: state.page_size,
    sort: state.sort,
    itemId: state.item_id,
    partyId: state.party_id,
    doneById: state.done_by_id,
    costCenterId: state.cost_center_id,
    searchType: state.searchType,
    searchKey: state.searchKey,
    startDate: state.start_date,
    endDate: state.end_date,
  });

  // Fetching data for filters
  const { data: itemsData, isLoading: isLoadingItems } = useItemsPaginated({
    page_size: 1000,
    sort: 'name',
  })
  const { data: suppliersData, isLoading: isLoadingSuppliers } =
    useSuppliersPaginated({ page_size: 1000, sort: 'name' })

  const { data: accounts = [] } = useAccounts()

  const itemOptions = useMemo(() => 
    itemsData?.data?.map((item) => ({ value: item.id, label: item.name })) || [], 
  [itemsData]);

  const supplierOptions = useMemo(() => 
    suppliersData?.data?.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    })) || [], 
  [suppliersData]);

  const accountNameMap = useMemo(() => {
    if (!accounts.length) return {}
    return accounts.reduce((map, account) => {
      map[account.id] = account.name
      return map
    }, {})
  }, [accounts])

  const { data, isLoading, refetch, isRefetching } = usePurchaseReturnsPaginated(state)
  const { mutateAsync: deletePurchaseReturn, isLoading: isDeleting } = useDeletePurchaseReturns()

  // Derived Data (Matching ExpenseReport pattern)
  const listData = useMemo(() => data?.data || [], [data]);
  const totalPages = data?.page_count || 1; // Direct assignment
  const totalItems = data?.count || 0;      // Direct assignment
  const loading = isLoading || isRefetching;

  // --- 3. Sync UI Controls from main state ---
  useEffect(() => {
    setItemId(state.item_id || '');
    setPartyId(state.party_id || '');
    setDoneById(state.done_by_id || '');
    setCostCenterId(state.cost_center_id || defaltCostCenter);
    setSort(state.sort || '-date');
    setSearchKey(state.searchKey || '');
    setSearchType(state.searchType || '');
    setStartDate(state.start_date || '');
    setEndDate(state.end_date || '');
    setHeaderItem(state.item_id || '');
    setHeaderParty(state.party_id || '');
    setHeaderDoneById(state.done_by_id || '');
    setHeaderCostCenterId(state.cost_center_id || '');
    setDateFilter({
        startDate: state.start_date || null,
        endDate: state.end_date || null,
        rangeType: 'custom',
    });
  }, [state, defaltCostCenter]);


  // Update filterDatas for export
  useEffect(() => {
    setFilterDatas({
      item_id: itemId,
      party_id: partyId,
      doneById,
      costCenterId,
      headerItem,
      headerParty,
    })
  }, [itemId, partyId, doneById, costCenterId, headerItem, headerParty])

  const { exportToExcel, exportToPdf, printDocument } =
    usePurchaseReturnExportAndPrint({
      listData: listData,
      reportType: 'Purchase Return Report',
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

  // --- Handlers (Memoized) - UPDATED setState CALLS ---

  const handleSort = useCallback((value) => {
    setSort(value)
    setState({ page: 1, sort: value }) // Simplified setState
  }, [])

  const handleHeaderSearch = useCallback((key, value) => {
    setState({ page: 1, [key]: value }) // Simplified setState
  }, [])

  const handleSearch = useCallback(() => {
    setState({ // Simplified setState
      page: 1,
      searchType,
      searchKey,
    })
  }, [searchType, searchKey])

  const handleDateFilterChange = useCallback((newFilterValue) => {
    setDateFilter(newFilterValue)
    setState({ // Simplified setState
      start_date: newFilterValue.startDate || '',
      end_date: newFilterValue.endDate || '',
      page: 1,
    })
  }, [])

  const handleFilter = useCallback(() => {
    setState({ // Simplified setState
      start_date: startDate,
      end_date: endDate,
      item_id: itemId,
      party_id: partyId,
      done_by_id: doneById,
      cost_center_id: costCenterId,
      page: 1,
    })
    setShowFilter(false)
  }, [startDate, endDate, itemId, partyId, doneById, costCenterId])

  const handleHeaderItemFilter = useCallback((value) => {
    setHeaderItem(value)
    setState({ page: 1, item_id: value }) // Simplified setState
  }, [])

  const handleHeaderPartyFilter = useCallback((value) => {
    setHeaderParty(value)
    setState({ page: 1, party_id: value }) // Simplified setState
  }, [])

  const handleHeaderDoneByFilter = useCallback((value) => {
    setHeaderDoneById(value)
    setState({ page: 1, done_by_id: value }) // Simplified setState
  }, [])

  const handleHeaderCostCenterFilter = useCallback((value) => {
    setHeaderCostCenterId(value)
    setState({ page: 1, cost_center_id: value }) // Simplified setState
  }, [])

  const handleRefresh = useCallback(() => {
    const defaultState = {
      start_date: '',
      end_date: '',
      item_id: '',
      party_id: '',
      done_by_id: '',
      cost_center_id: defaltCostCenter,
      page: 1,
      page_size: 10,
      sort: '-date',
      searchType: '',
      searchKey: '',
    };
    
    // Reset local UI states
    setEndDate('');
    setStartDate('');
    setSearchKey('');
    setSearchType('');
    setItemId('');
    setPartyId('');
    setDoneById('');
    if (!isDisableCostCenter) setCostCenterId(defaltCostCenter);
    setHeaderItem('');
    setHeaderParty('');
    setHeaderDoneById('');
    setHeaderCostCenterId('');
    setSort('-date');
    setDateFilter({ startDate: null, endDate: null, rangeType: 'custom' });

    // Reset Main State
    setState(defaultState); // Simplified setState with full default object
  }, [defaltCostCenter, isDisableCostCenter])

  const handlePageLimitSelect = useCallback((value) => {
    setState({ page_size: value, page: 1 }) // Simplified setState
  }, [])

  const handlePageChange = useCallback((value) => {
    setState({ page: value }) // Simplified setState
  }, [])

  const searchOptions = useMemo(() => ([
    { value: 'item_name', name: 'Item Name' },
    { value: 'party_name', name: 'Supplier Name' },
    { value: 'purchase_id', name: 'Purchase ID' },
    { value: 'reason', name: 'Reason' },
    ...(!isDisableCostCenter
      ? [{ value: 'cost_center_name', name: 'Cost Center' }]
      : []),
  ]), [isDisableCostCenter])

  const handleEditClick = useCallback((id, returnData) =>
    navigate(`/purchase-return/edit/${id}`, { state: { returnData } }), [navigate])
    
  const handleViewClick = useCallback((id, returnData) =>
    navigate(`/purchase-return/view/${id}`), [navigate])

  const handleDelete = useCallback(async (id) => {
    try {
      await deletePurchaseReturn(id)
      showToast({
        crudItem: CRUDITEM.PURCHASE_RETURN,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      })
      refetch()
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.PURCHASE_RETURN,
        crudType: CRUDTYPE.DELETE_ERROR,
      })
    }
  }, [deletePurchaseReturn, refetch, showToast])

  const handleShowPayments = useCallback((returnData) => {
    const paymentData = [
      {
        id: returnData.id,
        date: returnData.date,
        amount: returnData.refund_amount || 0,
        paidTo: accountNameMap[returnData.account_id] || 'N/A',
      },
    ]
    setSelectedPurchaseReturnPayments(paymentData)
    setIsPaymentsModalOpen(true)
  }, [accountNameMap])

  const handleClosePaymentsModal = useCallback(() => {
    setIsPaymentsModalOpen(false)
    setSelectedPurchaseReturnPayments([])
  }, [])

  // Memoized Handlers for Rows
  const rowHandlers = useMemo(() => ({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: handleDelete,
    onShowPayments: handleShowPayments,
  }), [handleViewClick, handleEditClick, handleDelete, handleShowPayments])

  const filterProps = {
    showFilter,
    setShowFilter,
    handleFilter,
    partyId,
    setPartyId,
    supplierOptions,
    isLoadingSuppliers,
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
              title="Purchase Returns"
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
                          Supplier
                          <ThFilterContainer>
                            <ThSort
                              sort={sort}
                              setSort={setSort}
                              value="party_name"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <SelectField
                                value={headerParty}
                                onChange={(e) =>
                                  handleHeaderPartyFilter(e.target.value)
                                }
                                options={[
                                  { value: '', label: 'All Suppliers' },
                                  ...supplierOptions,
                                ]}
                                isLoading={isLoadingSuppliers}
                                isLabel={false}
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
                                value={headerItem}
                                onChange={(e) =>
                                  handleHeaderItemFilter(e.target.value)
                                }
                                options={[
                                  { value: '', label: 'All Items' },
                                  ...itemOptions,
                                ]}
                                isLoading={isLoadingItems}
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
                              sort={sort}
                              setSort={setSort}
                              value="done_by"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover
                              isSearch={false}
                              popoverWidth={220}
                            >
                              <DoneByAutoComplete
                                placeholder="Select Done By"
                                value={headerDoneById}
                                onChange={(e) =>
                                  handleHeaderDoneByFilter(e.target.value)
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
                              sort={sort}
                              setSort={setSort}
                              value="cost_center"
                              handleSort={handleSort}
                            />
                            <ThSearchOrFilterPopover isSearch={false}>
                              <CostCenterAutoComplete
                                placeholder="Select Cost Center"
                                value={headerCostCenterId}
                                onChange={(e) =>
                                  handleHeaderCostCenterFilter(e.target.value)
                                }
                                is_edit={false}
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
                      <Th>Reason</Th>
                      <Th>
                        <ThContainer>
                          Status
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="status"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      <ThDotMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((pr, index) => (
                        <PurchaseReturnRow
                          key={pr.id}
                          pr={pr}
                          index={index}
                          page={state.page}
                          pageSize={state.page_size}
                          handlers={rowHandlers}
                        />
                      ))
                    ) : (
                      <TableCaption
                        item={Transaction.PurchaseReturn}
                        noOfCol={10}
                      />
                    )}
                  </Tbody>
                </Table>
              </>
            )}
            {!loading && listData.length > 0 && (
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
            <PageTitleWithBackButton title="Purchase Returns" />
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
              </PageHeader>
              <div className="purchase_report" style={{ marginTop: '0' }}>
                {loading ? (
                  <Loader />
                ) : listData.length === 0 ? (
                  <TableCaption item={Transaction.PurchaseReturn} />
                ) : (
                  <div className="mobile-list-view">
                    {listData.map((pr) => (
                      <MobilePurchaseReturnCard 
                        key={pr.id}
                        pr={pr}
                        handlers={rowHandlers}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Spacer />
              {!loading && listData.length > 0 && (
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
        payments={selectedPurchaseReturnPayments}
        type="purchase_return"
      />
    </>
  )
}

export default PurchaseReturnReport

// Memoized List Filter
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
    supplierOptions,
    isLoadingSuppliers,
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
        <SelectField
          label="Select Item"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          options={[
            { value: '', label: 'All Items' },
            ...itemOptions,
          ]}
          isLoading={isLoadingItems}
        />

        <SelectField
          label="Select Supplier"
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          options={[
            { value: '', label: 'All Suppliers' },
            ...supplierOptions,
          ]}
          isLoading={isLoadingSuppliers}
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
          disabled={isDisableCostCenter}
        />

        {isMobile ? (
          <>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split('T')[0] : '')
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split('T')[0] : '')
              }
            />
          </>
        ) : (
          <HStack>
            <DateField
              label="Start Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                setStartDate(date ? date.toISOString().split('T')[0] : '')
              }
            />
            <DateField
              label="End Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                setEndDate(date ? date.toISOString().split('T')[0] : '')
              }
            />
          </HStack>
        )}
      </VStack>
    </PopUpFilter>
  )
})