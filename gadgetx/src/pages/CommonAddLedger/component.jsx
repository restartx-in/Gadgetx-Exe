import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import Title from "@/components/Title";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";

const DRAFT_PREFIX = "ledger_form_draft_";

const ledgerSchema = z.object({
  name: z.string().min(1, "Ledger name is required"),
  balance: z.coerce.number().min(0, "Balance must be 0 or more"),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonAddLedger = ({
  isOpen,
  onClose,
  mode,
  selectedLedger,
  onLedgerCreated,
  // Injected Hooks
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  // Injected Components
  DoneByComponent,
  CostCenterComponent,
  appTag = "common",
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createLedger, isPending: creating } = useCreateHook();
  const { mutateAsync: updateLedger, isPending: updating } = useUpdateHook();
  const { mutateAsync: deleteLedger, isPending: deleting } = useDeleteHook();

  const defaultValues = {
    name: "",
    balance: 0,
    done_by_id: null,
    cost_center_id: null,
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(ledgerSchema),
    defaultValues,
  });

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({ ...defaultValues, ...selectedLedger, balance: selectedLedger?.balance ?? 0 });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (selectedLedger?.name) {
          reset({ ...defaultValues, name: selectedLedger.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedLedger, reset, setFocus, draftKey]);

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      balance: Number(data.balance),
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
    };

    try {
      if (mode === "edit") {
        await updateLedger({ id: selectedLedger.id, data: payload });
        showToast({ crudItem: CRUDITEM.LEDGER, crudType: CRUDTYPE.UPDATE_SUCCESS });
      } else {
        const res = await createLedger(payload);
        isSubmittingSuccess.current = true;
        localStorage.removeItem(draftKey);
        showToast({ crudItem: CRUDITEM.LEDGER, crudType: CRUDTYPE.CREATE_SUCCESS });
        onLedgerCreated?.(res.data || res);
      }
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
    if (!selectedLedger?.id) return;
    try {
      await deleteLedger(selectedLedger.id);
      showToast({ crudItem: CRUDITEM.LEDGER, crudType: CRUDTYPE.DELETE_SUCCESS });
      onClose();
    } catch (error) {
      showToast({ type: TOASTTYPE.GENARAL, message: "Failed to delete.", status: TOASTSTATUS.ERROR });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <Title report={Report.Ledger} mode={mode} />
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}>
        <ModalBody>
          <VStack>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField {...field} label="Ledger Name" disabled={disabled} required />
              )}
            />
            <Controller
              name="balance"
              control={control}
              render={({ field }) => (
                <InputField 
                  {...field} 
                  label={mode === "add" ? "Starting Balance" : "Current Balance"} 
                  disabled={disabled || mode === "edit"} 
                  type="number" 
                  step="0.01" 
                  required 
                />
              )}
            />
            <Controller
              name="done_by_id"
              control={control}
              render={({ field }) => (
                <DoneByComponent {...field} placeholder="Select Done By" disabled={disabled} />
              )}
            />
            <Controller
              name="cost_center_id"
              control={control}
              render={({ field }) => (
                <CostCenterComponent {...field} placeholder="Select Cost Center" disabled={disabled} />
              )}
            />
          </VStack>
        </ModalBody>
      </form>
      <ModalFooter style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && <DeleteTextButton transaction={Transaction.Ledger} onDelete={handleDelete} isLoading={deleting} />}
        <SubmitButton isLoading={creating || updating} disabled={disabled} type={mode} onClick={handleSubmit(onFormSubmit)} />
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddLedger;