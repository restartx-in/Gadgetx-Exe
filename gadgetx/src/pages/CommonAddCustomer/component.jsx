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
import HStack from "@/components/HStack";
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
import { padding } from "@mui/system";

const DRAFT_PREFIX = "customer_form_draft_";

const customerSchema = z
  .object({
    name: z.string().min(1, "Customer name is required"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .optional()
      .or(z.literal(""))
      .nullable(),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Address is required"),
    credit_limit: z.coerce.number().min(0, "Credit limit must be 0 or more"),
    outstanding_balance: z.coerce
      .number()
      .min(0, "Outstanding balance must be 0 or more"),
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

const CommonAddCustomer = ({
  isOpen,
  onClose,
  mode,
  selectedCustomer,
  onCustomerCreated,
  // Hooks
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  useCreateAccountHook,
  // Components
  DoneByComponent,
  CostCenterComponent,
  CalculatorInput,
  appTag = "common",
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;

  // Ref to block draft saving during the success cycle
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createCustomer, isPending: creating } = useCreateHook();
  const { mutateAsync: updateCustomer, isPending: updating } = useUpdateHook();
  const { mutateAsync: deleteCustomer, isPending: deleting } = useDeleteHook();
  const { mutateAsync: createAccount, isPending: creatingAccount } =
    useCreateAccountHook();

  const defaultValues = {
    name: "",
    email: "",
    address: "",
    phone: "",
    credit_limit: 0,
    outstanding_balance: 0,
    done_by_id: null,
    cost_center_id: null,
    create_linked_account: false,
    account_type: "cash",
    initial_balance: 0,
    account_description: "",
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(customerSchema),
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
          ...selectedCustomer,
        });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        const initialValues = savedDraft
          ? JSON.parse(savedDraft)
          : defaultValues;

        reset({
          ...initialValues,
          name: selectedCustomer?.name || initialValues.name || "",
        });
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedCustomer, reset, setFocus, draftKey]);
  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const handleFormError = (errors) => onFormError(errors, showToast);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      credit_limit: Number(data.credit_limit),
      outstanding_balance: Number(data.outstanding_balance),
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
    };

    try {
      if (mode === "edit") {
        await updateCustomer({
          id: selectedCustomer.id,
          customerData: payload,
        });

        if (data.create_linked_account) {
          try {
            await createAccount({
              name: selectedCustomer.name,
              party_id: selectedCustomer.id,
              cost_center_id: selectedCustomer.cost_center_id,
              done_by_id: selectedCustomer.done_by_id,
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
              message: "Customer updated, but failed to create Account.",
              status: TOASTSTATUS.WARNING,
            });
          }
        } else {
          showToast({
            crudItem: CRUDITEM.CUSTOMER,
            crudType: CRUDTYPE.UPDATE_SUCCESS,
          });
        }
      } else {
        const res = await createCustomer(payload);
        const customerObj = res.data || res;

        isSubmittingSuccess.current = true;
        localStorage.removeItem(draftKey);

        if (data.create_linked_account) {
          try {
            await createAccount({
              name: customerObj.name,
              party_id: customerObj.id,
              cost_center_id: customerObj.cost_center_id,
              done_by_id: customerObj.done_by_id,
              description: data.account_description,
              balance: Number(data.initial_balance),
              type: data.account_type,
            });
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Customer and Account created successfully.",
              status: TOASTSTATUS.SUCCESS,
            });
          } catch (accErr) {
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Customer created, but failed to create Account.",
              status: TOASTSTATUS.WARNING,
            });
          }
        } else {
          showToast({
            crudItem: CRUDITEM.CUSTOMER,
            crudType: CRUDTYPE.CREATE_SUCCESS,
          });
        }

        if (onCustomerCreated) {
          onCustomerCreated(customerObj);
        }
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
    if (!selectedCustomer?.id) return;
    try {
      await deleteCustomer(selectedCustomer.id);
      showToast({
        crudItem: CRUDITEM.CUSTOMER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete customer.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Customer} mode={mode} />
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit, handleFormError)}>
        <ModalBody>
          <VStack>
            <HStack justifyContent="flex-start">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Customer Name"
                    disabled={disabled}
                    required
                    placeholder="Customer Name"
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Email Address"
                    disabled={disabled}
                    type="email"
                    placeholder="Email Address"
                  />
                )}
              />
              <HStack justifyContent="flex-end">
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
              </HStack>
            </HStack>
            <HStack justifyContent="flex-start">
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
              <HStack justifyContent="flex-end">
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      {...field}
                      // label="Address"
                      disabled={disabled}
                      required
                      placeholder="Address"
                      rows=".0"
                    />
                  )}
                />
              </HStack>
            </HStack>
            {/* <Controller
              name="credit_limit"
              control={control}
              render={({ field }) => (
                <CalculatorInput
                  {...field}
                  label="Credit Limit"
                  disabled={disabled}
                  required
                  type="number"
                  placeholder="Credit Limit"
                />
              )}
            />
            <Controller
              name="outstanding_balance"
              control={control}
              render={({ field }) => (
                <CalculatorInput
                  {...field}
                  label="Outstanding Balance"
                  disabled={disabled}
                  required
                  type="number"
                  placeholder="Outstanding Balance"
                />
              )}
            /> */}

            {/* {(mode === "add" || mode === "edit") && (
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
            )} */}
          </VStack>
        </ModalBody>
      </form>
      <ModalFooter
        style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}
      >
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Customer}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        {mode !== "view" && (
          <SubmitButton
            isLoading={creating || updating || creatingAccount}
            disabled={disabled}
            type={mode}
            onClick={handleSubmit(onFormSubmit, handleFormError)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddCustomer;
