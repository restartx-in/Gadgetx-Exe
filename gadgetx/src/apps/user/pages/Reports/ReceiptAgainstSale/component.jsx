import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useReducer,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaTrash, FaPrint } from "react-icons/fa";

// Hooks & Context
import { useSales } from "@/apps/user/hooks/api/sales/useSales";
import { useVoucherById } from "@/apps/user/hooks/api/voucher/useVoucherById";
import { useCreateVoucher } from "@/apps/user/hooks/api/voucher/useCreateVoucher";
import { useUpdateVoucher } from "@/apps/user/hooks/api/voucher/useUpdateVoucher";
import { useDeleteVoucher } from "@/apps/user/hooks/api/voucher/useDeleteVoucher";
import { useToast } from "@/context/ToastContext";
import { onFormError } from "@/utils/formUtils"; // Added for consistent error handling

// Constants & Components
import { CRUDITEM, CRUDTYPE } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import ContainerWrapper from "@/components/ContainerWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import HStack from "@/components/HStack/component";
import VStack from "@/components/VStack/component";
import PageTitle from "@/components/PageTitle";
import IconBackButton from "@/apps/user/components/IconBackButton";
import DateField from "@/components/DateField";
import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import CustomerAutocomplete from "@/apps/user/components/CustomerAutoComplete";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import Button from "@/components/Button";
import DeleteConfirmationModal from "@/apps/user/components/DeleteConfirmationModal/component";
import Loader from "@/components/Loader";
import ViewButtonForReceiptAndPayment from "@/apps/user/components/ViewButtonForReceiptAndPayment";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import TextBadge from "@/components/TextBadge";
import ReceiptModal from "@/apps/user/components/ReceiptModal";

// Style
import "./style.scss";

// --- Zod Schema for Validation ---
const voucherSchema = z.object({
  from_ledger_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "From Ledger (Party) is required",
    }),
  to_ledger_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "To Ledger is required",
    }),
  voucher_no: z.string().min(1, "Receipt No is required"),
  date: z.string(),
  party_id: z.any().optional(), // Not submitted, just for UI state
  cost_center_id: z.any().optional().nullable(),
  done_by_id: z.any().optional().nullable(),
  description: z.string().optional(),
});

// --- Reducer (Simplified for Invoice List Management) ---
const invoiceReducerInitialState = {
  salesInvoices: [],
  referencedSaleIds: [],
};

const invoiceReducer = (state, action) => {
  switch (action.type) {
    case "SET_REFERENCED_IDS":
      return { ...state, referencedSaleIds: action.payload };
    case "MERGE_VOUCHER_SALES": {
      const { voucherSales, voucherData } = action.payload;
      const txMap = (voucherData.transactions || []).reduce((map, t) => {
        map[parseInt(t.invoice_id)] = parseFloat(t.received_amount || 0);
        return map;
      }, {});
      const mapped = voucherSales.map((inv) => {
        const now_paying = txMap[inv.id] || 0;
        const totalAmount = parseFloat(inv.total_amount || 0);
        const totalPaidBeforeReceipt =
          parseFloat(inv.paid_amount || 0) - now_paying;
        const effectivePaidAmount = Math.max(0, totalPaidBeforeReceipt);
        const balanceAfterNowPaying =
          totalAmount - effectivePaidAmount - now_paying;
        let status = balanceAfterNowPaying <= 0.01 ? "paid" : "partial";
        if (effectivePaidAmount === 0 && now_paying === 0) status = "unpaid";
        return {
          ...inv,
          id: inv.id,
          invoice_number: inv.invoice_number,
          total_amount: totalAmount,
          paid_amount: effectivePaidAmount,
          now_paying_amount: now_paying,
          balance: balanceAfterNowPaying,
          is_selected: balanceAfterNowPaying <= 0.01,
          status: status.toLowerCase(),
        };
      });
      return { ...state, salesInvoices: mapped };
    }
    case "LOAD_PARTY_SALES": {
      const partySales = action.payload;
      const mapped = partySales.map((inv) => ({
        ...inv,
        now_paying_amount: 0,
        is_selected: false,
        balance:
          parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0),
        status: (inv.status || "unpaid").toLowerCase(),
      }));
      return { ...state, salesInvoices: mapped };
    }
    case "CLEAR_INVOICES":
      return { ...state, salesInvoices: [] };
    case "TOGGLE_SELECT_ALL": {
      const isChecked = action.payload;
      const newInvoices = state.salesInvoices.map((inv) => {
        const maxPayable = inv.total_amount - inv.paid_amount;
        if (maxPayable <= 0) return inv;
        const newPayingAmount = isChecked ? maxPayable : 0;
        return {
          ...inv,
          is_selected: isChecked,
          now_paying_amount: newPayingAmount,
          balance: maxPayable - newPayingAmount,
        };
      });
      return { ...state, salesInvoices: newInvoices };
    }
    case "UPDATE_INVOICE_PAYMENT": {
      const { saleId, amount, isCheckboxChange } = action.payload;
      const newInvoices = state.salesInvoices.map((inv) => {
        if (inv.id === saleId) {
          const maxPayable = inv.total_amount - inv.paid_amount;
          let newPayingAmount = 0;
          if (isCheckboxChange) {
            newPayingAmount = amount ? maxPayable : 0;
          } else {
            const payingAmount = parseFloat(amount) || 0;
            newPayingAmount = Math.min(Math.max(0, payingAmount), maxPayable);
          }
          const newBalance =
            inv.total_amount - inv.paid_amount - newPayingAmount;
          return {
            ...inv,
            now_paying_amount: newPayingAmount,
            balance: newBalance,
            is_selected: newBalance <= 0.01,
          };
        }
        return inv;
      });
      return { ...state, salesInvoices: newInvoices };
    }
    default:
      return state;
  }
};

const ReceiptAgainstSale = () => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const [invoiceState, dispatch] = useReducer(
    invoiceReducer,
    invoiceReducerInitialState,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const headerCheckboxRef = useRef(null);
  const customerRef = useRef(null); // Ref for Customer field

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedVoucherForReceipt, setSelectedVoucherForReceipt] =
    useState(null);

  // --- React Hook Form Setup ---
  // UPDATED: Added shouldFocusError: false to control focus manually
  const { control, handleSubmit, reset, watch, setValue, setFocus } = useForm({
    resolver: zodResolver(voucherSchema),
    shouldFocusError: false,
    defaultValues: {
      voucher_no: "",
      date: new Date().toISOString(),
      party_id: "",
      from_ledger_id: "",
      to_ledger_id: "",
      cost_center_id: "",
      done_by_id: "",
      description: "",
    },
  });

  const watchedPartyId = watch("party_id");
  const watchedVoucherNo = watch("voucher_no");

  // --- Data Fetching ---
  const { data: voucherData, isLoading: isFetchingVoucher } = useVoucherById(
    id,
    { enabled: !!id },
  );
  const { mutateAsync: createVoucher, isPending: isCreating } =
    useCreateVoucher();
  const { mutateAsync: updateVoucher, isPending: isUpdating } =
    useUpdateVoucher();
  const { mutateAsync: deleteVoucher, isPending: isDeleting } =
    useDeleteVoucher();

  const { data: voucherSales, isLoading: isFetchingVoucherSales } = useSales(
    { ids: invoiceState.referencedSaleIds.join(","), status: "" },
    {
      enabled:
        (isEditMode || isViewMode) && invoiceState.referencedSaleIds.length > 0,
    },
  );

  const { data: partySales, isLoading: isSalesLoading } = useSales(
    { party_id: watchedPartyId, status: "unpaid,partial" },
    { enabled: !!watchedPartyId && !isEditMode && !isViewMode },
  );

  // --- Memoized Derived Data ---
  const totalNowPaying = useMemo(
    () =>
      invoiceState.salesInvoices.reduce(
        (sum, inv) => sum + inv.now_paying_amount,
        0,
      ),
    [invoiceState.salesInvoices],
  );

  // --- Side Effects to Sync API Data with State ---
  useEffect(() => {
    if (voucherData && (isEditMode || isViewMode)) {
      reset({
        voucher_no: voucherData.voucher_no,
        date: voucherData.date,
        party_id: "", // This is derived from the ledger
        from_ledger_id: voucherData.from_ledger_id,
        to_ledger_id: voucherData.to_ledger_id,
        cost_center_id: voucherData.cost_center_id || "",
        done_by_id: voucherData.done_by_id || "",
        description: voucherData.description || "",
      });
      const ids = (voucherData.transactions || [])
        .filter((t) => t.invoice_type === "SALE")
        .map((t) => parseInt(t.invoice_id));
      dispatch({ type: "SET_REFERENCED_IDS", payload: ids });
    }
  }, [voucherData, isEditMode, isViewMode, reset]);

  useEffect(() => {
    if ((isEditMode || isViewMode) && voucherSales && voucherData) {
      dispatch({
        type: "MERGE_VOUCHER_SALES",
        payload: { voucherSales, voucherData },
      });
    }
  }, [voucherSales, voucherData, isEditMode, isViewMode]);

  useEffect(() => {
    if (partySales && !isEditMode && !isViewMode) {
      dispatch({ type: "LOAD_PARTY_SALES", payload: partySales });
    }
  }, [partySales, isEditMode, isViewMode]);

  const handlePrint = useCallback(() => {
    if (!voucherData) {
      showToast({
        message: "Voucher data not available to print.",
        status: TOASTSTATUS.WARNING,
      });
      return;
    }
    const formattedData = {
      id: voucherData.id,
      invoice_number: voucherData.voucher_no,
      date: voucherData.date,
      partner: { label: `Received from`, name: voucherData.from_ledger_name },
      items: invoiceState.salesInvoices
        .filter((inv) => inv.now_paying_amount > 0)
        .map((inv) => ({
          name: `Payment for Invoice #${inv.invoice_number}`,
          quantity: 1,
          price: inv.now_paying_amount,
        })),
      summary: {
        subTotal: totalNowPaying,
        grandTotal: totalNowPaying,
        orderTax: 0,
        discount: 0,
        shipping: 0,
      },
      payment: { amountPaid: totalNowPaying, changeReturn: 0 },
      payment_methods: [
        {
          amount: totalNowPaying,
          mode_of_payment: voucherData.to_ledger_name || "N/A",
        },
      ],
    };
    setSelectedVoucherForReceipt(formattedData);
    setIsReceiptModalOpen(true);
  }, [voucherData, invoiceState.salesInvoices, totalNowPaying, showToast]);

  useEffect(() => {
    if (isViewMode && location.state?.print && voucherData) {
      handlePrint();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isViewMode, location.state, voucherData, handlePrint, navigate]);

  // --- Memoized Event Handlers ---
  const handlePartyChange = useCallback(
    (party) => {
      setValue("party_id", party?.party_id || "", { shouldValidate: true });
      setValue("from_ledger_id", party?.ledger_id || "", {
        shouldValidate: true,
      });
      if (!party) dispatch({ type: "CLEAR_INVOICES" });
    },
    [setValue],
  );

  const handleSelectAll = useCallback(
    (isChecked) => dispatch({ type: "TOGGLE_SELECT_ALL", payload: isChecked }),
    [],
  );
  const handleCheckboxChange = useCallback(
    (saleId, isChecked) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { saleId, amount: isChecked, isCheckboxChange: true },
      }),
    [],
  );
  const handlePaymentChange = useCallback(
    (saleId, amount) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { saleId, amount, isCheckboxChange: false },
      }),
    [],
  );

  // UPDATED: Strict order for validation focus to match visual layout
  const handleValidationError = (errors) => {
    onFormError(errors, showToast);

    // 1. Check Party (Top Left)
    if (errors.from_ledger_id) {
      customerRef.current?.focus?.();
      return;
    }
    // 2. Check To Ledger (Bottom Left in first stack)
    if (errors.to_ledger_id) {
      setFocus("to_ledger_id");
      return;
    }
    // 3. Check Receipt No (Bottom in second stack)
    if (errors.voucher_no) {
      setFocus("voucher_no");
      return;
    }
  };

  const onFormSubmit = useCallback(
    async (data, andPrint = false) => {
      const transactions = invoiceState.salesInvoices
        .filter((inv) => inv.now_paying_amount > 0)
        .map((inv) => ({
          invoice_id: String(inv.id),
          invoice_type: "SALE",
          received_amount: inv.now_paying_amount,
        }));

      if (transactions.length === 0) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please select at least one invoice.",
          status: TOASTSTATUS.WARNING,
        });
        return;
      }

      const total = transactions.reduce((sum, t) => sum + t.received_amount, 0);
      const payload = {
        amount: total,
        date: data.date,
        description: data.description,
        voucher_no: data.voucher_no,
        voucher_type: 1, // Receipt Voucher
        cost_center_id: data.cost_center_id || null,
        done_by_id: data.done_by_id || null,
        from_ledger: { ledger_id: data.from_ledger_id, amount: total },
        to_ledger: { ledger_id: data.to_ledger_id, amount: total },
        transactions,
      };

      try {
        const response = isEditMode
          ? await updateVoucher({ id, voucherData: payload })
          : await createVoucher(payload);
        showToast({
          crudItem: CRUDITEM.VOUCHER,
          crudType: isEditMode
            ? CRUDTYPE.UPDATE_SUCCESS
            : CRUDTYPE.CREATE_SUCCESS,
        });

        const voucherId = isEditMode ? id : response?.id;
        if (andPrint && voucherId) {
          navigate(`/receipt-against-sale/view/${voucherId}`, {
            replace: true,
            state: { print: true },
          });
        } else {
          navigate("/receipt-report");
        }
      } catch (err) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Action failed",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [
      invoiceState.salesInvoices,
      isEditMode,
      id,
      navigate,
      showToast,
      createVoucher,
      updateVoucher,
    ],
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteVoucher(id);
      showToast({
        crudItem: CRUDITEM.VOUCHER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      navigate("/receipt-report");
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Delete failed",
        status: TOASTSTATUS.ERROR,
      });
    }
  }, [id, deleteVoucher, navigate, showToast]);

  const headerCheckboxState = useMemo(() => {
    const payableInvoices = invoiceState.salesInvoices.filter(
      (inv) => inv.total_amount - inv.paid_amount > 0,
    );
    if (payableInvoices.length === 0)
      return { checked: false, indeterminate: false, disabled: true };
    const selectedPayableInvoices = payableInvoices.filter(
      (inv) => inv.is_selected,
    );
    const allSelected =
      selectedPayableInvoices.length === payableInvoices.length;
    return {
      checked: allSelected,
      indeterminate: selectedPayableInvoices.length > 0 && !allSelected,
      disabled: isViewMode,
    };
  }, [invoiceState.salesInvoices, isViewMode]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        headerCheckboxState.indeterminate;
    }
  }, [headerCheckboxState.indeterminate]);

  const isLoading =
    isFetchingVoucher || isFetchingVoucherSales || isSalesLoading;

  if (
    isFetchingVoucher ||
    (id && isFetchingVoucherSales && invoiceState.salesInvoices.length === 0)
  )
    return <Loader />;

  return (
    <ContainerWrapper>
      <div className="receipt-against-sale">
        <div className="receipt-against-sale__header">
          <HStack
            justifyContent="space-between"
            width="100%"
            alignItems="center"
          >
            <HStack spacing={10} alignItems="center">
              <IconBackButton onClick={() => navigate(-1)} />
              <PageTitle
                title={
                  mode
                    ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} Receipt`
                    : "Receipt Against Sale"
                }
              />
              <ViewButtonForReceiptAndPayment
                path="/receipt-report?invoiceTypes=SALE"
                buttonText="View Sales Receipts"
              />
            </HStack>
          </HStack>
        </div>
        <ScrollContainer>
          <div className="receipt-against-sale__content">
            <div className="receipt-against-sale__form-panel">
              <VStack>
                {!isViewMode && !isEditMode ? (
                  <CustomerAutocomplete
                    ref={customerRef} // Attached Ref here
                    label="From Ledger (Party)"
                    value={watchedPartyId}
                    onChange={handlePartyChange}
                    required
                  />
                ) : (
                  <InputField
                    label="From Ledger (Party)"
                    value={voucherData?.from_ledger_name}
                    readOnly
                  />
                )}
                <Controller
                  name="to_ledger_id"
                  control={control}
                  render={({ field }) => (
                    <LedgerAutoCompleteWithAddOptionWithBalance
                      {...field}
                      label="To Ledger"
                      required
                      disabled={isViewMode}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </VStack>
              <VStack>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      {...field}
                      label="Description"
                      multiline
                      rows={1}
                      disabled={isViewMode}
                    />
                  )}
                />
                <Controller
                  name="voucher_no"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Receipt No"
                      required
                      disabled={isViewMode}
                    />
                  )}
                />
              </VStack>
              <VStack>
                <Controller
                  name="cost_center_id"
                  control={control}
                  render={({ field }) => (
                    <CostCenterAutoCompleteWithAddOption
                      {...field}
                      name="cost_center_id"
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
                      name="done_by_id"
                      disabled={isViewMode}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </VStack>
              <VStack>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Date"
                      value={new Date(field.value)}
                      onChange={(d) => field.onChange(d.toISOString())}
                      disabled={isViewMode}
                    />
                  )}
                />
              </VStack>
            </div>
            <div className="receipt-against-sale__table-panel">
              <div className="table-container">
                {isLoading && <Loader />}
                <Table>
                  <Thead>
                    <Tr>
                      <Th width="20px">
                        <input
                          type="checkbox"
                          ref={headerCheckboxRef}
                          checked={headerCheckboxState.checked}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={headerCheckboxState.disabled}
                        />
                      </Th>
                      <Th>Invoice No</Th>
                      <Th>Invoice Date</Th>
                      <Th>Status</Th>
                      <Th>Total Amt</Th>
                      <Th>Receipt Earlier</Th>
                      <Th>Paying Now</Th>
                      <Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {!watchedPartyId && !id ? (
                      <TableCaption
                        item="Items"
                        noOfCol={8}
                        message="Select a party to view pending invoices."
                      />
                    ) : invoiceState.salesInvoices.length > 0 ? (
                      invoiceState.salesInvoices.map((inv) => {
                        const maxPayable = inv.total_amount - inv.paid_amount;
                        const isDisabled = isViewMode || maxPayable <= 0;
                        return (
                          <Tr key={inv.id}>
                            <Td>
                              <input
                                type="checkbox"
                                checked={inv.is_selected || false}
                                onChange={(e) =>
                                  !isDisabled &&
                                  handleCheckboxChange(inv.id, e.target.checked)
                                }
                                disabled={isDisabled}
                              />
                            </Td>
                            <Td>{inv.invoice_number}</Td>
                            <Td>{inv.date.split("T")[0]}</Td>
                            <Td>
                              <TextBadge
                                variant="paymentStatus"
                                type={inv.status}
                              >
                                {inv.status.charAt(0).toUpperCase() +
                                  inv.status.slice(1)}
                              </TextBadge>
                            </Td>
                            <Td>
                              <AmountSymbol>{inv.total_amount}</AmountSymbol>
                            </Td>
                            <Td>
                              <AmountSymbol>{inv.paid_amount}</AmountSymbol>
                            </Td>
                            <Td>
                              <InputField
                                type="number"
                                className="table-input"
                                value={inv.now_paying_amount || ""}
                                onChange={(e) =>
                                  handlePaymentChange(inv.id, e.target.value)
                                }
                                disabled={isDisabled}
                              />
                            </Td>
                            <Td>
                              <AmountSymbol>{inv.balance}</AmountSymbol>
                            </Td>
                          </Tr>
                        );
                      })
                    ) : (
                      <TableCaption
                        item="Items"
                        noOfCol={8}
                        message="No pending items found."
                      />
                    )}
                  </Tbody>
                </Table>
              </div>
              <div className="table-footer">
                <div className="total-paying">
                  <span>Total Paying:</span>
                  <span className="amount">
                    <AmountSymbol>{totalNowPaying}</AmountSymbol>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollContainer>
        <div className="receipt-against-sale__actions">
          <CancelButton onClick={() => navigate(-1)} />
          {isViewMode && (
            <>
              <Button
                className="btn-delete"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <FaTrash /> Delete
              </Button>
              <Button
                onClick={() => navigate(`/receipt-against-sale/edit/${id}`)}
              >
                Edit
              </Button>
              <Button onClick={handlePrint}>
                <FaPrint style={{ marginRight: "8px" }} />
                Print
              </Button>
            </>
          )}
          {!isViewMode && (
            <>
              <SubmitButton
                label={isEditMode ? "Update Receipt" : "Create Receipt"}
                onClick={handleSubmit(
                  (data) => onFormSubmit(data, false),
                  handleValidationError,
                )}
                isLoading={isCreating || isUpdating}
              />
              <Button
                onClick={handleSubmit(
                  (data) => onFormSubmit(data, true),
                  handleValidationError,
                )}
                disabled={isCreating || isUpdating}
              >
                {isEditMode ? "Update & Print" : "Submit & Print"}
              </Button>
            </>
          )}
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        transactionName={watchedVoucherNo}
      />
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transactionData={selectedVoucherForReceipt}
      />
    </ContainerWrapper>
  );
};

export default ReceiptAgainstSale;