import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash, FaSave, FaEye } from "react-icons/fa";
import useSuppliers from "@/hooks/api/supplier/useSuppliers";
import useItem from "@/hooks/api/item/useItem";
import usePurchaseById from "@/hooks/api/purchase/usePurchaseById";
import useCreatePurchase from "@/hooks/api/purchase/useCreatePurchase";
import useUpdatePurchase from "@/hooks/api/purchase/useUpdatePurchase";
import { usePurchaseInvoiceNo } from "@/hooks/api/purchaseInvoiceNo/usePurchaseInvoiceNo";
import useAccounts from "@/hooks/api/account/useAccounts";
import { useToast } from "@/context/ToastContext";
import AmountSymbol from "@/components/AmountSymbol";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageTitle from "@/components/PageTitle";
import IconBackButton from "@/apps/user/components/IconBackButton";
import Loader from "@/components/Loader";
import HStack from "@/components/HStack";
import DateField from "@/components/DateField";
import InputField from "@/components/InputField";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import SupplierAutoCompleteWithAddOption from "@/apps/user/components/SupplierAutoCompleteWithAddOption";
import ItemAutoCompleteWithAddOption from "@/apps/user/components/ItemAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import { useIsMobile } from "@/utils/useIsMobile";
import QuantitySelector from "@/components/QuantitySelector";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ItemDetailModal from "@/apps/user/components/ItemDetailModal";
import ThreeDotActionMenu from "@/components/ThreeDotActionMenu";
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

const DRAFT_STORAGE_KEY = "purchase_form_draft";

const Purchase = () => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const showToast = useToast();
  const isViewMode = mode === "view";

  const partyRef = useRef(null);
  const itemSearchRef = useRef(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [viewItemId, setViewItemId] = useState(null);
  const [isViewItemModalOpen, setIsViewItemModalOpen] = useState(false);

  const [existingPayments, setExistingPayments] = useState([]);

  const defaultForm = {
    purchaseDate: new Date().toISOString(),
    partyId: "",
    orderItems: [],
    done_by_id: "",
    cost_center_id: "",
    status: "pending",
    discount: 0,
    invoice_number: "",
  };

  const [form, setForm] = useState(() => {
    if (mode === "add") {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          delete parsedDraft.payments;
          delete parsedDraft.shipping;
          return { ...defaultForm, ...parsedDraft };
        } catch (e) {
          return defaultForm;
        }
      }
    }
    return defaultForm;
  });

  const { data: purchaseData, isLoading: isFetchingPurchase } =
    usePurchaseById(id);
  const { data: suppliers = [], isLoading: isFetchingSuppliers } =
    useSuppliers();
  const { data: items = [], isLoading: isFetchingItems } = useItem();
  const { mutateAsync: createPurchase, isPending: isCreating } =
    useCreatePurchase();
  const { mutateAsync: updatePurchase, isPending: isUpdating } =
    useUpdatePurchase();
  const { data: invoiceNoData } = usePurchaseInvoiceNo(!id);

  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();

  const itemsWithCalculations = useMemo(() => {
    return form.orderItems.map((item) => {
      const originalItem = items.find((i) => i.id === item.id);
      const stock = originalItem ? originalItem.stock_quantity : 0;

      const baseTotal = item.price * item.quantity;
      const taxAmount = (baseTotal * item.taxPercentage) / 100;
      const subtotal = baseTotal + taxAmount;
      return { ...item, taxAmount, subtotal, stock };
    });
  }, [form.orderItems, items]);

  // Derive the active item for the modal
  const activeViewItem = useMemo(() => {
    if (!viewItemId) return null;
    return itemsWithCalculations.find((item) => item.id === viewItemId);
  }, [itemsWithCalculations, viewItemId]);

  const itemsSubtotal = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.subtotal, 0),
    [itemsWithCalculations]
  );

  const totalTax = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.taxAmount, 0),
    [itemsWithCalculations]
  );

  const totalQty = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.quantity, 0),
    [itemsWithCalculations]
  );

  const grandTotal = useMemo(
    () => Math.max(0, itemsSubtotal - form.discount),
    [itemsSubtotal, form.discount]
  );

  const modalCalculations = useMemo(
    () => ({
      total: grandTotal,
      subTotal: itemsSubtotal,
      taxAmount: totalTax,
      totalQty: totalQty,
      discount: form.discount,
    }),
    [grandTotal, itemsSubtotal, totalTax, totalQty, form.discount]
  );

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, mode]);

  useEffect(() => {
    if (purchaseData && (mode === "edit" || mode === "view")) {
      const loadedItems = purchaseData.items.map((item) => {
        const dbItem = items.find((i) => i.id === item.item_id);
        return {
          id: item.item_id,
          name: item.item_name,
          price: parseFloat(item.unit_price),
          quantity: item.quantity,
          taxPercentage: dbItem ? parseFloat(dbItem.tax) : 0,
        };
      });

      setForm({
        purchaseDate: purchaseData.date,
        partyId: purchaseData.party_id,
        done_by_id: purchaseData.done_by_id || "",
        cost_center_id: purchaseData.cost_center_id || "",
        discount: parseFloat(purchaseData.discount) || 0,
        orderItems: loadedItems,
        status: purchaseData.status || "unpaid",
        invoice_number: purchaseData.invoice_number,
      });

      // Map Backend Payment Data to Frontend Format
      if (purchaseData.payment_methods) {
        const validPayments = purchaseData.payment_methods.filter(
          (p) => p && p.account_id
        );

        const mappedPayments = validPayments.map((p) => ({
          ...p,
          mode_of_payment_id: p.mode_of_payment_id || p.mode_of_payment,
        }));

        setExistingPayments(mappedPayments);
      }
    }

    if (mode === "add" && partyRef.current) {
      setTimeout(() => partyRef.current.focus(), 100);
    }
  }, [purchaseData, items, mode]);

  const handleProductSelect = (selectedItemId) => {
    if (
      !selectedItemId ||
      form.orderItems.some((item) => item.id === selectedItemId)
    )
      return;
    const itemToAdd = items.find((item) => item.id === selectedItemId);
    if (itemToAdd) {
      const newItem = {
        id: itemToAdd.id,
        name: itemToAdd.name,
        price: parseFloat(itemToAdd.purchase_price) || 0,
        quantity: 1,
        taxPercentage: parseFloat(itemToAdd.tax) || 0,
      };
      setForm((prev) => ({
        ...prev,
        orderItems: [...prev.orderItems, newItem],
      }));
    }
  };

  const handleQuantityChange = (itemId, newQuantity) =>
    setForm((prev) => ({
      ...prev,
      orderItems: prev.orderItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ),
    }));

  const handleItemDelete = (itemId) =>
    setForm((prev) => ({
      ...prev,
      orderItems: prev.orderItems.filter((item) => item.id !== itemId),
    }));

  const handleCancel = () => navigate(-1);

  const handleViewItemDetails = (item) => {
    setViewItemId(item.id);
    setIsViewItemModalOpen(true);
  };

  const [isCredit, setisCredit] = useState(false);

  const handleProcessPayment = () => {
    if (isViewMode) return;

    if (!form.partyId) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a supplier.",
        status: TOASTSTATUS.ERROR,
      });
      partyRef.current?.focus();
      return;
    }

    if (form.orderItems.length === 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please add at least one item.",
        status: TOASTSTATUS.ERROR,
      });
      itemSearchRef.current?.focus();
      return;
    }

    if (isCredit) {
      const pendingPaymentData = {
        status: "unpaid",
        paid_amount: 0,
        payment_methods: [],
        note: "Credit Purchase (Payment Pending)",
      };
      handleFinalSubmit(pendingPaymentData);
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handleFinalSubmit = async (paymentData, print = false) => {
    // 1. Calculate the paid amount manually to satisfy the backend validator
    const calculatedPaidAmount =
      paymentData.payment_methods?.reduce(
        (acc, curr) => acc + (parseFloat(curr.amount) || 0),
        0
      ) || 0;

    const payload = {
      party_id: form.partyId,
      done_by_id: form.done_by_id || null,
      cost_center_id: form.cost_center_id || null,
      status: paymentData.status,
      // 2. explicitly send the calculated paid amount
      paid_amount: calculatedPaidAmount,
      discount: form.discount,
      invoice_number: id ? form.invoice_number : invoiceNoData?.invoice_number,
      date: form.purchaseDate,
      items: form.orderItems.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payment_methods: paymentData.payment_methods,
      note: paymentData.note,
    };

    try {
      if (mode === "edit") {
        await updatePurchase({ id, purchaseData: payload });
        showToast({
          crudItem: CRUDITEM.PURCHASE,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createPurchase(payload);
        showToast({
          crudItem: CRUDITEM.PURCHASE,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setForm(defaultForm);
      }
      setIsPaymentModalOpen(false);
      navigate("/purchase-report");
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${mode} purchase.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  if (
    isFetchingPurchase ||
    isFetchingSuppliers ||
    isFetchingItems ||
    isFetchingAccounts
  )
    return <Loader />;

  return (
    <ContainerWrapper className="purchase-page">
      {/* MODIFIED HEADER STRUCTURE TO INCLUDE VIEW BUTTON */}
      <HStack
        className="purchase-page__header"
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
                ? "Create Purchase"
                : mode === "edit"
                ? "Edit Purchase"
                : "View Purchase"
            }
          />
          {/* ADDED VIEW BUTTON */}
          <ViewButtonForReceiptAndPayment
            path="/purchase-report"
            buttonText="View Purchase Report"
          />
          {/* END ADDED VIEW BUTTON */}
        </HStack>
      </HStack>
      {/* END MODIFIED HEADER STRUCTURE */}

      <ScrollContainer className="purchase-page__scroll-container">
        <div className="purchase-page__form-content">
          {isMobile ? (
            <>
              <HStack justifyContent="flex-start">
                <SupplierAutoCompleteWithAddOption
                  ref={partyRef}
                  name="partyId"
                  value={form.partyId}
                  onChange={handleChange}
                  disabled={isViewMode}
                />
                <DateField
                  label="Date "
                  value={new Date(form.purchaseDate)}
                  onChange={(date) =>
                    setForm((prev) => ({
                      ...prev,
                      purchaseDate: date.toISOString(),
                    }))
                  }
                  disabled={isViewMode}
                />
              </HStack>
              <HStack justifyContent="flex-start">
                <DoneByAutoCompleteWithAddOption
                  placeholder="Select Done By"
                  name="done_by_id"
                  value={form.done_by_id}
                  onChange={handleChange}
                  disabled={isViewMode}
                />
                <CostCenterAutoCompleteWithAddOption
                  placeholder="Select Cost Center"
                  name="cost_center_id"
                  value={form.cost_center_id}
                  onChange={handleChange}
                  disabled={isViewMode}
                />
              </HStack>
            </>
          ) : (
            <HStack justifyContent="flex-start" style={{ marginTop: "5px" }}>
              <SupplierAutoCompleteWithAddOption
                ref={partyRef}
                name="partyId"
                value={form.partyId}
                onChange={handleChange}
                disabled={isViewMode}
              />
              <DoneByAutoCompleteWithAddOption
                placeholder="Select Done By"
                name="done_by_id"
                value={form.done_by_id}
                onChange={handleChange}
                disabled={isViewMode}
              />
              <CostCenterAutoCompleteWithAddOption
                placeholder="Select Cost Center"
                name="cost_center_id"
                value={form.cost_center_id}
                onChange={handleChange}
                disabled={isViewMode}
              />
              <DateField
                label="Date "
                value={new Date(form.purchaseDate)}
                onChange={(date) =>
                  setForm((prev) => ({
                    ...prev,
                    purchaseDate: date.toISOString(),
                  }))
                }
                disabled={isViewMode}
              />
            </HStack>
          )}

          <div className="purchase-page__order-table">
            <Table>
              <Thead>
                <Tr>
                  {!isViewMode && (
                    <div className="fs14">
                      <ItemAutoCompleteWithAddOption
                        style={{
                          minwidth: "80px",
                          width: "60%",
                          padding: "8px",
                        }}
                        ref={itemSearchRef}
                        placeholder="Start typing to add items..."
                        onChange={(e) => handleProductSelect(e.target.value)}
                      />
                    </div>
                  )}{" "}
                  {!isMobile && <Th>COST</Th>}
                  <Th>QTY</Th>
                  {!isMobile && <Th>TAX</Th>}
                  <Th>SUBTOTAL</Th>
                  <Th>ACTION</Th>
                </Tr>
              </Thead>
              <Tbody>
                {itemsWithCalculations.length > 0 ? (
                  itemsWithCalculations.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <div style={{ paddingLeft: "12px" }}>{item.name}</div>
                      </Td>

                      {!isMobile && (
                        <Td>
                          <AmountSymbol>{item.price}</AmountSymbol>
                        </Td>
                      )}

                      <Td>
                        <QuantitySelector
                          initialValue={item.quantity}
                          onChange={(newQty) =>
                            handleQuantityChange(item.id, newQty)
                          }
                          min={1}
                          disabled={isViewMode}
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
                        <AmountSymbol>{item.subtotal.toFixed(2)}</AmountSymbol>
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
                              onDelete={() => handleItemDelete(item.id)}
                              isViewMode={isViewMode}
                            />
                          </div>
                        ) : (
                          <div
                            className="actions-group"
                            style={{ display: "flex", gap: "8px" }}
                          >
                            {!isViewMode && (
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => handleItemDelete(item.id)}
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
                    noOfCol={isMobile ? 4 : isViewMode ? 6 : 7}
                    message={
                      id ? "No products found." : "No products have been added."
                    }
                  />
                )}
              </Tbody>
            </Table>
          </div>
        </div>
      </ScrollContainer>

      {/* Updated Bottom Section & Actions */}
      {!isViewMode && (
        <div className="purchase-page__actions">
          <div className="purchase-page__bottom-section">
            <div className="bottom-stat-item" style={{ marginRight: "auto" }}>
              <span className="stat-label">Discount:</span>
              <div className="stat-input-wrapper">
                <InputField
                  type="number"
                  min="0"
                  value={form.discount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      discount: Math.max(0, parseFloat(e.target.value) || 0),
                    }))
                  }
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="bottom-stat-item">
              <span className="stat-label">Subtotal:</span>
              <span className="stat-value">
                <AmountSymbol>{itemsSubtotal.toFixed(2)}</AmountSymbol>
              </span>
            </div>

            <div className="bottom-stat-item">
              <span className="stat-label">Tax:</span>
              <span className="stat-value">
                <AmountSymbol>{totalTax.toFixed(2)}</AmountSymbol>
              </span>
            </div>

            <div className="bottom-stat-item grand-totals">
              <span className="stat-label">Total:</span>
              <span className="stat-value">
                <AmountSymbol>{grandTotal.toFixed(2)}</AmountSymbol>
              </span>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <HStack justifyContent="flex-end" alignItems="center">
              {!isViewMode && (
                <div
                  className="skip-payment-toggle"
                  style={{
                    marginRight: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    className="toggle-label"
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#666",
                    }}
                  >
                   Credit
                  </span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={isCredit}
                      onChange={(e) => setisCredit(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              )}

              <CancelButton onClick={handleCancel}>Cancel</CancelButton>
              {mode === "add" && (
                <SubmitButton
                  label="submit"
                  onClick={handleProcessPayment}
                  disabled={isCreating || isUpdating}
                >
                  <FaSave style={{ marginRight: "5px" }} /> Process Purchase &
                  Save
                </SubmitButton>
              )}
              {mode === "edit" && (
                <SubmitButton
                  label="update"
                  onClick={handleProcessPayment}
                  disabled={isCreating || isUpdating}
                >
                  <FaSave style={{ marginRight: "5px" }} /> update
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
        onQuantityChange={handleQuantityChange}
      />
    </ContainerWrapper>
  );
};

export default Purchase;