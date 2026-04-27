import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaTrash, FaSave, FaPrint } from "react-icons/fa";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageTitle from "@/components/PageTitle";
import Loader from "@/components/Loader";
import HStack from "@/components/HStack";
import Button from "@/components/Button";
import DateField from "@/components/DateField";
import InputField from "@/components/InputField";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";
import SelectField from "@/components/SelectField";
import { useIsMobile } from "@/utils/useIsMobile";
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

// 1. Define Zod Schema
const purchaseSchema = z.object({
  purchaseDate: z.string(),
  partyId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null, "Please select a supplier"),
  done_by_id: z.any().optional().nullable(),
  cost_center_id: z.any().optional().nullable(),
  status: z.string().default("pending"),
  discount: z.coerce.number().min(0).default(0),
  invoice_number: z.any().optional(),
  orderItems: z
    .array(
      z.object({
        id: z.any(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().min(0.0001),
        taxPercentage: z.number(),
      }),
    )
    .min(1, "Please add at least one item"),
});

const CommonPurchase = ({ hooks = {}, components = {}, config = {} }) => {
  const {
    useSuppliers,
    useItem,
    usePurchaseById,
    useCreatePurchase,
    useUpdatePurchase,
    usePurchaseInvoiceNo,
    useAccounts,
    useModeOfPayments,
    // New Hooks injected for Column Permissions
    useTransactionFieldPermissions,
    useUpdateTransactionFieldPermissions,
    useTransactionTableFieldsSettings,
  } = hooks;

  const {
    AmountSymbol,
    IconBackButton,
    SupplierAutoCompleteWithAddOption,
    ItemAutoCompleteWithAddOption,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    QuantitySelector,
    PaymentModal,
    ItemDetailModal,
    ReceiptModal,
    ThreeDotActionMenu,
    ViewButtonForReceiptAndPayment,
  } = components;

  const { API_UPLOADS_BASE, buildUploadUrl } = config;

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
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPurchaseForReceipt, setSelectedPurchaseForReceipt] =
    useState(null);
  const [isCredit, setisCredit] = useState(false);

  const defaultValues = {
    purchaseDate: new Date().toISOString(),
    partyId: "",
    orderItems: [],
    done_by_id: "",
    cost_center_id: "",
    mode_of_payment_id: "",
    status: "pending",
    discount: 0,
    invoice_number: "",
  };

  // 2. Setup React Hook Form
  const { control, watch, setValue, getValues, trigger, reset, setFocus } =
    useForm({
      resolver: zodResolver(purchaseSchema),
      defaultValues,
    });

  const watchedItems = watch("orderItems");
  const watchedDiscount = watch("discount");
  const watchedFormData = watch();

  // ----- Data Fetching -----
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
  const { data: modeOfPayments = [] } = useModeOfPayments();

  // ----- Column Permissions Logic -----
  const { getFieldsForType, getSettingsKey } =
    useTransactionTableFieldsSettings("Purchase");
  const allPossibleFields = useMemo(
    () => getFieldsForType(),
    [getFieldsForType],
  );
  const settingsKey = getSettingsKey();

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useTransactionFieldPermissions();
  const { mutateAsync: updatePermissions, isPending: isUpdatingPermissions } =
    useUpdateTransactionFieldPermissions();

  const [extraFields, setExtraFields] = useState([]);

  useEffect(() => {
    if (isLoadingPermissions) return;
    const savedKeys = permissionsData?.[settingsKey];
    if (savedKeys && savedKeys.length > 0) {
      const fieldMap = new Map(allPossibleFields.map((f) => [f.value, f]));
      const orderedVisible = savedKeys
        .map((key) => fieldMap.get(key))
        .filter(Boolean);
      const visibleValues = new Set(orderedVisible.map((f) => f.value));
      const hidden = allPossibleFields.filter(
        (f) => !visibleValues.has(f.value),
      );
      setExtraFields([
        ...orderedVisible.map((f) => ({ ...f, show: true })),
        ...hidden.map((f) => ({ ...f, show: false })),
      ]);
    } else {
      setExtraFields(allPossibleFields.map((f) => ({ ...f, show: true })));
    }
  }, [permissionsData, isLoadingPermissions, allPossibleFields, settingsKey]);

  const handleSaveColumns = async (newColumnKeys, closeModalCallback) => {
    try {
      if (permissionsData?.id) {
        await updatePermissions({
          id: permissionsData.id,
          permissionsData: { [settingsKey]: newColumnKeys },
        });
        closeModalCallback();
      }
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to save column settings.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  // ----- Drafts & Loading Existing -----
  useEffect(() => {
    if (mode === "add") {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          delete parsedDraft.payments;
          delete parsedDraft.shipping;
          reset({ ...defaultValues, ...parsedDraft });
        } catch (e) {
          reset(defaultValues);
        }
      }
    }
  }, [mode, reset]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedFormData));
    }
  }, [watchedFormData, mode]);

  const itemsWithCalculations = useMemo(() => {
    return (watchedItems || []).map((item) => {
      const originalItem = items.find((i) => i.id === item.id);
      const stock = originalItem ? originalItem.stock_quantity : 0;
      const baseTotal = item.price * item.quantity;
      const taxAmount = (baseTotal * item.taxPercentage) / 100;
      const subtotal = baseTotal + taxAmount;
      return { ...item, taxAmount, subtotal, stock };
    });
  }, [watchedItems, items]);

  const activeViewItem = useMemo(() => {
    if (!viewItemId) return null;
    return itemsWithCalculations.find((item) => item.id === viewItemId);
  }, [itemsWithCalculations, viewItemId]);

  const itemsSubtotal = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.subtotal, 0),
    [itemsWithCalculations],
  );

  const totalTax = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.taxAmount, 0),
    [itemsWithCalculations],
  );

  const totalQty = useMemo(
    () =>
      itemsWithCalculations.reduce((total, item) => total + item.quantity, 0),
    [itemsWithCalculations],
  );

  const grandTotal = useMemo(
    () => Math.max(0, itemsSubtotal - (watchedDiscount || 0)),
    [itemsSubtotal, watchedDiscount],
  );

  const modalCalculations = useMemo(
    () => ({
      total: grandTotal,
      subTotal: itemsSubtotal,
      taxAmount: totalTax,
      totalQty: totalQty,
      discount: watchedDiscount || 0,
    }),
    [grandTotal, itemsSubtotal, totalTax, totalQty, watchedDiscount],
  );

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

      reset({
        purchaseDate: purchaseData.date,
        partyId: purchaseData.party_id,
        done_by_id: purchaseData.done_by_id || "",
        cost_center_id: purchaseData.cost_center_id || "",
        mode_of_payment_id: purchaseData.mode_of_payment_id || "",
        discount: parseFloat(purchaseData.discount) || 0,
        orderItems: loadedItems,
        status: purchaseData.status || "unpaid",
        invoice_number: purchaseData.invoice_number,
      });

      if (purchaseData.payment_methods) {
        const validPayments = purchaseData.payment_methods.filter(
          (p) => p && p.account_id,
        );
        const mappedPayments = validPayments.map((p) => ({
          ...p,
          mode_of_payment_id: p.mode_of_payment_id || p.mode_of_payment,
        }));
        setExistingPayments(mappedPayments);
      }
    }
    if (mode === "add" && partyRef.current) {
      setTimeout(() => setFocus("partyId"), 100);
    }
  }, [purchaseData, items, mode, reset, setFocus]);

  const handleProductSelect = (selectedItemId) => {
    const currentItems = getValues("orderItems");
    if (
      !selectedItemId ||
      currentItems.some((item) => item.id === selectedItemId)
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
      setValue("orderItems", [...currentItems, newItem]);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const currentItems = getValues("orderItems");
    const updated = currentItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item,
    );
    setValue("orderItems", updated);
  };

  const handleItemDelete = (itemId) => {
    const currentItems = getValues("orderItems");
    setValue(
      "orderItems",
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const handleCancel = () => navigate(-1);

  const handleViewItemDetails = (item) => {
    setViewItemId(item.id);
    setIsViewItemModalOpen(true);
  };

  const handlePrint = () => {
    if (!purchaseData) {
      showToast({
        message: "Purchase data not loaded yet.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    const supplierName =
      suppliers.find((s) => s.id === purchaseData.party_id)?.name || "N/A";

    const formattedData = {
      id: purchaseData.id,
      invoice_number: purchaseData.invoice_number,
      date: purchaseData.date,
      partner: {
        label: "Supplier",
        name: supplierName,
      },
      items: itemsWithCalculations.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      summary: {
        subTotal: itemsSubtotal,
        grandTotal: grandTotal,
        discount: watchedDiscount || 0,
        orderTax: totalTax,
        shipping: 0,
      },
      payment: {
        amountPaid: parseFloat(purchaseData.paid_amount) || 0,
      },
      payment_methods: purchaseData.payment_methods || [],
    };

    setSelectedPurchaseForReceipt(formattedData);
    setIsReceiptModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (isViewMode) return;

    const isValid = await trigger();
    if (!isValid) {
      const errors = getValues();
      if (!errors.partyId) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please select a supplier.",
          status: TOASTSTATUS.ERROR,
        });
        partyRef.current?.focus();
      } else if (!errors.orderItems || errors.orderItems.length === 0) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please add at least one item.",
          status: TOASTSTATUS.ERROR,
        });
        itemSearchRef.current?.focus();
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please check required fields.",
          status: TOASTSTATUS.ERROR,
        });
      }
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

  const handleFinalSubmit = async (paymentData) => {
    const formData = getValues();
    const calculatedPaidAmount =
      paymentData.payment_methods?.reduce(
        (acc, curr) => acc + (parseFloat(curr.amount) || 0),
        0,
      ) || 0;

    const payload = {
      party_id: formData.partyId,
      done_by_id: formData.done_by_id || null,
      cost_center_id: formData.cost_center_id || null,
      // Prefer mode_of_payment_id from form; fall back to first PaymentModal entry
      mode_of_payment_id:
        formData.mode_of_payment_id ||
        paymentData.payment_methods?.[0]?.mode_of_payment_id ||
        null,
      status: paymentData.status,
      paid_amount: calculatedPaidAmount,
      discount: formData.discount,
      invoice_number: id
        ? formData.invoice_number
        : invoiceNoData?.invoice_number,
      date: formData.purchaseDate,
      items: formData.orderItems.map((item) => ({
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
        reset(defaultValues);
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

  if (
    isFetchingPurchase ||
    isFetchingSuppliers ||
    isFetchingItems ||
    isFetchingAccounts ||
    isLoadingPermissions
  )
    return <Loader />;

  return (
    <ContainerWrapper className="purchase-page">
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
        </HStack>
        <HStack spacing={10} style={{ alignItems: "center" }}>
          <ColumnSelectorModal
            onApply={handleSaveColumns}
            allPossibleFields={allPossibleFields}
            savedColumnKeys={extraFields
              .filter((f) => f.show)
              .map((f) => f.value)}
            isLoading={isUpdatingPermissions}
          />
          <ViewButtonForReceiptAndPayment
            path="/purchase-report"
            buttonText="View Purchase Report"
          />
        </HStack>
      </HStack>

      <ScrollContainer className="purchase-page__scroll-container">
        <div className="purchase-page__form-content">
          {isMobile ? (
            <>
              <HStack justifyContent="flex-start">
                <Controller
                  name="partyId"
                  control={control}
                  render={({ field }) => (
                    <SupplierAutoCompleteWithAddOption
                      {...field}
                      ref={partyRef}
                      disabled={isViewMode}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
                <Controller
                  name="purchaseDate"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Date "
                      value={new Date(field.value)}
                      onChange={(date) => field.onChange(date.toISOString())}
                      disabled={isViewMode}
                    />
                  )}
                />
              </HStack>
              <HStack justifyContent="flex-start">
                <Controller
                  name="done_by_id"
                  control={control}
                  render={({ field }) => (
                    <DoneByAutoCompleteWithAddOption
                      {...field}
                      placeholder="Select Done By"
                      disabled={isViewMode}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
                <Controller
                  name="cost_center_id"
                  control={control}
                  render={({ field }) => (
                    <CostCenterAutoCompleteWithAddOption
                      {...field}
                      placeholder="Select Cost Center"
                      disabled={isViewMode}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </HStack>
            </>
          ) : (
            <HStack justifyContent="flex-start" style={{ marginTop: "5px" }}>
              <Controller
                name="partyId"
                control={control}
                render={({ field }) => (
                  <SupplierAutoCompleteWithAddOption
                    {...field}
                    ref={partyRef}
                    disabled={isViewMode}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <Controller
                name="done_by_id"
                control={control}
                render={({ field }) => (
                  <DoneByAutoCompleteWithAddOption
                    {...field}
                    placeholder="Select Done By"
                    disabled={isViewMode}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <Controller
                name="cost_center_id"
                control={control}
                render={({ field }) => (
                  <CostCenterAutoCompleteWithAddOption
                    {...field}
                    placeholder="Select Cost Center"
                    disabled={isViewMode}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <HStack>
                <Controller
                  name="purchaseDate"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Date "
                      value={new Date(field.value)}
                      onChange={(date) => field.onChange(date.toISOString())}
                      disabled={isViewMode}
                    />
                  )}
                />
              </HStack>
            </HStack>
          )}

          <div className="purchase-page__order-table">
            <Table>
              <Thead>
                <Tr>
                  <Th style={{ width: "40%", padding: 0 }}>
                    {!isViewMode ? (
                      <div className="fs14" style={{ padding: "8px" }}>
                        <ItemAutoCompleteWithAddOption
                          style={{
                            minWidth: "80px",
                            width: "100%",
                          }}
                          ref={itemSearchRef}
                          placeholder="Start typing to add items..."
                          onChange={(e) => handleProductSelect(e.target.value)}
                        />
                      </div>
                    ) : (
                      "PRODUCT"
                    )}
                  </Th>
                  {extraFields
                    .filter((f) => f.show)
                    .map((field) => {
                      if (field.value === "cost" && !isMobile)
                        return <Th key="cost">COST</Th>;
                      if (field.value === "quantity")
                        return <Th key="quantity">QTY</Th>;
                      if (field.value === "tax" && !isMobile)
                        return <Th key="tax">TAX</Th>;
                      if (field.value === "sub_total")
                        return <Th key="sub_total">SUBTOTAL</Th>;
                      return null;
                    })}
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
                      {extraFields
                        .filter((f) => f.show)
                        .map((field) => {
                          if (field.value === "cost" && !isMobile)
                            return (
                              <Td key="cost">
                                <AmountSymbol>{item.price}</AmountSymbol>
                              </Td>
                            );
                          if (field.value === "quantity")
                            return (
                              <Td key="quantity">
                                <QuantitySelector
                                  initialValue={item.quantity}
                                  onChange={(newQty) =>
                                    handleQuantityChange(item.id, newQty)
                                  }
                                  min={1}
                                  disabled={isViewMode}
                                />
                              </Td>
                            );
                          if (field.value === "tax" && !isMobile)
                            return (
                              <Td key="tax">
                                <AmountSymbol>
                                  {item.taxAmount.toFixed(2)}
                                </AmountSymbol>
                              </Td>
                            );
                          if (field.value === "sub_total")
                            return (
                              <Td key="sub_total">
                                <AmountSymbol>
                                  {item.subtotal.toFixed(2)}
                                </AmountSymbol>
                              </Td>
                            );
                          return null;
                        })}
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
                    noOfCol={extraFields.filter((f) => f.show).length + 2}
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

      {!isViewMode && (
        <div className="purchase-page__actions">
          <div className="purchase-page__bottom-section">
            <div className="bottom-stat-item" style={{ marginRight: "auto" }}>
              <span className="stat-label">Discount:</span>
              <div className="stat-input-wrapper">
                <Controller
                  name="discount"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      type="number"
                      min="0"
                      readOnly={isViewMode}
                      onChange={(e) =>
                        field.onChange(
                          Math.max(0, parseFloat(e.target.value) || 0),
                        )
                      }
                    />
                  )}
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
              {mode === "edit" && (
                <Button onClick={handlePrint}>
                  <FaPrint style={{ marginRight: "8px" }} />
                  Print
                </Button>
              )}
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

      {mode === "view" && (
        <HStack justifyContent="flex-end" style={{ marginTop: "10px" }}>
          <Button onClick={handlePrint}>
            <FaPrint style={{ marginRight: "8px" }} />
            Print
          </Button>
          <Button onClick={() => navigate(`/purchase/edit/${id}`)}>Edit</Button>
        </HStack>
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
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transactionData={selectedPurchaseForReceipt}
      />
    </ContainerWrapper>
  );
};

export default CommonPurchase;
