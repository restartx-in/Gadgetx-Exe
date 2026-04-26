import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash, FaSave } from "react-icons/fa";

import useSalesPaginated from "@/hooks/api/sales/useSalesPaginated";
import { useCustomers } from "@/hooks/api/customer/useCustomers";
import useItem from "@/hooks/api/item/useItem";
import { useSalesById } from "@/hooks/api/sales/useSalesById";
import { useSaleReturnById } from "@/hooks/api/saleReturns/useSaleReturnsById";
import useCreateSaleReturn from "@/hooks/api/saleReturns/useCreateSaleReturns";
import { useSaleReturnInvoiceNo } from "@/hooks/api/saleReturnInvoiceNo/useSaleReturnInvoiceNo";
import useUpdateSaleReturn from "@/hooks/api/saleReturns/useUpdateSaleReturns";
import useAccounts from "@/hooks/api/account/useAccounts";
import { useToast } from "@/context/ToastContext";

import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

import AmountSymbol from "@/components/AmountSymbol";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageTitle from "@/components/PageTitle";
import IconBackButton from "@/apps/user/components/IconBackButton";
import Loader from "@/components/Loader";
import HStack from "@/components/HStack";
import DateField from "@/components/DateField";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import QuantitySelector from "@/components/QuantitySelector";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ViewButtonForReceiptAndPayment from "@/components/ViewButtonForReceiptAndPayment"; // ADDED IMPORT
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";
import "./style.scss";

const SaleReturn = () => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isViewMode = mode === "view";

  // --- Refs for input focus ---
  const saleSelectRef = useRef(null);
  const itemSelectRef = useRef(null);

  // --- Form State ---
  const [returnDate, setReturnDate] = useState(new Date());
  const [saleId, setSaleId] = useState("");
  const [reason, setReason] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(null);

  const [existingPayments, setExistingPayments] = useState([]); 

  // --- Modal State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSkipPayment, setIsSkipPayment] = useState(false); // Added Skip State

  // --- API Data Fetching ---
  const { data: saleReturnData, isLoading: isFetchingSaleReturn } =
    useSaleReturnById(id, mode !== "add");
  const { data: paginatedSales, isLoading: isFetchingSales } =
    useSalesPaginated({ page_size: 9999 });
  const { data: customers = [], isLoading: isFetchingCustomers } =
    useCustomers();
  const { data: allItems = [], isLoading: isFetchingItems } = useItem();
  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();
  const { data: selectedSaleData, isLoading: isFetchingSelectedSale } =
    useSalesById(saleId);
  const { mutateAsync: createSaleReturn, isPending: isCreating } =
    useCreateSaleReturn();
  const { mutateAsync: updateSaleReturn, isPending: isUpdating } =
    useUpdateSaleReturn();
  const { data: invoiceNoData } = useSaleReturnInvoiceNo(mode === "add");

  // --- Effects ---
  useEffect(() => {
    if (mode === "add" && id) {
      setSaleId(id);
    }
  }, [id, mode]);

  useEffect(() => {
    if (
      mode === "add" &&
      id &&
      selectedSaleData?.items &&
      allItems.length > 0 &&
      returnItems.length === 0
    ) {
      const allReturnableItems = selectedSaleData.items
        .map((soldItem) => {
          const itemDetails = allItems.find((i) => i.id === soldItem.item_id);
          const alreadyReturned = soldItem.returned_quantity || 0;
          const maxReturnable = soldItem.quantity - alreadyReturned;
          if (maxReturnable <= 0) return null;
          return {
            id: soldItem.item_id,
            name: soldItem.item_name,
            price: parseFloat(soldItem.unit_price),
            taxPercentage: parseFloat(itemDetails?.tax) || 0,
            maxReturnable: maxReturnable,
            quantity: maxReturnable,
          };
        })
        .filter(Boolean);
      setReturnItems(allReturnableItems);
    }
  }, [mode, id, selectedSaleData, allItems, returnItems.length]);

  useEffect(() => {
    if (saleReturnData && (mode === "edit" || mode === "view")) {
      setReturnDate(new Date(saleReturnData.date));
      setReason(saleReturnData.reason || "");
      setDoneById(saleReturnData.done_by_id || "");
      setCostCenterId(saleReturnData.cost_center_id || "");
      setSaleId(saleReturnData.sale_id);
      setInvoiceNumber(saleReturnData.invoice_number);

      const returnedItem = {
        id: saleReturnData.item_id,
        name: saleReturnData.item_name,
        price:
          saleReturnData.return_quantity > 0
            ? parseFloat(saleReturnData.total_refund_amount) /
              saleReturnData.return_quantity
            : 0,
        taxPercentage: 0,
        maxReturnable: saleReturnData.return_quantity,
        quantity: saleReturnData.return_quantity,
      };
      setReturnItems([returnedItem]);

      if (saleReturnData.payment_methods) {
        const validPayments = saleReturnData.payment_methods.filter(
          (p) => p && p.account_id
        );
        const mappedPayments = validPayments.map((p) => ({
          ...p,
          mode_of_payment_id: p.mode_of_payment_id,
        }));
        setExistingPayments(mappedPayments);
      }
    }
    if (mode === "add" && saleSelectRef.current) {
      setTimeout(() => saleSelectRef.current.focus(), 100);
    }
  }, [saleReturnData, mode]);

  // --- Memoized Calculations ---
  const itemsWithCalculations = useMemo(
    () =>
      returnItems.map((item) => {
        const baseTotal = item.price * item.quantity;
        const taxAmount = (baseTotal * item.taxPercentage) / 100;
        const subtotal = baseTotal + taxAmount;
        return { ...item, taxAmount, subtotal };
      }),
    [returnItems]
  );

  const subtotalAmount = useMemo(
    () =>
      itemsWithCalculations.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [itemsWithCalculations]
  );

  const totalTaxAmount = useMemo(
    () => itemsWithCalculations.reduce((sum, item) => sum + item.taxAmount, 0),
    [itemsWithCalculations]
  );

  const totalRefundAmount = useMemo(
    () => subtotalAmount + totalTaxAmount,
    [subtotalAmount, totalTaxAmount]
  );

  const totalQty = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.quantity, 0),
    [itemsWithCalculations]
  );

  const modalCalculations = useMemo(
    () => ({
      total: totalRefundAmount,
      subTotal: subtotalAmount,
      taxAmount: totalTaxAmount,
      totalQty: totalQty,
      discount: 0,
      shipping: 0,
    }),
    [totalRefundAmount, subtotalAmount, totalTaxAmount, totalQty]
  );

  const sales = useMemo(() => paginatedSales?.data || [], [paginatedSales]);
  const customerMap = useMemo(
    () =>
      (customers || []).reduce(
        (acc, customer) => ({ ...acc, [customer.id]: customer.name }),
        {}
      ),
    [customers]
  );
  const saleOptions = useMemo(
    () =>
      sales.map((sale) => ({
        value: sale.id,
        label: `INV-${sale.id} / ${customerMap[sale.party_id] || "Unknown"}`,
      })),
    [sales, customerMap]
  );

  const itemOptions = useMemo(() => {
    const itemsInSale = selectedSaleData?.items || [];
    return itemsInSale
      .filter((item) => {
        const alreadyReturned = item.returned_quantity || 0;
        const maxReturnable = item.quantity - alreadyReturned;
        const isAlreadyInList = returnItems.some(
          (ri) => ri.id === item.item_id
        );
        return maxReturnable > 0 && !isAlreadyInList;
      })
      .map((item) => ({ value: item.item_id, label: item.item_name }));
  }, [selectedSaleData, returnItems]);

  // --- Handlers ---
  const handleSaleSelect = (selectedId) => {
    setSaleId(selectedId);
    setReturnItems([]);
  };

  const handleItemAdd = (selectedItemId) => {
    if (!selectedItemId) return;
    const itemToAdd = selectedSaleData.items.find(
      (item) => item.item_id === parseInt(selectedItemId, 10)
    );
    const itemDetails = allItems.find((i) => i.id === itemToAdd.item_id);
    if (itemToAdd) {
      const alreadyReturned = itemToAdd.returned_quantity || 0;
      setReturnItems((prev) => [
        ...prev,
        {
          id: itemToAdd.item_id,
          name: itemToAdd.item_name,
          price: parseFloat(itemToAdd.unit_price),
          taxPercentage: parseFloat(itemDetails?.tax) || 0,
          maxReturnable: itemToAdd.quantity - alreadyReturned,
          quantity: 1,
        },
      ]);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) =>
    setReturnItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );

  const handleItemDelete = (itemId) =>
    setReturnItems((prev) => prev.filter((item) => item.id !== itemId));

  const handleCancel = () => navigate("/sale-return-report");

  const handleProcessReturn = () => {
    if (isViewMode) return;

    if (!saleId) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select an original sale.",
        status: TOASTSTATUS.ERROR,
      });
      saleSelectRef.current?.focus();
      return;
    }
    if (returnItems.length === 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please add at least one item to return.",
        status: TOASTSTATUS.ERROR,
      });
      itemSelectRef.current?.focus();
      return;
    }

    if (isSkipPayment) {
        const pendingPaymentData = {
            status: 'pending',
            refunded_amount: 0,
            payment_methods: [],
            note: "Sale Return (Refund Pending)"
        };
        handleFinalSubmit(pendingPaymentData);
    } else {
        setIsPaymentModalOpen(true);
    }
  };

  const handleFinalSubmit = async (paymentData, print = false) => {
    try {
      const item = itemsWithCalculations[0];

      // Calculate refunded_amount manually to satisfy validator
      const calculatedRefundedAmount = paymentData.payment_methods?.reduce(
        (acc, curr) => acc + (parseFloat(curr.amount) || 0), 0
      ) || 0;

      // Common payload properties
      const payloadBase = {
        date: returnDate.toISOString(),
        reason: reason || "N/A",
        done_by_id: doneById || null,
        cost_center_id: costCenterId || null,
        payment_methods: paymentData.payment_methods,
        status: paymentData.status,
        unit_price: item.price,
        refunded_amount: calculatedRefundedAmount, 
      };

      if (mode === "edit") {
        const payload = {
          ...payloadBase,
          // FIX: Include IDs for update validation
          sale_id: parseInt(saleId, 10),
          item_id: parseInt(item.id, 10),
          
          return_quantity: parseInt(item.quantity, 10),
          invoice_number: invoiceNumber,
        };
        await updateSaleReturn({ id, data: payload });
        showToast({
          crudItem: CRUDITEM.SALE_RETURN,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const payload = {
          ...payloadBase,
          sale_id: parseInt(saleId, 10),
          item_id: parseInt(item.id, 10),
          return_quantity: parseInt(item.quantity, 10),
          invoice_number: invoiceNoData?.invoice_number,
        };
        await createSaleReturn(payload);
        showToast({
          crudItem: CRUDITEM.SALE_RETURN,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      setIsPaymentModalOpen(false);
      navigate("/sale-return-report");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Failed to ${mode} sale return.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const isLoading =
    isFetchingSaleReturn ||
    isFetchingSales ||
    isFetchingCustomers ||
    isFetchingItems ||
    isFetchingAccounts ||
    (saleId && isFetchingSelectedSale);

  if (isLoading) return <Loader />;

  const isDisabled = mode === "view";

  return (
    <ContainerWrapper>
      <div className="sale-return-page">
        {/* MODIFIED HEADER STRUCTURE */}
        <HStack
            className="sale-return-page__header" // Keep the class for styling
            style={{
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
            }}
        >
            <HStack spacing={10} style={{ alignItems: "center" }}>
                <IconBackButton onClick={handleCancel} />
                <PageTitle
                    title={
                        mode === "add"
                            ? "Create Sale Return"
                            : mode === "edit"
                            ? "Edit Sale Return"
                            : "View Sale Return"
                    }
                />
                {/* ADDED VIEW BUTTON */}
                <ViewButtonForReceiptAndPayment
                    path="/sale-return-report"
                    buttonText="View Sale Returns"
                />
                {/* END ADDED VIEW BUTTON */}
            </HStack>
        </HStack>
        {/* END MODIFIED HEADER STRUCTURE */}

        <div className="sale-return-page__form-container">
          <ScrollContainer>
            <div className="sale-return-page__form-content">
              {/* Top Controls Grid */}
              <div className="sale-return-page__top-controls">
                <HStack justifyContent="flex-start">
                  <DoneByAutoCompleteWithAddOption
                    placeholder="Select Done By"
                    name="done_by_id"
                    value={doneById}
                    onChange={(e) => setDoneById(e.target.value)}
                    disabled={isDisabled}
                  />
                  <CostCenterAutoCompleteWithAddOption
                    placeholder="Select Cost Center"
                    name="cost_center_id"
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    disabled={isDisabled}
                  />
                </HStack>

                <SelectField
                  label="Sale Invoice"
                  ref={saleSelectRef}
                  value={saleId}
                  onChange={(e) => handleSaleSelect(e.target.value)}
                  options={saleOptions}
                  disabled={isDisabled || mode === "edit"}
                />
                <HStack justifyContent="flex-start">
                  {selectedSaleData && (
                    <InputField
                      label="Customer"
                      value={customerMap[selectedSaleData.party_id] || ""}
                      readOnly
                    />
                  )}
                  <DateField
                    value={returnDate}
                    onChange={setReturnDate}
                    disabled={isDisabled}
                  />
                </HStack>
              </div>

              {/* Item Selection */}
              {saleId && !isFetchingSelectedSale && mode === "add" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <SelectField
                    ref={itemSelectRef}
                    onChange={(e) => handleItemAdd(e.target.value)}
                    options={itemOptions}
                    placeholder="Select an item from the sale to return..."
                    value=""
                  />
                </div>
              )}

              {isFetchingSelectedSale && (
                <p style={{ textAlign: "center", margin: "1rem 0" }}>
                  Loading sale details...
                </p>
              )}

              {/* Table */}
              <div className="sale-return-page__order-table">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>PRODUCT</Th>
                      <Th>PRICE</Th>
                      <Th>RETURNABLE</Th>
                      <Th>RETURN QTY</Th>
                      <Th>TAX</Th>
                      <Th>SUBTOTAL</Th>
                      {!isDisabled && <Th>ACTION</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {itemsWithCalculations.length > 0 ? (
                      itemsWithCalculations.map((item) => (
                        <Tr key={item.id}>
                          <Td>
                            <div style={{ paddingLeft: "12px" }}>
                              {item.name}
                            </div>
                          </Td>
                          <Td>
                            <AmountSymbol>{item.price.toFixed(2)}</AmountSymbol>
                          </Td>
                          <Td>
                            <span className="stock-badge">
                              {item.maxReturnable}
                            </span>
                          </Td>
                          <Td>
                            <QuantitySelector
                              initialValue={item.quantity}
                              onChange={(newQty) =>
                                handleQuantityChange(item.id, newQty)
                              }
                              min={1}
                              max={item.maxReturnable}
                              disabled={isDisabled}
                            />
                          </Td>
                          <Td>
                            <AmountSymbol>
                              {item.taxAmount.toFixed(2)}
                            </AmountSymbol>
                          </Td>
                          <Td>
                            <AmountSymbol>
                              {item.subtotal.toFixed(2)}
                            </AmountSymbol>
                          </Td>
                          <Td>
                            {!isDisabled && (
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => handleItemDelete(item.id)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <TableCaption
                        item="Products"
                        noOfCol={7}
                        message="No products have been added for return."
                      />
                    )}
                  </Tbody>
                </Table>
              </div>
            </div>
          </ScrollContainer>
        </div>

        {!isDisabled && (
          <div className="sale-return-page__actions">
            {/* New Single Row Bottom Section */}
            <div className="sale-return-page__bottom-section">
              <div className="bottom-stat-item" style={{ marginRight: "auto" }}>
                <span className="stat-label">Reason:</span>
                <div className="stat-input-wrapper" style={{ width: "250px" }}>
                  <InputField
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason..."
                    disabled={isDisabled}
                  />
                </div>
              </div>

              <div className="bottom-stat-item">
                <span className="stat-label">Subtotal:</span>
                <span className="stat-value">
                  <AmountSymbol>{subtotalAmount.toFixed(2)}</AmountSymbol>
                </span>
              </div>

              <div className="bottom-stat-item">
                <span className="stat-label">Tax:</span>
                <span className="stat-value">
                  <AmountSymbol>{totalTaxAmount.toFixed(2)}</AmountSymbol>
                </span>
              </div>

              <div className="bottom-stat-item grand-totals">
                <span className="stat-label">Total Refund:</span>
                <span className="stat-value">
                  <AmountSymbol>{totalRefundAmount.toFixed(2)}</AmountSymbol>
                </span>
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <HStack justifyContent="flex-end" alignItems="center">
                {/* Skip Payment Toggle */}
                {!isViewMode && (
                    <div className="skip-payment-toggle" style={{ marginRight: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="toggle-label" style={{ fontSize: "14px", fontWeight: "500", color: "#666" }}>
                            Skip Payment
                        </span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={isSkipPayment}
                                onChange={(e) => setIsSkipPayment(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                )}

                <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                <SubmitButton
                  onClick={handleProcessReturn}
                  disabled={isCreating || isUpdating}
                >
                  <FaSave style={{ marginRight: "5px" }} /> Process Refund &
                  Save
                </SubmitButton>
              </HStack>
            </div>
          </div>
        )}

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          calculations={modalCalculations}
          onSubmit={handleFinalSubmit}
          isProcessing={isCreating || isUpdating}
          accounts={accounts}
          initialPayments={existingPayments}
          mode={mode}
        />
      </div>
    </ContainerWrapper>
  );
};

export default SaleReturn;