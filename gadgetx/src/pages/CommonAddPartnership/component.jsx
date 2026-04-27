import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";

const DRAFT_PREFIX = "partnership_form_draft_";

const partnershipSchema = z.object({
  partner_id: z
    .union([z.string(), z.number()])
    .refine((val) => !!val, "Partner is required"),
  from_account: z
    .union([z.string(), z.number()])
    .refine((val) => !!val, "Source account is required"),
  contribution: z.coerce.number().min(1, "Contribution must be greater than 0"),
  profit_share: z.coerce
    .number()
    .min(0)
    .max(100, "Profit share must be between 0-100"),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonAddPartnership = ({
  isOpen,
  onClose,
  mode,
  selectedPartnership,
  onSuccess,
  // Injected Hooks
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  // Injected Project-Specific Components
  PartnerAutoComplete,
  AccountAutoComplete,
  DoneByComponent,
  CostCenterComponent,
  CalculatorInput,
  appTag = "common",
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;

  // SUCCESS LOCK: Prevents the draft useEffect from saving empty values during reset
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createPartnership, isPending: creating } =
    useCreateHook();
  const { mutateAsync: updatePartnership, isPending: updating } =
    useUpdateHook();
  const { mutateAsync: deletePartnership, isPending: deleting } =
    useDeleteHook();

  const defaultValues = {
    partner_id: "",
    from_account: "",
    contribution: 0,
    profit_share: 0,
    done_by_id: null,
    cost_center_id: null,
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(partnershipSchema),
    defaultValues,
  });

  const watchedFields = watch();

  // 1. Lifecycle: Sync Form State
  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false;
      if (mode === "edit" || mode === "view") {
        reset({ ...defaultValues, ...selectedPartnership });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
      }

      // Auto-focus the partner selection if adding
      if (mode !== "view") {
        setTimeout(() => setFocus("partner_id"), 100);
      }
    } else {
      reset(defaultValues); // Cleanup when modal closes
    }
  }, [isOpen, mode, selectedPartnership, reset, setFocus, draftKey]);

  // 2. Draft Persistence logic
  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      partner_id: Number(data.partner_id),
      from_account: Number(data.from_account),
      contribution: Number(data.contribution),
      profit_share: Number(data.profit_share),
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
    };

    try {
      if (mode === "edit") {
        await updatePartnership({ id: selectedPartnership.id, data: payload });
        showToast({
          crudItem: CRUDITEM.PARTNERSHIP,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        // --- SUCCESS SEQUENCE ---
        const res = await createPartnership(payload);

        isSubmittingSuccess.current = true; // Block draft saving
        localStorage.removeItem(draftKey); // Clear disk

        showToast({
          crudItem: CRUDITEM.PARTNERSHIP,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        if (onSuccess) {
          onSuccess(res.data || res);
        }
      }
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          err.response?.data?.error ||
          "An error occurred while saving partnership.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPartnership?.id) return;
    try {
      await deletePartnership(selectedPartnership.id);
      showToast({
        crudItem: CRUDITEM.PARTNERSHIP,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to delete partnership record.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Partnership} mode={mode} />
      </ModalHeader>
      <form
        onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}
      >
        <ModalBody>
          <VStack>
            <Controller
              name="partner_id"
              control={control}
              render={({ field }) => (
                <PartnerAutoComplete
                  {...field}
                  label="Partner"
                  disabled={disabled || mode === "edit"}
                  required
                />
              )}
            />

            <Controller
              name="contribution"
              control={control}
              render={({ field }) => (
                <CalculatorInput
                  {...field}
                  label="Contribution Amount"
                  disabled={disabled}
                  required
                  type="number"
                />
              )}
            />

            <Controller
              name="from_account"
              control={control}
              render={({ field }) => (
                <AccountAutoComplete
                  {...field}
                  label="Source Account"
                  disabled={disabled}
                  required
                />
              )}
            />

            <Controller
              name="profit_share"
              control={control}
              render={({ field }) => (
                <CalculatorInput
                  {...field}
                  label="Profit Share %"
                  disabled={disabled}
                  type="number"
                />
              )}
            />

            <Controller
              name="done_by_id"
              control={control}
              render={({ field }) => (
                <DoneByComponent {...field} disabled={disabled} />
              )}
            />

            <Controller
              name="cost_center_id"
              control={control}
              render={({ field }) => (
                <CostCenterComponent {...field} disabled={disabled} />
              )}
            />
          </VStack>
        </ModalBody>
      </form>
      <ModalFooter
        style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}
      >
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Partnership}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        <SubmitButton
          isLoading={creating || updating}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit(onFormSubmit)}
        />
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddPartnership;
