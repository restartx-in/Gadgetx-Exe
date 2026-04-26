import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash, FaSave, FaEye } from "react-icons/fa";
import AmountSymbol from "@/components/AmountSymbol";
import useItem from "@/hooks/api/item/useItem";
import useSalesById from "@/hooks/api/sales/useSalesById";
import useCreateSales from "@/hooks/api/sales/useCreateSales";
import { useSaleInvoiceNo } from "@/hooks/api/saleInvoiceNo/useSaleInvoiceNo";
import useUpdateSales from "@/hooks/api/sales/useUpdateSales";
import useAccounts from "@/hooks/api/account/useAccounts";
import { useToast } from "@/context/ToastContext";
import { useCustomers } from "@/hooks/api/customer/useCustomers";
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
import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import ItemAutoCompleteWithAddOption from "@/apps/user/components/ItemAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import ItemDetailModal from "@/apps/user/components/ItemDetailModal";
import QuantitySelector from "@/components/QuantitySelector";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ThreeDotActionMenu from "@/components/ThreeDotActionMenu";
import { useIsMobile } from "@/utils/useIsMobile";
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

const DRAFT_STORAGE_KEY = "sale_form_draft";

const Sale = () => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isViewMode = mode === "view";
  const isMobile = useIsMobile();

  const partyRef = useRef(null);
  const itemSearchRef = useRef(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [viewItemId, setViewItemId] = useState(null);
  const [isViewItemModalOpen, setIsViewItemModalOpen] = useState(false);

  const [existingPayments, setExistingPayments] = useState([]);

  const defaultForm = {
    saleDate: new Date().toISOString(),
    partyId: "",
    orderItems: [],
    done_by_id: "",
    cost_center_id: "",
    status: "pending",
    discount: 0,
    invoice_number: "",
    change_return: 0,
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
          console.error("Failed to parse sale draft:", e);
          return defaultForm;
        }
      }
      return defaultForm;
    }
    return defaultForm;
  });

  const { data: saleData, isLoading: isFetchingSale } = useSalesById(id);
  const { isLoading: isFetchingCustomers } = useCustomers();
  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();
  const { data: items = [], isLoading: isFetchingItems } = useItem();
  const { mutateAsync: createSale, isPending: isCreating } = useCreateSales();
  const { mutateAsync: updateSale, isPending: isUpdating } = useUpdateSales();
  const { data: invoiceNoData } = useSaleInvoiceNo();

  const itemsWithCalculations = useMemo(() => {
    return form.orderItems.map((item) => {
      const baseTotal = item.price * item.quantity;
      const taxAmount = (baseTotal * item.taxPercentage) / 100;
      const subtotal = baseTotal + taxAmount;
      return { ...item, taxAmount, subtotal };
    });
  }, [form.orderItems]);

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
    if (saleData && (mode === "edit" || mode === "view")) {
      const loadedItems = saleData.items.map((item) => {
        const dbItem = items.find((i) => i.id === item.item_id);
        return {
          id: item.item_id,
          name: item.item_name,
          stock: dbItem?.stock_quantity || 0,
          price: parseFloat(item.unit_price),
          quantity: item.quantity,
          taxPercentage: dbItem ? parseFloat(dbItem.tax) : 0,
        };
      });

      setForm({
        saleDate: saleData.date,
        partyId: saleData.party_id,
        done_by_id: saleData.done_by_id || "",
        cost_center_id: saleData.cost_center_id || "",
        discount: parseFloat(saleData.discount) || 0,
        orderItems: loadedItems,
        status: saleData.status || "unpaid",
        invoice_number: saleData.invoice_number,
        change_return: parseFloat(saleData.change_return) || 0,
      });

      if (saleData.payment_methods) {
        // Map backend payment format to frontend
        const validPayments = saleData.payment_methods
          .filter(
            (p) => p && p.account_id !== null && p.mode_of_payment_id !== null
          )
          .map((p) => ({
            ...p,
            // Ensure ID is mapped correctly for the modal
            mode_of_payment_id: p.mode_of_payment_id || p.mode_of_payment,
          }));
        setExistingPayments(validPayments);
      }
    }

    if (mode === "add") {
      const timerId = setTimeout(() => {
        if (partyRef.current) {
          partyRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [saleData, items, mode]);

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
        stock: itemToAdd.stock_quantity,
        price: parseFloat(itemToAdd.selling_price) || 0,
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
        message: "Please select a customer.",
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
        status: "unpaid", // Default to unpaid for skipped payments
        paid_amount: 0,
        change_return: 0,
        payment_methods: [{ account_id: "credit", amount: 0, mode_of_payment_id: null }],
        note: "Credit Sale (Payment Pending)",
      };
      handleFinalSubmit(pendingPaymentData);
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handleFinalSubmit = async (paymentData, print = false) => {
    // 1. Calculate paid amount manually for validator if using vouchers
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

      // 2. Explicitly send paid_amount
      paid_amount: calculatedPaidAmount,

      change_return: paymentData.change_return || 0,
      discount: form.discount,
      date: form.saleDate,
      invoice_number: id ? form.invoice_number : invoiceNoData?.invoice_number,
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
        await updateSale({ id, saleData: payload });
        showToast({
          crudItem: CRUDITEM.SALE,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createSale(payload);
        showToast({
          crudItem: CRUDITEM.SALE,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setForm(defaultForm);
      }
      setIsPaymentModalOpen(false);
      navigate("/sale-report");
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${mode} sale.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (
    (isFetchingSale && mode !== "add") ||
    isFetchingCustomers ||
    isFetchingItems ||
    isFetchingAccounts
  )
    return <Loader />;

  return (
    <ContainerWrapper>
      <div className="sale-page">
        {/* MODIFIED HEADER STRUCTURE */}
        <HStack
          className="sale-page__header" // Keep the class for styling
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
                  ? "Create Sale"
                  : mode === "edit"
                  ? "Edit Sale"
                  : "View Sale"
              }
            />
            {/* ADDED VIEW BUTTON */}
            <ViewButtonForReceiptAndPayment
              path="/sale-report"
              buttonText="View Sale Report"
            />
            {/* END ADDED VIEW BUTTON */}
          </HStack>
        </HStack>
        {/* END MODIFIED HEADER STRUCTURE */}

        <div className="sale-page__form-container">
          <ScrollContainer>
            <div className="sale-page__form-content">
              {isMobile ? (
                <>
                  <HStack justifyContent="flex-start">
                    <CustomerAutoCompleteWithAddOption
                      ref={partyRef}
                      name="partyId"
                      value={form.partyId}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                    <DateField
                      label="Date "
                      value={new Date(form.saleDate)}
                      onChange={(date) =>
                        setForm((prev) => ({
                          ...prev,
                          saleDate: date.toISOString(),
                        }))
                      }
                      disabled={isViewMode}
                    />
                    <DoneByAutoCompleteWithAddOption
                      placeholder="Select Done By"
                      name="done_by_id"
                      value={form.done_by_id}
                      onChange={handleChange}
                      disabled={isViewMode}
                    />
                  </HStack>
                  <HStack justifyContent="flex-start">
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
                <HStack
                  justifyContent="flex-start"
                  style={{ marginTop: "5px" }}
                >
                  <CustomerAutoCompleteWithAddOption
                    ref={partyRef}
                    name="partyId"
                    value={form.partyId}
                    onChange={handleChange}
                    disabled={isViewMode}
                  />
                  <DateField
                    label="Date "
                    value={new Date(form.saleDate)}
                    onChange={(date) =>
                      setForm((prev) => ({
                        ...prev,
                        saleDate: date.toISOString(),
                      }))
                    }
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
                </HStack>
              )}

              <div className="sale-page__order-table">
                <Table>
                  <Thead>
                    <Tr>
                      {!isViewMode && (
                        <div className="fs14">
                          <ItemAutoCompleteWithAddOption
                            style={{
                              minWidth: "80px",
                              width: "60%",
                              padding: "8px",
                            }}
                            ref={itemSearchRef}
                            placeholder="Select items..."
                            onChange={(e) =>
                              handleProductSelect(e.target.value)
                            }
                          />
                        </div>
                      )}
                      {!isMobile && <Th>PRICE</Th>}
                      {!isMobile && <Th>STOCK</Th>}
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
                            <div style={{ paddingLeft: "12px" }}>
                              {item.name}
                            </div>
                          </Td>
                          {!isMobile && (
                            <Td>
                              <AmountSymbol>{item.price}</AmountSymbol>
                            </Td>
                          )}
                          {!isMobile && (
                            <Td>
                              <span className="stock-badge">{item.stock}</span>
                            </Td>
                          )}
                          <Td>
                            <QuantitySelector
                              initialValue={item.quantity}
                              onChange={(newQty) =>
                                handleQuantityChange(item.id, newQty)
                              }
                              min={1}
                              max={item.stock}
                              disabled={isViewMode}
                            />
                          </Td>
                          {!isMobile && (
                            <Td>
                              <AmountSymbol>{item.taxAmount}</AmountSymbol>
                            </Td>
                          )}
                          <Td>
                            <AmountSymbol>{item.subtotal}</AmountSymbol>
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
                              <div className="actions-group">
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
                        noOfCol={isMobile ? 4 : 7}
                        message="No products have been added."
                      />
                    )}
                  </Tbody>
                </Table>
              </div>
            </div>
          </ScrollContainer>
        </div>

        {!isViewMode && (
          <div className="sale-page__actions">
            <div className="sale-page__actions-inner">
              <div className="sale-page__bottom-section">
                <div
                  className="bottom-stat-item"
                  style={{ marginRight: "auto" }}
                >
                  <span className="stat-label">Discount:</span>
                  <div className="stat-input-wrapper">
                    <InputField
                      type="number"
                      min="0"
                      value={form.discount}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          discount: Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          ),
                        }))
                      }
                      readOnly={isViewMode}
                    />
                  </div>
                </div>

                <div className="bottom-stat-item">
                  <span className="stat-label">Subtotal:</span>
                  <span className="stat-value">
                    <AmountSymbol>{itemsSubtotal}</AmountSymbol>
                  </span>
                </div>

                <div className="bottom-stat-item">
                  <span className="stat-label">Tax:</span>
                  <span className="stat-value">
                    <AmountSymbol>{totalTax}</AmountSymbol>
                  </span>
                </div>

                <div className="bottom-stat-item grand-totals">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">
                    <AmountSymbol>{grandTotal}</AmountSymbol>
                  </span>
                </div>
              </div>
              
              <div style={{ marginTop: "1rem" }}>
                <HStack justifyContent="flex-end" alignItems="center">
                  {/* Skip Payment Toggle */}
                  <div className="skip-payment-toggle" style={{ marginRight: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="toggle-label" style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Credit</span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isCredit}
                        onChange={(e) => setisCredit(e.target.checked)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                  {mode === "add" && (
                    <SubmitButton
                      label="submit"
                      onClick={handleProcessPayment}
                      disabled={isCreating || isUpdating}
                    >
                       <FaSave style={{ marginRight: "5px" }} /> Process Sale & Save
                    </SubmitButton>
                  )}
                  {mode === "edit" && (
                    <SubmitButton
                      label="update"
                      onClick={handleProcessPayment}
                      disabled={isCreating || isUpdating}
                    >
                      <FaSave style={{ marginRight: "5px" }} /> Update
                    </SubmitButton>
                  )}
                </HStack>
              </div>
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
      </div>
    </ContainerWrapper>
  );
};

export default Sale;