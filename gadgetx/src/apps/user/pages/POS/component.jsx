import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  FaTag,
  FaHandHoldingUsd,
  FaMoneyCheckAlt,
  FaFileInvoice,
  FaArrowCircleDown,
  FaUserEdit,
} from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";

import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import Loader from "@/components/Loader";
import BarcodeScannerInput from "@/apps/user/components/BarcodeScannerInput";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import IconBackButton from "@/apps/user/components/IconBackButton/component";
import AddCustomer from "@/apps/user/pages/List/CustomerList/components/AddCustomer";
import AddDoneBy from "@/apps/user/pages/List/DoneByList/components/AddDoneBy";
import SalesListModal from "./components/SalesListModal";
import CartTable from "./components/CartTable";
import SummaryPanel from "./components/SummaryPanel";
import ProductCard from "./components/ProductCard";
import MobileActionDropdown from "./components/MobileActionDropdown";
import PaymentModal from "./components/PaymentModal";
import HeldSalesModal from "./components/HeldSalesModal";
import RegisterDetailsModal from "./components/RegisterDetailsModal";
import ProductDetailModal from "./components/ProductDetailModal";
import HStack from "@/components/HStack";

import { useToast } from "@/context/ToastContext";
import { useItem } from "@/apps/user/hooks/api/item/useItem";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import { useDoneBys } from "@/apps/user/hooks/api/doneBy/useDoneBys";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import useCreateSales from "@/apps/user/hooks/api/sales/useCreateSales";
import useSalesPaginated from "@/apps/user/hooks/api/sales/useSalesPaginated";
import { useIsMobile } from "@/utils/useIsMobile";
import { useSaleInvoiceNo } from "@/apps/user/hooks/api/saleInvoiceNo/useSaleInvoiceNo";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import { CRUDITEM, CRUDTYPE } from "@/constants/object/crud";

import "./style.scss";

const HELD_SALES_KEY = "pos_held_sales";
const RECENT_CUSTOMER_KEY = "gadgetx_pos_recent_customer_id";

const POS = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const customerRef = useRef(null);
  const doneByRef = useRef(null);
  const searchRef = useRef(null);

  const isMobile = useIsMobile();
  const [activeMobileView, setActiveMobileView] = useState("products");

  const [cart, setCart] = useState([]);
  const [selectedPartyId, setselectedPartyId] = useState("");
  const [selectedDoneById, setSelectedDoneById] = useState("");
  const [selectedCostCenterId, setSelectedCostCenterId] = useState("");
  const [isCredit, setIsCredit] = useState(false);
  const [discountType, setDiscountType] = useState("Fixed");
  const [discount, setDiscount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [activeBrand, setActiveBrand] = useState("All Brands");
  const [activeModal, setActiveModal] = useState(null);
  const [heldSales, setHeldSales] = useState([]);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [heldItemIds, setHeldItemIds] = useState(new Set());
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDoneByModalOpen, setIsDoneByModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchType, setSearchType] = useState("bar_code");
  const [searchKey, setSearchKey] = useState("");
  const [isCheckPriceMode, setIsCheckPriceMode] = useState(false);
  const [checkPriceItem, setCheckPriceItem] = useState(null);

  const focusSearchInput = (delay = 120) => {
    setTimeout(() => {
      searchRef.current?.focus();
      if (typeof searchRef.current?.select === "function") {
        searchRef.current.select();
      }
    }, delay);
  };

  const { data: itemsData = [], isLoading: isFetchingItems } = useItem();

  const items = useMemo(() => {
    return (Array.isArray(itemsData) ? itemsData : itemsData?.data || []).map(
      (v) => ({
        ...v,
        selling_price:
          parseFloat(v.selling_price || v.selling_price_with_tax || v.price) ||
          0,
        stock_quantity: parseInt(v.stock_qty || v.stock_quantity || 0),
        tax: parseFloat(v.tax) || 0,
      }),
    );
  }, [itemsData]);

  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();
  const { data: modeOfPayments = [] } = useModeOfPayments();
  const { data: invoiceNoData } = useSaleInvoiceNo();
  const {
    data: customers = [],
    isLoading: isFetchingCustomers,
    refetch: refetchCustomers,
  } = useCustomers();
  const {
    data: doneBys = [],
    isLoading: isFetchingDoneBys,
    refetch: refetchDoneBys,
  } = useDoneBys();
  const { mutateAsync: createSale, isPending: isCreatingSale } =
    useCreateSales();

  const [modalFilters, setModalFilters] = useState({});
  const { data: modalSalesData } = useSalesPaginated(modalFilters, {
    enabled: activeModal === "register",
  });



  const selectedCustomerInfo = useMemo(() => {
    if (!customers?.length || !selectedPartyId) return null;
    return customers.find((c) => String(c.id) === String(selectedPartyId));
  }, [customers, selectedPartyId]);



  // Auto-focus barcode search input on load
  useEffect(() => {
    focusSearchInput(300);
  }, []);

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    if (customers.length === 0) return;

    setselectedPartyId((prev) => {
      if (prev) {
        const matchedPrevCustomer = customers.find(
          (c) => String(c.id) === String(prev),
        );
        if (matchedPrevCustomer) {
          return matchedPrevCustomer.id;
        }
      }

      return prev || "";
    });
  }, [customers]);

  useEffect(() => {
    if (!selectedPartyId) return;
    localStorage.setItem(RECENT_CUSTOMER_KEY, String(selectedPartyId));
  }, [selectedPartyId]);

  useEffect(() => {
    const savedHeldSales = JSON.parse(
      localStorage.getItem(HELD_SALES_KEY) || "[]",
    );
    setHeldSales(savedHeldSales);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const categories = useMemo(
    () => [
      "All Categories",
      ...new Set(items.map((item) => item.category_name).filter(Boolean)),
    ],
    [items],
  );
  const brands = useMemo(
    () => [
      "All Brands",
      ...new Set(items.map((item) => item.brand_name).filter(Boolean)),
    ],
    [items],
  );

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handleBackNavigation();
        return;
      }

      const isFKey = e.key.startsWith("F") && e.key.length <= 3;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        e.target.tagName,
      );

      if (isInput && !isFKey) return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "F2":
          e.preventDefault();
          document.querySelector(".btn-pay")?.click();
          break;
        case "F3":
          e.preventDefault();
          document.querySelector(".btn-hold")?.click();
          break;
        case "F4":
          e.preventDefault();
          openModal("held");
          break;
        case "F5":
          e.preventDefault();
          openModal("sales");
          break;
        case "F6":
          e.preventDefault();
          handleBackNavigation();
          break;
        case "F7":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "F8":
          e.preventDefault();
          document.querySelector(".btn-reset")?.click();
          break;
        case "F9":
          e.preventDefault();
          setIsCheckPriceMode((prev) => !prev);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const searchOptions = [
    { value: "name", name: "Name" },
    { value: "bar_code", name: "Barcode" },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "All Categories" ||
        item.category_name === activeCategory;
      const matchesBrand =
        activeBrand === "All Brands" || item.brand_name === activeBrand;
      if (!searchKey) return matchesCategory && matchesBrand;
      const searchField = item[searchType] || "";
      const matchesSearch = searchField
        .toLowerCase()
        .includes(searchKey.toLowerCase());
      return matchesCategory && matchesBrand && matchesSearch;
    });
  }, [items, activeCategory, activeBrand, searchKey, searchType]);

  const round2 = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  const summary = useMemo(() => {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    const taxAmount = cart.reduce((sum, item) => {
      const itemBase = round2(item.price * item.quantity);
      return sum + round2((itemBase * item.tax) / 100);
    }, 0);

    const subTotal = cart.reduce((sum, item) => {
      const itemBase = round2(item.price * item.quantity);
      const itemTax = round2((itemBase * item.tax) / 100);
      return sum + round2(itemBase + itemTax);
    }, 0);

    const discountAmount =
      discountType === "Percentage"
        ? round2((subTotal * discount) / 100)
        : round2(discount);

    const total = round2(subTotal - discountAmount);

    return {
      totalQty,
      subTotal: round2(subTotal),
      taxAmount: round2(taxAmount),
      discountAmount: round2(discountAmount),
      total,
    };
  }, [cart, discount, discountType]);

  const registerSummary = useMemo(() => {
    if (!modalSalesData?.data) return null;
    const cashInHand = accounts
      .filter((acc) => acc.type === "cash")
      .reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0);
    const cashAtBank = accounts
      .filter((acc) => acc.type === "bank")
      .reduce((sum, acc) => sum + parseFloat(acc.amount || 0), 0);
    let totalSales = 0;
    let totalRefund = 0;
    modalSalesData.data.forEach((sale) => {
      if (["paid", "partial"].includes(sale.status))
        totalSales += parseFloat(sale.total_amount || 0);
      if (sale.status === "refund")
        totalRefund += parseFloat(sale.total_amount || 0);
    });
    return {
      cashInHand,
      cashAtBank,
      totalSales,
      totalRefund,
      totalPayment: totalSales - totalRefund,
    };
  }, [accounts, modalSalesData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const updateHeldSales = (newHeldSales) => {
    setHeldSales(newHeldSales);
    localStorage.setItem(HELD_SALES_KEY, JSON.stringify(newHeldSales));
  };

  const handleOpenAddCustomerModal = () => setIsCustomerModalOpen(true);
  const handleCloseCustomerModal = () => setIsCustomerModalOpen(false);



  const handleCustomerCreated = (newCustomer) => {
    if (newCustomer?.id) {
      refetchCustomers();
    }
    handleCloseCustomerModal();
  };

  const handleOpenAddDoneByModal = () => setIsDoneByModalOpen(true);
  const handleCloseDoneByModal = () => setIsDoneByModalOpen(false);
  const handleDoneByCreated = (newDoneBy) => {
    if (newDoneBy?.id) {
      refetchDoneBys();
      setSelectedDoneById(newDoneBy.id);
    }
    handleCloseDoneByModal();
  };

  const handleAddItemToCart = (item) => {
    if (!selectedPartyId) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a customer first.",
        status: TOASTSTATUS.WARNING,
      });
      return;
    }

    const itemKey = `${item.category_name}-${item.id}`;
    const isInCart = cart.some((i) => i.key === itemKey);

    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      if (existingItem.quantity < item.stock_quantity) {
        setCart(
          cart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          ),
        );
        showToast({
          type: TOASTTYPE.GENARAL,
          message: `${item.name} quantity increased.`,
          status: TOASTSTATUS.SUCCESS,
        });
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Maximum stock reached.",
          status: TOASTSTATUS.WARNING,
        });
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
          type: item.type,
        },
      ]);
      showToast({
        type: TOASTTYPE.GENARAL,
        message: `${item.name} added to cart.`,
        status: TOASTSTATUS.SUCCESS,
      });
    } else {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Item is out of stock.",
        status: TOASTSTATUS.ERROR,
      });
    }

    focusSearchInput();
  };

  const handleQuantityChange = (itemId, newQuantity) =>
    setCart(
      cart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );

  const handlePriceChange = (itemId, newPrice) => {
    const priceValue = newPrice === "" ? 0 : parseFloat(newPrice);
    if (!isNaN(priceValue) && priceValue >= 0) {
      setCart(
        cart.map((item) =>
          item.id === itemId ? { ...item, price: priceValue } : item,
        ),
      );
    }
  };

  const handleRemoveItem = (itemId) => {
    setCart(cart.filter((item) => item.id !== itemId));
    focusSearchInput();
  };

  const resetForm = () => {
    setCart([]);
    setselectedPartyId("");
    setSelectedDoneById("");
    setSelectedCostCenterId("");
    setIsCredit(false);
    setDiscount(0);
    setDiscountType("Fixed");
    focusSearchInput(80);
  };

  const handleSearch = () => {
    if (searchType === "bar_code" && searchKey) {
      const foundItem = items.find(
        (item) => item.bar_code?.toLowerCase() === searchKey.toLowerCase(),
      );
      if (foundItem) {
        if (isCheckPriceMode) {
          setCheckPriceItem(foundItem);
        } else {
          handleAddItemToCart(foundItem);
        }
        setSearchKey("");
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Product with this barcode not found.",
          status: TOASTSTATUS.WARNING,
        });
      }
      focusSearchInput();
    }
  };

  const handleScan = (scannedValue) => {
    const foundItem = items.find(
      (item) => item.bar_code?.toLowerCase() === scannedValue.toLowerCase(),
    );
    if (foundItem) {
      if (isCheckPriceMode) {
        setCheckPriceItem(foundItem);
      } else {
        handleAddItemToCart(foundItem);
      }
    } else {
      setSearchType("bar_code");
      setSearchKey(scannedValue);
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Product with this barcode not found.",
        status: TOASTSTATUS.WARNING,
      });
    }

    focusSearchInput();
  };

  const handleProcessPayment = () => {
    if (!selectedPartyId) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a customer.",
        status: TOASTSTATUS.ERROR,
      });
      customerRef.current?.focus();
      return;
    }
    if (!selectedDoneById) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select who the sale was done by.",
        status: TOASTSTATUS.ERROR,
      });
      doneByRef.current?.focus();
      return;
    }
    if (cart.length === 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please add items to the cart.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    if (isCredit) {
      handleFinalizeSale({
        status: "unpaid",
        paid_amount: 0,
        change_return: 0,
        payment_methods: [],
        note: "Credit Sale",
      });
    } else {
      setPaymentModalOpen(true);
    }
  };

  const getReceiptData = (paymentDetails) => {
    const customer = customers.find((c) => c.id === selectedPartyId);
    const totalAmountPaid = paymentDetails.payment_methods.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const formattedPaymentMethods = paymentDetails.payment_methods.map(
      (method) => {
        const modeValue =
          method.mode_of_payment || method.mode_of_payment_id || method.mode;
        const modeObj = modeOfPayments.find((m) => m.id === modeValue);

        let displayMode = "Unknown";
        if (modeObj) {
          displayMode = modeObj.name;
        } else if (modeValue && typeof modeValue === "string") {
          displayMode = modeValue;
        } else if (modeValue) {
          displayMode = modeValue;
        }

        return {
          ...method,
          mode_of_payment: displayMode,
        };
      },
    );

    const singleMethod = paymentDetails.payment_methods.length === 1;
    const accountName = singleMethod
      ? accounts.find(
          (acc) => acc.id === paymentDetails.payment_methods[0]?.account_id,
        )?.name || "Cash"
      : "Multiple";

    return {
      id: invoiceNoData?.invoice_number,
      date: new Date(),
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(
          (item.price * (1 + (item.tax || 0) / 100)).toFixed(2),
        ),
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
      partner: customer ? { label: "Customer", name: customer.name } : null,
      store: {},
    };
  };

  const handleFinalizeSale = async (paymentDetails, shouldPrint) => {

    const payload = {
      party_id: selectedPartyId,
      done_by_id: selectedDoneById || null,
      cost_center_id: selectedCostCenterId || null,
      order_status: "completed",
      expected_delivery: null,
      actual_delivery: new Date().toISOString(),
      payment_status:
        paymentDetails.status === "paid"
          ? "paid"
          : paymentDetails.paid_amount > 0
            ? "partial"
            : "unpaid",
      paid_amount: paymentDetails.paid_amount || 0,
      change_return: paymentDetails.change_return || 0,
      discount: summary.discountAmount,
      order_date: new Date().toISOString(),
      note: paymentDetails.note,
      items: cart.map((item) => {
        const itemBase = round2(item.price * item.quantity);
        const itemTaxAmount = round2((itemBase * item.tax) / 100);
        return {
          item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          tax_amount: itemTaxAmount,
          total_price: round2(itemBase + itemTaxAmount),
        };
      }),
      payment_methods:
        paymentDetails.payment_methods?.length > 0
          ? paymentDetails.payment_methods
          : accounts[0]
            ? [
                {
                  account_id: accounts[0].id,
                  amount: 0,
                  mode_of_payment_id: modeOfPayments[0]?.id || null,
                },
              ]
            : [],
      invoice_number: invoiceNoData?.invoice_number || `POS-${Date.now()}`,
    };

    try {
      await createSale(payload);
      showToast({ crudItem: CRUDITEM.SALE, crudType: CRUDTYPE.CREATE_SUCCESS });

      if (shouldPrint) {
        setReceiptData(getReceiptData(paymentDetails));
        setReceiptModalOpen(true);
      }

      setPaymentModalOpen(false);
      setTimeout(() => resetForm(), 300);
      focusSearchInput(380);
    } catch (res) {
      const msg = res.error || `Failed to create sale.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const newHeldSale = {
      id: Date.now(),
      cart,
      selectedPartyId,
      discountType,
      discount,
    };
    updateHeldSales([...heldSales, newHeldSale]);
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "Sale has been put on hold.",
      status: TOASTSTATUS.SUCCESS,
    });
    resetForm();
  };

  const handleResumeSale = (saleId) => {
    const saleToResume = heldSales.find((s) => s.id === saleId);
    if (saleToResume) {
      setCart(saleToResume.cart);
      setselectedPartyId(saleToResume.selectedPartyId);
      setDiscountType(saleToResume.discountType);
      setDiscount(saleToResume.discount);
      handleDeleteHeldSale(saleId, { showToast: false });
      closeModal();
      focusSearchInput(100);
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Sale resumed.",
        status: TOASTSTATUS.INFO,
      });
    }
  };

  const handleDeleteHeldSale = (saleId, options = { showToast: true }) => {
    updateHeldSales(heldSales.filter((s) => s.id !== saleId));
    if (options.showToast) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Held sale deleted.",
        status: TOASTSTATUS.SUCCESS,
      });
    }
  };

  const openModal = (modalName) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filters = {};
    if (["sales", "register"].includes(modalName))
      filters = { start_date: today.toISOString(), page_size: 9999 };
    else if (modalName === "recent") filters = { page_size: 10, sort: "-date" };
    setModalFilters(filters);
    setActiveModal(modalName);
  };
  const closeModal = () => setActiveModal(null);

  if (
    isFetchingItems ||
    isFetchingCustomers ||
    isFetchingAccounts ||
    isFetchingDoneBys
  )
    return <Loader />;

  return (
    <>
      <div className="pos-container">
        {isMobile ? (
          <>
            <div className="pos-section top-bar">
              <IconBackButton />
              {activeMobileView === "products" && (
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
              )}
              <MobileActionDropdown
                onOpenModal={openModal}
                navigate={navigate}
              />
            </div>
            <div className="pos-mobile-content">
              <div className="pos-section customer-panel p10 mb10">
                <HStack justifyContent="flex-start">
                  <div className="customer-input-container">
                    <DoneByAutoCompleteWithAddOption
                      ref={doneByRef}
                      value={selectedDoneById}
                      onChange={(e) => setSelectedDoneById(e.target.value)}
                      placeholder="Done By"
                    />
                  </div>
                  <div className="customer-input-container">
                    <CustomerAutoCompleteWithAddOption
                      ref={customerRef}
                      value={selectedPartyId}
                      onChange={(e) => setselectedPartyId(e.target.value)}
                      placeholder="Select or add a customer"
                    />
                  </div>
                </HStack>
              </div>

              {activeMobileView === "products" && (
                <>

                  <div className="pos-section product-panel">
                    <div className="filter-bar">
                      <div className="filter-group">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            className={activeCategory === cat ? "active" : ""}
                            onClick={() => setActiveCategory(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="filter-group">
                        {brands.map((brand) => (
                          <button
                            key={brand}
                            className={activeBrand === brand ? "active" : ""}
                            onClick={() => setActiveBrand(brand)}
                          >
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
                          <ProductCard
                            key={item.id}
                            item={item}
                            onAddItem={
                              isCheckPriceMode
                                ? setCheckPriceItem
                                : handleAddItemToCart
                            }
                            isHeld={heldItemIds.has(item.id)}
                          />
                        ))
                      ) : (
                        <p className="no-products-found">No products found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {activeMobileView === "cart" && (
                <div className="pos-mobile-cart-wrapper">
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
                      onPayNow={handleProcessPayment}
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
                  v === "products" ? "cart" : "products",
                )
              }
            >
              {activeMobileView === "products" ? (
                <FaShoppingCart />
              ) : (
                <FaThLarge />
              )}
              {cart.length > 0 && activeMobileView === "products" && (
                <span className="bubble-count">{cart.length}</span>
              )}
            </button>
          </>
        ) : (
          <div className="pos-page">
            <div className="pos-section customer-panel">
              <div className="customer-input-container">
                <DoneByAutoCompleteWithAddOption
                  ref={doneByRef}
                  value={selectedDoneById}
                  onChange={(e) => setSelectedDoneById(e.target.value)}
                  placeholder="Select Done By"
                />
                {/* <button
                  type="button"
                  className="add-customer-btn"
                  onClick={handleOpenAddDoneByModal}
                  title="Add New Done By Person"
                >
                  <FaPlus />
                </button> */}
              </div>
              <div className="customer-input-container">
                <CustomerAutoCompleteWithAddOption
                  ref={customerRef}
                  value={selectedPartyId}
                  onChange={(e) => setselectedPartyId(e.target.value)}
                  placeholder="Walk In Customer"
                />
              </div>
            </div>
            <div
              className={`pos-section top-bar ${!selectedPartyId ? "is-blocked" : ""}`}
            >
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
                <button
                  className={`icon-btn ${isCheckPriceMode ? "check-price-active" : ""}`}
                  onClick={() => setIsCheckPriceMode(!isCheckPriceMode)}
                  title={
                    isCheckPriceMode
                      ? "Check Price Mode ON (F9)"
                      : "Check Price (F9)"
                  }
                >
                  <FaTag />
                </button>
                <button
                  className="icon-btn"
                  onClick={handleBackNavigation}
                  title="Back (F6 / Alt+←)"
                >
                  <FiArrowLeft />
                </button>
                {/* <button
                  onClick={() => openModal("register")}
                  title="Register Details"
                >
                  <FaCashRegister />
                </button> */}
                {/* <button
                  onClick={() => navigate("/payment-against-purchase")}
                  title="Payment Out Screen"
                >
                  <FaHandHoldingUsd />
                </button> */}
                {/* <button
                  onClick={() =>
                    navigate("/payment-report?invoiceTypes=PURCHASE")
                  }
                  title="Another Payment Out (Purchase)"
                >
                  <FaMoneyCheckAlt />
                </button> */}
                {/* <button
                  onClick={() => navigate("/payment-against-sale-return")}
                  title="Other Payment Out"
                >
                  <FaMoneyCheckAlt />
                </button> */}
                {/* <button
                  onClick={() => navigate("/payment-report")}
                  title="All Payment Data View"
                >
                  <FaFileInvoice />
                </button> */}
                <button
                  onClick={() => navigate("/suppliers-list")}
                  title="Supplier Update"
                >
                  <FaUserEdit />
                </button>
                {/* <button
                  onClick={() => navigate("/receipt-against-sale")}
                  title="Payment In"
                >
                  <FaArrowCircleDown />
                </button> */}
                <button
                  onClick={() => openModal("sales")}
                  title="Today's Sales List"
                >
                  <FaThList />
                </button>
                <button
                  className="icon-btn-wrapper"
                  onClick={() => openModal("held")}
                  title="Held Sales"
                >
                  <FaPauseCircle />
                  {heldSales.length > 0 && (
                    <span className="bubble-count">{heldSales.length}</span>
                  )}
                </button>
                <button
                  onClick={() => openModal("recent")}
                  title="Recent Sales"
                >
                  <FaHistory />
                </button>
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
                <button onClick={() => navigate("/")} title="Dashboard">
                  <FaTachometerAlt />
                </button>
              </div>
            </div>
            <div
              className={`pos-section product-panel ${!selectedPartyId ? "is-blocked" : ""}`}
            >
              {isCheckPriceMode && (
                <div className="check-price-banner">
                  <FaTag /> Check Price Mode — Scan or click a product to view
                  details
                </div>
              )}
              <div className="filter-bar">
                <div className="filter-group">
                  {categories.map((cat, idx) => (
                    <button
                      key={`cat-${cat}-${idx}`}
                      className={activeCategory === cat ? "active" : ""}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="filter-group">
                  {brands.map((brand, idx) => (
                    <button
                      key={`brand-${brand}-${idx}`}
                      className={activeBrand === brand ? "active" : ""}
                      onClick={() => setActiveBrand(brand)}
                    >
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
                    <ProductCard
                      key={`${item.category_name}-${item.id}`}
                      item={item}
                      onAddItem={
                        isCheckPriceMode
                          ? setCheckPriceItem
                          : handleAddItemToCart
                      }
                      onView={setCheckPriceItem}
                      isHeld={heldItemIds.has(item.id)}
                    />
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
                onPayNow={handleProcessPayment}
                onHold={handleHoldSale}
                isProcessing={isCreatingSale}
              />
            </div>
          </div>
        )}
      </div>

      <AddCustomer
        isOpen={isCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        mode="add"
        selectedCustomer={null}
        onCustomerCreated={handleCustomerCreated}
        onCustomerUpdated={() => {
          refetchCustomers();
          handleCloseCustomerModal();
        }}
      />

      <AddDoneBy
        isOpen={isDoneByModalOpen}
        onClose={handleCloseDoneByModal}
        mode="add"
        onDoneByCreated={handleDoneByCreated}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          focusSearchInput(120);
        }}
        calculations={summary}
        onSubmit={handleFinalizeSale}
        isProcessing={isCreatingSale}
        accounts={accounts}
        initialPayments={[]}
        mode="add"
      />
      <HeldSalesModal
        isOpen={activeModal === "held"}
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
      {/* <RegisterDetailsModal
        isOpen={activeModal === "register"}
        onClose={closeModal}
        registerData={registerSummary}
      /> */}
      <SalesListModal
        isOpen={activeModal === "sales"}
        onClose={closeModal}
        filters={modalFilters}
        title="Today's Sales"
        modalType="sales"
      />
      {/* <SalesListModal
        isOpen={activeModal === "recent"}
        onClose={closeModal}
        filters={modalFilters}
        title="Recent Sales"
        modalType="recent"
      /> */}
      <ProductDetailModal
        isOpen={!!checkPriceItem}
        onClose={() => setCheckPriceItem(null)}
        item={checkPriceItem}
        onAddToCart={handleAddItemToCart}
      />
    </>
  );
};

export default POS;
