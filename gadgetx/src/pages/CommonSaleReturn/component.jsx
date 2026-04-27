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
import DateField from "@/components/DateField";
import Button from "@/components/Button";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";
import ColumnSelectorModal from "@/components/ColumnSelectorModal";
import "./style.scss";

// 1. Define Zod Schema
const saleReturnSchema = z.object({
  date: z.string(),
  sale_id: z
    .union([z.string(), z.number()])
    .refine(
      (val) => val !== "" && val !== null,
      "Please select an original sale",
    ),
  reason: z.string().optional(),
  done_by_id: z.any().optional().nullable(),
  cost_center_id: z.any().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.any(),
        name: z.string(),
        price: z.number(),
        taxPercentage: z.number(),
        maxReturnable: z.number(),
        quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
      }),
    )
    .min(1, "Please add at least one item to return"),
  status: z.string().default("pending"),
  invoice_number: z.any().optional(),
});

const CommonSaleReturn = ({ hooks = {}, components = {} }) => {
  const {
    useSalesPaginated,
    useCustomers,
    useItem,
    useSalesById,
    useSaleReturnById,
    useCreateSaleReturn,
    useSaleReturnInvoiceNo,
    useUpdateSaleReturn,
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
    QuantitySelector,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    PaymentModal,
    ReceiptModal,
    ViewButtonForReceiptAndPayment,
  } = components;

  const { id, mode } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isViewMode = mode === "view";

  const saleSelectRef = useRef(null);
  const itemSelectRef = useRef(null);

  const [existingPayments, setExistingPayments] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSkipPayment, setIsSkipPayment] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReturnForReceipt, setSelectedReturnForReceipt] =
    useState(null);

  const defaultValues = {
    date: new Date().toISOString(),
    sale_id: "",
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
      resolver: zodResolver(saleReturnSchema),
      defaultValues,
    });

  const watchedItems = watch("items");
  const watchedSaleId = watch("sale_id");

  // ----- Data Fetching -----
  const { data: saleReturnData, isLoading: isFetchingSaleReturn } =
    useSaleReturnById(id, mode !== "add");
  const { data: paginatedSales, isLoading: isFetchingSales } =
    useSalesPaginated({ page_size: 9999 });
  const { data: customers = [], isLoading: isFetchingCustomers } =
    useCustomers();
  const { data: allItems = [], isLoading: isFetchingItems } = useItem();
  const { data: accounts = [], isLoading: isFetchingAccounts } = useAccounts();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();
  const { data: selectedSaleData, isLoading: isFetchingSelectedSale } =
    useSalesById(watchedSaleId);
  const { mutateAsync: createSaleReturn, isPending: isCreating } =
    useCreateSaleReturn();
  const { mutateAsync: updateSaleReturn, isPending: isUpdating } =
    useUpdateSaleReturn();
  const { data: invoiceNoData } = useSaleReturnInvoiceNo(mode === "add");

  // ----- Column Permissions Logic -----
  const { getFieldsForType, getSettingsKey } =
    useTransactionTableFieldsSettings("SaleReturn");
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
    } catch {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to save column settings.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  // Handle URL ID for Add Mode (Pre-fill Sale ID)
  useEffect(() => {
    if (mode === "add" && id) {
      setValue("sale_id", id, { shouldValidate: true });
    }
  }, [id, mode, setValue]);

  // Auto-populate items in Add Mode if ID provided
  useEffect(() => {
    const currentItems = getValues("items");
    if (
      mode === "add" &&
      id &&
      selectedSaleData?.items &&
      allItems.length > 0 &&
      currentItems.length === 0
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
      setValue("items", allReturnableItems, { shouldValidate: true });
    }
  }, [mode, id, selectedSaleData, allItems, setValue, getValues]);

  // Load Existing Data for Edit/View
  useEffect(() => {
    if (saleReturnData && (mode === "edit" || mode === "view")) {
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

      reset({
        date: saleReturnData.date,
        sale_id: saleReturnData.sale_id ? String(saleReturnData.sale_id) : "",
        reason: saleReturnData.reason || "",
        done_by_id: saleReturnData.done_by_id || "",
        cost_center_id: saleReturnData.cost_center_id || "",
        items: [returnedItem],
        status: saleReturnData.status || "pending",
        invoice_number: saleReturnData.invoice_number,
      });

      if (saleReturnData.payment_methods) {
        const validPayments = saleReturnData.payment_methods.filter(
          (p) => p && p.account_id,
        );
        const mappedPayments = validPayments.map((p) => ({
          ...p,
          mode_of_payment_id: p.mode_of_payment_id,
        }));
        setExistingPayments(mappedPayments);
      }
    }
    if (mode === "add" && saleSelectRef.current) {
      setTimeout(() => setFocus("sale_id"), 100);
    }
  }, [saleReturnData, mode, reset, setFocus]);

  const itemsWithCalculations = useMemo(
    () =>
      (watchedItems || []).map((item) => {
        const baseTotal = item.price * item.quantity;
        const taxAmount = (baseTotal * item.taxPercentage) / 100;
        const subtotal = baseTotal + taxAmount;
        return { ...item, taxAmount, subtotal };
      }),
    [watchedItems],
  );

  const subtotalAmount = useMemo(
    () =>
      itemsWithCalculations.reduce(
        (sum, item) => sum + item.price * item.quantity,
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
      itemsWithCalculations.reduce((total, item) => total + item.quantity, 0),
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

  const sales = useMemo(() => paginatedSales?.data || [], [paginatedSales]);
  const customerMap = useMemo(
    () =>
      (customers || []).reduce(
        (acc, customer) => ({ ...acc, [customer.id]: customer.name }),
        {},
      ),
    [customers],
  );

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

  const saleOptions = useMemo(
    () =>
      sales.map((sale) => ({
        value: sale.id,
        label: `INV-${sale.id} / ${customerMap[sale.party_id] || "Unknown"}`,
      })),
    [sales, customerMap],
  );

  const itemOptions = useMemo(() => {
    const itemsInSale = selectedSaleData?.items || [];
    const currentFormItems = getValues("items") || [];
    return itemsInSale
      .filter((item) => {
        const alreadyReturned = item.returned_quantity || 0;
        const maxReturnable = item.quantity - alreadyReturned;
        const isAlreadyInList = currentFormItems.some(
          (ri) => ri.id === item.item_id,
        );
        return maxReturnable > 0 && !isAlreadyInList;
      })
      .map((item) => ({ value: item.item_id, label: item.item_name }));
  }, [selectedSaleData, watchedItems, getValues]);

  const handleSaleSelect = (selectedId) => {
    setValue("sale_id", selectedId, { shouldValidate: true });
    setValue("items", []);
  };

  const handleItemAdd = (selectedItemId) => {
    if (!selectedItemId) return;
    const itemToAdd = selectedSaleData.items.find(
      (item) => item.item_id === parseInt(selectedItemId, 10),
    );
    const itemDetails = allItems.find((i) => i.id === itemToAdd.item_id);

    if (itemToAdd) {
      const alreadyReturned = itemToAdd.returned_quantity || 0;
      const newItem = {
        id: itemToAdd.item_id,
        name: itemToAdd.item_name,
        price: parseFloat(itemToAdd.unit_price),
        taxPercentage: parseFloat(itemDetails?.tax) || 0,
        maxReturnable: itemToAdd.quantity - alreadyReturned,
        quantity: 1,
      };
      const currentItems = getValues("items");
      setValue("items", [...currentItems, newItem], { shouldValidate: true });
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const currentItems = getValues("items");
    const updated = currentItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item,
    );
    setValue("items", updated);
  };

  const handleItemDelete = (itemId) => {
    const currentItems = getValues("items");
    setValue(
      "items",
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const handleCancel = () => navigate("/sale-return-report");

  const handlePrint = () => {
    if (!saleReturnData) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Return data is not available to print.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }
    const formattedData = {
      id: saleReturnData.id,
      invoice_number: saleReturnData.invoice_number,
      date: saleReturnData.date,
      partner: {
        label: "Return from Customer",
        name:
          customerMap[saleReturnData.party_id] ||
          saleReturnData.party_name ||
          "N/A",
      },
      items: [
        {
          name: saleReturnData.item_name,
          quantity: saleReturnData.return_quantity,
          price:
            saleReturnData.return_quantity > 0
              ? saleReturnData.total_refund_amount /
                saleReturnData.return_quantity
              : 0,
        },
      ],
      summary: {
        subTotal: saleReturnData.total_refund_amount,
        grandTotal: saleReturnData.total_refund_amount,
        orderTax: 0,
        discount: 0,
        shipping: 0,
      },
      payment: {
        amountPaid: saleReturnData.total_refund_amount,
        changeReturn: 0,
      },
      payment_methods: (saleReturnData.payment_methods || []).map((pm) => ({
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
      if (!errors.sale_id) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please select an original sale.",
          status: TOASTSTATUS.ERROR,
        });
        saleSelectRef.current?.focus();
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
          message: "Please check all required fields.",
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
        note: "Sale Return (Refund Pending)",
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
      cost_center_id: formData.cost_center_id || null,
      payment_methods:
        paymentData.payment_methods && paymentData.payment_methods.length > 0
          ? paymentData.payment_methods
          : [],
      status: paymentData.status,
      unit_price: item.price,
      refunded_amount: calculatedRefundedAmount,
      paid_amount: paymentData.paid_amount || 0,
      change_return: paymentData.change_return || 0,
      note: paymentData.note,
    };

    try {
      if (mode === "edit") {
        const payload = {
          ...payloadBase,
          sale_id: parseInt(formData.sale_id, 10),
          item_id: parseInt(item.id, 10),
          return_quantity: parseInt(item.quantity, 10),
          invoice_number: formData.invoice_number,
        };
        await updateSaleReturn({ id, data: payload });
        showToast({
          crudItem: CRUDITEM.SALE_RETURN,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const payload = {
          ...payloadBase,
          sale_id: parseInt(formData.sale_id, 10),
          item_id: parseInt(item.id, 10),
          return_quantity: parseInt(item.quantity, 10),
          invoice_number: invoiceNoData?.invoice_number,
        };
        await createSaleReturn(payload);
        showToast({
          crudItem: CRUDITEM.SALE_RETURN,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        reset(defaultValues);
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
    isLoadingPermissions ||
    (watchedSaleId && isFetchingSelectedSale);

  if (isLoading) return <Loader />;

  const isDisabled = mode === "view";

  return (
    <ContainerWrapper>
      <div className="sale-return-page">
        <HStack
          className="sale-return-page__header"
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
              path="/sale-return-report"
              buttonText="View Sale Returns"
            />
          </HStack>
        </HStack>

        <div className="sale-return-page__form-container">
          <ScrollContainer>
            <div className="sale-return-page__form-content">
              <div className="sale-return-page__top-controls">
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
                  name="sale_id"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      {...field}
                      label="Sale Invoice"
                      ref={saleSelectRef}
                      options={saleOptions}
                      disabled={isDisabled || mode === "edit"}
                      onChange={(e) => handleSaleSelect(e.target.value)}
                      value={field.value}
                    />
                  )}
                />
                <HStack justifyContent="flex-start">
                  {selectedSaleData && (
                    <InputField
                      label="Customer"
                      value={customerMap[selectedSaleData.party_id] || ""}
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

              {watchedSaleId && !isFetchingSelectedSale && mode === "add" && (
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

              <div className="sale-return-page__order-table">
                <Table>
                  <Thead>
                    <Tr>
                      {extraFields
                        .filter((f) => f.show)
                        .map((field) => {
                          if (field.value === "product")
                            return <Th key="product">PRODUCT</Th>;
                          if (field.value === "price")
                            return <Th key="price">PRICE</Th>;
                          if (field.value === "returnable")
                            return <Th key="returnable">RETURNABLE</Th>;
                          if (field.value === "return_quantity")
                            return <Th key="return_quantity">RETURN QTY</Th>;
                          if (field.value === "tax")
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
                        <Tr key={item.id}>
                          {extraFields
                            .filter((f) => f.show)
                            .map((field) => {
                              if (field.value === "product")
                                return (
                                  <Td key="product">
                                    <div style={{ paddingLeft: "12px" }}>
                                      {item.name}
                                    </div>
                                  </Td>
                                );
                              if (field.value === "price")
                                return (
                                  <Td key="price">
                                    <AmountSymbol>
                                      {item.price.toFixed(2)}
                                    </AmountSymbol>
                                  </Td>
                                );
                              if (field.value === "returnable")
                                return (
                                  <Td key="returnable">
                                    <span className="stock-badge">
                                      {item.maxReturnable}
                                    </span>
                                  </Td>
                                );
                              if (field.value === "return_quantity")
                                return (
                                  <Td key="return_quantity">
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
                                );
                              if (field.value === "tax")
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
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => handleItemDelete(item.id)}
                              >
                                <FaTrash />
                              </button>
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
          <div className="sale-return-page__actions">
            <div className="sale-return-page__bottom-section">
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

        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          transactionData={selectedReturnForReceipt}
        />
      </div>
    </ContainerWrapper>
  );
};

export default CommonSaleReturn;
