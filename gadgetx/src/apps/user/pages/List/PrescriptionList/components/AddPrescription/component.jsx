import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { onFormError } from "@/utils/formUtils";

import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import useCreatePrescription from "@/apps/user/hooks/api/prescription/useCreatePrescription";
import useUpdatePrescription from "@/apps/user/hooks/api/prescription/useUpdatePrescription";
import useDeletePrescription from "@/apps/user/hooks/api/prescription/useDeletePrescription";

const prescriptionSchema = z.object({
  customer_id: z.coerce.number().min(1, "Customer is required"),
  doctor_name: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  prescription_date: z.string().min(1, "Date is required"), // Added this

  // Right Eye
  right_sph: z.coerce.number().optional().nullable(),
  right_cyl: z.coerce.number().optional().nullable(),
  right_axis: z.coerce.number().optional().nullable(),
  right_add: z.coerce.number().optional().nullable(),
  right_ipd: z.coerce.number().optional().nullable(),
  // Left Eye
  left_sph: z.coerce.number().optional().nullable(),
  left_cyl: z.coerce.number().optional().nullable(),
  left_axis: z.coerce.number().optional().nullable(),
  left_add: z.coerce.number().optional().nullable(),
  left_ipd: z.coerce.number().optional().nullable(),
});

const AddPrescription = ({
  isOpen,
  onClose,
  mode,
  selectedItem,
  onSuccess,
}) => {
  const showToast = useToast();
  const disabled = mode === "view";

  const { mutateAsync: createPrescription, isPending: creating } =
    useCreatePrescription();
  const { mutateAsync: updatePrescription, isPending: updating } =
    useUpdatePrescription();
  const { mutateAsync: deletePrescription, isPending: deleting } =
    useDeletePrescription();

  const defaultValues = useMemo(
    () => ({
      customer_id: "",
      prescription_date: new Date().toISOString().split("T")[0],
      doctor_name: "",
      remarks: "",
      right_sph: "",
      right_cyl: "",
      right_axis: "",
      right_add: "",
      right_ipd: "",
      left_sph: "",
      left_cyl: "",
      left_axis: "",
      left_add: "",
      left_ipd: "",
    }),
    [],
  );

  const { control, handleSubmit, reset, setFocus } = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({ ...defaultValues, ...selectedItem });
      } else {
        reset(defaultValues);
      }
      if (mode !== "view") setTimeout(() => setFocus("customer_id"), 100);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedItem, reset, setFocus, defaultValues]);

  const handleFormError = (errors) => onFormError(errors, showToast);

  const onFormSubmit = async (data) => {
    try {
      if (mode === "edit") {
        await updatePrescription({
          id: selectedItem.id,
          prescriptionData: data,
        });
        showToast({
          crudItem: CRUDITEM.PRESCRIPTION,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const result = await createPrescription(data);
        showToast({
          crudItem: CRUDITEM.PRESCRIPTION,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        if (onSuccess) onSuccess(result.data);
      }
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: err.response?.data?.error || "An unexpected error occurred.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem?.id) return;
    try {
      await deletePrescription(selectedItem.id);
      showToast({
        crudItem: CRUDITEM.PRESCRIPTION,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || "Failed to delete prescription.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const eyeFields = [
    { name: "sph", label: "SPH" },
    { name: "cyl", label: "CYL" },
    { name: "axis", label: "AXIS" },
    { name: "add", label: "ADD" },
    { name: "ipd", label: "IPD" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="800px">
      <ModalHeader>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>
          {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"}{" "}
          Prescription
        </h2>
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit, handleFormError)}>
        <ModalBody>
          <VStack gap="20px">
            <HStack gap="20px">
              <Controller
                name="customer_id"
                control={control}
                render={({ field }) => (
                  <div style={{ flex: 1 }}>
                    <CustomerAutoCompleteWithAddOption
                      {...field}
                      label="Customer"
                      disabled={disabled}
                      required
                    />
                  </div>
                )}
              />
              <Controller
                name="prescription_date"
                control={control}
                render={({ field }) => (
                  <div style={{ flex: 1 }}>
                    <InputField
                      {...field}
                      label="Prescription Date"
                      type="date" // Uses the browser's native date picker
                      disabled={disabled}
                    />
                  </div>
                )}
              />
            </HStack>
            <Controller
              name="doctor_name"
              control={control}
              render={({ field }) => (
                <div style={{ flex: 1 }}>
                  <InputField
                    {...field}
                    label="Doctor Name"
                    disabled={disabled}
                    placeholder="Doctor Name"
                  />
                </div>
              )}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "40px",
                border: "1px solid #eee",
                padding: "20px",
                borderRadius: "8px",
              }}
            >
              {/* Right Eye */}
              <VStack gap="10px">
                <h3
                  style={{
                    borderBottom: "2px solid var(--primary-color)",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  Right Eye (OD)
                </h3>
                {eyeFields.map((f) => (
                  <Controller
                    key={`right_${f.name}`}
                    name={`right_${f.name}`}
                    control={control}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        label={f.label}
                        type="number"
                        step="0.01"
                        disabled={disabled}
                        placeholder={f.label}
                      />
                    )}
                  />
                ))}
              </VStack>

              {/* Left Eye */}
              <VStack gap="10px">
                <h3
                  style={{
                    borderBottom: "2px solid var(--primary-color)",
                    paddingBottom: "5px",
                    marginBottom: "10px",
                  }}
                >
                  Left Eye (OS)
                </h3>
                {eyeFields.map((f) => (
                  <Controller
                    key={`left_${f.name}`}
                    name={`left_${f.name}`}
                    control={control}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        label={f.label}
                        type="number"
                        step="0.01"
                        disabled={disabled}
                        placeholder={f.label}
                      />
                    )}
                  />
                ))}
              </VStack>
            </div>

            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  label="Remarks"
                  disabled={disabled}
                  placeholder="Remarks"
                />
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
            transaction={Transaction.Prescription}
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
        />)}
      </ModalFooter>
    </Modal>
  );
};

export default AddPrescription;
