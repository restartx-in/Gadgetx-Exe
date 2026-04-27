import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import PhoneNoField from "@/components/PhoneNoField";
import Select from "@/components/Select";
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

const DRAFT_PREFIX = "supplier_form_draft_";

const supplierSchema = z
  .object({
    name: z.string().min(1, "Supplier name is required"),
    email: z
      .string()
      .email("Invalid email")
      .optional()
      .or(z.literal(""))
      .nullable(),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Address is required"),
    payment_terms: z.string().min(1, "Payment terms are required"),
    outstanding_balance: z.coerce.number().optional().default(0),
    done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
    cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
    create_linked_account: z.boolean().optional().default(false),
    account_type: z.enum(["cash", "bank"]).optional(),
    initial_balance: z.coerce.number().optional().default(0),
    account_description: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.create_linked_account && !data.account_type) {
      ctx.addIssue({
        code: "custom",
        message: "Account type is required",
        path: ["account_type"],
      });
    }
  });

const CommonAddSupplier = ({
  isOpen,
  onClose,
  mode,
  selectedSupplier,
  onSupplierCreated,
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  useCreateAccountHook,
  DoneByComponent,
  CostCenterComponent,
  CalculatorInput,
  appTag = "common",
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createSupplier, isPending: creating } = useCreateHook();
  const { mutateAsync: updateSupplier, isPending: updating } = useUpdateHook();
  const { mutateAsync: deleteSupplier, isPending: deleting } = useDeleteHook();
  const { mutateAsync: createAccount, isPending: creatingAccount } =
    useCreateAccountHook();

  const defaultValues = {
    name: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "",
    outstanding_balance: 0,
    done_by_id: null,
    cost_center_id: null,
    create_linked_account: false,
    account_type: "cash",
    initial_balance: 0,
    account_description: "",
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  });

  const watchedFields = watch();
  const watchedCreateAccount = watch("create_linked_account");

  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false;
      if (mode === "edit" || mode === "view") {
        reset({
          ...defaultValues,
          ...selectedSupplier,
        });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (selectedSupplier?.name) {
          reset({ ...defaultValues, name: selectedSupplier.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedSupplier, reset, setFocus, draftKey]);

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const baseSupplierPayload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      payment_terms: data.payment_terms,
      outstanding_balance: Number(data.outstanding_balance || 0),
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
    };

    try {
      if (mode === "edit") {
        await updateSupplier({
          id: selectedSupplier.id,
          supplierData: baseSupplierPayload,
        });

        if (data.create_linked_account) {
          try {
            await createAccount({
              name: selectedSupplier.name,
              party_id: selectedSupplier.id,
              cost_center_id: selectedSupplier.cost_center_id,
              done_by_id: selectedSupplier.done_by_id,
              description: data.account_description,
              balance: Number(data.initial_balance),
              type: data.account_type,
            });
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Account created and linked successfully.",
              status: TOASTSTATUS.SUCCESS,
            });
          } catch (accErr) {
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Supplier updated, but failed to create Account.",
              status: TOASTSTATUS.WARNING,
            });
          }
        } else {
          showToast({
            crudItem: CRUDITEM.SUPPLIER,
            crudType: CRUDTYPE.UPDATE_SUCCESS,
          });
        }
      } else {
        const supplierPayload = { ...baseSupplierPayload, type: "supplier" };
        const res = await createSupplier(supplierPayload);
        const supplierObj = res.data || res;

        isSubmittingSuccess.current = true;
        localStorage.removeItem(draftKey);

        if (data.create_linked_account) {
          try {
            await createAccount({
              name: supplierObj.name,
              party_id: supplierObj.id,
              cost_center_id: supplierObj.cost_center_id,
              done_by_id: supplierObj.done_by_id,
              description: data.account_description,
              balance: Number(data.initial_balance),
              type: data.account_type,
            });
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Supplier and Account created successfully.",
              status: TOASTSTATUS.SUCCESS,
            });
          } catch (accErr) {
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Supplier created, but failed to create Account.",
              status: TOASTSTATUS.WARNING,
            });
          }
        } else {
          showToast({
            crudItem: CRUDITEM.SUPPLIER,
            crudType: CRUDTYPE.CREATE_SUCCESS,
          });
        }
        onSupplierCreated?.(supplierObj);
      }
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: err.response?.data?.message || "An error occurred.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Supplier} mode={mode} />
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
                  label="Supplier Name"
                  disabled={disabled}
                  required
                  placeholder="Supplier Name"
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
                  disabled={disabled}
                  placeholder="Email"
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneNoField
                  {...field}
                  label="Phone"
                  disabled={disabled}
                  required
                  placeholder="Phone"
                />
              )}
            />
            <Controller
              name="done_by_id"
              control={control}
              render={({ field }) => (
                <DoneByComponent
                  {...field}
                  disabled={disabled}
                  placeholder="Select Done By"
                />
              )}
            />
            <Controller
              name="cost_center_id"
              control={control}
              render={({ field }) => (
                <CostCenterComponent
                  {...field}
                  disabled={disabled}
                  placeholder="Select Cost Center"
                />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  label="Address"
                  disabled={disabled}
                  required
                  placeholder="Address"
                />
              )}
            />
            <Controller
              name="payment_terms"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Payment Terms"
                  disabled={disabled}
                  required
                  placeholder="Payment Terms"
                />
              )}
            />
            <Controller
              name="outstanding_balance"
              control={control}
              render={({ field }) => (
                <CalculatorInput
                  {...field}
                  label="Outstanding Balance (Opening Due)"
                  disabled={disabled}
                  placeholder="0.00"
                />
              )}
            />

            {(mode === "add" || mode === "edit") && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "10px",
                  }}
                >
                  <Controller
                    name="create_linked_account"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input
                        type="checkbox"
                        id="createLinkedAccount"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                    )}
                  />
                  <label
                    htmlFor="createLinkedAccount"
                    style={{ cursor: "pointer", fontWeight: "500" }}
                  >
                    Create associated Account?
                  </label>
                </div>
                {watchedCreateAccount && (
                  <VStack
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                    }}
                  >
                    <Controller
                      name="account_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Account Type"
                          options={[
                            { value: "cash", label: "Cash" },
                            { value: "bank", label: "Bank" },
                          ]}
                          required
                        />
                      )}
                    />
                    <Controller
                      name="initial_balance"
                      control={control}
                      render={({ field }) => (
                        <CalculatorInput
                          {...field}
                          label="Opening Balance"
                          required
                          placeholder="0.00"
                        />
                      )}
                    />
                    <Controller
                      name="account_description"
                      control={control}
                      render={({ field }) => (
                        <TextArea {...field} label="Account Description" />
                      )}
                    />
                  </VStack>
                )}
              </>
            )}
          </VStack>
        </ModalBody>
      </form>
      <ModalFooter
        style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}
      >
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Supplier}
            onDelete={() => deleteSupplier(selectedSupplier.id).then(onClose)}
            isLoading={deleting}
          />
        )}
        <SubmitButton
          isLoading={creating || updating || creatingAccount}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}
        />
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddSupplier;
