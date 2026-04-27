import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useCallback,
} from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaTrash, FaPrint } from "react-icons/fa";

// Hooks & Context
import { useSaleReturns } from "@/apps/user/hooks/api/saleReturns/useSaleReturns";
import { useVoucherById } from "@/apps/user/hooks/api/voucher/useVoucherById";
import { useCreateVoucher } from "@/apps/user/hooks/api/voucher/useCreateVoucher";
import { useUpdateVoucher } from "@/apps/user/hooks/api/voucher/useUpdateVoucher";
import { useDeleteVoucher } from "@/apps/user/hooks/api/voucher/useDeleteVoucher";
import { useToast } from "@/context/ToastContext";
import { onFormError } from "@/utils/formUtils"; // For consistent toast messages

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
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import DeleteConfirmationModal from "@/apps/user/components/DeleteConfirmationModal/component";
import ViewReportButton from "@/apps/user/components/ViewButtonForReceiptAndPayment";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
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

import "./style.scss";

// --- Zod Schema for Validation ---
const voucherSchema = z.object({
  to_ledger_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "To Ledger (Customer) is required",
    }),
  from_ledger_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "From Ledger is required",
    }),
  voucher_no: z.string().min(1, "Payment No is required"),
  date: z.string(),
  party_id: z.any().optional(), // For UI state only
  cost_center_id: z.any().optional().nullable(),
  done_by_id: z.any().optional().nullable(),
  description: z.string().optional(),
});

// --- Reducer for Invoice List Management ---
const invoiceReducerInitialState = {
  returnInvoices: [],
  referencedSaleReturnIds: [],
};

const invoiceReducer = (state, action) => {
  switch (action.type) {
    case "SET_REFERENCED_IDS":
      return { ...state, referencedSaleReturnIds: action.payload };
    case "MERGE_VOUCHER_SALE_RETURNS": {
      const { voucherSaleReturns, voucherData } = action.payload;
      const txMap = (voucherData.transactions || []).reduce((map, t) => {
        map[parseInt(t.invoice_id)] = parseFloat(t.received_amount || 0);
        return map;
      }, {});

      const mapped = voucherSaleReturns.map((ret) => {
        const now_paying = txMap[ret.id] || 0;
        const total_refund_amount = parseFloat(ret.total_refund_amount || 0);
        const refundedAmountBeforePayment =
          parseFloat(ret.refunded_amount || 0) - now_paying;
        const effectiveRefundedAmount = Math.max(
          0,
          refundedAmountBeforePayment,
        );
        const maxPayable = total_refund_amount - effectiveRefundedAmount;
        const balanceAfterNowPaying = maxPayable - now_paying;
        let status = balanceAfterNowPaying <= 0.01 ? "refunded" : "partial";
        if (effectiveRefundedAmount === 0 && now_paying === 0)
          status = "pending";
        return {
          ...ret,
          id: ret.id,
          invoice_number: ret.invoice_number || `SR-${ret.id}`,
          total_refund_amount,
          refunded_amount: effectiveRefundedAmount,
          now_paying_amount: now_paying,
          balance: balanceAfterNowPaying,
          is_selected: balanceAfterNowPaying <= 0.01,
          date: ret.date,
          status: status.toLowerCase(),
        };
      });
      return { ...state, returnInvoices: mapped };
    }
    case "LOAD_PARTY_SALE_RETURNS": {
      const partyReturns = action.payload;
      const mapped = partyReturns
        .map((ret) => {
          const maxPayable =
            parseFloat(ret.total_refund_amount) -
            parseFloat(ret.refunded_amount || 0);
          return {
            ...ret,
            now_paying_amount: 0,
            is_selected: false,
            balance: maxPayable,
            status: (ret.status || "N/A").toLowerCase(),
          };
        })
        .filter(
          (ret) =>
            parseFloat(ret.total_refund_amount) -
              parseFloat(ret.refunded_amount || 0) >
            0,
        );
      return { ...state, returnInvoices: mapped };
    }
    case "CLEAR_INVOICES":
      return { ...state, returnInvoices: [] };
    case "TOGGLE_SELECT_ALL": {
      const isChecked = action.payload;
      const newInvoices = state.returnInvoices.map((ret) => {
        const maxPayable =
          parseFloat(ret.total_refund_amount) -
          parseFloat(ret.refunded_amount || 0);
        if (maxPayable <= 0) return ret;
        const newPayingAmount = isChecked ? maxPayable : 0;
        return {
          ...ret,
          is_selected: isChecked,
          now_paying_amount: newPayingAmount,
          balance: maxPayable - newPayingAmount,
        };
      });
      return { ...state, returnInvoices: newInvoices };
    }
    case "UPDATE_INVOICE_PAYMENT": {
      const { returnId, amount, isCheckboxChange } = action.payload;
      const newInvoices = state.returnInvoices.map((ret) => {
        if (ret.id === returnId) {
          const maxPayable =
            parseFloat(ret.total_refund_amount) -
            parseFloat(ret.refunded_amount || 0);
          let newPayingAmount = 0;
          if (isCheckboxChange) {
            newPayingAmount = amount ? maxPayable : 0;
          } else {
            const payingAmount = parseFloat(amount) || 0;
            newPayingAmount = Math.min(Math.max(0, payingAmount), maxPayable);
          }
          const newBalance = maxPayable - newPayingAmount;
          return {
            ...ret,
            now_paying_amount: newPayingAmount,
            balance: newBalance,
            is_selected: newBalance <= 0.01,
          };
        }
        return ret;
      });
      return { ...state, returnInvoices: newInvoices };
    }
    default:
      return state;
  }
};

const PaymentAgainstSaleReturn = () => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = !isViewMode && !isEditMode;

  const [invoiceState, dispatch] = useReducer(
    invoiceReducer,
    invoiceReducerInitialState,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const headerCheckboxRef = useRef(null);
  const customerRef = useRef(null); // Ref for Customer field

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState(null);

  // --- React Hook Form Setup ---
  // UPDATED: Added shouldFocusError: false
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

  const { data: voucherSaleReturns, isLoading: isFetchingVoucherSaleReturns } =
    useSaleReturns(
      {
        ids: invoiceState.referencedSaleReturnIds.join(","),
        payment_due_only: false,
      },
      {
        enabled:
          (isEditMode || isViewMode) &&
          invoiceState.referencedSaleReturnIds.length > 0,
      },
    );

  const { data: partyReturns, isLoading: isReturnsLoading } = useSaleReturns(
    { party_id: watchedPartyId, payment_due_only: true },
    { enabled: !!watchedPartyId && isCreateMode },
  );

  // --- Side Effects ---
  useEffect(() => {
    if (voucherData && (isEditMode || isViewMode)) {
      reset({
        voucher_no: voucherData.voucher_no,
        date: voucherData.date,
        party_id: "",
        from_ledger_id: voucherData.from_ledger_id,
        to_ledger_id: voucherData.to_ledger_id,
        cost_center_id: voucherData.cost_center_id || "",
        done_by_id: voucherData.done_by_id || "",
        description: voucherData.description || "",
      });
      const ids = (voucherData.transactions || [])
        .filter((t) => t.invoice_type === "SALERETURN")
        .map((t) => parseInt(t.invoice_id));
      dispatch({ type: "SET_REFERENCED_IDS", payload: ids });
    }
  }, [voucherData, isEditMode, isViewMode, reset]);

  useEffect(() => {
    if ((isEditMode || isViewMode) && voucherSaleReturns && voucherData) {
      dispatch({
        type: "MERGE_VOUCHER_SALE_RETURNS",
        payload: { voucherSaleReturns, voucherData },
      });
    }
  }, [voucherSaleReturns, voucherData, isEditMode, isViewMode]);

  useEffect(() => {
    if (partyReturns && isCreateMode) {
      dispatch({ type: "LOAD_PARTY_SALE_RETURNS", payload: partyReturns });
    }
  }, [partyReturns, isCreateMode]);

  const totalNowPaying = useMemo(
    () =>
      invoiceState.returnInvoices.reduce(
        (sum, ret) => sum + (parseFloat(ret.now_paying_amount) || 0),
        0,
      ),
    [invoiceState.returnInvoices],
  );

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
      partner: {
        label: `Paid to (Customer)`,
        name: voucherData.to_ledger_name,
      },
      items: invoiceState.returnInvoices
        .filter((ret) => ret.now_paying_amount > 0)
        .map((ret) => ({
          name: `Refund for S.Return #${ret.invoice_number}`,
          quantity: 1,
          price: ret.now_paying_amount,
        })),
      summary: {
        subTotal: totalNowPaying,
        grandTotal: totalNowPaying,
        orderTax: 0,
        discount: 0,
        shipping: 0,
      },
      payment: {
        amountPaid: totalNowPaying,
        changeReturn: 0,
      },
      payment_methods: [
        {
          amount: totalNowPaying,
          mode_of_payment: voucherData.from_ledger_name || "N/A",
        },
      ],
    };
    setSelectedVoucherForPrint(formattedData);
    setIsReceiptModalOpen(true);
  }, [voucherData, invoiceState.returnInvoices, totalNowPaying, showToast]);

  useEffect(() => {
    if (isViewMode && location.state?.print && voucherData) {
      handlePrint();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isViewMode, location.state, voucherData, handlePrint, navigate]);

  // --- Handlers ---
  const handlePartyChange = useCallback(
    (party) => {
      setValue("party_id", party?.party_id || "", { shouldValidate: true });
      setValue("to_ledger_id", party?.ledger_id || "", {
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
    (returnId, isChecked) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { returnId, amount: isChecked, isCheckboxChange: true },
      }),
    [],
  );
  const handlePaymentChange = useCallback(
    (returnId, amount) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { returnId, amount, isCheckboxChange: false },
      }),
    [],
  );

  // UPDATED: Manual validation handler for toast and focus
  const handleValidationError = (errors) => {
    onFormError(errors, showToast);
    if (errors.to_ledger_id) { // Customer field
      customerRef.current?.focus?.();
      return;
    }
    if (errors.from_ledger_id) {
      setFocus("from_ledger_id");
      return;
    }
    if (errors.voucher_no) {
      setFocus("voucher_no");
      return;
    }
  };

  const onFormSubmit = useCallback(
    async (data, andPrint = false) => {
      const transactions = invoiceState.returnInvoices
        .filter((ret) => ret.now_paying_amount > 0)
        .map((ret) => ({
          invoice_id: String(ret.id),
          invoice_type: "SALERETURN",
          received_amount: ret.now_paying_amount,
        }));

      if (transactions.length === 0) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please enter an amount to refund.",
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
        voucher_type: 0,
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
          navigate(`/payment-against-sale-return/view/${voucherId}`, {
            replace: true,
            state: { print: true },
          });
        } else {
          navigate("/payment-report");
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
      invoiceState.returnInvoices,
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
      navigate("/payment-report");
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Delete failed",
        status: TOASTSTATUS.ERROR,
      });
    }
  }, [id, deleteVoucher, navigate, showToast]);

  const headerCheckboxState = useMemo(() => {
    if (isViewMode)
      return { checked: false, indeterminate: false, disabled: true };
    const payableInvoices = invoiceState.returnInvoices.filter(
      (inv) =>
        parseFloat(inv.total_refund_amount) -
          parseFloat(inv.refunded_amount || 0) >
        0,
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
      disabled: false,
    };
  }, [invoiceState.returnInvoices, isViewMode]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        headerCheckboxState.indeterminate;
    }
  }, [headerCheckboxState.indeterminate]);

  const isLoading = isFetchingVoucher || (id && isFetchingVoucherSaleReturns);

  if (isLoading) return <Loader />;

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
                    ? `${mode.charAt(0).toUpperCase() + mode.slice(1)} Refund`
                    : "Payment Against Sale Return"
                }
              />
              <ViewReportButton
                path="/payment-report?invoiceTypes=SALERETURN"
                buttonText="View SR Payments"
              />
            </HStack>
          </HStack>
        </div>
        <ScrollContainer>
          <div className="receipt-against-sale__content">
            <div className="receipt-against-sale__form-panel">
              <VStack spacing={10}>
                {isCreateMode ? (
                  <CustomerAutocomplete
                    ref={customerRef} // Attached ref
                    label="To Ledger (Party)"
                    value={watchedPartyId}
                    onChange={handlePartyChange}
                    required
                  />
                ) : (
                  <InputField
                    label="To Ledger (Party)"
                    value={voucherData?.to_ledger_name || ""}
                    readOnly
                  />
                )}
                <Controller
                  name="from_ledger_id"
                  control={control}
                  render={({ field }) => (
                    <LedgerAutoCompleteWithAddOptionWithBalance
                      {...field}
                      label="From Ledger (Bank/Cash)"
                      required
                      disabled={isViewMode}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              </VStack>
              <VStack spacing={10}>
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
                      label="Payment No"
                      required
                      disabled={isViewMode}
                    />
                  )}
                />
              </VStack>
              <VStack spacing={10}>
                <Controller
                  name="cost_center_id"
                  control={control}
                  render={({ field }) => (
                    <CostCenterAutoCompleteWithAddOption
                      {...field}
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
                {isReturnsLoading && isCreateMode && <Loader />}
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
                      <Th>Return No</Th>
                      <Th>Return Date</Th>
                      <Th>Status</Th>
                      <Th>Refund Due</Th>
                      <Th>Already Refunded</Th>
                      <Th>Refunding Now</Th>
                      <Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {!watchedPartyId && !id ? (
                      <TableCaption
                        item="Returns"
                        noOfCol={8}
                        message="Select a party to view pending returns."
                      />
                    ) : invoiceState.returnInvoices.length > 0 ? (
                      invoiceState.returnInvoices.map((ret) => {
                        const maxPayable =
                          parseFloat(ret.total_refund_amount) -
                          parseFloat(ret.refunded_amount || 0);
                        const isDisabled =
                          isViewMode || (maxPayable <= 0 && !ret.is_selected);
                        return (
                          <Tr key={ret.id}>
                            <Td>
                              <input
                                type="checkbox"
                                checked={ret.is_selected || false}
                                onChange={(e) =>
                                  !isViewMode &&
                                  handleCheckboxChange(ret.id, e.target.checked)
                                }
                                disabled={isDisabled}
                              />
                            </Td>
                            <Td>{ret.invoice_number}</Td>
                            <Td>{ret.date.split("T")[0]}</Td>
                            <Td>
                              <TextBadge
                                variant="paymentStatus"
                                type={ret.status}
                              >
                                {ret.status.charAt(0).toUpperCase() +
                                  ret.status.slice(1)}
                              </TextBadge>
                            </Td>
                            <Td>
                              <AmountSymbol>
                                {ret.total_refund_amount || 0}
                              </AmountSymbol>
                            </Td>
                            <Td>
                              <AmountSymbol>
                                {ret.refunded_amount || 0}
                              </AmountSymbol>
                            </Td>
                            <Td>
                              <InputField
                                type="number"
                                className="table-input"
                                value={ret.now_paying_amount || ""}
                                onChange={(e) =>
                                  handlePaymentChange(ret.id, e.target.value)
                                }
                                disabled={isViewMode}
                              />
                            </Td>
                            <Td>
                              <AmountSymbol>
                                {ret.balance < 0 ? 0 : ret.balance}
                              </AmountSymbol>
                            </Td>
                          </Tr>
                        );
                      })
                    ) : (
                      <TableCaption
                        item="Returns"
                        noOfCol={8}
                        message="No pending items found."
                      />
                    )}
                  </Tbody>
                </Table>
              </div>
              <div className="table-footer">
                <div className="total-paying">
                  <span>Total Refund:</span>
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
                onClick={() =>
                  navigate(`/payment-against-sale-return/edit/${id}`)
                }
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
                label={isEditMode ? "Update Refund" : "Create Refund"}
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
        transactionData={selectedVoucherForPrint}
      />
    </ContainerWrapper>
  );
};

export default PaymentAgainstSaleReturn;