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
import { usePurchases } from "@/hooks/api/purchase/usePurchases";
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
import SupplierAutocomplete from "@/apps/user/components/SupplierAutocomplete";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
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
  purchaseInvoices: [],
  referencedPurchaseIds: [], // Used to trigger API call in edit/view mode
};

const reducer = (state, action) => {
  switch (action.type) {
    case "INITIALIZE_FORM_FROM_VOUCHER": {
      const voucherData = action.payload;
      const partyIdForFiltering = voucherData.to_ledger_id;
      const ids = (voucherData.transactions || [])
        .filter((t) => t.invoice_type === "PURCHASE")
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
        referencedPurchaseIds: ids,
      };
    }
    case "MERGE_VOUCHER_PURCHASES": {
      const voucherPurchases = action.payload.voucherPurchases;
      const transactions = action.payload.voucherData.transactions || [];
      const txMap = transactions.reduce((map, t) => {
        map[parseInt(t.invoice_id)] = parseFloat(t.received_amount || 0);
        return map;
      }, {});

      const mappedInvoices = voucherPurchases.map((inv) => {
        const now_paying = txMap[inv.id] || 0;
        const totalAmount = parseFloat(inv.total_amount || 0);
        const totalPaidBeforePayment =
          parseFloat(inv.paid_amount || 0) - now_paying;
        const effectivePaidAmount = Math.max(0, totalPaidBeforePayment);
        const maxPayable = totalAmount - effectivePaidAmount;
        const balanceAfterNowPaying = maxPayable - now_paying;
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
          date: inv.date,
          status: status.toLowerCase(),
        };
      });
      return { ...state, purchaseInvoices: mappedInvoices };
    }
    case "LOAD_SUPPLIER_PURCHASES": {
      const supplierPurchases = action.payload;
      const mappedInvoices = supplierPurchases.map((inv) => {
        const maxPayable =
          parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
        return {
          ...inv,
          now_paying_amount: 0,
          is_selected: false,
          balance: maxPayable,
          date: inv.date,
          status: inv.status.toLowerCase(),
        };
      });
      return { ...state, purchaseInvoices: mappedInvoices };
    }
    case "SET_SUPPLIER": {
      const selectedSupplier = action.payload;
      return {
        ...state,
        form: {
          ...state.form,
          party_id: selectedSupplier?.supplier_id || "",
          to_ledger_id: selectedSupplier?.ledger_id || "",
        },
        purchaseInvoices: selectedSupplier ? state.purchaseInvoices : [], // Clear invoices if supplier is cleared
      };
    }
    case "UPDATE_FORM_FIELD": {
      const { name, value } = action.payload;
      return { ...state, form: { ...state.form, [name]: value } };
    }
    case "TOGGLE_SELECT_ALL": {
      const isChecked = action.payload;
      const newInvoices = state.purchaseInvoices.map((inv) => {
        const maxPayable =
          parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
        if (maxPayable <= 0) return inv;
        const newPayingAmount = isChecked ? maxPayable : 0;
        return {
          ...inv,
          is_selected: isChecked,
          now_paying_amount: newPayingAmount,
          balance: maxPayable - newPayingAmount,
        };
      });
      return { ...state, purchaseInvoices: newInvoices };
    }
    case "UPDATE_INVOICE_PAYMENT": {
      const { purchaseId, amount, isCheckboxChange } = action.payload;
      const newInvoices = state.purchaseInvoices.map((inv) => {
        if (inv.id === purchaseId) {
          const maxPayable =
            parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
          let newPayingAmount = 0;
          if (isCheckboxChange) {
            newPayingAmount = amount ? maxPayable : 0; // 'amount' here is the isChecked boolean
          } else {
            const payingAmount = parseFloat(amount) || 0;
            newPayingAmount = Math.min(Math.max(0, payingAmount), maxPayable);
          }
          const newBalance = maxPayable - newPayingAmount;
          return {
            ...inv,
            now_paying_amount: newPayingAmount,
            balance: newBalance,
            is_selected: newBalance <= 0.01,
          };
        }
        return inv;
      });
      return { ...state, purchaseInvoices: newInvoices };
    }
    default:
      return state;
  }
};

const PaymentAgainstPurchase = () => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

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

  const { data: voucherPurchases, isLoading: isFetchingVoucherPurchases } =
    usePurchases(
      { ids: state.referencedPurchaseIds.join(","), status: "" },
      {
        enabled:
          (isEditMode || isViewMode) && state.referencedPurchaseIds.length > 0,
      }
    );

  const { data: supplierPurchases, isLoading: isPurchasesLoading } =
    usePurchases(
      { party_id: state.form.party_id, status: "unpaid,partial" },
      { enabled: !!state.form.party_id && !isEditMode && !isViewMode }
    );

  // --- Side Effects to Sync API Data with Reducer State ---
  useEffect(() => {
    if (voucherData && (isEditMode || isViewMode)) {
      dispatch({ type: "INITIALIZE_FORM_FROM_VOUCHER", payload: voucherData });
    }
  }, [voucherData, isEditMode, isViewMode]);

  useEffect(() => {
    if ((isEditMode || isViewMode) && voucherPurchases && voucherData) {
      dispatch({
        type: "MERGE_VOUCHER_PURCHASES",
        payload: { voucherPurchases, voucherData },
      });
    }
  }, [voucherPurchases, voucherData, isEditMode, isViewMode]);

  useEffect(() => {
    if (supplierPurchases && !isEditMode && !isViewMode) {
      dispatch({ type: "LOAD_SUPPLIER_PURCHASES", payload: supplierPurchases });
    }
  }, [supplierPurchases, isEditMode, isViewMode]);

  // --- Memoized Callbacks for Event Handlers ---
  const handleFormChange = useCallback(
    (e) =>
      dispatch({
        type: "UPDATE_FORM_FIELD",
        payload: { name: e.target.name, value: e.target.value },
      }),
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
  const handleSupplierChange = useCallback(
    (supplier) => dispatch({ type: "SET_SUPPLIER", payload: supplier }),
    []
  );
  const handleSelectAll = useCallback(
    (isChecked) => dispatch({ type: "TOGGLE_SELECT_ALL", payload: isChecked }),
    []
  );
  const handleCheckboxChange = useCallback(
    (purchaseId, isChecked) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { purchaseId, amount: isChecked, isCheckboxChange: true },
      }),
    []
  );
  const handlePaymentChange = useCallback(
    (purchaseId, amount) =>
      dispatch({
        type: "UPDATE_INVOICE_PAYMENT",
        payload: { purchaseId, amount, isCheckboxChange: false },
      }),
    []
  );

  const handleSubmit = useCallback(async () => {
    const transactions = state.purchaseInvoices
      .filter((inv) => inv.now_paying_amount > 0)
      .map((inv) => ({
        invoice_id: String(inv.id),
        invoice_type: "PURCHASE",
        received_amount: inv.now_paying_amount,
      }));

    if (transactions.length === 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select at least one invoice to pay.",
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

  // --- Memoized Derived State ---
  const totalNowPaying = useMemo(
    () =>
      state.purchaseInvoices.reduce(
        (sum, inv) => sum + inv.now_paying_amount,
        0
      ),
    [state.purchaseInvoices]
  );

  const headerCheckboxState = useMemo(() => {
    const payableInvoices = state.purchaseInvoices.filter(
      (inv) =>
        parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0) > 0
    );
    const selectedPayableInvoices = payableInvoices.filter(
      (inv) => inv.is_selected
    );
    if (payableInvoices.length === 0)
      return { checked: false, indeterminate: false, disabled: true };
    const allSelected =
      selectedPayableInvoices.length === payableInvoices.length;
    return {
      checked: allSelected,
      indeterminate: selectedPayableInvoices.length > 0 && !allSelected,
      disabled: isViewMode,
    };
  }, [state.purchaseInvoices, isViewMode]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        headerCheckboxState.indeterminate;
    }
  }, [headerCheckboxState.indeterminate]);

  const isLoading =
    isFetchingVoucher || isPurchasesLoading || isFetchingVoucherPurchases;

  if (isLoading && state.purchaseInvoices.length === 0) return <Loader />;

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
                    ? `${mode.toUpperCase()} Payment`
                    : "Payment Against Purchase"
                }
              />
              <ViewReportButton
                path="/payment-report?invoiceTypes=PURCHASE"
                buttonText="View Purchase Payments"
              />
            </HStack>
          </HStack>
        </div>
        <ScrollContainer>
          <div className="receipt-against-sale__content">
            <div className="receipt-against-sale__form-panel">
              <VStack>
                {!isViewMode && !isEditMode ? (
                  <SupplierAutocomplete
                    label="To Ledger (Supplier)"
                    value={state.form.party_id}
                    onChange={handleSupplierChange}
                    required
                  />
                ) : (
                  <InputField
                    label="To Ledger (Supplier)"
                    value={voucherData?.to_ledger_name}
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
                      <Th>Paid Earlier</Th>
                      <Th>Paying Now</Th>
                      <Th>Balance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {!state.form.party_id && !id ? (
                      <TableCaption
                        item="Invoices"
                        noOfCol={8}
                        message="Select a supplier to view pending invoices."
                      />
                    ) : state.purchaseInvoices.length > 0 ? (
                      state.purchaseInvoices.map((inv) => {
                        const maxPayable =
                          parseFloat(inv.total_amount) -
                          parseFloat(inv.paid_amount || 0);
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
                        item="Invoices"
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
            <button
              className="btn-delete"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <FaTrash /> Delete
            </button>
          )}
          {!isViewMode && (
            <SubmitButton
              label={isEditMode ? "Update Payment" : "Create Payment"}
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

export default PaymentAgainstPurchase;
