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
import Select from "@/components/Select";
import BrandAutoCompleteWithAddOption from "@/apps/user/components/BrandAutoCompleteWithAddOption";
import CategoryAutoCompleteWithAddOption from "@/apps/user/components/CategoryAutoCompleteWithAddOption";
import InputFieldWithCalculator from "@/components/InputFieldWithCalculator";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { onFormError } from "@/utils/formUtils";
import { useIsMobile } from "@/utils/useIsMobile";

import { useCreateFrame } from "@/apps/user/hooks/api/frame/useCreateFrame";
import { useUpdateFrame } from "@/apps/user/hooks/api/frame/useUpdateFrame";
import { useDeleteFrame } from "@/apps/user/hooks/api/frame/useDeleteFrame";

const DRAFT_KEY = "frame_form_draft";

const frameSchema = z.object({
  name: z.string().min(1, "Frame name is required"),
  brand_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
    message: "Brand is required",
  }),
  model_no: z.string().optional().nullable(),
  category_id: z.union([z.string(), z.number()]).optional().nullable(),
  material: z.string().optional().nullable(),
  cost_price: z.coerce.number().min(0).default(0),
  selling_price: z.coerce.number().min(1, "Selling price must be greater than 0"),
  gender: z.enum(["male", "female", "unisex"]),
  frame_type: z.enum(["full rim", "rimless", "half rim"]),
});

// Changed "selectedEntry" to "selectedFrame" to match your FrameList props
const AddFrame = ({ isOpen, onClose, mode, selectedFrame, onSuccess }) => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const disabled = mode === "view";
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createFrame, isPending: creating } = useCreateFrame();
  const { mutateAsync: updateFrame, isPending: updating } = useUpdateFrame();
  const { mutateAsync: deleteFrame, isPending: deleting } = useDeleteFrame();

  const defaultValues = {
    name: "",
    brand_id: "",
    model_no: "",
    category_id: "",
    material: "",
    cost_price: 0,
    selling_price: "",
    gender: "unisex",
    frame_type: "full rim",
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(frameSchema),
    defaultValues,
  });

  const watchedFields = watch();

  // FIX: This useEffect now correctly handles loading selectedFrame data
  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false;
      
      if (mode !== "add" && selectedFrame) {
        // Load the data from the list into the form
        reset({
          ...defaultValues,
          ...selectedFrame,
          // Ensure IDs are strings for the AutoComplete components if needed
          brand_id: selectedFrame.brand_id?.toString() || "",
          category_id: selectedFrame.category_id?.toString() || "",
        });
      } else {
        // Add mode: Load draft or empty form
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
      }

      if (mode !== "view") {
        setTimeout(() => setFocus("name"), 100);
      }
    }
  }, [isOpen, mode, selectedFrame, reset]); // Added selectedFrame to dependencies

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen]);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      brand_id: Number(data.brand_id),
      category_id: data.category_id ? Number(data.category_id) : null,
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
    };

    try {
      if (mode === "edit") {
        await updateFrame({ id: selectedFrame.id, data: payload });
        showToast({ crudItem: CRUDITEM.FRAME, crudType: CRUDTYPE.UPDATE_SUCCESS });
      } else {
        await createFrame(payload);
        isSubmittingSuccess.current = true;
        localStorage.removeItem(DRAFT_KEY);
        showToast({ crudItem: CRUDITEM.FRAME, crudType: CRUDTYPE.CREATE_SUCCESS });
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
        <Title report="Frame" mode={mode} />
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}>
        <ModalBody>
          <VStack>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField {...field} label="Frame Name" disabled={disabled} required />
              )}
            />

            <Controller
              name="brand_id"
              control={control}
              render={({ field }) => (
                <BrandAutoCompleteWithAddOption {...field} disabled={disabled} required />
              )}
            />

            <HStack>
              <Controller
                name="model_no"
                control={control}
                render={({ field }) => (
                  <InputField {...field} label="Model No" disabled={disabled} />
                )}
              />
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <CategoryAutoCompleteWithAddOption {...field} disabled={disabled} />
                )}
              />
            </HStack>

            <Controller
              name="material"
              control={control}
              render={({ field }) => (
                <InputField {...field} label="Material" disabled={disabled} />
              )}
            />

            <HStack isMobile={isMobile}>
              <Controller
                name="cost_price"
                control={control}
                render={({ field }) => (
                  <InputFieldWithCalculator {...field} label="Cost Price" disabled={disabled} />
                )}
              />
              <Controller
                name="selling_price"
                control={control}
                render={({ field }) => (
                  <InputFieldWithCalculator {...field} label="Selling Price" disabled={disabled} required />
                )}
              />
            </HStack>

            <HStack isMobile={isMobile}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Gender"
                    disabled={disabled}
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                      { label: "Unisex", value: "unisex" },
                    ]}
                  />
                )}
              />
              <Controller
                name="frame_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Frame Type"
                    disabled={disabled}
                    options={[
                      { label: "Full Rim", value: "full rim" },
                      { label: "Rimless", value: "rimless" },
                      { label: "Half Rim", value: "half rim" },
                    ]}
                  />
                )}
              />
            </HStack>
          </VStack>
        </ModalBody>
      </form>
      <ModalFooter style={{ width: "100%", display: "flex", justifyContent: "flex-end", gap: "16px" }}>
        {mode !== "edit" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction="Frame"
            onDelete={async () => {
              await deleteFrame(selectedFrame.id);
              showToast({ crudItem: CRUDITEM.FRAME, crudType: CRUDTYPE.DELETE_SUCCESS });
              onSuccess?.();
              onClose();
            }}
            isLoading={deleting}
          />
        )}
        {mode !== "view" && (
          <SubmitButton
            isLoading={creating || updating}
            disabled={disabled}
            type={mode}
            onClick={handleSubmit(onFormSubmit)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default AddFrame;