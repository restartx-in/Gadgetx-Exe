import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useCallback,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

// Hooks & Context
import { useSaleReturns } from "@/hooks/api/saleReturns/useSaleReturns";
import { useVoucherById } from "@/hooks/api/voucher/useVoucherById";
import { useCreateVoucher } from "@/hooks/api/voucher/useCreateVoucher";
import { useUpdateVoucher } from "@/hooks/api/voucher/useUpdateVoucher";
import { useDeleteVoucher } from "@/hooks/api/voucher/useDeleteVoucher";
import { useToast } from "@/context/ToastContext";

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
import CustomerAutocomplete from "@/apps/user/components/CustomerAutocomplete";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import Loader from "@/components/Loader";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal/component";
import ViewReportButton from "@/components/ViewButtonForReceiptAndPayment";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  TableCaption,
} from "@/components/Table";
import AmountSymbol from "@/components/AmountSymbol";
import TextBadge from "@/apps/user/components/TextBadge";

import "./style.scss";

// --- Reducer for Centralized State Management ---
const initialState = {
  form: {
    voucher_no: "",
    date: new Date().toISOString(),
    party_id: "",
    from_ledger_id: "",
    to_ledger_id: "",
    cost_center_id: "",
    done_by_id: "",
    description: "",
  },
  returnInvoices: [],
  referencedSaleReturnIds: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "INITIALIZE_FORM_FROM_VOUCHER": {
      const voucherData = action.payload;
      const partyIdForFiltering = voucherData.to_ledger_id;
      const ids = (voucherData.transactions || [])
        .filter((t) => t.invoice_type === "SALERETURN")
        .map((t) => parseInt(t.invoice_id));
      return {
        ...state,
        form: {
          voucher_no: voucherData.voucher_no,
          date: voucherData.date,
          party_id: partyIdForFiltering,
          from_ledger_id: voucherData.from_ledger_id,
          to_ledger_id: voucherData.to_ledger_id,
          cost_center_id: voucherData.cost_center_id || "",
          done_by_id: voucherData.done_by_id || "",
          description: voucherData.description || "",
        },
        referencedSaleReturnIds: ids,
      };
    }
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
          refundedAmountBeforePayment
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
            0
        );
      return { ...state, returnInvoices: mapped };
    }
    case "SET_PARTY": {
      const selectedParty = action.payload;
      return {
        ...state,
        form: {
          ...state.form,
          party_id: selectedParty?.party_id || "",
          to_ledger_id: selectedParty?.ledger_id || "",
        },
        returnInvoices: selectedParty ? state.returnInvoices : [],
        referencedSaleReturnIds: selectedParty
          ? state.referencedSaleReturnIds
          : [],
      };
    }
    case "UPDATE_FORM_FIELD": {
      const { name, value } = action.payload;
      return { ...state, form: { ...state.form, [name]: value } };
    }
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
            newPayingAmount = amount ? maxPayable : 0; // here 'amount' is the isChecked boolean
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
  const showToast = useToast();

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = !isViewMode && !isEditMode;

  const [state, dispatch] = useReducer(reducer, initialState);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const headerCheckboxRef = useRef(null);

  // --- Data Fetching ---
  const { data: voucherData, isLoading: isFetchingVoucher } = useVoucherById(
    id,
    { enabled: !!id }
  );
  const { mutateAsync: createVoucher, isPending: isCreating } =
    useCreateVoucher();
  const { mutateAsync: updateVoucher, isPending: isUpdating } =
    useUpdateVoucher();
  const { mutateAsync: deleteVoucher, isPending: isDeleting } =
    useDeleteVoucher();

  const { data: voucherSaleReturns, isLoading: isFetchingVoucherSaleReturns } =
    useSaleReturns(
      { ids: state.referencedSaleReturnIds.join(","), payment_due_only: false },
      {
        enabled:
          (isEditMode || isViewMode) &&
          state.referencedSaleReturnIds.length > 0,
      }
    );

  const { data: partyReturns, isLoading: isReturnsLoading } = useSaleReturns(
    { party_id: state.form.party_id, payment_due_only: true },
    { enabled: !!state.form.party_id && isCreateMode }
  );

  // --- Side Effects to Sync API Data with Reducer State ---
  useEffect(() => {
    if (voucherData && (isEditMode || isViewMode)) {
      dispatch({ type: "INITIALIZE_FORM_FROM_VOUCHER", payload: voucherData });
    }
  }, [voucherData, isEditMode, isViewMode]);

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

  // --- Memoized Callbacks for Event Handlers ---
  const handleFormChange = useCallback(
    (e) => dispatch({ type: "UPDATE_FORM_FIELD", payload: e.target }),
    []
  );
  const handleDateChange = useCallback(
    (d) =>
      dispatch({
        type: "UPDATE_FORM_FIELD",
        payload: { name: "date", value: d.toISOString() },
      }),
    []
  );
  const handlePartyChange = useCallback(
    (party) => dispatch({ type: "SET_PARTY", payload: party }),
    []
  );
  const handleSelectAll = useCallback(
    (isChecked) => dispatch({ type: "TOGGLE_SELECT_ALL", payload: isChecked }),
    []
  );
  const handleCheckboxChange = useCallback(
    (returnId, isChecked) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { returnId, amount: isChecked, isCheckboxChange: true },
      }),
    []
  );
  const handlePaymentChange = useCallback(
    (returnId, amount) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { returnId, amount, isCheckboxChange: false },
      }),
    []
  );

  const handleSubmit = useCallback(async () => {
    const transactions = state.returnInvoices
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
      date: state.form.date,
      description: state.form.description,
      voucher_no: state.form.voucher_no,
      voucher_type: 0,
      cost_center_id: state.form.cost_center_id || null,
      done_by_id: state.form.done_by_id || null,
      from_ledger: { ledger_id: state.form.from_ledger_id, amount: total },
      to_ledger: { ledger_id: state.form.to_ledger_id, amount: total },
      transactions,
    };

    try {
      const action = isEditMode
        ? updateVoucher({ id, voucherData: payload })
        : createVoucher(payload);
      await action;
      showToast({
        crudItem: CRUDITEM.VOUCHER,
        crudType: isEditMode
          ? CRUDTYPE.UPDATE_SUCCESS
          : CRUDTYPE.CREATE_SUCCESS,
      });
      navigate("/payment-report");
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Action failed",
        status: TOASTSTATUS.ERROR,
      });
    }
  }, [
    state,
    isEditMode,
    id,
    navigate,
    showToast,
    createVoucher,
    updateVoucher,
  ]);

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

  // --- Memoized Derived Data ---
  const totalNowPaying = useMemo(
    () =>
      state.returnInvoices.reduce(
        (sum, ret) => sum + (parseFloat(ret.now_paying_amount) || 0),
        0
      ),
    [state.returnInvoices]
  );

  const headerCheckboxState = useMemo(() => {
    if (isViewMode)
      return { checked: false, indeterminate: false, disabled: true };
    const payableInvoices = state.returnInvoices.filter(
      (inv) =>
        parseFloat(inv.total_refund_amount) -
          parseFloat(inv.refunded_amount || 0) >
        0
    );
    if (payableInvoices.length === 0)
      return { checked: false, indeterminate: false, disabled: true };
    const selectedPayableInvoices = payableInvoices.filter(
      (inv) => inv.is_selected
    );
    const allSelected =
      selectedPayableInvoices.length === payableInvoices.length;
    return {
      checked: allSelected,
      indeterminate: selectedPayableInvoices.length > 0 && !allSelected,
      disabled: false,
    };
  }, [state.returnInvoices, isViewMode]);

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
                    ? `${mode.toUpperCase()} Refund`
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
              <VStack>
                {isCreateMode ? (
                  <CustomerAutocomplete
                    label="To Ledger (Party)"
                    value={state.form.party_id}
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
                <LedgerAutoCompleteWithAddOptionWithBalance
                  label="From Ledger (Bank/Cash)"
                  name="from_ledger_id"
                  value={state.form.from_ledger_id}
                  onChange={handleFormChange}
                  required
                  disabled={isViewMode}
                />
              </VStack>
              <VStack>
                <DateField
                  label="Date"
                  value={new Date(state.form.date)}
                  onChange={handleDateChange}
                  disabled={isViewMode}
                />
                <InputField
                  label="Payment No"
                  name="voucher_no"
                  value={state.form.voucher_no}
                  onChange={handleFormChange}
                  required
                  disabled={isViewMode}
                />
              </VStack>
              <VStack>
                <CostCenterAutoCompleteWithAddOption
                  value={state.form.cost_center_id}
                  onChange={handleFormChange}
                  name="cost_center_id"
                  disabled={isViewMode}
                />
                <DoneByAutoCompleteWithAddOption
                  value={state.form.done_by_id}
                  onChange={handleFormChange}
                  name="done_by_id"
                  disabled={isViewMode}
                />
              </VStack>
              <TextArea
                label="Description"
                name="description"
                value={state.form.description}
                onChange={handleFormChange}
                multiline
                rows={3}
                disabled={isViewMode}
              />
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
                    {!state.form.party_id && !id ? (
                      <TableCaption
                        item="Returns"
                        noOfCol={8}
                        message="Select a party to view pending returns."
                      />
                    ) : state.returnInvoices.length > 0 ? (
                      state.returnInvoices.map((ret) => {
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
            <button
              className="btn-delete"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <FaTrash /> Delete
            </button>
          )}
          {!isViewMode && (
            <SubmitButton
              label={isEditMode ? "Update Refund" : "Create Refund"}
              onClick={handleSubmit}
              isLoading={isCreating || isUpdating}
            />
          )}
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        transactionName={state.form.voucher_no}
      />
    </ContainerWrapper>
  );
};

export default PaymentAgainstSaleReturn;
