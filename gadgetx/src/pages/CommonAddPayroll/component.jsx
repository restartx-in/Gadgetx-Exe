import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import DateField from "@/components/DateField";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import PageTitle from "@/components/PageTitle";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { useIsMobile } from "@/utils/useIsMobile";
import { onFormError } from "@/utils/formUtils";

const DRAFT_PREFIX = "payroll_form_draft_";

const payrollSchema = z.object({
  employee_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
    message: "Please select an employee",
  }),
  account_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
    message: "Please select a payment account",
  }),
  salary: z.coerce.number().min(0.01, "Salary must be greater than 0"),
  pay_date: z.string().min(1, "Please select a pay date"),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonAddPayroll = ({
  isOpen,
  onClose,
  mode,
  selectedPayroll,
  appTag,
  onSuccess,
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  EmployeeComponent,
  AccountComponent,
  CostCenterComponent,
  DoneByComponent,
}) => {
  const isMobile = useIsMobile();
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createPayroll, isPending: isCreating } = useCreateHook();
  const { mutateAsync: updatePayroll, isPending: isUpdating } = useUpdateHook();
  const { mutateAsync: deletePayroll, isPending: isDeleting } = useDeleteHook();

  const defaultValues = {
    employee_id: "",
    account_id: "",
    salary: "",
    pay_date: new Date().toISOString().split("T")[0],
    cost_center_id: null,
    done_by_id: null,
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(payrollSchema),
    defaultValues,
  });

  const watchedFields = watch();
  const watchedSalary = watch("salary");

  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false;
      if (mode === "edit" || mode === "view") {
        reset({
          ...defaultValues,
          ...selectedPayroll,
          pay_date: selectedPayroll?.pay_date
            ? new Date(selectedPayroll.pay_date).toISOString().split("T")[0]
            : defaultValues.pay_date,
        });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
      }
      if (mode !== "view") setTimeout(() => setFocus("employee_id"), 100);
    }
  }, [isOpen, mode, selectedPayroll, reset, setFocus, draftKey]);

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const handleFormError = (errors) => onFormError(errors, showToast);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      salary: Number(data.salary),
      employee_id: Number(data.employee_id),
      account_id: Number(data.account_id),
    };

    try {
      if (mode === "edit") {
        await updatePayroll({ id: selectedPayroll.id, payrollData: payload });
        showToast({
          crudItem: CRUDITEM.PAYROLL,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createPayroll(payload);
        isSubmittingSuccess.current = true;
        localStorage.removeItem(draftKey);
        reset(defaultValues);
        showToast({
          crudItem: CRUDITEM.PAYROLL,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        status: TOASTSTATUS.ERROR,
        message: err.response?.data?.error || "Error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPayroll?.id) return;
    try {
      await deletePayroll(selectedPayroll.id);
      showToast({
        crudItem: CRUDITEM.PAYROLL,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      localStorage.removeItem(draftKey);
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to delete payroll.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  // Restored dynamic title logic from your original code
  const getModalTitle = () => {
    if (mode === "add") return "Add Payroll Record";
    if (mode === "edit") return "Edit Payroll Record";
    return "View Payroll Record";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <PageTitle title={getModalTitle()} />
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit, handleFormError)}>
        <ModalBody>
          <VStack>
            <Controller
              name="employee_id"
              control={control}
              render={({ field }) => (
                <EmployeeComponent
                  {...field}
                  placeholder="Select Employee"
                  disabled={disabled}
                  required
                />
              )}
            />

            <Controller
              name="account_id"
              control={control}
              render={({ field }) => (
                <AccountComponent
                  {...field}
                  placeholder="Select Account"
                  disabled={disabled}
                  required
                  debitAmount={watchedSalary}
                />
              )}
            />

            <Controller
              name="cost_center_id"
              control={control}
              render={({ field }) => (
                <CostCenterComponent {...field} disabled={disabled} />
              )}
            />

            <Controller
              name="done_by_id"
              control={control}
              render={({ field }) => (
                <DoneByComponent
                  {...field}
                  placeholder="Done By"
                  disabled={disabled}
                />
              )}
            />

            {isMobile ? (
              <VStack>
                <Controller
                  name="salary"
                  control={control}
                  render={({ field }) => (
                    <InputFieldWithCalculator
                      {...field}
                      label="Salary"
                      type="number"
                      placeholder="0.00"
                      disabled={disabled}
                      required
                    />
                  )}
                />
                <Controller
                  name="pay_date"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Pay Date"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(d) =>
                        field.onChange(d ? d.toISOString().split("T")[0] : "")
                      }
                      disabled={disabled}
                      required
                    />
                  )}
                />
              </VStack>
            ) : (
              <HStack>
                <Controller
                  name="salary"
                  control={control}
                  render={({ field }) => (
                    <InputFieldWithCalculator
                      {...field}
                      label="Salary"
                      type="number"
                      placeholder="0.00"
                      disabled={disabled}
                      required
                    />
                  )}
                />
                <Controller
                  name="pay_date"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Pay Date"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(d) =>
                        field.onChange(d ? d.toISOString().split("T")[0] : "")
                      }
                      disabled={disabled}
                      required
                    />
                  )}
                />
              </HStack>
            )}
          </VStack>
        </ModalBody>
      </form>

      {/* RESTORED EXACT BUTTON ARRANGEMENT AND STYLES */}
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
            transaction="Payroll"
            onDelete={handleDelete}
            isLoading={isDeleting}
          />
        )}

        {mode !== "view" && (
          <SubmitButton
            isLoading={isCreating || isUpdating}
            disabled={disabled}
            type={mode}
            onClick={handleSubmit(onFormSubmit, handleFormError)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddPayroll;
