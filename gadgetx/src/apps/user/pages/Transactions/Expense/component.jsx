import { useState, useEffect, useRef } from "react";
import useCreateExpense from "@/hooks/api/expense/useCreateExpense";
import useUpdateExpense from "@/hooks/api/expense/useUpdateExpense";
import useDeleteExpense from "@/hooks/api/expense/useDeleteExpense";
import { useExpenseTypes } from "@/hooks/api/expenseType/useExpenseTypes";
import useAccounts from "@/hooks/api/account/useAccounts";
import DateField from "@/components/DateField";
import HStack from "@/components/HStack";
import TextArea from "@/components/TextArea";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import Title from "@/apps/user/components/Title";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";
import ExpenseTypeAutoCompleteWithAddOption from "@/apps/user/components/ExpenseTypeAutoCompleteWithAddOption";
import AccountAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/AccountAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Report } from "@/constants/object/report";
import { Transaction } from "@/constants/object/transaction";

import "./style.scss";

const DRAFT_STORAGE_KEY = "expense_form_draft";

const Expense = ({ isOpen, onClose, mode, selectedExpense, onSuccess }) => {
  const showToast = useToast();

  const expenseTypeRef = useRef(null);
  const amountRef = useRef(null);
  const amountPaidRef = useRef(null);
  const accountRef = useRef(null);

  const defaultForm = {
    expense_type_id: "",
    amount: "",
    amount_paid: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    account_id: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createExpense, isPending: creating } =
    useCreateExpense();
  const { mutateAsync: updateExpense, isPending: updating } =
    useUpdateExpense();
  const { mutateAsync: deleteExpense, isPending: deleting } =
    useDeleteExpense();
  const { data: expenseTypesData, isLoading: expenseTypesLoading } =
    useExpenseTypes();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({
          expense_type_id: selectedExpense.expense_type_id || "",
          amount: selectedExpense.amount || "",
          amount_paid: selectedExpense.amount_paid || "",
          description: selectedExpense.description || "",
          date: selectedExpense.date
            ? new Date(selectedExpense.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          account_id: selectedExpense.account_id || "",
          done_by_id: selectedExpense.done_by_id || "",
          cost_center_id: selectedExpense.cost_center_id || "",
        });
      } else if (mode === "add") {
        const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
        setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => expenseTypeRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedExpense]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, mode]);

  useEffect(() => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      if (form.amount_paid !== "") {
        setForm((prev) => ({ ...prev, amount_paid: "" }));
      }
    }
  }, [form.amount]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm({ ...defaultForm });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFormDateChange = (newDate) => {
    setForm({
      ...form,
      date: newDate ? newDate.toISOString().split("T")[0] : "",
    });
  };

  const handleDelete = async () => {
    if (!selectedExpense?.id) return;
    try {
      await deleteExpense(selectedExpense.id);
      showToast({
        crudItem: CRUDITEM.EXPENSE,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete expense.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.expense_type_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a category.",
        status: TOASTSTATUS.ERROR,
      });
      expenseTypeRef.current?.focus();
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a valid expense amount.",
        status: TOASTSTATUS.ERROR,
      });
      amountRef.current?.focus();
      return;
    }

    if (parseFloat(form.amount_paid) > parseFloat(form.amount)) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Amount paid cannot be greater than the total amount.",
        status: TOASTSTATUS.ERROR,
      });
      amountPaidRef.current?.focus();
      return;
    }

    if (
      form.amount_paid === null ||
      form.amount_paid === "" ||
      parseFloat(form.amount_paid) < 0
    ) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a valid amount paid.",
        status: TOASTSTATUS.ERROR,
      });
      amountPaidRef.current?.focus();
      return;
    }

    if (!form.account_id && form.amount_paid>0) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select an account.",
        status: TOASTSTATUS.ERROR,
      });
      accountRef.current?.focus();
      return;
    }

    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        amount_paid: parseFloat(form.amount_paid) || 0,
        account_id: Number(form.account_id)|| null,
        expense_type_id: Number(form.expense_type_id),
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
      };

      if (mode === "edit") {
        await updateExpense({ id: selectedExpense.id, data: payload });
        showToast({
          crudItem: CRUDITEM.EXPENSE,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createExpense(payload);
        showToast({
          crudItem: CRUDITEM.EXPENSE,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorageAndResetForm();
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || "An unexpected error occurred.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Expense} mode={mode} />
      </ModalHeader>
      <ModalBody>
        {/* <HStack justifyContent="flex-start"> */}
         <DateField
            disabled={disabled}
            label="Date"
            value={form.date ? new Date(form.date) : null}
            onChange={handleFormDateChange}
          />
          <ExpenseTypeAutoCompleteWithAddOption
            ref={expenseTypeRef}
            name="expense_type_id"
            value={form.expense_type_id}
            onChange={handleChange}
            disabled={disabled || expenseTypesLoading}
            required
          />
         
        {/* </HStack> */}
        <InputFieldWithCalculator
        label="Amount"
          ref={amountRef}
          disabled={disabled}
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
        />
        <InputFieldWithCalculator
          label="Amount Paid"
          ref={amountPaidRef}
          disabled={disabled || !form.amount || parseFloat(form.amount) <= 0}
          name="amount_paid"
          placeholder="Amount Paid"
          value={form.amount_paid}
          onChange={handleChange}
          required
        />
        <AccountAutoCompleteWithAddOptionWithBalance
          ref={accountRef}
          name="account_id"
          value={form.account_id}
          onChange={handleChange}
          placeholder="Paid From Account"
          debitAmount={form.amount_paid}
          disabled={
            disabled ||
            accountsLoading ||
            !form.amount_paid ||
            Number(form.amount_paid) <= 0
          }
          required
        />
        <DoneByAutoCompleteWithAddOption
          placeholder="Select Done By"
          name="done_by_id"
          value={form.done_by_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <CostCenterAutoCompleteWithAddOption
          placeholder="Select Cost Center"
          name="cost_center_id"
          value={form.cost_center_id}
          onChange={handleChange}
          disabled={disabled}
        />
        <TextArea
          label="Description"
          disabled={disabled}
          name="description"
          // placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
      </ModalBody>
      <ModalFooter>
        <HStack justifyContent="flex-end" style={{ width: "100%" }}>
          <div style={{ flex: 1 }}></div>
          {mode === "edit" && (
            <DeleteTextButton
              transaction={Transaction.Expense}
              onDelete={handleDelete}
              isLoading={deleting}
            />
          )}
          {mode === "add" && <CancelButton onClick={onClose} />}
          {mode !== "view" && (
            <SubmitButton
              isLoading={creating || updating}
              disabled={disabled}
              type={mode}
              onClick={handleSubmit}
            />
          )}
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default Expense;