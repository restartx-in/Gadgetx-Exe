import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash, FaSave } from "react-icons/fa";

// --- HOOKS ---
import useCreatePurchaseReturn from "@/hooks/api/purchaseReturns/useCreatePurchaseReturns";
import { usePurchaseReturnInvoiceNo } from "@/hooks/api/purchaseReturnInvoiceNo/usePurchaseReturnInvoiceNo";
import useUpdatePurchaseReturn from "@/hooks/api/purchaseReturns/useUpdatePurchaseReturns";
import usePurchaseReturnById from "@/hooks/api/purchaseReturns/usePurchaseReturnsById";
import usePurchasesPaginated from "@/hooks/api/purchase/usePurchasesPaginated";
import usePurchaseById from "@/hooks/api/purchase/usePurchaseById";
import useAccounts from "@/hooks/api/account/useAccounts";
import { useToast } from "@/context/ToastContext";
import { useIsMobile } from "@/utils/useIsMobile"; 

// --- CONSTANTS ---
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

// --- COMPONENTS ---
import AmountSymbol from "@/components/AmountSymbol";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageTitle from "@/components/PageTitle";
import IconBackButton from "@/apps/user/components/IconBackButton";
import Loader from "@/components/Loader";
import HStack from "@/components/HStack";
import DateField from "@/components/DateField";
import SelectField from "@/components/SelectField";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ThreeDotActionMenu from "@/components/ThreeDotActionMenu"; 
import ItemDetailModal from "@/apps/user/components/ItemDetailModal"; 
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
import QuantitySelector from "@/components/QuantitySelector";
import InputField from "@/components/InputField";
import "./style.scss";

const PurchaseReturn = () => {
  const navigate = useNavigate();
  const { id, mode } = useParams();
  const showToast = useToast();
  const isViewMode = mode === "view";
  const isMobile = useIsMobile(); 

  // --- Refs for input focus ---
  const purchaseSelectRef = useRef(null);
  const itemSelectRef = useRef(null);

  // --- Form State ---
  const [returnDate, setReturnDate] = useState(new Date());
  const [purchaseId, setPurchaseId] = useState("");
  const [reason, setReason] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [doneById, setDoneById] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(null);

  const [existingPayments, setExistingPayments] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSkipPayment, setIsSkipPayment] = useState(false); // Added Skip State

  // --- State for Item Detail Modal ---
  const [viewItemId, setViewItemId] = useState(null);
  const [isViewItemModalOpen, setIsViewItemModalOpen] = useState(false);

  const { data: returnData, isLoading: isLoadingReturn } =
    usePurchaseReturnById(id, { enabled: !!id });
  const { data: purchasesResult, isLoading: isFetchingPurchases } =
    usePurchasesPaginated({ page_size: 1000, sort: "-date" });

  const purchaseIdToFetch = purchaseId || returnData?.purchase_id;

  const { data: selectedPurchase, isLoading: isFetchingPurchaseDetails } =
    usePurchaseById(purchaseIdToFetch, { enabled: !!purchaseIdToFetch });

  const { mutateAsync: createPurchaseReturn, isPending: isCreating } =
    useCreatePurchaseReturn();
  const { mutateAsync: updatePurchaseReturn, isPending: isUpdating } =
    useUpdatePurchaseReturn();
  const { data: invoiceNoData } = usePurchaseReturnInvoiceNo(!id);

  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();

  // --- Effects ---
  useEffect(() => {
    if ((mode === "edit" || isViewMode) && returnData) {
      setReturnDate(new Date(returnData.date));
      setPurchaseId(returnData.purchase_id);
      setInvoiceNumber(returnData.invoice_number);
      setDoneById(returnData.done_by_id || "");
      setCostCenterId(returnData.cost_center_id || "");
      setReason(returnData.reason || "");

      const returnedItemDetails = selectedPurchase?.items.find(
        (i) => i.item_id === returnData.item_id
      );

      const unitPrice =
        returnData.return_quantity > 0
          ? parseFloat(returnedItemDetails?.unit_price) || 0
          : 0;

      const returnedItem = {
        item_id: returnData.item_id,
        item_name: returnData.item_name,
        unit_price: unitPrice,
        tax_percentage: parseFloat(returnedItemDetails?.item_tax) || 0,
        max_quantity:
          (returnedItemDetails?.quantity || 0) + returnData.return_quantity,
        return_quantity: returnData.return_quantity,
      };
      setReturnItems([returnedItem]);

      // --- Map Backend Payment Data to Frontend Format ---
      if (returnData.payment_methods) {
        const validPayments = returnData.payment_methods.filter(
          (p) => p && p.account_id
        );
        const mappedPayments = validPayments.map((p) => ({
          ...p,
          // Use mode_of_payment_id from backend
          mode_of_payment_id: p.mode_of_payment_id,
        }));
        setExistingPayments(mappedPayments);
      }
    }
    if (mode === "add" && purchaseSelectRef.current) {
      setTimeout(() => purchaseSelectRef.current.focus(), 100);
    }
  }, [mode, isViewMode, returnData, selectedPurchase]);

  // --- Memoized Calculations ---
  const itemsWithCalculations = useMemo(
    () =>
      returnItems.map((item) => {
        const baseTotal = item.unit_price * item.return_quantity;
        const taxAmount = (baseTotal * item.tax_percentage) / 100;
        const subtotal = baseTotal + taxAmount;
        return { ...item, taxAmount, subtotal };
      }),
    [returnItems]
  );

  const activeViewItem = useMemo(() => {
    if (!viewItemId) return null;
    const item = itemsWithCalculations.find(
      (item) => item.item_id === viewItemId
    );
    if (!item) return null;
    return {
      id: item.item_id,
      name: item.item_name,
      stock: item.max_quantity, 
      price: item.unit_price,
      quantity: item.return_quantity,
      taxPercentage: item.tax_percentage,
      taxAmount: item.taxAmount,
      subtotal: item.subtotal,
    };
  }, [itemsWithCalculations, viewItemId]);

  const subtotalAmount = useMemo(
    () =>
      itemsWithCalculations.reduce(
        (sum, item) => sum + item.unit_price * item.return_quantity,
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
      itemsWithCalculations.reduce(
        (total, item) => total + item.return_quantity,
        0
      ),
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

  const purchaseOptions =
    purchasesResult?.data?.map((p) => ({
      value: p.id,
      label: `INV-${p.id} | ${p.party_name} | ${new Date(
        p.date
      ).toLocaleDateString()}`,
    })) || [];

  const itemOptions = useMemo(() => {
    const itemsInPurchase = selectedPurchase?.items || [];
    return itemsInPurchase
      .filter((item) => {
        const isAlreadyInList = returnItems.some(
          (ri) => ri.item_id === item.item_id
        );
        return !isAlreadyInList;
      })
      .map((item) => ({ value: item.item_id, label: item.item_name }));
  }, [selectedPurchase, returnItems]);

  // --- Handlers ---
  const handlePurchaseSelect = (selectedId) => {
    setPurchaseId(selectedId);
    setReturnItems([]);
  };

  const handleItemAdd = (selectedItemId) => {
    if (!selectedItemId) return;
    const itemToAdd = selectedPurchase.items.find(
      (item) => item.item_id === parseInt(selectedItemId, 10)
    );
    if (itemToAdd) {
      setReturnItems((prev) => [
        ...prev,
        {
          ...itemToAdd,
          max_quantity: itemToAdd.quantity,
          unit_price: parseFloat(itemToAdd.unit_price) || 0,
          tax_percentage: parseFloat(itemToAdd.item_tax) || 0,
          return_quantity: 1,
        },
      ]);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) =>
    setReturnItems((prev) =>
      prev.map((item) =>
        item.item_id === itemId
          ? { ...item, return_quantity: newQuantity }
          : item
      )
    );

  const handleItemDelete = (itemId) =>
    setReturnItems((prev) => prev.filter((item) => item.item_id !== itemId));

  const handleViewItemDetails = (item) => {
    setViewItemId(item.item_id);
    setIsViewItemModalOpen(true);
  };

  const handleCancel = () => navigate("/purchase-return-report");

  // --- UPDATED PROCESS HANDLER ---
  const handleProcessReturn = () => {
    if (isViewMode) return;

    if (!purchaseId) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select an original purchase.",
        status: TOASTSTATUS.ERROR,
      });
      purchaseSelectRef.current?.focus();
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
            note: "Purchase Return (Refund Pending)"
        };
        handleFinalSubmit(pendingPaymentData);
    } else {
        setIsPaymentModalOpen(true);
    }
  };

  const handleFinalSubmit = async (paymentData, print = false) => {
    try {
      const item = itemsWithCalculations[0];

      const calculatedRefundedAmount = paymentData.payment_methods?.reduce(
        (acc, curr) => acc + (parseFloat(curr.amount) || 0), 0
      ) || 0;

      const payloadBase = {
        date: returnDate.toISOString(),
        reason: reason || "N/A",
        done_by_id: doneById || null,
        unit_price: item.unit_price, 
        cost_center_id: costCenterId || null,
        payment_methods: paymentData.payment_methods,
        status: paymentData.status,
        total_refund_amount: totalRefundAmount, 
        refunded_amount: calculatedRefundedAmount, // Explicitly send calculation
      };

       if (mode === 'edit') {
        const payload = {
          ...payloadBase,
          return_quantity: parseInt(item.return_quantity, 10),
          invoice_number: invoiceNumber,
        }
        await updatePurchaseReturn({ id, data: payload });
        showToast({
          crudItem: CRUDITEM.PURCHASE_RETURN,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      }  else {
        const payload = {
          ...payloadBase,
          purchase_id: parseInt(purchaseId, 10),
          item_id: parseInt(item.item_id, 10),
          return_quantity: parseInt(item.return_quantity, 10),
          invoice_number: invoiceNoData?.invoice_number,
        }
        await createPurchaseReturn(payload);
        showToast({
          crudItem: CRUDITEM.PURCHASE_RETURN,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      setIsPaymentModalOpen(false);
      navigate("/purchase-return-report");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Failed to ${mode} purchase return.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const isLoading =
    isLoadingReturn ||
    isFetchingPurchases ||
    isFetchingPurchaseDetails ||
    isFetchingAccounts;

  if (isLoading && (mode !== "add" || purchaseId)) return <Loader />;

  const pageTitle =
    mode === "add"
      ? "Create Purchase Return"
      : mode === "edit"
      ? "Edit Purchase Return"
      : "View Purchase Return";
  const isDisabled = isViewMode;
  const isPurchaseSelectorDisabled =
    mode === "edit" || mode === "view" || (mode === "add" && id);

  return (
    <ContainerWrapper>
      <div className="purchase-return-page">
        {/* MODIFIED HEADER STRUCTURE */}
        <HStack
            className="purchase-return-page__header" // Keep the class for styling
            style={{
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
            }}
        >
            <HStack spacing={10} style={{ alignItems: "center" }}>
                <IconBackButton onClick={handleCancel} />
                <PageTitle title={pageTitle} />
                {/* ADDED VIEW BUTTON */}
                <ViewButtonForReceiptAndPayment
                    path="/purchase-return-report"
                    buttonText="View Purchase Returns"
                />
                {/* END ADDED VIEW BUTTON */}
            </HStack>
        </HStack>
        {/* END MODIFIED HEADER STRUCTURE */}

        <div className="purchase-return-page__form-container">
          <ScrollContainer>
            <div className="purchase-return-page__form-content">
              {/* Top Controls Grid */}
              <div className="purchase-return-page__top-controls">
                <HStack justifyContent="flex-start">
                  <DoneByAutoCompleteWithAddOption
                    placeholder="Select Done By"
                    value={doneById}
                    onChange={(e) => setDoneById(e.target.value)}
                    disabled={isDisabled}
                  />
                  <CostCenterAutoCompleteWithAddOption
                    placeholder="Select Cost Center"
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value)}
                    disabled={isDisabled}
                  />
                </HStack>

                <SelectField
                  label="Purchase Invoice"
                  ref={purchaseSelectRef}
                  value={purchaseId}
                  onChange={(e) => handlePurchaseSelect(e.target.value)}
                  options={purchaseOptions}
                  disabled={isPurchaseSelectorDisabled}
                />

                <HStack justifyContent="flex-start">
                  {selectedPurchase && (
                    <InputField
                      label="Supplier"
                      value={selectedPurchase.party_name || ""}
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
              {purchaseId && !isFetchingPurchaseDetails && mode === "add" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <SelectField
                    ref={itemSelectRef}
                    onChange={(e) => handleItemAdd(e.target.value)}
                    options={itemOptions}
                    placeholder="Select an item from the purchase to return..."
                    value=""
                  />
                </div>
              )}

              {isFetchingPurchaseDetails && (
                <p style={{ textAlign: "center", margin: "1rem 0" }}>
                  Loading purchase details...
                </p>
              )}

              {/* Table */}
              <div className="purchase-return-page__order-table">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>PRODUCT</Th>
                      {!isMobile && <Th>PRICE</Th>}
                      {!isMobile && <Th>AVAILABLE</Th>}
                      <Th>RETURN QTY</Th>
                      {!isMobile && <Th>TAX</Th>}
                      <Th>SUBTOTAL</Th>
                      <Th>ACTION</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {itemsWithCalculations.length > 0 ? (
                      itemsWithCalculations.map((item) => (
                        <Tr key={item.item_id}>
                          <Td>
                            <div style={{ paddingLeft: "12px" }}>
                              {item.item_name}
                            </div>
                          </Td>
                          {!isMobile && (
                            <Td>
                              <AmountSymbol>
                                {item.unit_price.toFixed(2)}
                              </AmountSymbol>
                            </Td>
                          )}
                          {!isMobile && (
                            <Td>
                              <span className="stock-badge">
                                {item.max_quantity}
                              </span>
                            </Td>
                          )}
                          <Td>
                            <QuantitySelector
                              initialValue={item.return_quantity}
                              onChange={(newQty) =>
                                handleQuantityChange(item.item_id, newQty)
                              }
                              min={1}
                              max={item.max_quantity}
                              disabled={isDisabled}
                            />
                          </Td>
                          {!isMobile && (
                            <Td>
                              <AmountSymbol>
                                {item.taxAmount.toFixed(2)}
                              </AmountSymbol>
                            </Td>
                          )}
                          <Td>
                            <AmountSymbol>
                              {item.subtotal.toFixed(2)}
                            </AmountSymbol>
                          </Td>
                          <Td>
                            {isMobile ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  paddingRight: "10px",
                                }}
                              >
                                <ThreeDotActionMenu
                                  onView={() => handleViewItemDetails(item)}
                                  onDelete={() =>
                                    handleItemDelete(item.item_id)
                                  }
                                  isViewMode={isDisabled} 
                                />
                              </div>
                            ) : (
                              <div className="actions-group">
                                {!isDisabled && (
                                  <button
                                    type="button"
                                    className="action-btn delete-btn"
                                    onClick={() =>
                                      handleItemDelete(item.item_id)
                                    }
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            )}
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <TableCaption
                        item="Products"
                        noOfCol={isMobile ? 4 : 7}
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
          <div className="purchase-return-page__actions">
            <div className="purchase-return-page__bottom-section">
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

            {/* Buttons */}
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
                {mode === "add" && (
                  <SubmitButton
                    label="submit"
                    onClick={handleProcessReturn}
                    disabled={isCreating || isUpdating}
                  >
                    <FaSave style={{ marginRight: "5px" }} /> Process Refund &
                    Save
                  </SubmitButton>
                )}
                {mode === "edit" && (
                  <SubmitButton
                    label="update"
                    onClick={handleProcessReturn}
                    disabled={isCreating || isUpdating}
                  >
                    <FaSave style={{ marginRight: "5px" }} /> Update
                  </SubmitButton>
                )}
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

        <ItemDetailModal
          isOpen={isViewItemModalOpen}
          onClose={() => setIsViewItemModalOpen(false)}
          item={activeViewItem}
          onQuantityChange={(newQty) =>
            handleQuantityChange(viewItemId, newQty)
          }
        />
      </div>
    </ContainerWrapper>
  );
};

export default PurchaseReturn;