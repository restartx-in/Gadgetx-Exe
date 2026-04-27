import React, { useEffect } from "react";
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

const DRAFT_KEY = "mop_form_draft";

// 1. Define Zod Schema
const mopSchema = z.object({
  name: z.string().min(1, "Mode Name is required"),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonModeOfPaymentModal = ({
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  DoneBySelectorComponent,
  CostCenterSelectorComponent,
  isOpen,
  onClose,
  mode,
  selectedItem,
  onItemCreated,
}) => {
  const showToast = useToast();
  const ENTITY_NAME = CRUDITEM.MODEOFPAYMENT || "Mode Of Payment";
  const disabled = mode === "view";

  const { mutateAsync: createItem, isLoading: creating } = useCreateHook();
  const { mutateAsync: updateItem, isLoading: updating } = useUpdateHook();
  const { mutateAsync: deleteItem, isLoading: deleting } = useDeleteHook();

  const defaultValues = {
    name: "",
    done_by_id: null,
    cost_center_id: null,
  };

  // 2. React Hook Form Setup
  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(mopSchema),
    defaultValues,
  });

  const watchedFields = watch();

  // 3. Sync Form with Mode/Selection & Draft Logic
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({
          ...defaultValues,
          ...selectedItem,
        });
      } else {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        // Priority: selectedItem.name (passed from autocomplete typed value) > Draft > Default
        if (selectedItem?.name) {
          reset({ ...defaultValues, name: selectedItem.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }

      if (mode !== "view") {
        setTimeout(() => setFocus("name"), 100);
      }
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedItem, reset, setFocus]);

  // 4. Draft Persistence Logic
  useEffect(() => {
    if (mode === "add" && isOpen) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen]);

  const handleFormError = (errors) => onFormError(errors, showToast);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
    };

    try {
      if (mode === "edit") {
        await updateItem({ id: selectedItem.id, data: payload });
        showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.UPDATE_SUCCESS });
        onClose();
      } else {
        const newItem = await createItem(payload);
        showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.CREATE_SUCCESS });
        localStorage.removeItem(DRAFT_KEY);
        if (onItemCreated) onItemCreated(newItem);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "An unexpected error occurred.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem?.id) return;
    try {
      await deleteItem(selectedItem.id);
      showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.DELETE_SUCCESS });
      localStorage.removeItem(DRAFT_KEY);
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || `Failed to delete ${ENTITY_NAME}.`,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <Title report={Report.ModeOfPayment || ENTITY_NAME} mode={mode} />
      </ModalHeader>

      <form onSubmit={handleSubmit(onFormSubmit, handleFormError)}>
        <ModalBody>
          <VStack>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Mode Name"
                  placeholder="Mode Name (e.g. card, upi, cash)"
                  disabled={disabled}
                  required
                />
              )}
            />

            {DoneBySelectorComponent && (
              <Controller
                name="done_by_id"
                control={control}
                render={({ field }) => (
                  <DoneBySelectorComponent
                    {...field}
                    placeholder="Select Done By"
                    disabled={disabled}
                  />
                )}
              />
            )}

            {CostCenterSelectorComponent && (
              <Controller
                name="cost_center_id"
                control={control}
                render={({ field }) => (
                  <CostCenterSelectorComponent
                    {...field}
                    placeholder="Select Cost Center"
                    disabled={disabled}
                  />
                )}
              />
            )}
          </VStack>
        </ModalBody>
      </form>

      <ModalFooter
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px",
        }}
      >
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.ModeOfPayment || ENTITY_NAME}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        {mode !== "view" && (
          <SubmitButton
            isLoading={creating || updating}
            disabled={disabled}
            type={mode}
            onClick={handleSubmit(onFormSubmit, handleFormError)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default CommonModeOfPaymentModal;
