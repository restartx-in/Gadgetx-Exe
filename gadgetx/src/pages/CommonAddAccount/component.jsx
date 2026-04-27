import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Transaction } from "@/constants/object/transaction";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { useToast } from "@/context/ToastContext";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";

import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import InputField from "@/components/InputField";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";

const DRAFT_STORAGE_KEY_PREFIX = "account_form_draft_";

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["cash", "bank"]),
  description: z.string().optional().nullable(),
  balance: z.coerce.number().optional().default(0),
  outstanding_balance: z.coerce.number().optional().default(0),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
  party_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonAddAccount = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  selectedAccount,
  onDeposit,
  onWithdrawal,
  onShowTransactions,
  onAccountCreated,
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  DoneByComponent,
  CostCenterComponent,
  SupplierComponent,
  CalculatorInputComponent,
  appTag = "common",
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_STORAGE_KEY_PREFIX}${appTag}`;

  const { mutateAsync: createAccount, isPending: creating } = useCreateHook();
  const { mutateAsync: updateAccount, isPending: updating } = useUpdateHook();
  const { mutateAsync: deleteAccount, isPending: deleting } = useDeleteHook();

  const defaultValues = {
    name: "",
    type: "cash",
    description: "",
    balance: "",
    outstanding_balance: 0,
    done_by_id: null,
    cost_center_id: null,
    party_id: null,
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({
          ...defaultValues,
          ...selectedAccount,
          balance: selectedAccount?.balance ?? 0,
          outstanding_balance: selectedAccount?.outstanding_balance ?? 0,
        });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (selectedAccount?.name) {
          reset({ ...defaultValues, name: selectedAccount.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    }
  }, [isOpen, mode, selectedAccount, reset, setFocus, draftKey]);

  useEffect(() => {
    if (mode === "add" && isOpen) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const commonPayload = {
      name: data.name,
      type: data.type,
      description: data.description,
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
      party_id: data.party_id ? Number(data.party_id) : null,
    };

    try {
      if (mode === "edit") {
        await updateAccount({
          id: selectedAccount.id,
          data: {
            ...commonPayload,
            balance: Number(data.balance) || 0,
            outstanding_balance: Number(data.outstanding_balance || 0),
          },
        });
        showToast({
          crudItem: CRUDITEM.ACCOUNT,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const payload = {
          ...commonPayload,
          initial_balance: Number(data.balance) || 0,
        };
        const newAccount = await createAccount(payload);
        showToast({
          crudItem: CRUDITEM.ACCOUNT,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        localStorage.removeItem(draftKey);
        onAccountCreated?.(newAccount.data || newAccount);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: err.response?.data?.error || "An error occurred.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount?.id) return;
    try {
      await deleteAccount(selectedAccount.id);
      showToast({
        crudItem: CRUDITEM.ACCOUNT,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to delete.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Accounts} mode={mode} />
      </ModalHeader>
      <form
        onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}
        noValidate
      >
        <ModalBody>
          {(mode === "edit" || mode === "view") && (
            <div
              className="add_account__quick-actions"
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "14px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => onDeposit?.(selectedAccount)}
                style={{
                  flex: 1,
                  minWidth: "130px",
                  height: "36px",
                  borderRadius: "8px",
                  border: "1px solid #0ea5e9",
                  background: "#e0f2fe",
                  color: "#075985",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => onWithdrawal?.(selectedAccount)}
                style={{
                  flex: 1,
                  minWidth: "130px",
                  height: "36px",
                  borderRadius: "8px",
                  border: "1px solid #f97316",
                  background: "#fff7ed",
                  color: "#9a3412",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Withdrawal
              </button>
              <button
                type="button"
                onClick={() => onShowTransactions?.(selectedAccount)}
                style={{
                  flex: 1,
                  minWidth: "150px",
                  height: "36px",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                View Transactions
              </button>
            </div>
          )}

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Account Name"
                disabled={disabled}
                required
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Account Type"
                options={[
                  { value: "cash", label: "Cash" },
                  { value: "bank", label: "Bank" },
                ]}
                disabled={disabled}
                required
              />
            )}
          />

          <Controller
            name="party_id"
            control={control}
            render={({ field }) => (
              <SupplierComponent
                {...field}
                disabled={disabled}
                placeholder="Select Party (Optional)"
              />
            )}
          />

          <Controller
            name="done_by_id"
            control={control}
            render={({ field }) => (
              <DoneByComponent
                {...field}
                disabled={disabled}
                placeholder="Done By"
              />
            )}
          />

          <Controller
            name="cost_center_id"
            control={control}
            render={({ field }) => (
              <CostCenterComponent
                {...field}
                disabled={disabled}
                placeholder="Cost Center"
              />
            )}
          />

          <Controller
            name="balance"
            control={control}
            render={({ field: { ref, ...field } }) => (
              <CalculatorInputComponent
                {...field}
                inputRef={ref}
                disabled={disabled}
                label={mode === "add" ? "Opening Balance" : "Current Balance"}
                required={mode === "add"}
              />
            )}
          />

          <Controller
            name="outstanding_balance"
            control={control}
            render={({ field: { ref, ...field } }) => (
              <CalculatorInputComponent
                {...field}
                inputRef={ref}
                disabled={disabled}
                label="Outstanding Balance"
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                disabled={disabled}
                label="Description (Optional)"
              />
            )}
          />

          {(mode === "edit" || mode === "view") && (
            <div className="add_account__bottom-actions">
              <button
                type="button"
                className="btn-secondaryy"
                onClick={() => onShowTransactions?.(selectedAccount)}
              >
                Show Transactions
              </button>
            </div>
          )}
        </ModalBody>
      </form>
      <ModalFooter
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px",
          width: "100%",
        }}
      >
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Account}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        {mode !== "view" && (
          <SubmitButton
            type={mode}
            isLoading={creating || updating}
            onClick={handleSubmit(onFormSubmit)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddAccount;
