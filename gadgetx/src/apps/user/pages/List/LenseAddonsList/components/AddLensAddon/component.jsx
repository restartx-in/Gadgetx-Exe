import React, { useEffect } from "react";
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

import { useCreateLensAddon } from "@/apps/user/hooks/api/lensAddon/useCreateLensAddon";
import { useUpdateLensAddon } from "@/apps/user/hooks/api/lensAddon/useUpdateLensAddon";
import { useDeleteLensAddon } from "@/apps/user/hooks/api/lensAddon/useDeleteLensAddon";

const addonSchema = z.object({
  name: z.string().min(1, "Addon name is required"),
  price: z.coerce.number().min(0, "Price is required"),
  stock: z.coerce.number().min(0, "Stock must be 0 or more").optional().default(0),
});

const AddLensAddon = ({ isOpen, onClose, mode, selectedAddon, onSuccess }) => {
  const showToast = useToast();
  const disabled = mode === "view";

  const { mutateAsync: createAddon, isPending: creating } =
    useCreateLensAddon();
  const { mutateAsync: updateAddon, isPending: updating } =
    useUpdateLensAddon();
  const { mutateAsync: deleteAddon, isPending: deleting } =
    useDeleteLensAddon();

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(addonSchema),
    defaultValues: { name: "", price: "", stock: 0 },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode !== "add" && selectedAddon) {
        reset({
          ...selectedAddon,
          stock: selectedAddon.stock || 0
        });
      } else {
        reset({ name: "", price: "", stock: 0 });
      }
    }
  }, [isOpen, mode, selectedAddon, reset]);

  const onFormSubmit = async (data) => {
    try {
      if (mode === "edit") {
        await updateAddon({ id: selectedAddon.id, data });
        showToast({
          crudItem: CRUDITEM.LENS_ADDON, // Ensure this exists in your constants
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createAddon(data);
        showToast({
          crudItem: CRUDITEM.LENS_ADDON,
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
        <Title report="Lens Addon" mode={mode} />
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
                  label="Addon Name"
                  disabled={disabled}
                  required
                />
              )}
            />
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  type="number"
                  label="Price"
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
              transaction="Lens Addon"
              onDelete={async () => {
                await deleteAddon(selectedAddon.id);
                showToast({
                  crudItem: CRUDITEM.LENS_ADDON,
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

export default AddLensAddon;
