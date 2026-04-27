import React, { useEffect, useRef } from "react";
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
import { onFormError } from "@/utils/formUtils";

import { useCreateLens } from "@/apps/user/hooks/api/lens/useCreateLens";
import { useUpdateLens } from "@/apps/user/hooks/api/lens/useUpdateLens";
import { useDeleteLens } from "@/apps/user/hooks/api/lens/useDeleteLens";

const lensSchema = z.object({
  name: z.string().min(1, "Lens name is required"),
  index_value: z.coerce.number().min(0, "Index value is required"),
  base_price: z.coerce.number().min(0, "Base price is required"),
  stock: z.coerce.number().min(0, "Stock must be 0 or more").optional().default(0),
});

const AddLenses = ({ isOpen, onClose, mode, selectedLens, onSuccess }) => {
  const showToast = useToast();
  const disabled = mode === "view";

  const { mutateAsync: createLens, isPending: creating } = useCreateLens();
  const { mutateAsync: updateLens, isPending: updating } = useUpdateLens();
  const { mutateAsync: deleteLens, isPending: deleting } = useDeleteLens();

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(lensSchema),
    defaultValues: { name: "", index_value: "", base_price: "", stock: 0 },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode !== "add" && selectedLens) {
        reset({
          ...selectedLens,
          stock: selectedLens.stock || 0
        });
      } else {
        reset({ name: "", index_value: "", base_price: "", stock: 0 });
      }
    }
  }, [isOpen, mode, selectedLens, reset]);

  const onFormSubmit = async (data) => {
    try {
      if (mode === "edit") {
        await updateLens({ id: selectedLens.id, data });
        showToast({
          crudItem: CRUDITEM.LENS,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createLens(data);
        showToast({
          crudItem: CRUDITEM.LENS,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.ERROR,
        message: err.response?.data?.error || "An error occurred.",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report="Lens" mode={mode} />
      </ModalHeader>
      <form
        onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}
      >
        <ModalBody>
          <VStack>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Lens Name"
                  disabled={disabled}
                  required
                />
              )}
            />
            <Controller
              name="index_value"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  step="0.01"
                  label="Index Value"
                  disabled={disabled}
                  required
                />
              )}
            />
            <Controller
              name="base_price"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Base Price"
                  disabled={disabled}
                  required
                />
              )}
            />
            <Controller
              name="stock"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Stock Quantity"
                  disabled={disabled}
                />
              )}
            />
          </VStack>
        </ModalBody>
        <ModalFooter
          style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}
        >
          {mode !== "edit" && <CancelButton onClick={onClose} />}
          {mode === "edit" && (
            <DeleteTextButton
              transaction="Lens"
              onDelete={async () => {
                await deleteLens(selectedLens.id);
                showToast({
                  crudItem: CRUDITEM.LENS,
                  crudType: CRUDTYPE.DELETE_SUCCESS,
                });
                onSuccess?.();
                onClose();
              }}
              isLoading={deleting}
            />
          )}
          {mode !== "view" && (
            <SubmitButton
              isLoading={creating || updating}
              type={mode}
              onClick={handleSubmit(onFormSubmit)}
            />
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddLenses;
