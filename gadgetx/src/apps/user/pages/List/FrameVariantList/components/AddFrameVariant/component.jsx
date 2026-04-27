import React, { useEffect, useRef,useState  } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import FrameAutoCompleteWithAddOption from "@/apps/user/components/FrameAutoCompleteWithAddOption";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import Button from "@/components/Button";
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import demoLogo from "@/assets/user/demo-logo.svg";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { onFormError } from "@/utils/formUtils";

import { useCreateFrameVariant } from "@/apps/user/hooks/api/frameVariant/useCreateFrameVariant";
import { useUpdateFrameVariant } from "@/apps/user/hooks/api/frameVariant/useUpdateFrameVariant";
import { useDeleteFrameVariant } from "@/apps/user/hooks/api/frameVariant/useDeleteFrameVariant";

const DRAFT_KEY = "frame_variant_draft";

const variantSchema = z.object({
  frame_id: z
    .union([z.string(), z.number()])
    .refine((val) => !!val, { message: "Frame selection is required" }),
  sku: z.string().min(1, "SKU is required"),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  stock_qty: z.coerce
    .number()
    .int()
    .min(0, "Stock cannot be negative")
    .default(0),
  barcode: z.string().optional().nullable(),
  image: z.any().optional(),
});

const AddFrameVariant = ({
  isOpen,
  onClose,
  mode,
  selectedVariant,
  onSuccess,
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createVariant, isPending: creating } =
    useCreateFrameVariant();
  const { mutateAsync: updateVariant, isPending: updating } =
    useUpdateFrameVariant();
  const { mutateAsync: deleteVariant, isPending: deleting } =
    useDeleteFrameVariant();

  const defaultValues = {
    frame_id: "",
    sku: "",
    barcode: "",
    color: "",
    size: "",
    stock_qty: 0,
    image: null,
  };

  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(demoLogo);

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues,
  });

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false;
      if (mode !== "add" && selectedVariant) {
        reset({
          ...defaultValues,
          ...selectedVariant,
          frame_id: selectedVariant.frame_id?.toString(),
        });
        const fullImageUrl = buildUploadUrl(API_UPLOADS_BASE, selectedVariant.image);
        if (fullImageUrl) {
          setImagePreview(`${fullImageUrl}?t=${new Date().getTime()}`);
        } else {
          setImagePreview(demoLogo);
        }
      } else {
        const saved = localStorage.getItem(DRAFT_KEY);
        reset(saved ? JSON.parse(saved) : defaultValues);
      }
      if (mode !== "view") setTimeout(() => setFocus("sku"), 100);
    } else {
      setImageFile(null);
      setImagePreview(demoLogo);
    }
  }, [isOpen, mode, selectedVariant, reset]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen]);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      frame_id: Number(data.frame_id),
      stock_qty: Number(data.stock_qty),
    };
    if (imageFile) {
      payload.image = imageFile;
    }
    try {
      if (mode === "edit") {
        await updateVariant({ id: selectedVariant.id, data: payload });
        showToast({
          crudItem: CRUDITEM.FRAME_VARIANT || "Variant",
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createVariant(payload);
        isSubmittingSuccess.current = true;
        localStorage.removeItem(DRAFT_KEY);
        showToast({
          crudItem: CRUDITEM.FRAME_VARIANT || "Variant",
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const errData = err.response?.data;
      const apiError = errData?.error;
      const errorMsg = typeof apiError === "string" 
        ? apiError 
        : apiError?.message || errData?.message || "Error saving variant";

      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.ERROR,
        message: errorMsg,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report="Frame Variant" mode={mode} />
      </ModalHeader>
      <form
        onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}
      >
        <ModalBody>
          <VStack>
            
            <Controller
              name="frame_id"
              control={control}
              render={({ field }) => (
                <FrameAutoCompleteWithAddOption
                  {...field}
                  label="Select Parent Frame"
                  disabled={disabled}
                  required
                />
              )}
            />
            <HStack>
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="SKU"
                  disabled={disabled}
                  required
                />
              )}
            />

            

              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <InputField {...field} label="Color" disabled={disabled} />
                )}
              />
              <Controller
                name="size"
                control={control}
                render={({ field }) => (
                  <InputField {...field} label="Size" disabled={disabled} />
                )}
              />
            <Controller
              name="stock_qty"
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
            </HStack>
            <HStack>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "10px" }}>
              <img
                src={imagePreview}
                alt="Variant Image"
                style={{ width: "100px", height: "100px", objectFit: "contain", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "1px" }}
                onError={(e) => (e.target.src = demoLogo)}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/gif"
                style={{ display: "none" }}
                disabled={disabled}
              />
              {!disabled && (
                <Button
                  onClick={() => fileInputRef.current.click()}
                  type="button"
                >
                  Upload Image
                </Button>
              )}
            </div>
           
            <Controller
              name="barcode"
              control={control}
              render={({ field }) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                  <InputField
                    {...field}
                    label="Barcode"
                    disabled={disabled}
                  />
                  {!disabled && (
                    <Button 
                      type="button" 
                      onClick={() => field.onChange(Math.floor(100000000000 + Math.random() * 900000000000).toString())}
                      style={{ padding: "4px 8px", fontSize: "12px", alignSelf: "flex-end" }}
                    >
                      Generate Barcode
                    </Button>
                  )}
                </div>
              )}
            />
            </HStack>
             
            

          </VStack>
        </ModalBody>
      </form>
      <ModalFooter
        style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}
      >
        {mode !== "edit" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction="Variant"
            onDelete={async () => {
              await deleteVariant(selectedVariant.id);
              showToast({
                crudItem: CRUDITEM.FRAME_VARIANT || "Variant",
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
    </Modal>
  );
};

export default AddFrameVariant;
