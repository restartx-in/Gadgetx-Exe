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
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import { useIsMobile } from "@/utils/useIsMobile";
import { onFormError } from "@/utils/formUtils";
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

const DRAFT_STORAGE_KEY = "sale_form_draft";

const saleSchema = z.object({
  saleDate: z.string(),
  partyId: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null, "Please select a customer"),
  done_by_id: z.any().optional().nullable(),
  cost_center_id: z.any().optional().nullable(),
  status: z.string().default("pending"),
  discount: z.coerce.number().min(0).default(0),
  invoice_number: z.any().optional(),
  change_return: z.coerce.number().optional().default(0),
  orderItems: z
    .array(
      z.object({
        id: z.any(),
        name: z.string(),
        stock: z.number(),
        price: z.number(),
        quantity: z.number().min(0.0001, "Quantity must be greater than 0"),
        taxPercentage: z.number(),
      }),
    )
    .min(1, "Please add at least one item"),
});

const CommonSale = ({ hooks = {}, components = {}, config = {} }) => {
  const {
    useItem,
    useSalesById,
    useCreateSales,
    useSaleInvoiceNo,
    useUpdateSales,
    useAccounts,
    useCustomers,
    useModeOfPayments,
    // New Hooks injected for Column Permissions
    useTransactionFieldPermissions,
    useUpdateTransactionFieldPermissions,
    useTransactionTableFieldsSettings,
  } = hooks;

  const {
    AmountSymbol,
    IconBackButton,
    CustomerAutoCompleteWithAddOption,
    ItemAutoCompleteWithAddOption,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    ItemDetailModal,
    QuantitySelector,
    PaymentModal,
    ThreeDotActionMenu,
    ViewButtonForReceiptAndPayment,
    ReceiptModal,
  } = components;

  const { API_UPLOADS_BASE, buildUploadUrl } = config;

  // SAFETY GUARD
  if (!useSalesById) return <Loader />;

  const { id, mode } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isViewMode = mode === "view";
  const isMobile = useIsMobile();

  const itemSearchRef = useRef(null);
  const partyRef = useRef(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewItemId, setViewItemId] = useState(null);
  const [isViewItemModalOpen, setIsViewItemModalOpen] = useState(false);
  const [existingPayments, setExistingPayments] = useState([]);
  const [isCredit, setisCredit] = useState(false);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);

  const defaultValues = {
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

  const { control, handleSubmit, reset, watch, setValue, getValues, setFocus } =
    useForm({
      resolver: zodResolver(saleSchema),
      defaultValues,
    });

  const watchedItems = watch("orderItems");
  const watchedDiscount = watch("discount");
  const watchedFormData = watch();

  // ----- Data Fetching -----
  const { data: saleData, isLoading: isFetchingSale } = useSalesById(id);
  const { data: customers = [] } = useCustomers();
  const { data: accounts = [] } = useAccounts();
  const { data: items = [] } = useItem();
  const { data: modeOfPaymentList = [] } = useModeOfPayments();
  const { mutateAsync: createSale, isPending: isCreating } = useCreateSales();
  const { mutateAsync: updateSale, isPending: isUpdating } = useUpdateSales();
  const { data: invoiceNoData } = useSaleInvoiceNo();

  // ----- Column Permissions Logic -----
  const { getFieldsForType, getSettingsKey } =
    useTransactionTableFieldsSettings("Sale");
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
      // Default fallback
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

  // ----- Calculations & Memos -----
  const itemsWithCalculations = useMemo(() => {
    return (watchedItems || []).map((item) => {
      const baseTotal = item.price * item.quantity;
      const taxAmount = (baseTotal * item.taxPercentage) / 100;
      const subtotal = baseTotal + taxAmount;
      return { ...item, taxAmount, subtotal };
    });
  }, [watchedItems]);

  const customerNameMap = useMemo(
    () => customers.reduce((m, c) => ({ ...m, [c.id]: c.name }), {}),
    [customers],
  );
  const accountNameMap = useMemo(
    () => accounts.reduce((m, a) => ({ ...m, [a.id]: a.name }), {}),
    [accounts],
  );
  const modeOfPaymentNameMap = useMemo(
    () => modeOfPaymentList.reduce((m, mo) => ({ ...m, [mo.id]: mo.name }), {}),
    [modeOfPaymentList],
  );

  const activeViewItem = useMemo(
    () =>
      viewItemId
        ? itemsWithCalculations.find((i) => i.id === viewItemId)
        : null,
    [itemsWithCalculations, viewItemId],
  );
  const itemsSubtotal = useMemo(
    () => itemsWithCalculations.reduce((t, i) => t + i.subtotal, 0),
    [itemsWithCalculations],
  );
  const totalTax = useMemo(
    () => itemsWithCalculations.reduce((t, i) => t + i.taxAmount, 0),
    [itemsWithCalculations],
  );
  const totalQty = useMemo(
    () => itemsWithCalculations.reduce((t, i) => t + i.quantity, 0),
    [itemsWithCalculations],
  );
  const grandTotal = useMemo(
    () => Math.max(0, itemsSubtotal - (watchedDiscount || 0)),
    [itemsSubtotal, watchedDiscount],
  );

  // ----- Drafts & Loading Existing -----
  useEffect(() => {
    if (mode === "add") {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          delete parsedDraft.payments;
          reset({ ...defaultValues, ...parsedDraft });
        } catch (e) {
          reset(defaultValues);
        }
      }
    }
  }, [mode, reset]);

  useEffect(() => {
    if (mode === "add")
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedFormData));
  }, [watchedFormData, mode]);

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
      reset({
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
        setExistingPayments(
          saleData.payment_methods
            .filter((p) => p && p.account_id !== null)
            .map((p) => ({
              ...p,
              mode_of_payment_id: p.mode_of_payment_id || p.mode_of_payment,
            })),
        );
      }
    }
    if (mode === "add") setTimeout(() => setFocus("partyId"), 100);
  }, [saleData, items, mode, reset, setFocus]);

  // ----- Actions -----
  const handleProductSelect = (selectedItemId) => {
    const currentItems = getValues("orderItems");
    if (
      !selectedItemId ||
      currentItems.some((item) => item.id === selectedItemId)
    )
      return;

    const itemToAdd = items.find((item) => item.id === selectedItemId);
    if (itemToAdd) {
      setValue("orderItems", [
        ...currentItems,
        {
          id: itemToAdd.id,
          name: itemToAdd.name,
          stock: itemToAdd.stock_quantity,
          price: parseFloat(itemToAdd.selling_price) || 0,
          quantity: 1,
          taxPercentage: parseFloat(itemToAdd.tax) || 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (itemIdToRemove) => {
    const currentItems = getValues("orderItems");
    const updatedItems = currentItems.filter(
      (item) => item.id !== itemIdToRemove,
    );
    setValue("orderItems", updatedItems);
  };

  const getPrintSettingsAndStore = () => {
    const printSettings = JSON.parse(
      localStorage.getItem("PRINT_SETTINGS") || "{}",
    );
    return {
      company_name: printSettings.company_name || "Your Company",
      store: printSettings.store_name || "Main Store",
      address: printSettings.address || "123 Main St",
      email: printSettings.email || "contact@example.com",
      phone: printSettings.phone || "555-1234",
      full_header_image_url: buildUploadUrl(
        API_UPLOADS_BASE,
        printSettings.header_image_url,
      ),
    };
  };

  const handlePrint = () => {
    if (!saleData) return;
    const cleanedItems = (saleData.items || [])
      .filter((i) => i?.item_name)
      .map((i) => ({
        name: i.item_name,
        quantity: parseFloat(i.quantity) || 0,
        price: parseFloat(i.unit_price) || 0,
      }));
    const formattedData = {
      id: saleData.id,
      invoice_number: saleData.invoice_number,
      date: saleData.date,
      store: getPrintSettingsAndStore(),
      partner: {
        label: "Customer",
        name: customerNameMap[saleData.party_id] || "Walk-in Customer",
      },
      items: cleanedItems,
      summary: {
        subTotal:
          parseFloat(saleData.sub_total) ||
          cleanedItems.reduce((s, i) => s + i.price * i.quantity, 0),
        grandTotal: parseFloat(saleData.total_amount),
        orderTax: parseFloat(saleData.tax_amount),
        discount: parseFloat(saleData.discount),
        shipping: parseFloat(saleData.shipping_charge),
      },
      payment: {
        amountPaid: parseFloat(saleData.paid_amount),
        changeReturn: parseFloat(saleData.change_return),
      },
      payment_methods: (saleData.payment_methods || []).map((pm) => ({
        ...pm,
        mode_of_payment:
          modeOfPaymentNameMap[pm.mode_of_payment_id] ||
          accountNameMap[pm.account_id] ||
          "Unknown",
      })),
    };
    setSelectedSaleForReceipt(formattedData);
    setIsReceiptModalOpen(true);
  };

  const handleFinalSubmit = async (paymentData, shouldPrint = false) => {
    const formData = getValues();
    const payload = {
      party_id: formData.partyId,
      done_by_id: formData.done_by_id || null,
      cost_center_id: formData.cost_center_id || null,
      status: paymentData.status,
      paid_amount:
        paymentData.payment_methods?.reduce(
          (a, c) => a + (parseFloat(c.amount) || 0),
          0,
        ) || 0,
      change_return: paymentData.change_return || 0,
      discount: formData.discount,
      date: formData.saleDate,
      invoice_number: id
        ? formData.invoice_number
        : invoiceNoData?.invoice_number,
      items: formData.orderItems.map((i) => ({
        item_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      })),
      ledger_id: paymentData.payment_methods?.[0]?.account_id || null,
      payment_methods: paymentData.payment_methods,
      note: paymentData.note,
    };

    try {
      setIsPaymentModalOpen(false);
      const response =
        mode === "edit"
          ? await updateSale({ id, saleData: payload })
          : await createSale(payload);
      showToast({
        crudItem: CRUDITEM.SALE,
        crudType:
          mode === "edit" ? CRUDTYPE.UPDATE_SUCCESS : CRUDTYPE.CREATE_SUCCESS,
      });

      if (shouldPrint) {
        const receiptSubTotal = formData.orderItems.reduce(
          (s, i) => s + i.price * i.quantity,
          0,
        );
        const receiptTax = formData.orderItems.reduce(
          (s, i) => s + (i.price * i.quantity * i.taxPercentage) / 100,
          0,
        );
        setSelectedSaleForReceipt({
          id: response?.data?.id || id,
          invoice_number:
            response?.data?.invoice_number || payload.invoice_number,
          date: payload.date,
          store: getPrintSettingsAndStore(),
          partner: {
            label: "Customer",
            name: customerNameMap[payload.party_id] || "Walk-in",
          },
          items: formData.orderItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          summary: {
            subTotal: receiptSubTotal,
            grandTotal: Math.max(
              0,
              receiptSubTotal + receiptTax - payload.discount,
            ),
            orderTax: receiptTax,
            discount: payload.discount,
            shipping: 0,
          },
          payment: {
            amountPaid: payload.paid_amount,
            changeReturn: payload.change_return,
          },
          payment_methods: payload.payment_methods.map((pm) => ({
            ...pm,
            mode_of_payment:
              modeOfPaymentNameMap[pm.mode_of_payment_id] ||
              accountNameMap[pm.account_id] ||
              "Unknown",
            amount: parseFloat(pm.amount),
          })),
        });
        setIsReceiptModalOpen(true);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        if (mode === "add") reset(defaultValues);
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        navigate("/sale-report");
      }
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: err.response?.data?.message || err.message,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleProcessPayment = () => {
    if (isCredit) {
      const defaultMOP = modeOfPaymentList?.find(m => m.name.toLowerCase().includes("cash")) || modeOfPaymentList?.[0];
      handleFinalSubmit(
        {
          status: "unpaid",
          paid_amount: 0,
          change_return: 0,
          payment_methods: [
            { 
              account_id: defaultMOP?.default_ledger_id || null, 
              amount: 0, 
              mode_of_payment_id: defaultMOP?.id || null 
            },
          ],
          note: "Credit Sale",
        },
        false,
      );
    } else setIsPaymentModalOpen(true);
  };

  if (
    (isFetchingSale && mode !== "add") ||
    !items.length ||
    isLoadingPermissions
  )
    return <Loader />;

  return (
    <ContainerWrapper>
      <div className="sale-page">
        <HStack
          className="sale-page__header"
          style={{
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <HStack spacing={10} style={{ alignItems: "center" }}>
            <IconBackButton onClick={() => navigate(-1)} />
            <PageTitle
              title={
                mode === "add"
                  ? "Create Sale"
                  : mode === "edit"
                    ? "Edit Sale"
                    : "View Sale"
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
              path="/sale-report"
              buttonText="View Sale Report"
            />
          </HStack>
        </HStack>

        <div className="sale-page__form-container">
          <ScrollContainer>
            <div className="sale-page__form-content">
              <HStack
                justifyContent="flex-start"
              >
                <Controller
                  name="partyId"
                  control={control}
                  render={({ field }) => (
                    <CustomerAutoCompleteWithAddOption
                      {...field}
                      ref={partyRef}
                      disabled={isViewMode}
                    />
                  )}
                />
                <Controller
                    name="done_by_id"
                    control={control}
                    render={({ field }) => (
                      <DoneByAutoCompleteWithAddOption
                        {...field}
                        placeholder="Done By"
                        disabled={isViewMode}
                      />
                    )}
                  />
                  <Controller
                    name="cost_center_id"
                    control={control}
                    render={({ field }) => (
                      <CostCenterAutoCompleteWithAddOption
                        {...field}
                        placeholder="Cost Center"
                        disabled={isViewMode}
                      />
                    )}
                  />
               
                <HStack justifyContent="flex-end">
                  
                   <Controller
                  name="saleDate"
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

              <div className="sale-page__order-table">
                <Table>
                  <Thead>
                    <Tr>
                      <Th style={{ width: "40%", padding: 0 }}>
                        {!isViewMode ? (
                          <div className="fs14" style={{ padding: "8px" }}>
                            <ItemAutoCompleteWithAddOption
                              style={{ width: "100%" }}
                              ref={itemSearchRef}
                              placeholder="Select items..."
                              onChange={(e) =>
                                handleProductSelect(e.target.value)
                              }
                            />
                          </div>
                        ) : (
                          "PRODUCT"
                        )}
                      </Th>
                      {extraFields
                        .filter((f) => f.show)
                        .map((field) => {
                          if (field.value === "price" && !isMobile)
                            return <Th key="price">PRICE</Th>;
                          if (field.value === "stock" && !isMobile)
                            return <Th key="stock">STOCK</Th>;
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
                            <div style={{ paddingLeft: "12px" }}>
                              {item.name}
                            </div>
                          </Td>
                          {extraFields
                            .filter((f) => f.show)
                            .map((field) => {
                              if (field.value === "price" && !isMobile)
                                return (
                                  <Td key="price">
                                    <AmountSymbol>{item.price}</AmountSymbol>
                                  </Td>
                                );
                              if (field.value === "stock" && !isMobile)
                                return (
                                  <Td key="stock">
                                    <span className="stock-badge">
                                      {item.stock}
                                    </span>
                                  </Td>
                                );
                              if (field.value === "quantity")
                                return (
                                  <Td key="quantity">
                                    <QuantitySelector
                                      initialValue={item.quantity}
                                      onChange={(q) =>
                                        setValue(
                                          "orderItems",
                                          getValues("orderItems").map((i) =>
                                            i.id === item.id
                                              ? { ...i, quantity: q }
                                              : i,
                                          ),
                                        )
                                      }
                                      min={1}
                                      max={item.stock}
                                      disabled={isViewMode}
                                    />
                                  </Td>
                                );
                              if (field.value === "tax" && !isMobile)
                                return (
                                  <Td key="tax">
                                    <AmountSymbol>
                                      {item.taxAmount}
                                    </AmountSymbol>
                                  </Td>
                                );
                              if (field.value === "sub_total")
                                return (
                                  <Td key="sub_total">
                                    <AmountSymbol>{item.subtotal}</AmountSymbol>
                                  </Td>
                                );
                              return null;
                            })}
                          <Td>
                            {isMobile ? (
                              <ThreeDotActionMenu
                                onView={() => {
                                  setViewItemId(item.id);
                                  setIsViewItemModalOpen(true);
                                }}
                                onDelete={() => handleRemoveItem(item.id)}
                                isViewMode={isViewMode}
                              />
                            ) : (
                              !isViewMode && (
                                <button
                                  type="button"
                                  className="action-btn delete-btn"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <FaTrash />
                                </button>
                              )
                            )}
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <TableCaption
                        item="Products"
                        noOfCol={extraFields.filter((f) => f.show).length + 2}
                        message="No products added."
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
                  {mode === "edit" && (
                    <Button onClick={handlePrint}>
                      <FaPrint style={{ marginRight: "8px" }} />
                      Print
                    </Button>
                  )}
                  <div
                    className="skip-payment-toggle"
                    style={{
                      marginRight: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#666" }}>
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
                  <CancelButton onClick={() => navigate(-1)}>
                    Cancel
                  </CancelButton>
                  <SubmitButton
                    label="submit"
                    onClick={handleSubmit(handleProcessPayment, (e) =>
                      onFormError(e, showToast),
                    )}
                    disabled={isCreating || isUpdating}
                  >
                    <FaSave style={{ marginRight: "5px" }} />{" "}
                    {mode === "edit" ? "Update" : "Process & Save"}
                  </SubmitButton>
                </HStack>
              </div>
            </div>
          </div>
        )}
        {mode === "view" && (
          <HStack justifyContent="flex-end" style={{ marginTop: "10px" }}>
            <Button onClick={handlePrint}>
              <FaPrint style={{ marginRight: "8px" }} />
              Print
            </Button>
            <Button onClick={() => navigate(`/sale/edit/${id}`)}>Edit</Button>
          </HStack>
        )}

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          calculations={{
            total: grandTotal,
            subTotal: itemsSubtotal,
            taxAmount: totalTax,
            totalQty,
            discount: watchedDiscount,
          }}
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
          onQuantityChange={(id, q) =>
            setValue(
              "orderItems",
              getValues("orderItems").map((i) =>
                i.id === id ? { ...i, quantity: q } : i,
              ),
            )
          }
        />
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            navigate("/sale-report");
          }}
          transactionData={selectedSaleForReceipt}
        />
      </div>
    </ContainerWrapper>
  );
};

export default CommonSale;