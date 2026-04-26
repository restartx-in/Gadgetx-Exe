import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaThList,
  FaPauseCircle,
  FaHistory,
  FaTachometerAlt,
  FaPlus,
  FaClipboardList,
  FaCashRegister,
  FaExpand,
  FaCompress,
  FaShoppingCart,
  FaThLarge,
} from 'react-icons/fa'
import { FiArrowLeft } from 'react-icons/fi';


import CustomerAutoCompleteWithAddOption from '@/apps/user/components/CustomerAutoCompleteWithAddOption'
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption'
import Loader from '@/components/Loader'
import BarcodeScannerInput from '@/apps/user/components/BarcodeScannerInput'
import ReceiptModal from '@/apps/user/components/ReceiptModal'
import IconBackButton from '@/apps/user/components/IconBackButton/component'
import AddCustomer from '@/apps/user/pages/List/CustomerList/components/AddCustomer'
import AddDoneBy from '@/apps/user/pages/List/DoneByList/components/AddDoneBy'
import SalesListModal from './components/SalesListModal'
import CartTable from './components/CartTable'
import SummaryPanel from './components/SummaryPanel'
import ProductCard from './components/ProductCard'
import MobileActionDropdown from './components/MobileActionDropdown'
import PaymentModal from './components/PaymentModal'
import HeldSalesModal from './components/HeldSalesModal'
import RegisterDetailsModal from './components/RegisterDetailsModal'

import OpenRegisterModal from './components/OpenRegisterModal'
import CloseRegisterModal from './components/CloseRegisterModal'
import useCurrentRegisterSession from '@/hooks/api/registerSession/useCurrentRegisterSession'

import { useToast } from '@/context/ToastContext'
import useItem from '@/hooks/api/item/useItem'
import useAccounts from '@/hooks/api/account/useAccounts'
import { useCustomers } from '@/hooks/api/customer/useCustomers'
import { useDoneBys } from '@/hooks/api/doneBy/useDoneBys'
import { useModeOfPayments } from '@/hooks/api/modeOfPayment/useModeOfPayments'
import useCreateSales from '@/hooks/api/sales/useCreateSales'
import useSalesPaginated from '@/hooks/api/sales/useSalesPaginated'
import { useIsMobile } from '@/utils/useIsMobile'
import { useSaleInvoiceNo } from '@/hooks/api/saleInvoiceNo/useSaleInvoiceNo'
import { TOASTSTATUS, TOASTTYPE } from '@/constants/object/toastType'
import { CRUDITEM, CRUDTYPE } from '@/constants/object/crud'

import './style.scss'

const HELD_SALES_KEY = 'pos_held_sales'

const POS = () => {
  const navigate = useNavigate()
  const showToast = useToast()
  const customerRef = useRef(null)
  const doneByRef = useRef(null)
  const searchRef = useRef(null)

  const isMobile = useIsMobile()
  const [activeMobileView, setActiveMobileView] = useState('products')

  // --- REGISTER SESSION STATE ---
  const [isOpenRegisterModalOpen, setIsOpenRegisterModalOpen] = useState(false)
  const [isCloseConfirmationModalOpen, setIsCloseConfirmationModalOpen] = useState(false)
  const [pendingNavigationPath, setPendingNavigationPath] = useState(null)
  
  // Fetch current session status
  const { data: currentSession, isLoading: isLoadingSession, refetch: refetchSession } = useCurrentRegisterSession()
  // ------------------------------

  const [cart, setCart] = useState([])
  const [selectedPartyId, setselectedPartyId] = useState('')
  const [selectedDoneById, setSelectedDoneById] = useState('')
  const [discountType, setDiscountType] = useState('Fixed')
  const [discount, setDiscount] = useState(0)
  const [activeCategory, setActiveCategory] = useState('All Categories')
  const [activeBrand, setActiveBrand] = useState('All Brands')
  const [activeModal, setActiveModal] = useState(null)
  const [heldSales, setHeldSales] = useState([])
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false)
  const [heldItemIds, setHeldItemIds] = useState(new Set())
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isDoneByModalOpen, setIsDoneByModalOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchType, setSearchType] = useState('name')
  const [searchKey, setSearchKey] = useState('')

  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts()
  const { data: items = [], isLoading: isFetchingItems } = useItem()
  const { data: modeOfPayments = [] } = useModeOfPayments() 
  const { data: invoiceNoData } = useSaleInvoiceNo()
  const { data: customers = [], isLoading: isFetchingCustomers, refetch: refetchCustomers } = useCustomers()
  const { data: doneBys = [], isLoading: isFetchingDoneBys, refetch: refetchDoneBys } = useDoneBys()
  const { mutateAsync: createSale, isPending: isCreatingSale } = useCreateSales()

  const [modalFilters, setModalFilters] = useState({})
  const { data: modalSalesData } = useSalesPaginated(modalFilters)

  // --- 1. CHECK SESSION ON LOAD ---
  useEffect(() => {
  if (isLoadingSession) return;

  if (!currentSession) {
    setIsOpenRegisterModalOpen(true);
    return;
  }

  const sessionDoneBy = currentSession?.session?.done_by_id;

  if (sessionDoneBy) {
    setSelectedDoneById(prev => prev || sessionDoneBy);
  }

}, [currentSession, isLoadingSession]);



  // --- NAVIGATION INTERCEPTOR ---
  const handleNavigation = (path) => {
    if (currentSession?.session) {
      setPendingNavigationPath(path)
      setIsCloseConfirmationModalOpen(true)
    } else {
      if (path === -1) navigate(-1)
      else navigate(path)
    }
  }

  const handleRegisterOpened = (doneById) => {
      refetchSession() 
      if (doneById) setSelectedDoneById(doneById)
      setIsOpenRegisterModalOpen(false)
  }

  const handleKeepOpen = () => {
    setIsCloseConfirmationModalOpen(false)
    if (pendingNavigationPath) {
        if (pendingNavigationPath === -1) navigate(-1)
        else navigate(pendingNavigationPath)
    }
  }

  const handleRegisterClosed = () => {
    setIsCloseConfirmationModalOpen(false)
    refetchSession() 
    if (pendingNavigationPath) {
        if (pendingNavigationPath === -1) navigate(-1)
        else navigate(pendingNavigationPath)
    }
  }
  useEffect(() => {
  if (customers.length === 0) return;

  setselectedPartyId(prev => {
    if (prev) return prev; 
    const walkIn = customers.find(c => c.name?.toLowerCase() === 'walk in customer');
    return walkIn ? walkIn.id : prev;
  });

}, [customers]);


  useEffect(() => {
    const savedHeldSales = JSON.parse(
      localStorage.getItem(HELD_SALES_KEY) || '[]'
    )
    setHeldSales(savedHeldSales)
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const categories = useMemo(
    () => [
      'All Categories',
      ...new Set(items.map((item) => item.category_name).filter(Boolean)),
    ],
    [items]
  )
  const brands = useMemo(
    () => [
      'All Brands',
      ...new Set(items.map((item) => item.brand_name).filter(Boolean)),
    ],
    [items]
  )
  const searchOptions = [
    { value: 'name', name: 'Name' },
    { value: 'bar_code', name: 'Barcode' },
  ]

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === 'All Categories' ||
        item.category_name === activeCategory
      const matchesBrand =
        activeBrand === 'All Brands' || item.brand_name === activeBrand
      if (!searchKey) return matchesCategory && matchesBrand
      const searchField = item[searchType] || ''
      const matchesSearch = searchField
        .toLowerCase()
        .includes(searchKey.toLowerCase())
      return matchesCategory && matchesBrand && matchesSearch
    })
  }, [items, activeCategory, activeBrand, searchKey, searchType])
  
  const round2 = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }

  const summary = useMemo(() => {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0)
    const subTotal = cart.reduce(
      (sum, item) => sum + round2(item.price * item.quantity),
      0
    )
    const taxAmount = cart.reduce((sum, item) => {
      const itemSubtotal = round2(item.price * item.quantity)
      const itemTax = round2((itemSubtotal * item.tax) / 100)
      return sum + itemTax
    }, 0)
    const discountAmount =
      discountType === 'Percentage'
        ? round2((subTotal * discount) / 100)
        : round2(discount)
    const total = subTotal + taxAmount - discountAmount
    return {
      totalQty,
      subTotal: round2(subTotal),
      taxAmount: round2(taxAmount),
      discountAmount: round2(discountAmount),
      total: round2(total),
    }
  }, [cart, discount, discountType])

  const registerSummary = useMemo(() => {
    if (!modalSalesData?.data) return null
    const cashInHand = accounts
      .filter((acc) => acc.type === 'cash')
      .reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0)
    const cashAtBank = accounts
      .filter((acc) => acc.type === 'bank')
      .reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0)
    let totalSales = 0
    let totalRefund = 0
    modalSalesData.data.forEach((sale) => {
      if (['paid', 'partial'].includes(sale.status))
        totalSales += parseFloat(sale.total_amount || 0)
      if (sale.status === 'refund')
        totalRefund += parseFloat(sale.total_amount || 0)
    })
    return {
      cashInHand,
      cashAtBank,
      totalSales,
      totalRefund,
      totalPayment: totalSales - totalRefund,
    }
  }, [accounts, modalSalesData])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error)
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  const updateHeldSales = (newHeldSales) => {
    setHeldSales(newHeldSales)
    localStorage.setItem(HELD_SALES_KEY, JSON.stringify(newHeldSales))
  }

  const handleOpenAddCustomerModal = () => setIsCustomerModalOpen(true)
  const handleCloseCustomerModal = () => setIsCustomerModalOpen(false)
  const handleCustomerCreated = (newCustomer) => {
    if (newCustomer?.id) {
      refetchCustomers()
      setselectedPartyId(newCustomer.id)
    }
    handleCloseCustomerModal()
  }

  const handleOpenAddDoneByModal = () => setIsDoneByModalOpen(true)
  const handleCloseDoneByModal = () => setIsDoneByModalOpen(false)
  const handleDoneByCreated = (newDoneBy) => {
    if (newDoneBy?.id) {
      refetchDoneBys()
      setSelectedDoneById(newDoneBy.id)
    }
    handleCloseDoneByModal()
  }

  const handleAddItemToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    if (existingItem) {
      if (existingItem.quantity < item.stock_quantity) {
        setCart(
          cart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        )
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: 'Maximum stock reached.',
          status: TOASTSTATUS.WARNING,
        })
      }
    } else if (item.stock_quantity > 0) {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          price: parseFloat(item.selling_price) || 0,
          stock: item.stock_quantity,
          quantity: 1,
          tax: parseFloat(item.tax) || 0,
        },
      ])
    } else {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Item is out of stock.',
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const handleQuantityChange = (itemId, newQuantity) =>
    setCart(
      cart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )

  const handlePriceChange = (itemId, newPrice) => {
    const priceValue = newPrice === '' ? 0 : parseFloat(newPrice)
    if (!isNaN(priceValue) && priceValue >= 0) {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, price: priceValue } : item
        )
      )
    }
  }

  const handleRemoveItem = (itemId) =>
    setCart(cart.filter((item) => item.id !== itemId))

  const resetForm = () => {
    setCart([])
    const customer = customers.find((item) => item.id === selectedPartyId)
    if (customer?.name !== 'Walk In Customer') setselectedPartyId('')
    setDiscount(0)
    setDiscountType('Fixed')
  }

  const handleSearch = () => {
    if (searchType === 'bar_code' && searchKey) {
      const foundItem = items.find(
        (item) => item.bar_code?.toLowerCase() === searchKey.toLowerCase()
      )
      if (foundItem) {
        handleAddItemToCart(foundItem)
        showToast({
          type: TOASTTYPE.GENARAL,
          message: `${foundItem.name} added to cart.`,
          status: TOASTSTATUS.SUCCESS,
        })
        setSearchKey('')
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: 'Product with this barcode not found.',
          status: TOASTSTATUS.WARNING,
        })
      }
    }
  }

  const handleScan = (scannedValue) => {
    const foundItem = items.find(
      (item) => item.bar_code?.toLowerCase() === scannedValue.toLowerCase()
    )
    if (foundItem) {
      handleAddItemToCart(foundItem)
      showToast({
        type: TOASTTYPE.GENARAL,
        message: `${foundItem.name} added to cart.`,
        status: TOASTSTATUS.SUCCESS,
      })
    } else {
      setSearchType('bar_code')
      setSearchKey(scannedValue)
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Product with this barcode not found.',
        status: TOASTSTATUS.WARNING,
      })
    }
  }

  const handleOpenPaymentModal = () => {
    if (!selectedPartyId) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please select a customer.', status: TOASTSTATUS.ERROR })
      customerRef.current?.focus()
      return
    }
    if (!selectedDoneById) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please select who the sale was done by.', status: TOASTSTATUS.ERROR })
      doneByRef.current?.focus()
      return
    }
    if (cart.length === 0) {
      showToast({ type: TOASTTYPE.GENARAL, message: 'Please add items to the cart.', status: TOASTSTATUS.ERROR })
      return
    }
    setPaymentModalOpen(true)
  }

  const getReceiptData = (paymentDetails) => {
    const customer = customers.find((c) => c.id === selectedPartyId)
    const totalAmountPaid = paymentDetails.payment_methods.reduce(
      (sum, item) => sum + item.amount,
      0
    )

    const formattedPaymentMethods = paymentDetails.payment_methods.map((method) => {
      const modeValue = method.mode_of_payment || method.mode_of_payment_id || method.mode
      const modeObj = modeOfPayments.find((m) => m.id === modeValue)
      
      let displayMode = 'Unknown'
      if (modeObj) {
        displayMode = modeObj.name 
      } else if (modeValue && typeof modeValue === 'string') {
        displayMode = modeValue 
      } else if (modeValue) {
        displayMode = modeValue 
      }

      return {
        ...method,
        mode_of_payment: displayMode,
      }
    })

    const singleMethod = paymentDetails.payment_methods.length === 1
    const accountName = singleMethod
      ? accounts.find(
          (acc) => acc.id === paymentDetails.payment_methods[0]?.account_id
        )?.name || 'Cash'
      : 'Multiple'

    return {
      id: invoiceNoData?.invoice_number,
      date: new Date(),
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price) || 0,
      })),
      summary: {
        subTotal: summary.subTotal,
        orderTax: summary.taxAmount,
        grandTotal: summary.total,
        discount: summary.discountAmount,
        shipping: 0,
      },
      payment: {
        amountPaid: totalAmountPaid,
        method: accountName,
      },
      payment_methods: formattedPaymentMethods,
      partner: customer ? { label: 'Customer', name: customer.name } : null,
      store: {},
    }
  }

  const handleFinalizeSale = async (paymentDetails, shouldPrint) => {
    const payload = {
      party_id: selectedPartyId,
      done_by_id: selectedDoneById || null,
      status: paymentDetails.status,
      paid_amount: paymentDetails.paid_amount,
      discount: summary.discountAmount,
      date: new Date().toISOString(),
      note: paymentDetails.note,
      items: cart.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payment_methods: paymentDetails.payment_methods,
      invoice_number: invoiceNoData?.invoice_number,
    }

    // NOTE: Account validation is now handled inside PaymentModal.
    // Redundant check removed.

    try {
      await createSale(payload)
      showToast({ crudItem: CRUDITEM.SALE, crudType: CRUDTYPE.CREATE_SUCCESS })

      if (shouldPrint) {
        setReceiptData(getReceiptData(paymentDetails))
        setReceiptModalOpen(true)
      }

      setPaymentModalOpen(false)
      setTimeout(() => resetForm(), 300)
    } catch (res) {
      const msg = res.error || `Failed to create sale.`
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      })
    }
  }

  const handleHoldSale = () => {
    if (cart.length === 0) return
    const newHeldSale = {
      id: Date.now(),
      cart,
      selectedPartyId,
      discountType,
      discount,
    }
    updateHeldSales([...heldSales, newHeldSale])
    showToast({
      type: TOASTTYPE.GENARAL,
      message: 'Sale has been put on hold.',
      status: TOASTSTATUS.SUCCESS,
    })
    resetForm()
  }

  const handleResumeSale = (saleId) => {
    const saleToResume = heldSales.find((s) => s.id === saleId)
    if (saleToResume) {
      setCart(saleToResume.cart)
      setselectedPartyId(saleToResume.selectedPartyId)
      setDiscountType(saleToResume.discountType)
      setDiscount(saleToResume.discount)
      handleDeleteHeldSale(saleId, { showToast: false })
      closeModal()
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Sale resumed.',
        status: TOASTSTATUS.INFO,
      })
    }
  }

  const handleDeleteHeldSale = (saleId, options = { showToast: true }) => {
    updateHeldSales(heldSales.filter((s) => s.id !== saleId))
    if (options.showToast) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: 'Held sale deleted.',
        status: TOASTSTATUS.SUCCESS,
      })
    }
  }

  const openModal = (modalName) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let filters = {}
    if (['sales', 'register'].includes(modalName))
      filters = { start_date: today.toISOString(), page_size: 9999 }
    else if (modalName === 'recent') filters = { page_size: 10, sort: '-date' }
    setModalFilters(filters)
    setActiveModal(modalName)
  }
  const closeModal = () => setActiveModal(null)

  if (isFetchingItems || isFetchingCustomers || isFetchingAccounts || isFetchingDoneBys || isLoadingSession)
    return <Loader />

  return (
    <>
      <div className="pos-container">
        {isMobile ? 
        (
          <>
            <div className="pos-section top-bar">
              <IconBackButton/>
              {activeMobileView === 'products' &&
              <BarcodeScannerInput
                searchRef={searchRef}
                searchKey={searchKey}
                onSearchKeyChange={(e) => setSearchKey(e.target.value)}
                searchType={searchType}
                onSearchTypeChange={(e) => setSearchType(e.target.value)}
                onEnter={handleSearch}
                onScan={handleScan}
                searchOptions={searchOptions}
                placeholder="Scan/Search Product..."
              />
                }
              <MobileActionDropdown
                onOpenModal={openModal}
                navigate={handleNavigation} 
              />
            </div>
            <div className="pos-mobile-content">
              {activeMobileView === 'products' && (
                <div className="pos-section product-panel">
                   <div className="filter-bar">
                    <div className="filter-group">
                      {categories.map((cat) => (
                        <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => setActiveCategory(cat)}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="filter-group">
                      {brands.map((brand) => (
                        <button key={brand} className={activeBrand === brand ? 'active' : ''} onClick={() => setActiveBrand(brand)}>
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="product-grid">
                    {isFetchingItems ? (
                      <Loader />
                    ) : filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <ProductCard key={item.id} item={item} onAddItem={handleAddItemToCart} isHeld={heldItemIds.has(item.id)} />
                      ))
                    ) : (
                      <p className="no-products-found">No products found.</p>
                    )}
                  </div>
                </div>
              )}
              {activeMobileView === 'cart' && (
                <div className="pos-mobile-cart-wrapper">
                   <div className="customer-input-container">
                    <CustomerAutoCompleteWithAddOption
                      ref={customerRef}
                      value={selectedPartyId}
                      onChange={(e) => setselectedPartyId(e.target.value)}
                      placeholder="Select or add a customer"
                    />
                    <button type="button" className="add-customer-btn" onClick={handleOpenAddCustomerModal} title="Add New Customer">
                      <FaPlus />
                    </button>
                  </div>
                  <div className="customer-input-container">
                    <DoneByAutoCompleteWithAddOption
                      ref={doneByRef}
                      value={selectedDoneById}
                      onChange={(e) => setSelectedDoneById(e.target.value)}
                      placeholder="Select Done By"
                    />
                    <button type="button" className="add-customer-btn" onClick={handleOpenAddDoneByModal} title="Add New Done By Person">
                      <FaPlus />
                    </button>
                  </div>
                  <div className="pos-section cart-panel">
                    <CartTable cart={cart} onQuantityChange={handleQuantityChange} onRemoveItem={handleRemoveItem} onPriceChange={handlePriceChange} />
                    <SummaryPanel
                      calculations={summary}
                      discountType={discountType}
                      setDiscountType={setDiscountType}
                      discount={discount}
                      setDiscount={setDiscount}
                      onReset={resetForm}
                      onPayNow={handleOpenPaymentModal}
                      onHold={handleHoldSale}
                    />
                  </div>
                </div>
              )}
            </div>
            <button
              className="pos-fab"
              onClick={() =>
                setActiveMobileView((v) =>
                  v === 'products' ? 'cart' : 'products'
                )
              }>
              {activeMobileView === 'products' ? (
                <FaShoppingCart />
              ) : (
                <FaThLarge />
              )}
              {cart.length > 0 && activeMobileView === 'products' && (
                <span className="bubble-count">{cart.length}</span>
              )}
            </button>
          </>
        ) : (
          <div className="pos-page">
            <div className="pos-section customer-panel">
              <div className="customer-input-container">
                <CustomerAutoCompleteWithAddOption
                  ref={customerRef}
                  value={selectedPartyId}
                  onChange={(e) => setselectedPartyId(e.target.value)}
                  placeholder="Walk In Customer"
                />
                <button
                  type="button"
                  className="add-customer-btn"
                  onClick={handleOpenAddCustomerModal}
                  title="Add New Customer">
                  <FaPlus />
                </button>
              </div>
              <div className="customer-input-container">
                <DoneByAutoCompleteWithAddOption
                  ref={doneByRef}
                  value={selectedDoneById}
                  onChange={(e) => setSelectedDoneById(e.target.value)}
                  placeholder="Select Done By"
                />
                <button
                  type="button"
                  className="add-customer-btn"
                  onClick={handleOpenAddDoneByModal}
                  title="Add New Done By Person">
                  <FaPlus />
                </button>
              </div>
            </div>
            <div className="pos-section top-bar fs40">
              <BarcodeScannerInput
                searchRef={searchRef}
                searchKey={searchKey}
                onSearchKeyChange={(e) => setSearchKey(e.target.value)}
                searchType={searchType}
                onSearchTypeChange={(e) => setSearchType(e.target.value)}
                onEnter={handleSearch}
                onScan={handleScan}
                searchOptions={searchOptions}
                placeholder="Scan/Search Product by Code or Name"
              />
              <div className="action-icons">
                <button className="icon-btn" onClick={() => handleNavigation(-1)} title="Back">
                  <FiArrowLeft />
                </button>

                <button onClick={() => handleNavigation('/jobsheet-report')} title="Jobsheet">
                  <FaClipboardList />
                </button>
                <button onClick={() => openModal('register')} title="Register Details">
                  <FaCashRegister />
                </button>
                <button onClick={() => openModal('sales')} title="Today's Sales List">
                  <FaThList />
                </button>
                <button className="icon-btn-wrapper" onClick={() => openModal('held')} title="Held Sales">
                  <FaPauseCircle />
                  {heldSales.length > 0 && (
                    <span className="bubble-count">{heldSales.length}</span>
                  )}
                </button>
                <button onClick={() => openModal('recent')} title="Recent Sales">
                  <FaHistory />
                </button>
                <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => handleNavigation('/')} title="Dashboard">
                  <FaTachometerAlt />
                </button>
              </div>
            </div>
            <div className="pos-section product-panel">
               <div className="filter-bar">
                <div className="filter-group">
                  {categories.map((cat) => (
                    <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => setActiveCategory(cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="filter-group">
                  {brands.map((brand) => (
                    <button key={brand} className={activeBrand === brand ? 'active' : ''} onClick={() => setActiveBrand(brand)}>
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              <div className="product-grid">
                {isFetchingItems ? (
                  <Loader />
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <ProductCard key={item.id} item={item} onAddItem={handleAddItemToCart} isHeld={heldItemIds.has(item.id)} />
                  ))
                ) : (
                  <p className="no-products-found">No products found.</p>
                )}
              </div>
            </div>
            <div className="pos-section cart-panel">
              <CartTable
                cart={cart}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onPriceChange={handlePriceChange}
              />
              <SummaryPanel
                calculations={summary}
                discountType={discountType}
                setDiscountType={setDiscountType}
                discount={discount}
                setDiscount={setDiscount}
                onReset={resetForm}
                onPayNow={handleOpenPaymentModal}
                onHold={handleHoldSale}
                isProcessing={isCreatingSale}
              />
            </div>
          </div>
        )}
      </div>

      {/* --- OPEN REGISTER MODAL --- */}
      <OpenRegisterModal 
        isOpen={isOpenRegisterModalOpen} 
        onClose={() => {}} 
        onRegisterOpened={handleRegisterOpened}
      />

      {/* --- CLOSE REGISTER CONFIRMATION MODAL --- */}
      <CloseRegisterModal 
        isOpen={isCloseConfirmationModalOpen}
        sessionId={currentSession?.session?.id}
        onClose={() => setIsCloseConfirmationModalOpen(false)}
        onKeepOpen={handleKeepOpen}
        onRegisterClosed={handleRegisterClosed}
      />

      <AddCustomer
        isOpen={isCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        mode="add"
        selectedCustomer={null}
        onCustomerCreated={handleCustomerCreated}
        onCustomerUpdated={() => { refetchCustomers(); handleCloseCustomerModal(); }}
      />
      <AddDoneBy
        isOpen={isDoneByModalOpen}
        onClose={handleCloseDoneByModal}
        mode="add"
        onDoneByCreated={handleDoneByCreated}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        calculations={summary}
        onSubmit={handleFinalizeSale}
        isProcessing={isCreatingSale}
        accounts={accounts}
        initialPayments={[]}
        mode="add"
      />
      <HeldSalesModal
        isOpen={activeModal === 'held'}
        onClose={closeModal}
        heldSales={heldSales}
        onResume={handleResumeSale}
        onDelete={handleDeleteHeldSale}
        customers={customers}
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transactionData={receiptData}
      />
      <RegisterDetailsModal
        isOpen={activeModal === 'register'}
        onClose={closeModal}
        registerData={registerSummary}
      />
      <SalesListModal
        isOpen={activeModal === 'sales'}
        onClose={closeModal}
        filters={modalFilters}
        title="Today's Sales"
        modalType="sales"
      />
      <SalesListModal
        isOpen={activeModal === 'recent'}
        onClose={closeModal}
        filters={modalFilters}
        title="Recent Sales"
        modalType="recent"
      />
    </>
  )
}

export default POS