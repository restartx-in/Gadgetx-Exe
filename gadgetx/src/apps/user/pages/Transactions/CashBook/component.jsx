import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import AccountAutoCompleteWithAddOption from "@/apps/user/components/AccountAutoCompleteWithAddOption";
import AccountAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/AccountAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import useCreateCashBook from "@/apps/user/hooks/api/cashBook/useCreateCashBook";
import useUpdateCashBook from "@/apps/user/hooks/api/cashBook/useUpdateCashBook";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import Title from "@/components/Title";
import { Report } from "@/constants/object/report";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";

const transactionTypeOptions = [
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "transfer", label: "Transfer" },
];

// 1. Define Zod Schema
const cashBookSchema = z
  .object({
    transaction_type: z.string().min(1, "Please choose a transaction type."),
    amount: z.coerce.number().min(0.01, "Please enter a valid amount."),
    account_id: z.union([z.string(), z.number()]).refine((val) => val !== "" && val !== null, "Please select an account."),
    to_account_id: z.any().optional(),
    description: z.string().optional(),
    done_by_id: z.any().optional().nullable(),
    cost_center_id: z.any().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.transaction_type === "transfer") {
      if (!data.to_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select the account to transfer to.",
          path: ["to_account_id"],
        });
      }
      if (
        data.account_id &&
        data.to_account_id &&
        data.account_id === data.to_account_id
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "From and To accounts cannot be the same.",
          path: ["to_account_id"],
        });
      }
    }
  });

const CashBook = ({ isOpen, onClose, mode, selectedEntry, onSuccess }) => {
  const showToast = useToast();
  const disabled = mode === "view";

  const accountSelectRef = useRef(null);
  const toAccountSelectRef = useRef(null);
  const transactionTypeRef = useRef(null);
  const amountRef = useRef(null);

  const defaultValues = {
    account_id: "",
    to_account_id: "",
    transaction_type: "",
    description: "",
    amount: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [fromAccountBalance, setFromAccountBalance] = useState(null);

  const { mutateAsync: createTransaction, isLoading: creating } =
    useCreateCashBook();
  const { mutateAsync: updateTransaction, isLoading: updating } =
    useUpdateCashBook();

  // 2. Setup React Hook Form
  const { control, handleSubmit, reset, watch, setValue, getValues } = useForm({
    resolver: zodResolver(cashBookSchema),
    defaultValues,
  });

  const watchedFormData = watch();
  const watchedTransactionType = watch("transaction_type");
  const watchedAmount = watch("amount");

  const clearLocalStorage = () => {
    localStorage.removeItem("add_cashbook_form");
  };

  // Load data effect
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        let amount = "";
        if (selectedEntry.debit > 0) amount = selectedEntry.debit;
        else if (selectedEntry.credit > 0) amount = selectedEntry.credit;
        
        reset({
          ...defaultValues,
          ...selectedEntry,
          amount: amount,
          account_id:
            selectedEntry.account_id || selectedEntry.from_account_id || "",
          to_account_id: selectedEntry.to_account_id || "",
        });

      } else { // Add mode
        if (selectedEntry && Object.keys(selectedEntry).length > 0) {
          const preFill = { ...defaultValues, ...selectedEntry };
          if (!selectedEntry.amount) preFill.amount = "";
          reset(preFill);
          clearLocalStorage();
        } else {
          const savedForm = localStorage.getItem("add_cashbook_form");
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
      }

      if (mode !== "view") {
        setTimeout(() => transactionTypeRef.current?.focus(), 100);
      }
    } else {
      setFromAccountBalance(null);
    }
  }, [mode, selectedEntry, isOpen, reset]);

  // Save draft effect
  useEffect(() => {
    if (
      isOpen &&
      mode === "add" &&
      (!selectedEntry || Object.keys(selectedEntry).length === 0)
    ) {
      localStorage.setItem("add_cashbook_form", JSON.stringify(watchedFormData));
    }
  }, [watchedFormData, isOpen, mode, selectedEntry]);

  const onFormError = (errors) => {
    const firstError = Object.values(errors)[0];
    if (firstError) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: firstError.message,
        status: TOASTSTATUS.ERROR,
      });
      // Focus logic
      if (errors.transaction_type) transactionTypeRef.current?.focus();
      if (errors.amount) amountRef.current?.focus();
      if (errors.account_id) accountSelectRef.current?.focus();
      if (errors.to_account_id) toAccountSelectRef.current?.focus();
    }
  };

  const onSubmit = async (data) => {
    // Re-check balance on submit as an extra validation step
    if (
      (data.transaction_type === "transfer" ||
       data.transaction_type === "withdrawal") &&
      fromAccountBalance !== null &&
      Number(data.amount) > fromAccountBalance
    ) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: `Amount cannot exceed account balance of ${fromAccountBalance.toLocaleString()}`,
        status: TOASTSTATUS.ERROR,
      });
      return;
    }
    
    try {
      let finalDescription = data.description;
      if (data.transaction_type === "transfer" && !data.description?.trim()) {
        finalDescription = "Fund Transfer";
      }

      const payload = {
        transaction_type: data.transaction_type,
        amount: Number(data.amount),
        description: finalDescription,
        done_by_id: data.done_by_id || null,
        cost_center_id: data.cost_center_id || null,
      };

      if (data.transaction_type === "transfer") {
        payload.from_account_id = data.account_id;
        payload.to_account_id = data.to_account_id;
      } else {
        payload.account_id = data.account_id;
      }

      const handleSuccess = () => {
        onClose();
        if (onSuccess) onSuccess();
      };

      if (mode === "edit") {
        const updateResponse = await updateTransaction({
          id: selectedEntry.id,
          data: payload,
        });
        const updateResult = updateResponse?.data ?? updateResponse;
        if (updateResult?.status === "failed") {
          throw new Error(updateResult?.message || "Failed to update transaction.");
        }
        showToast({
          crudItem: CRUDITEM.CASHBOOK,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
        handleSuccess();
      } else {
        const createResult = await createTransaction(payload);
        if (createResult?.status === "failed") {
          throw new Error(createResult?.message || "Failed to create transaction.");
        }
        showToast({
          crudItem: CRUDITEM.CASHBOOK,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorage();
        handleSuccess();
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "An unexpected error occurred.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: errorMsg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.CashBook} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <Controller
          name="transaction_type"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Transaction Type"
              ref={transactionTypeRef}
              disabled={disabled || mode === "edit"}
              options={transactionTypeOptions}
              placeholder="Select Transaction Type"
              required
              onChange={(e) => {
                field.onChange(e.target.value);
                // Reset dependent fields
                setValue("amount", "");
                setValue("account_id", "");
                setValue("to_account_id", "");
                setFromAccountBalance(null);
              }}
            />
          )}
        />
        
        {watchedTransactionType === "withdrawal" && (
          <>
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
                    onChange={(e) => {
                      const value = e.target.value;
                      const balance = fromAccountBalance ?? 0;
                      if (fromAccountBalance !== null && Number(value) > balance) {
                        showToast({
                          type: TOASTTYPE.GENARAL,
                          message: `Amount cannot exceed account balance of ${balance.toLocaleString()}`,
                          status: TOASTSTATUS.ERROR,
                        });
                        return;
                      }
                      field.onChange(value);
                    }}
                    />
                )}
            />
            <Controller
                name="account_id"
                control={control}
                render={({ field }) => (
                    <AccountAutoCompleteWithAddOptionWithBalance
                        {...field}
                        ref={accountSelectRef}
                        disabled={disabled || !watchedAmount || Number(watchedAmount) <= 0}
                        required
                        debitAmount={watchedAmount}
                        onChange={(e) => {
                            field.onChange(e.target.value);
                            setFromAccountBalance(e.target.selectedOption?.amount || null);
                        }}
                    />
                )}
            />
          </>
        )}

        {watchedTransactionType === "deposit" && (
          <>
            <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                    <InputFieldWithCalculator {...field} label="Amount" ref={amountRef} disabled={disabled} placeholder="Amount" />
                )}
            />
            <Controller
                name="account_id"
                control={control}
                render={({ field }) => (
                    <AccountAutoCompleteWithAddOption
                        {...field}
                        ref={accountSelectRef}
                        disabled={disabled || !watchedAmount || Number(watchedAmount) <= 0}
                        required
                        onChange={(e) => {
                            field.onChange(e.target.value);
                            setFromAccountBalance(e.target.selectedOption?.amount || null);
                        }}
                    />
                )}
            />
          </>
        )}

        {watchedTransactionType === "transfer" && (
          <>
            <Controller
                name="account_id"
                control={control}
                render={({ field }) => (
                    <AccountAutoCompleteWithAddOptionWithBalance
                        {...field}
                        ref={accountSelectRef}
                        disabled={disabled}
                        required
                        placeholder="Select From Account"
                         onChange={(e) => {
                            field.onChange(e.target.value);
                            setFromAccountBalance(e.target.selectedOption?.amount || null);
                        }}
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
                    disabled={disabled || !getValues("account_id")}
                    placeholder="Amount to Transfer"
                    onChange={(e) => {
                      const value = e.target.value;
                      const balance = fromAccountBalance ?? 0;
                      if (fromAccountBalance !== null && Number(value) > balance) {
                        showToast({
                          type: TOASTTYPE.GENARAL,
                          message: `Amount cannot exceed account balance of ${balance.toLocaleString()}`,
                          status: TOASTSTATUS.ERROR,
                        });
                        return;
                      }
                      field.onChange(value);
                    }}
                    />
                )}
            />
            <Controller
                name="to_account_id"
                control={control}
                render={({ field }) => (
                    <AccountAutoCompleteWithAddOption
                        {...field}
                        ref={toAccountSelectRef}
                        disabled={disabled || !watchedAmount || Number(watchedAmount) <= 0}
                        required
                        placeholder="Select To Account"
                        onChange={(e) => field.onChange(e.target.value)}
                    />
                )}
            />
          </>
        )}

        <Controller
            name="done_by_id"
            control={control}
            render={({ field }) => (
                <DoneByAutoCompleteWithAddOption
                    {...field}
                    placeholder="Done By (Optional)"
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
                    placeholder="Cost Center (Optional)"
                    disabled={disabled}
                    onChange={(e) => field.onChange(e.target.value)}
                />
            )}
        />
        <Controller
            name="description"
            control={control}
            render={({ field }) => (
                <TextArea
                    {...field}
                    label="Description"
                    disabled={disabled}
                />
            )}
        />
      </ModalBody>
      <ModalFooter
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px",
        }}
      >
        <CancelButton onClick={onClose} />
        <SubmitButton
          isLoading={creating || updating}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit(onSubmit, onFormError)}
        />
      </ModalFooter>
    </Modal>
  );
};

export default CashBook;