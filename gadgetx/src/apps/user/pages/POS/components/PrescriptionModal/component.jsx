import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import { FaPlus, FaListUl } from "react-icons/fa";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { onFormError } from "@/utils/formUtils";

import useCreatePrescription from "@/apps/user/hooks/api/prescription/useCreatePrescription";
import useUpdatePrescription from "@/apps/user/hooks/api/prescription/useUpdatePrescription";
import useDeletePrescription from "@/apps/user/hooks/api/prescription/useDeletePrescription";
import useCreateCustomer from "@/apps/user/hooks/api/customer/useCreateCustomer";

import "./style.scss";

// ─── Zod Schema ────────────────────────────────────────────────────────────────
const prescriptionSchema = z.object({
  // Customer
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional().nullable(),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal(""))
    .nullable(),
  age: z.coerce.number().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  address: z.string().optional().nullable(),

  // Prescription
  prescription_date: z.string().optional().nullable(),
  doctor_name: z.string().optional().nullable(),
  next_visit_date: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  vision_type: z.enum(["distance", "near"]).default("distance"),

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

  // Lens
  lens_type: z.string().optional().nullable(),
  lens_material: z.string().optional().nullable(),
  coating: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

// ─── Reusable compact table cell input ────────────────────────────────────────
const TableInput = ({
  value,
  onChange,
  disabled,
  placeholder = "0.00",
  step = "0.25",
}) => (
  <input
    className="table-input"
    type="number"
    step={step}
    value={value ?? ""}
    onChange={(e) =>
      onChange(e.target.value === "" ? null : Number(e.target.value))
    }
    disabled={disabled}
    placeholder={placeholder}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────
const PrescriptionModal = ({ isOpen, onClose, mode, selectedItem, onSuccess, onAddNew }) => {
  const showToast = useToast();
  const navigate = useNavigate();
  const disabled = mode === "view";
  const isCustomerDisabled = mode === "edit" || (mode === "add" && !!selectedItem?.customer_id);

  const [visionType, setVisionType] = useState("distance");

  const { mutateAsync: createPrescription, isPending: creating } =
    useCreatePrescription();
  const { mutateAsync: updatePrescription, isPending: updating } =
    useUpdatePrescription();
  const { mutateAsync: deletePrescription, isPending: deleting } =
    useDeletePrescription();
  const { mutateAsync: createCustomer, isPending: isCreatingCustomer } =
    useCreateCustomer();

  // Today's date in dd/mm/yyyy format for default
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // yyyy-mm-dd for input[type=date]
  }, []);
  const threedayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0]; // yyyy-mm-dd for input[type=date]
  }, []);

  const defaultValues = useMemo(
    () => ({
      name: "",
      phone: "",
      email: "",
      age: "",
      gender: null,
      address: "",
      prescription_date: todayStr,
      doctor_name: "",
      next_visit_date: threedayStr,
      note: "",
      vision_type: "distance",
      right_sph: 0,
      right_cyl: 0,
      right_axis: 0,
      right_add: 0,
      right_ipd: null,
      left_sph: 0,
      left_cyl: 0,
      left_axis: 0,
      left_add: 0,
      left_ipd: null,
      lens_type: null,
      lens_material: null,
      coating: null,
      remarks: "",
    }),
    [todayStr, threedayStr],
  );

  const { control, handleSubmit, reset, setFocus, watch, setValue } = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues,
  });

  const watchedVisionType = watch("vision_type");

  useEffect(() => {
    setVisionType(watchedVisionType || "distance");
  }, [watchedVisionType]);

  useEffect(() => {
    if (isOpen) {
      reset({ ...defaultValues, ...selectedItem });
      setVisionType(selectedItem?.vision_type || "distance");
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedItem, reset, setFocus, defaultValues]);

  const handleFormError = (errors) => onFormError(errors, showToast);

  const onFormSubmit = async (data) => {
    try {
      let customerId = selectedItem?.customer_id;

      // 1. Create the customer if in "add" mode and we don't have an ID yet
      if (mode === "add" && !customerId) {
        const newCustomer = await createCustomer({
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          age: data.age,
          gender: data.gender,
        });
        customerId = newCustomer.data?.id || newCustomer.id;
      }

      // 2. Prepare payload for the prescription table
      const payload = {
        customer_id: customerId,
        prescription_date: data.prescription_date,
        doctor_name: data.doctor_name,
        right_sph: data.right_sph,
        right_cyl: data.right_cyl,
        right_axis: data.right_axis,
        right_add: data.right_add,
        right_ipd: data.right_ipd,
        left_sph: data.left_sph,
        left_cyl: data.left_cyl,
        left_axis: data.left_axis,
        left_add: data.left_add,
        left_ipd: data.left_ipd,
        remarks: data.note,
      };

      // 3. Submit to the prescription service
      if (mode === "edit") {
        await updatePrescription({
          id: selectedItem.id,
          prescriptionData: payload,
        });
        showToast({
          crudItem: CRUDITEM.PRESCRIPTION,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createPrescription(payload);
        showToast({
          crudItem: CRUDITEM.PRESCRIPTION,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }

      if (onSuccess) onSuccess(customerId);
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

  const eyeRows = [
    { side: "Right", label: "Right (OD)" },
    { side: "Left", label: "Left (OS)" },
  ];

  const eyeCols = ["sph", "cyl", "axis", "add", "ipd"];
  const colLabels = {
    sph: "SPH",
    cyl: "CYL",
    axis: "AXIS",
    add: "ADD",
    ipd: "IPD",
  };

  const modalTitle =
    mode === "add"
      ? "New Prescription"
      : mode === "edit"
        ? "Edit Prescription"
        : "View Prescription";

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="780px" size="mz">
      <ModalHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: "15px",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
            {modalTitle}
          </h2>
          <div className="header-actions">
            <button
              type="button"
              className="action-btn-new"
              onClick={onAddNew}
              title="Add New Prescription for this customer"
            >
              <FaPlus /> New
            </button>
            <button
              type="button"
              className="action-btn-view"
              onClick={() => navigate("/prescription-list")}
              title="View All Prescriptions"
            >
              <FaListUl /> View All
            </button>
          </div>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit(onFormSubmit, handleFormError)}>
        <ModalBody>
          <div className="prescription-modal">
            {/* ── Customer Details ───────────────────────────────── */}
            <div className="section-title">Customer Details</div>
            <div className="customer-details">
              {/* Row 1: Customer Type | Name | Mobile */}
              <div className="row row-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Name"
                      required
                      disabled={isCustomerDisabled}
                      placeholder="Enter customer name"
                    />
                  )}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Mobile Number"
                      disabled={isCustomerDisabled}
                      placeholder="Enter mobile number"
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Email"
                      type="email"
                      disabled={isCustomerDisabled}
                      placeholder="Enter email (optional)"
                    />
                  )}
                />
              </div>

              {/* Row 2: Email | Age | Gender */}
              <div className="row row-3">
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Age"
                      type="number"
                      disabled={isCustomerDisabled}
                      placeholder="Enter age"
                    />
                  )}
                />
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Gender"
                      disabled={isCustomerDisabled}
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      placeholder="Select gender"
                    />
                  )}
                />
              </div>

              {/* Row 3: Address (full width) */}
              <div className="row row-1">
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Address"
                      disabled={isCustomerDisabled}
                      placeholder="Enter address (optional)"
                    />
                  )}
                />
              </div>
            </div>

            {/* ── Prescription Details ───────────────────────────── */}
            <div className="section-title" style={{ marginTop: "20px" }}>
              Prescription Details
            </div>
            <div className="prescription-details">
              {/* Row 1: Date | Doctor | Next Visit | Note + Toggle */}
              <div className="row row-4">
                <Controller
                  name="prescription_date"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Prescription Date"
                      type="date"
                      disabled={disabled}
                    />
                  )}
                />

                <Controller
                  name="doctor_name"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      style={{ width: "100%" }}
                      {...field}
                      label="Examined By"
                      disabled={disabled}
                      placeholder="Enter doctor name"
                    />
                  )}
                />
                {/* <VStack>
                  <Controller
                    name="next_visit_date"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        label="Next Visit Date"
                        type="date"
                        defaultValue=""
                        disabled={disabled}
                      />
                    )}
                  /> */}
                {/* </VStack> */}

                {/* Note + Distance/Near toggle stacked */}
                <div>
                  <Controller
                    name="note"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        label="Note"
                        disabled={disabled}
                        placeholder="Add note (optional)"
                      />
                    )}
                  />

                  {/* Distance / Near toggle */}
                  {/* <div className="vision-toggle" style={{ marginTop: "6px" }}>
                    <button
                      type="button"
                      className={`toggle-btn ${visionType === "distance" ? "active" : ""}`}
                      onClick={() => {
                        setVisionType("distance");
                        setValue("vision_type", "distance");
                      }}
                      disabled={disabled}
                    >
                      Distance
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${visionType === "near" ? "active" : ""}`}
                      onClick={() => {
                        setVisionType("near");
                        setValue("vision_type", "near");
                      }}
                      disabled={disabled}
                    >
                      Near
                    </button>
                  </div> */}
                </div>
              </div>

              {/* ── Eye Table ──────────────────────────────────────── */}
              <div className="eye-table-wrapper">
                <table className="eye-table">
                  <thead>
                    <tr>
                      <th>Eye</th>
                      <th>SPH</th>
                      <th>CYL</th>
                      <th>AXIS</th>
                      <th>ADD</th>
                      <th>IPD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eyeRows.map(({ side, label }, rowIdx) => (
                      <tr key={side}>
                        <td>{label}</td>
                        {eyeCols.map((col) => (
                          <td key={col}>
                            <Controller
                              name={`${side.toLowerCase()}_${col}`}
                              control={control}
                              render={({ field }) => (
                                <TableInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled={disabled}
                                  step={col === "axis" ? "1" : "0.25"}
                                  placeholder={col === "axis" ? "0" : "0.00"}
                                />
                              )}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Row: Lens Type | Lens Material | Coating | Remarks */}
              {/* <div
                className="row row-4-lens"
                style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
              >
                <Controller
                  name="lens_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Lens Type"
                      disabled={disabled}
                      placeholder="Select lens type"
                      options={[
                        { value: "single_vision", label: "Single Vision" },
                        { value: "bifocal", label: "Bifocal" },
                        { value: "progressive", label: "Progressive" },
                      ]}
                    />
                  )}
                />
                <Controller
                  name="lens_material"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Lens Material"
                      disabled={disabled}
                      placeholder="Select material"
                      options={[
                        { value: "plastic", label: "Plastic" },
                        { value: "polycarbonate", label: "Polycarbonate" },
                        { value: "trivex", label: "Trivex" },
                        { value: "glass", label: "Glass" },
                      ]}
                    />
                  )}
                />
                <Controller
                  name="coating"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Coating"
                      disabled={disabled}
                      placeholder="Select coating"
                      options={[
                        { value: "anti_reflective", label: "Anti-Reflective" },
                        { value: "uv_protection", label: "UV Protection" },
                        { value: "blue_cut", label: "Blue Cut" },
                        { value: "photochromic", label: "Photochromic" },
                      ]}
                    />
                  )}
                />
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      label="Remarks"
                      disabled={disabled}
                      placeholder="Enter remarks (optional)"
                    />
                  )}
                />
              </div> */}
            </div>
          </div>
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
        <SubmitButton
          isLoading={creating || updating || isCreatingCustomer}
          disabled={disabled}
          type={mode}
          label={mode === "add" ? "Save Prescription" : undefined}
          onClick={handleSubmit(onFormSubmit, handleFormError)}
        />
      </ModalFooter>
    </Modal>
  );
};

export default PrescriptionModal;
