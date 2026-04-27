import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DateField from "@/components/DateField";
import HStack from "@/components/HStack";
import TextArea from "@/components/TextArea";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import Title from "@/components/Title";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Report } from "@/constants/object/report";
import { Transaction } from "@/constants/object/transaction";

const DRAFT_STORAGE_KEY = "expense_form_draft";

const expenseSchema = z
  .object({
    expense_type_id: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, "Please select a category"),
    amount: z.coerce.number().min(0.01, "Please enter a valid expense amount"),
    amount_paid: z.coerce.number().min(0, "Please enter a valid amount paid"),
    description: z.string().optional(),
    date: z.string(),
    ledger_id: z.any().optional(),
    done_by_id: z.any().optional().nullable(),
    cost_center_id: z.any().optional().nullable(),
  })
  .refine((data) => data.amount_paid <= data.amount, {
    message: "Amount paid cannot be greater than the total amount",
    path: ["amount_paid"],
  })
  .refine(
    (data) => {
      if (data.amount_paid > 0) {
        return data.ledger_id !== null && data.ledger_id !== "";
      }
      return true;
    },
    {
      message: "Please select a ledger",
      path: ["ledger_id"],
    },
  );

const CommonExpense = ({
  isOpen,
  onClose,
  mode,
  selectedExpense,
  onSuccess,
  hooks,
  components,
  config,
}) => {
  const {
    useCreateExpense,
    useUpdateExpense,
    useDeleteExpense,
    useExpenseTypes,
    useLedger,
  } = hooks;

  const {
    InputFieldWithCalculator,
    ExpenseTypeAutoCompleteWithAddOption,
    LedgerAutoCompleteWithAddOptionWithBalance,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
  } = components;

  const { Report, Transaction } = config;
  const showToast = useToast();
  const disabled = mode === "view";

  const expenseTypeRef = useRef(null);
  const amountRef = useRef(null);
  const amountPaidRef = useRef(null);
  const ledgerRef = useRef(null);

  const defaultValues = {
    expense_type_id: "",
    amount: "",
    amount_paid: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    ledger_id: "",
    done_by_id: "",
    cost_center_id: "",
  };

  // 2. Setup React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  const watchedFormData = watch();
  const watchedAmount = watch("amount");
  const watchedAmountPaid = watch("amount_paid");

  const { mutateAsync: createExpense, isPending: creating } =
    useCreateExpense();
  const { mutateAsync: updateExpense, isPending: updating } =
    useUpdateExpense();
  const { mutateAsync: deleteExpense, isPending: deleting } =
    useDeleteExpense();
  const { data: expenseTypesData, isLoading: expenseTypesLoading } =
    useExpenseTypes();
  const { data: ledgers = [], isLoading: ledgersLoading } = useLedger();

  // Load Data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({
          expense_type_id: selectedExpense.expense_type_id || "",
          amount: selectedExpense.amount || "",
          amount_paid: selectedExpense.amount_paid || "",
          description: selectedExpense.description || "",
          date: selectedExpense.date
            ? new Date(selectedExpense.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          ledger_id: selectedExpense.ledger_id || "",
          done_by_id: selectedExpense.done_by_id || "",
          cost_center_id: selectedExpense.cost_center_id || "",
        });
      } else if (mode === "add") {
        const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedForm) {
          try {
            reset(JSON.parse(savedForm));
          } catch (e) {
            reset(defaultValues);
          }
        } else {
          reset(defaultValues);
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => expenseTypeRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedExpense, reset]);

  // Save Draft
  useEffect(() => {
    if (mode === "add" && isOpen) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedFormData));
    }
  }, [watchedFormData, mode, isOpen]);

  // Logic: Reset amount_paid if amount is invalid
  useEffect(() => {
    if (!watchedAmount || parseFloat(watchedAmount) <= 0) {
      if (watchedAmountPaid !== "" && watchedAmountPaid !== 0) {
        setValue("amount_paid", "");
      }
    }
  }, [watchedAmount, watchedAmountPaid, setValue]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset(defaultValues);
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

  const onFormError = (errors) => {
    const firstError = Object.values(errors)[0];
    if (firstError) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: firstError.message || "Please check required fields.",
        status: TOASTSTATUS.ERROR,
      });
      // Focus logic based on error field
      if (errors.expense_type_id) expenseTypeRef.current?.focus();
      if (errors.amount) amountRef.current?.focus();
      if (errors.amount_paid) amountPaidRef.current?.focus();
      if (errors.ledger_id) ledgerRef.current?.focus();
    }
  };

  const onFormSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount) || 0,
        amount_paid: parseFloat(data.amount_paid) || 0,
        ledger_id: Number(data.ledger_id) || null,
        expense_type_id: Number(data.expense_type_id),
        done_by_id: data.done_by_id || null,
        cost_center_id: data.cost_center_id || null,
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
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DateField
              disabled={disabled}
              label="Date"
              value={field.value ? new Date(field.value) : null}
              onChange={(date) =>
                field.onChange(date ? date.toISOString().split("T")[0] : "")
              }
            />
          )}
        />

        <Controller
          name="expense_type_id"
          control={control}
          render={({ field }) => (
            <ExpenseTypeAutoCompleteWithAddOption
              {...field}
              ref={expenseTypeRef}
              disabled={disabled || expenseTypesLoading}
              required
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <InputFieldWithCalculator
              {...field}
              label="Amount"
              ref={amountRef}
              disabled={disabled}
              placeholder="Amount"
              required
            />
          )}
        />

        <Controller
          name="amount_paid"
          control={control}
          render={({ field }) => (
            <InputFieldWithCalculator
              {...field}
              label="Amount Paid"
              ref={amountPaidRef}
              disabled={
                disabled || !watchedAmount || parseFloat(watchedAmount) <= 0
              }
              placeholder="Amount Paid"
              required
            />
          )}
        />

        <Controller
          name="ledger_id"
          control={control}
          render={({ field }) => (
            <LedgerAutoCompleteWithAddOptionWithBalance
              {...field}
              ref={ledgerRef}
              placeholder="Paid From Ledger"
              debitAmount={watchedAmountPaid}
              disabled={
                disabled ||
                ledgersLoading ||
                !watchedAmountPaid ||
                Number(watchedAmountPaid) <= 0
              }
              required
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
              disabled={disabled}
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
              disabled={disabled}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextArea {...field} label="Description" disabled={disabled} />
          )}
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
              onClick={handleSubmit(onFormSubmit, onFormError)}
            />
          )}
        </HStack>
      </ModalFooter>
    </Modal>
  );
};

export default CommonExpense;
