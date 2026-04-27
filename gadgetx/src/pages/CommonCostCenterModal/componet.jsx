import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { onFormError } from "@/utils/formUtils";

const DRAFT_KEY = "cost_center_form_draft";

// 1. Define Zod Schema
const costCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const CommonCostCenterModal = ({
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  isOpen,
  onClose,
  mode,
  selectedItem,
  onItemCreated,
}) => {
  const showToast = useToast();
  const ENTITY_NAME = CRUDITEM.COSTCENTER || "Cost Center";
  const NAME_LABEL = `${ENTITY_NAME}`;
  const disabled = mode === "view";

  const { mutateAsync: createItem, isLoading: creating } = useCreateHook();
  const { mutateAsync: updateItem, isLoading: updating } = useUpdateHook();
  const { mutateAsync: deleteItem, isLoading: deleting } = useDeleteHook();

  const defaultValues = { name: "" };

  // 2. React Hook Form Setup
  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(costCenterSchema),
    defaultValues,
  });

  const watchedFields = watch();

  // 3. Sync Form with Mode/Selection & Draft Logic
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({ name: selectedItem?.name || "" });
      } else {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        // Priority: selectedItem.name (passed from autocomplete typed value) > Draft > Default
        if (selectedItem?.name) {
          reset({ name: selectedItem.name });
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
    try {
      if (mode === "edit") {
        await updateItem(
          { id: selectedItem.id, data: data },
          { onSuccess: onClose },
        );
        showToast({
          crudItem: CRUDITEM.COSTCENTER,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newItem = await createItem(data);
        showToast({
          crudItem: CRUDITEM.COSTCENTER,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        localStorage.removeItem(DRAFT_KEY);
        if (onItemCreated) {
          onItemCreated(newItem);
        }
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
      await deleteItem(selectedItem.id, {
        onSuccess: () => {
          localStorage.removeItem(DRAFT_KEY);
          onClose();
        },
      });
      showToast({
        crudItem: CRUDITEM.COSTCENTER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
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
        <Title report={ENTITY_NAME} mode={mode} />
      </ModalHeader>

      <form onSubmit={handleSubmit(onFormSubmit, handleFormError)}>
        <ModalBody>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                disabled={disabled}
                label={NAME_LABEL}
                placeholder={NAME_LABEL}
                required
              />
            )}
          />
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
            transaction={ENTITY_NAME}
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

export default CommonCostCenterModal;
