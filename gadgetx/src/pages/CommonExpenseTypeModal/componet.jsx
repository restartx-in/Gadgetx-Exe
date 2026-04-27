import { useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import VStack from "@/components/VStack";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";

// 1. Define Zod Schema
const expenseTypeSchema = z.object({
  name: z.string().min(1, "Expense type name is required"),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonExpenseTypeModal = ({
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  DoneByAutoCompleteComponent,
  CostCenterAutoCompleteComponent,
  isOpen,
  onClose,
  mode,
  selectedItem,
  onItemCreated,
}) => {
  const showToast = useToast();
  const localStorageKey = "expense_type_form_draft";

  // Configuration for titles and messages
  const ENTITY_CRUD_KEY = "EXPENSETYPE";
  const ENTITY_TITLE_KEY = Report.ExpenseType;
  const ENTITY_NAME_STRING = CRUDITEM[ENTITY_CRUD_KEY] || "Expense Type";
  const NAME_LABEL = `${ENTITY_NAME_STRING} Name`;

  const { mutateAsync: createItem, isLoading: creating } = useCreateHook();
  const { mutateAsync: updateItem, isLoading: updating } = useUpdateHook();
  const { mutateAsync: deleteItem, isLoading: deleting } = useDeleteHook();

  const disabled = mode === "view";

  const defaultValues = {
    name: "",
    done_by_id: null,
    cost_center_id: null,
  };

  // 2. React Hook Form Setup
  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(expenseTypeSchema),
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
        const savedDraft = localStorage.getItem(localStorageKey);
        // Priority: selectedItem.name (from autocomplete typed value) > Draft > Default
        if (selectedItem?.name) {
          reset({ ...defaultValues, name: selectedItem.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }
      if (mode !== "view") {
        setTimeout(() => setFocus("name"), 100);
      }
    }
  }, [isOpen, mode, selectedItem, reset, setFocus]);

  // 4. Draft Persistence Logic
  useEffect(() => {
    if (mode === "add" && isOpen) {
      localStorage.setItem(localStorageKey, JSON.stringify(watchedFields));
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
        await updateItem(
          { id: selectedItem.id, data: payload },
          { onSuccess: onClose }
        );
        showToast({
          crudItem: CRUDITEM[ENTITY_CRUD_KEY],
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newItem = await createItem(payload);
        showToast({
          crudItem: CRUDITEM[ENTITY_CRUD_KEY],
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        localStorage.removeItem(localStorageKey);
        onClose();
        if (onItemCreated) {
          onItemCreated(newItem);
        }
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
          onClose();
          localStorage.removeItem(localStorageKey);
        },
      });
      showToast({
        crudItem: CRUDITEM[ENTITY_CRUD_KEY],
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      const msg = error.response?.data?.error || `Failed to delete ${ENTITY_NAME_STRING}.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <Title report={ENTITY_TITLE_KEY} mode={mode} />
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
                  disabled={disabled}
                  label={NAME_LABEL}
                  placeholder={NAME_LABEL}
                  required
                />
              )}
            />
            <Controller
              name="done_by_id"
              control={control}
              render={({ field }) => (
                <DoneByAutoCompleteComponent
                  {...field}
                  disabled={disabled}
                  is_edit={mode === "add" || mode === "edit"}
                />
              )}
            />
            <Controller
              name="cost_center_id"
              control={control}
              render={({ field }) => (
                <CostCenterAutoCompleteComponent
                  {...field}
                  disabled={disabled}
                  is_edit={mode === "add" || mode === "edit"}
                />
              )}
            />
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
            transaction={ENTITY_TITLE_KEY}
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

export default CommonExpenseTypeModal;