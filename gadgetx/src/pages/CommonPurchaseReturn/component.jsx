import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaTrash, FaSave, FaPrint } from "react-icons/fa";
import { useToast } from "@/context/ToastContext";
import { useIsMobile } from "@/utils/useIsMobile";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import Button from "@/components/Button";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import PageTitle from "@/components/PageTitle";
import Loader from "@/components/Loader";
import HStack from "@/components/HStack";
import DateField from "@/components/DateField";
import SelectField from "@/components/SelectField";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";
import InputField from "@/components/InputField";
import "./style.scss";

// 1. Define Zod Schema
const purchaseReturnSchema = z.object({
  date: z.string(),
  purchase_id: z
    .union([z.string(), z.number()])
    .refine(
      (val) => val !== "" && val !== null,
      "Please select an original purchase",
    ),
  reason: z.string().optional(),
  done_by_id: z.any().optional().nullable(),
  cost_center_id: z.any().optional().nullable(),
  items: z
    .array(
      z.object({
        item_id: z.any(),
        item_name: z.string(),
        unit_price: z.number(),
        tax_percentage: z.number(),
        max_quantity: z.number(),
        return_quantity: z
          .number()
          .min(0.0001, "Quantity must be greater than 0"),
      }),
    )
    .min(1, "Please add at least one item to return"),
  status: z.string().default("pending"),
  invoice_number: z.any().optional(),
});

const CommonPurchaseReturn = ({ hooks = {}, components = {}, config = {} }) => {
  const {
    useCreatePurchaseReturn,
    usePurchaseReturnInvoiceNo,
    useUpdatePurchaseReturn,
    usePurchaseReturnById,
    usePurchasesPaginated,
    usePurchaseById,
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
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    PaymentModal,
    ReceiptModal,
    ThreeDotActionMenu,
    ItemDetailModal,
    ViewButtonForReceiptAndPayment,
    QuantitySelector,
  } = components;

  const { API_UPLOADS_BASE } = config;

  const navigate = useNavigate();
  const { id, mode } = useParams();
  const showToast = useToast();
  const isViewMode = mode === "view";
  const isMobile = useIsMobile();

  const purchaseSelectRef = useRef(null);
  const itemSelectRef = useRef(null);

  const [existingPayments, setExistingPayments] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSkipPayment, setIsSkipPayment] = useState(false);
  const [viewItemId, setViewItemId] = useState(null);
  const [isViewItemModalOpen, setIsViewItemModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReturnForReceipt, setSelectedReturnForReceipt] =
    useState(null);

  const defaultValues = {
    date: new Date().toISOString(),
    purchase_id: "",
    reason: "",
    items: [],
    done_by_id: "",
    cost_center_id: "",
    status: "pending",
    invoice_number: "",
  };

  // 2. Setup React Hook Form
  const { control, watch, setValue, getValues, trigger, reset, setFocus } =
    useForm({
      resolver: zodResolver(purchaseReturnSchema),
      defaultValues,
    });

  const watchedItems = watch("items");
  const watchedPurchaseId = watch("purchase_id");

  const { data: returnData, isLoading: isLoadingReturn } =
    usePurchaseReturnById(id, { enabled: !!id });
  const { data: purchasesResult, isLoading: isFetchingPurchases } =
    usePurchasesPaginated({ page_size: 1000, sort: "-date" });

  const purchaseIdToFetch = watchedPurchaseId || returnData?.purchase_id;
  const { data: selectedPurchase, isLoading: isFetchingPurchaseDetails } =
    usePurchaseById(purchaseIdToFetch, { enabled: !!purchaseIdToFetch });
  const { mutateAsync: createPurchaseReturn, isPending: isCreating } =
    useCreatePurchaseReturn();
  const { mutateAsync: updatePurchaseReturn, isPending: isUpdating } =
    useUpdatePurchaseReturn();
  const { data: invoiceNoData } = usePurchaseReturnInvoiceNo(!id);
  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();

  // ----- Column Permissions Logic -----
  const { getFieldsForType, getSettingsKey } =
    useTransactionTableFieldsSettings("PurchaseReturn");
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
      } catch (_error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to save column settings.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  // Load Existing Data
  useEffect(() => {
    if ((mode === "edit" || isViewMode) && returnData && selectedPurchase) {
      const returnedItemDetails = selectedPurchase.items.find(
        (i) => i.item_id === returnData.item_id,
      );
      const unitPrice =
        parseFloat(returnedItemDetails?.unit_price) ||
        returnData.unit_price ||
        0;
      const returnedItem = {
        item_id: returnData.item_id,
        item_name: returnData.item_name,
        unit_price: unitPrice,
        tax_percentage: parseFloat(returnedItemDetails?.item_tax) || 0,
        max_quantity:
          (returnedItemDetails?.quantity || 0) + returnData.return_quantity,
        return_quantity: returnData.return_quantity,
      };

      reset({
        date: returnData.date,
        purchase_id: returnData.purchase_id
          ? String(returnData.purchase_id)
          : "",
        reason: returnData.reason || "",
        done_by_id: returnData.done_by_id || "",
        cost_center_id: returnData.cost_center_id || "",
        items: [returnedItem],
        status: returnData.status || "pending",
        invoice_number: returnData.invoice_number,
      });

      if (returnData.payment_methods) {
        const validPayments = returnData.payment_methods.filter(
          (p) => p && p.account_id,
        );
        const mappedPayments = validPayments.map((p) => ({
          ...p,
          mode_of_payment_id: p.mode_of_payment_id,
        }));
        setExistingPayments(mappedPayments);
      }
    }
    if (mode === "add" && purchaseSelectRef.current) {
      setTimeout(() => setFocus("purchase_id"), 100);
    }
  }, [mode, isViewMode, returnData, selectedPurchase, reset, setFocus]);

  const itemsWithCalculations = useMemo(
    () =>
      (watchedItems || []).map((item) => {
        const baseTotal = item.unit_price * item.return_quantity;
        const taxAmount = (baseTotal * item.tax_percentage) / 100;
        const subtotal = baseTotal + taxAmount;
        return { ...item, taxAmount, subtotal };
      }),
    [watchedItems],
  );

  const activeViewItem = useMemo(() => {
    if (!viewItemId) return null;
    const item = itemsWithCalculations.find(
      (item) => item.item_id === viewItemId,
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
        0,
      ),
    [itemsWithCalculations],
  );

  const totalTaxAmount = useMemo(
    () => itemsWithCalculations.reduce((sum, item) => sum + item.taxAmount, 0),
    [itemsWithCalculations],
  );

  const totalRefundAmount = useMemo(
    () => subtotalAmount + totalTaxAmount,
    [subtotalAmount, totalTaxAmount],
  );

  const totalQty = useMemo(
    () =>
      itemsWithCalculations.reduce(
        (total, item) => total + item.return_quantity,
        0,
      ),
    [itemsWithCalculations],
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
    [totalRefundAmount, subtotalAmount, totalTaxAmount, totalQty],
  );

  const purchaseOptions =
    purchasesResult?.data?.map((p) => ({
      value: p.id,
      label: `INV-${p.id} | ${p.party_name} | ${new Date(
        p.date,
      ).toLocaleDateString()}`,
    })) || [];

  const itemOptions = useMemo(() => {
    const itemsInPurchase = selectedPurchase?.items || [];
    const currentFormItems = getValues("items") || [];
    return itemsInPurchase
      .filter((item) => {
        const isAlreadyInList = currentFormItems.some(
          (ri) => ri.item_id === item.item_id,
        );
        return !isAlreadyInList;
      })
      .map((item) => ({ value: item.item_id, label: item.item_name }));
  }, [selectedPurchase, watchedItems, getValues]);

  const accountNameMap = useMemo(
    () =>
      accounts.reduce((map, account) => {
        map[account.id] = account.name;
        return map;
      }, {}),
    [accounts],
  );

  const modeOfPaymentNameMap = useMemo(
    () =>
      modeOfPaymentList.reduce((map, item) => {
        map[item.id] = item.name;
        return map;
      }, {}),
    [modeOfPaymentList],
  );

  const handlePurchaseSelect = (selectedId) => {
    setValue("purchase_id", selectedId, { shouldValidate: true });
    setValue("items", []);
  };

  const handleItemAdd = (selectedItemId) => {
    if (!selectedItemId) return;
    const itemToAdd = selectedPurchase.items.find(
      (item) => item.item_id === parseInt(selectedItemId, 10),
    );
    if (itemToAdd) {
      const newItem = {
        ...itemToAdd,
        max_quantity: itemToAdd.quantity,
        unit_price: parseFloat(itemToAdd.unit_price) || 0,
        tax_percentage: parseFloat(itemToAdd.item_tax) || 0,
        return_quantity: 1,
      };
      const currentItems = getValues("items");
      setValue("items", [...currentItems, newItem], { shouldValidate: true });
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const currentItems = getValues("items");
    const updated = currentItems.map((item) =>
      item.item_id === itemId
        ? { ...item, return_quantity: newQuantity }
        : item,
    );
    setValue("items", updated);
  };

  const handleItemDelete = (itemId) => {
    const currentItems = getValues("items");
    setValue(
      "items",
      currentItems.filter((item) => item.item_id !== itemId),
    );
  };

  const handleViewItemDetails = (item) => {
    setViewItemId(item.item_id);
    setIsViewItemModalOpen(true);
  };

  const handleCancel = () => navigate("/purchase-return-report");

  const handlePrint = () => {
    if (!returnData) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Return data not loaded yet.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    const formattedData = {
      id: returnData.id,
      invoice_number: returnData.invoice_number,
      date: returnData.date,
      partner: {
        label: "Return to Supplier",
        name: returnData.party_name || "N/A",
      },
      items: itemsWithCalculations.map((item) => ({
        name: item.item_name,
        quantity: item.return_quantity,
        price: item.unit_price,
      })),
      summary: {
        subTotal: subtotalAmount,
        grandTotal: totalRefundAmount,
        orderTax: totalTaxAmount,
        discount: 0,
        shipping: 0,
      },
      payment: {
        amountPaid: returnData.refunded_amount || 0,
      },
      payment_methods: (returnData.payment_methods || []).map((pm) => ({
        ...pm,
        mode_of_payment:
          modeOfPaymentNameMap[pm.mode_of_payment_id] ||
          accountNameMap[pm.account_id] ||
          "Unknown",
      })),
    };

    setSelectedReturnForReceipt(formattedData);
    setIsReceiptModalOpen(true);
  };

  const handleProcessReturn = async () => {
    if (isViewMode) return;

    const isValid = await trigger();
    if (!isValid) {
      const errors = getValues();
      if (!errors.purchase_id) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please select an original purchase.",
          status: TOASTSTATUS.ERROR,
        });
        purchaseSelectRef.current?.focus();
      } else if (!errors.items || errors.items.length === 0) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please add at least one item to return.",
          status: TOASTSTATUS.ERROR,
        });
        itemSelectRef.current?.focus();
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please check required fields.",
          status: TOASTSTATUS.ERROR,
        });
      }
      return;
    }

    if (isSkipPayment) {
      const pendingPaymentData = {
        status: "pending",
        refunded_amount: 0,
        paid_amount: 0,
        change_return: 0,
        payment_methods: [
          { account_id: "credit", amount: 0, mode_of_payment_id: null },
        ],
        note: "Purchase Return (Refund Pending)",
      };
      handleFinalSubmit(pendingPaymentData);
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  const handleFinalSubmit = async (paymentData) => {
    const formData = getValues();
    const item = itemsWithCalculations[0];

    // Safety check
    if (!item) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "No item details found for processing.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    const calculatedRefundedAmount =
      paymentData.payment_methods?.reduce(
        (acc, curr) => acc + (parseFloat(curr.amount) || 0),
        0,
      ) || 0;

    const payloadBase = {
      date: formData.date,
      reason: formData.reason || "N/A",
      done_by_id: formData.done_by_id || null,
      unit_price: item.unit_price,
      cost_center_id: formData.cost_center_id || null,
      payment_methods:
        paymentData.payment_methods && paymentData.payment_methods.length > 0
          ? paymentData.payment_methods
          : [],
      status: paymentData.status,
      total_refund_amount: totalRefundAmount,
      refunded_amount: calculatedRefundedAmount,
      paid_amount: paymentData.paid_amount || 0,
      change_return: paymentData.change_return || 0,
      note: paymentData.note,
    };

    try {
      if (mode === "edit") {
        const payload = {
          ...payloadBase,
          return_quantity: parseInt(item.return_quantity, 10),
          invoice_number: formData.invoice_number,
        };
        await updatePurchaseReturn({ id, data: payload });
        showToast({
          crudItem: CRUDITEM.PURCHASE_RETURN,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const payload = {
          ...payloadBase,
          purchase_id: parseInt(formData.purchase_id, 10),
          item_id: parseInt(item.item_id, 10),
          return_quantity: parseInt(item.return_quantity, 10),
          invoice_number: invoiceNoData?.invoice_number,
        };
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
    isFetchingAccounts ||
    isLoadingPermissions;

  if (isLoading && (mode !== "add" || watchedPurchaseId)) return <Loader />;

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
        <HStack
          className="purchase-return-page__header"
          style={{
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <HStack spacing={10} style={{ alignItems: "center" }}>
            <IconBackButton onClick={handleCancel} />
            <PageTitle title={pageTitle} />
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
              path="/purchase-return-report"
              buttonText="View Purchase Returns"
            />
          </HStack>
        </HStack>

        <div className="purchase-return-page__form-container">
          <ScrollContainer>
            <div className="purchase-return-page__form-content">
              <div className="purchase-return-page__top-controls">
                <HStack justifyContent="flex-start">
                  <Controller
                    name="done_by_id"
                    control={control}
                    render={({ field }) => (
                      <DoneByAutoCompleteWithAddOption
                        {...field}
                        placeholder="Select Done By"
                        disabled={isDisabled}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
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
                        disabled={isDisabled}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value}
                      />
                    )}
                  />
                </HStack>

                <Controller
                  name="purchase_id"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      {...field}
                      label="Purchase Invoice"
                      ref={purchaseSelectRef}
                      options={purchaseOptions}
                      disabled={isPurchaseSelectorDisabled}
                      onChange={(e) => handlePurchaseSelect(e.target.value)}
                      value={field.value}
                    />
                  )}
                />

                <HStack justifyContent="flex-start">
                  {selectedPurchase && (
                    <InputField
                      label="Supplier"
                      value={selectedPurchase.party_name || ""}
                      readOnly
                    />
                  )}
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DateField
                        value={new Date(field.value)}
                        onChange={(date) => field.onChange(date.toISOString())}
                        disabled={isDisabled}
                      />
                    )}
                  />
                </HStack>
              </div>

              {watchedPurchaseId &&
                !isFetchingPurchaseDetails &&
                mode === "add" && (
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

              <div className="purchase-return-page__order-table">
                <Table>
                  <Thead>
                    <Tr>
                      {extraFields
                        .filter((f) => f.show)
                        .map((field) => {
                          if (field.value === "product")
                          if (field.value === "price" && !isMobile)
                            return <Th key="price">PRICE</Th>;
                          if (field.value === "available" && !isMobile)
                            return <Th key="available">AVAILABLE</Th>;
                          if (field.value === "return_quantity")
                            return <Th key="return_quantity">RETURN QTY</Th>;
                          if (field.value === "tax" && !isMobile)
                            return <Th key="tax">TAX</Th>;
                          if (field.value === "sub_total")
                            return <Th key="sub_total">SUBTOTAL</Th>;
                          return null;
                        })}
                      {!isDisabled && <Th>ACTION</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {itemsWithCalculations.length > 0 ? (
                      itemsWithCalculations.map((item) => (
                        <Tr key={item.item_id}>
                          {extraFields
                            .filter((f) => f.show)
                            .map((field) => {
                              if (field.value === "product")
                                return (
                                  <Td key="product">
                                    <div style={{ paddingLeft: "12px" }}>
                                      {item.item_name}
                                    </div>
                                  </Td>
                                );
                              if (field.value === "price" && !isMobile)
                                return (
                                  <Td key="price">
                                    <AmountSymbol>
                                      {item.unit_price.toFixed(2)}
                                    </AmountSymbol>
                                  </Td>
                                );
                              if (field.value === "available" && !isMobile)
                                return (
                                  <Td key="available">
                                    <span className="stock-badge">
                                      {item.max_quantity}
                                    </span>
                                  </Td>
                                );
                              if (field.value === "return_quantity")
                                return (
                                  <Td key="return_quantity">
                                    <QuantitySelector
                                      initialValue={item.return_quantity}
                                      onChange={(newQty) =>
                                        handleQuantityChange(
                                          item.item_id,
                                          newQty,
                                        )
                                      }
                                      min={1}
                                      max={item.max_quantity}
                                      disabled={isDisabled}
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

                          {!isDisabled && (
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
                                  <button
                                    type="button"
                                    className="action-btn delete-btn"
                                    onClick={() =>
                                      handleItemDelete(item.item_id)
                                    }
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              )}
                            </Td>
                          )}
                        </Tr>
                      ))
                    ) : (
                      <TableCaption
                        item="Products"
                        noOfCol={
                          extraFields.filter((f) => f.show).length +
                          (isDisabled ? 0 : 1)
                        }
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
                  <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        placeholder="Enter reason..."
                        disabled={isDisabled}
                      />
                    )}
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
        <HStack
          justifyContent="flex-end"
          alignItems="center"
          style={{ marginTop: "1rem" }}
        >
          {mode === "view" && (
            <>
              <Button onClick={handlePrint}>
                <FaPrint style={{ marginRight: "8px" }} />
                Print
              </Button>
              <Button onClick={() => navigate(`/sale-return/edit/${id}`)}>
                Edit
              </Button>
            </>
          )}
        </HStack>

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
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          transactionData={selectedReturnForReceipt}
        />
      </div>
    </ContainerWrapper>
  );
};

export default CommonPurchaseReturn;
