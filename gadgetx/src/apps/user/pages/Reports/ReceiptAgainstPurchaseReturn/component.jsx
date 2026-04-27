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
import { usePurchaseReturns } from "@/apps/user/hooks/api/purchaseReturns/usePurchaseReturns";
import { useVoucherById } from "@/apps/user/hooks/api/voucher/useVoucherById";
import { useCreateVoucher } from "@/apps/user/hooks/api/voucher/useCreateVoucher";
import { useUpdateVoucher } from "@/apps/user/hooks/api/voucher/useUpdateVoucher";
import { useDeleteVoucher } from "@/apps/user/hooks/api/voucher/useDeleteVoucher";
import { useToast } from "@/context/ToastContext";
import { onFormError } from "@/utils/formUtils";

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
import SupplierAutocomplete from "@/apps/user/components/SupplierAutocomplete";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import DeleteConfirmationModal from "@/apps/user/components/DeleteConfirmationModal/component";
import ViewButtonForReceiptAndPayment from "@/apps/user/components/ViewButtonForReceiptAndPayment";
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

// --- Zod Schema ---
const voucherSchema = z.object({
  from_ledger_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "From Ledger (Supplier) is required",
    }),
  to_ledger_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== "" && val !== null && val !== undefined, {
      message: "To Ledger is required",
    }),
  voucher_no: z.string().min(1, "Receipt No is required"),
  date: z.string(),
  party_id: z.any().optional(),
  cost_center_id: z.any().optional().nullable(),
  done_by_id: z.any().optional().nullable(),
  description: z.string().optional(),
});

// --- Reducer ---
const invoiceReducerInitialState = {
  returnInvoices: [],
  referencedReturnIds: [],
};

const invoiceReducer = (state, action) => {
  switch (action.type) {
    case "SET_REFERENCED_IDS":
      return { ...state, referencedReturnIds: action.payload };
    case "MERGE_VOUCHER_RETURNS": {
      const { voucherReturns, voucherData } = action.payload;
      const txMap = (voucherData.transactions || []).reduce((map, t) => {
        map[parseInt(t.invoice_id)] = parseFloat(t.received_amount || 0);
        return map;
      }, {});
      const mapped = voucherReturns.map((ret) => {
        const now_paying = txMap[ret.id] || 0;
        const total_refund_amount = parseFloat(ret.total_refund_amount || 0);
        const refundedAmountBeforeReceipt =
          parseFloat(ret.refunded_amount || 0) - now_paying;
        const effectiveRefundedAmount = Math.max(
          0,
          refundedAmountBeforeReceipt,
        );
        const maxPayable = total_refund_amount - effectiveRefundedAmount;
        const balanceAfterNowPaying = maxPayable - now_paying;
        let status = balanceAfterNowPaying <= 0.01 ? "refunded" : "partial";
        if (effectiveRefundedAmount === 0 && now_paying === 0)
          status = "pending";
        return {
          ...ret,
          id: ret.id,
          invoice_number: ret.invoice_number || `PR-${ret.id}`,
          total_refund_amount,
          refunded_amount: effectiveRefundedAmount,
          now_paying_amount: now_paying,
          balance: balanceAfterNowPaying,
          is_selected: now_paying > 0 || balanceAfterNowPaying <= 0.01,
          date: ret.date,
          status: status.toLowerCase(),
        };
      });
      return { ...state, returnInvoices: mapped };
    }
    case "LOAD_PARTY_RETURNS": {
      const partyReturns = action.payload;
      const relevantReturns = partyReturns.filter(
        (ret) =>
          parseFloat(ret.total_refund_amount) -
            parseFloat(ret.refunded_amount || 0) >
          0,
      );
      const mapped = relevantReturns.map((ret) => ({
        ...ret,
        now_paying_amount: 0,
        is_selected: false,
        balance:
          parseFloat(ret.total_refund_amount) -
          parseFloat(ret.refunded_amount || 0),
        status: (ret.status || "pending").toLowerCase(),
      }));
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
            is_selected: newPayingAmount > 0 || newBalance <= 0.01,
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

const ReceiptAgainstPurchaseReturn = () => {
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
  const supplierRef = useRef(null);

  // Modal states
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedVoucherForReceipt, setSelectedVoucherForReceipt] =
    useState(null);
  const [isAutoPrinting, setIsAutoPrinting] = useState(false);

  // UPDATED: Added shouldFocusError: false to prevent auto-focusing the wrong field
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

  const { data: voucherReturns, isLoading: isFetchingVoucherReturns } =
    usePurchaseReturns(
      {
        ids: invoiceState.referencedReturnIds.join(","),
        payment_due_only: false,
      },
      {
        enabled:
          (isEditMode || isViewMode) &&
          invoiceState.referencedReturnIds.length > 0,
      },
    );

  const { data: partyReturns, isLoading: isReturnsLoading } =
    usePurchaseReturns(
      { party_id: watchedPartyId, payment_due_only: true },
      { enabled: !!watchedPartyId && !isEditMode && !isViewMode },
    );

  const totalNowPaying = useMemo(
    () =>
      invoiceState.returnInvoices.reduce(
        (sum, ret) => sum + (ret.now_paying_amount || 0),
        0,
      ),
    [invoiceState.returnInvoices],
  );

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
        .filter((t) => t.invoice_type === "PURCHASERETURN")
        .map((t) => parseInt(t.invoice_id));
      dispatch({ type: "SET_REFERENCED_IDS", payload: ids });
    }
  }, [voucherData, isEditMode, isViewMode, reset]);

  useEffect(() => {
    if ((isEditMode || isViewMode) && voucherReturns && voucherData) {
      dispatch({
        type: "MERGE_VOUCHER_RETURNS",
        payload: { voucherReturns, voucherData },
      });
    }
  }, [voucherReturns, voucherData, isEditMode, isViewMode]);

  useEffect(() => {
    if (partyReturns && !isEditMode && !isViewMode) {
      dispatch({ type: "LOAD_PARTY_RETURNS", payload: partyReturns });
    }
  }, [partyReturns, isEditMode, isViewMode]);

  const handlePrint = useCallback(() => {
    if (!voucherData || invoiceState.returnInvoices.length === 0) return;

    const formattedData = {
      id: voucherData.id,
      invoice_number: voucherData.voucher_no,
      date: voucherData.date,
      partner: {
        label: `Received from (Supplier)`,
        name: voucherData.from_ledger_name,
      },
      items: invoiceState.returnInvoices
        .filter((ret) => ret.now_paying_amount > 0)
        .map((ret) => ({
          name: `Refund for P.Return #${ret.invoice_number}`,
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
  }, [voucherData, invoiceState.returnInvoices, totalNowPaying]);

  useEffect(() => {
    if (isViewMode && location.state?.print && voucherData) {
      const hasTransactionsToLoad = (voucherData.transactions || []).length > 0;
      const itemsLoaded = invoiceState.returnInvoices.length > 0;

      if (hasTransactionsToLoad && !itemsLoaded) return;

      setIsAutoPrinting(true);
      handlePrint();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    isViewMode,
    location.state,
    voucherData,
    invoiceState.returnInvoices,
    handlePrint,
    navigate,
  ]);

  // UPDATED: Strict order for validation focus to match visual layout
  const handleValidationError = (errors) => {
    onFormError(errors, showToast);

    // 1. Check Supplier (Top Left)
    if (errors.from_ledger_id) {
      supplierRef.current?.focus?.();
      return; 
    }
    // 2. Check To Ledger (Bottom Left - visual flow) or Description
    if (errors.to_ledger_id) {
      setFocus("to_ledger_id");
      return;
    }
    // 3. Check Receipt No (Bottom Middle)
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
          invoice_type: "PURCHASERETURN",
          received_amount: ret.now_paying_amount,
        }));

      if (transactions.length === 0) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Please select at least one return.",
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
        voucher_type: 1,
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
          crudItem: CRUDITEM.VOUCHER || "Receipt",
          crudType: isEditMode
            ? CRUDTYPE.UPDATE_SUCCESS
            : CRUDTYPE.CREATE_SUCCESS,
        });

        const voucherId = isEditMode ? id : response?.id || response?.data?.id;

        if (andPrint && voucherId) {
          navigate(`/receipt-against-purchase-return/view/${voucherId}`, {
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
        crudItem: CRUDITEM.VOUCHER || "Receipt",
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
    const payableReturns = invoiceState.returnInvoices.filter(
      (ret) =>
        parseFloat(ret.total_refund_amount) -
          parseFloat(ret.refunded_amount || 0) >
        0,
    );
    if (payableReturns.length === 0)
      return { checked: false, indeterminate: false, disabled: true };
    const selectedPayableReturns = payableReturns.filter(
      (ret) => ret.is_selected,
    );
    const allSelected = selectedPayableReturns.length === payableReturns.length;
    return {
      checked: allSelected,
      indeterminate: selectedPayableReturns.length > 0 && !allSelected,
      disabled: isViewMode,
    };
  }, [invoiceState.returnInvoices, isViewMode]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        headerCheckboxState.indeterminate;
    }
  }, [headerCheckboxState.indeterminate]);

  const isLoading =
    isFetchingVoucher ||
    (id && isFetchingVoucherReturns) ||
    (isReturnsLoading && !isEditMode && !isViewMode);

  if (
    isFetchingVoucher ||
    (id && isFetchingVoucherReturns && invoiceState.returnInvoices.length === 0)
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
                    : "Receipt Against Purchase Return"
                }
              />
              <ViewButtonForReceiptAndPayment
                path="/receipt-report?invoiceTypes=PURCHASERETURN"
                buttonText="View PR Receipts"
              />
            </HStack>
          </HStack>
        </div>
        <ScrollContainer>
          <div className="receipt-against-sale__content">
            <div className="receipt-against-sale__form-panel">
              <VStack spacing={10}>
                {!isViewMode && !isEditMode ? (
                  <SupplierAutocomplete
                    ref={supplierRef}
                    label="From Ledger (Supplier)"
                    value={watchedPartyId}
                    onChange={(s) => {
                      setValue("party_id", s?.supplier_id || "");
                      setValue("from_ledger_id", s?.ledger_id || "");
                      if (!s) dispatch({ type: "CLEAR_INVOICES" });
                    }}
                    required
                  />
                ) : (
                  <InputField
                    label="From Ledger (Supplier)"
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
                      label="To Ledger (Bank/Cash)"
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
                      label="Receipt No"
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
                {isLoading && <Loader />}
                <Table>
                  <Thead>
                    <Tr>
                      <Th width="20px">
                        <input
                          type="checkbox"
                          ref={headerCheckboxRef}
                          checked={headerCheckboxState.checked}
                          onChange={(e) =>
                            dispatch({
                              type: "TOGGLE_SELECT_ALL",
                              payload: e.target.checked,
                            })
                          }
                          disabled={headerCheckboxState.disabled}
                        />
                      </Th>
                      <Th>Return No</Th>
                      <Th>Invoice Date</Th>
                      <Th>Status</Th>
                      <Th>Refund Value</Th>
                      <Th>Already Recv</Th>
                      <Th>Receiving Now</Th>
                      <Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {!watchedPartyId && !id ? (
                      <TableCaption
                        item="Returns"
                        noOfCol={8}
                        message="Select a supplier to view pending returns."
                      />
                    ) : invoiceState.returnInvoices.length > 0 ? (
                      invoiceState.returnInvoices.map((ret) => {
                        const maxPayable =
                          parseFloat(ret.total_refund_amount) -
                          parseFloat(ret.refunded_amount || 0);
                        const isDisabled = isViewMode || maxPayable <= 0;
                        return (
                          <Tr key={ret.id}>
                            <Td>
                              <input
                                type="checkbox"
                                checked={ret.is_selected || false}
                                onChange={(e) =>
                                  !isDisabled &&
                                  dispatch({
                                    type: "UPDATE_INVOICE_PAYMENT",
                                    payload: {
                                      returnId: ret.id,
                                      amount: e.target.checked,
                                      isCheckboxChange: true,
                                    },
                                  })
                                }
                                disabled={isDisabled}
                              />
                            </Td>
                            <Td>{ret.invoice_number}</Td>
                            <Td>{ret.date?.split("T")[0]}</Td>
                            <Td>
                              <TextBadge
                                variant="paymentStatus"
                                type={ret.status}
                              >
                                {ret.status?.charAt(0).toUpperCase() +
                                  ret.status?.slice(1)}
                              </TextBadge>
                            </Td>
                            <Td>
                              <AmountSymbol>
                                {ret.total_refund_amount}
                              </AmountSymbol>
                            </Td>
                            <Td>
                              <AmountSymbol>{ret.refunded_amount}</AmountSymbol>
                            </Td>
                            <Td>
                              <InputField
                                type="number"
                                className="table-input"
                                value={ret.now_paying_amount || ""}
                                onChange={(e) =>
                                  dispatch({
                                    type: "UPDATE_INVOICE_PAYMENT",
                                    payload: {
                                      returnId: ret.id,
                                      amount: e.target.value,
                                      isCheckboxChange: false,
                                    },
                                  })
                                }
                                disabled={isDisabled}
                              />
                            </Td>
                            <Td>
                              <AmountSymbol>{ret.balance}</AmountSymbol>
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
                  <span>Total Receiving:</span>
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
                  navigate(`/receipt-against-purchase-return/edit/${id}`)
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
        onClose={() => {
          setIsReceiptModalOpen(false);
          if (isAutoPrinting) {
            navigate("/receipt-report");
          }
        }}
        transactionData={selectedVoucherForReceipt}
      />
    </ContainerWrapper>
  );
};

export default ReceiptAgainstPurchaseReturn;