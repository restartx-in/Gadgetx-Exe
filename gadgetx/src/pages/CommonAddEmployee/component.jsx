import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import PhoneNoField from "@/components/PhoneNoField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import DateField from "@/components/DateField";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";
import HStack from "@/components/HStack";
import VStack from "@/components/VStack";

import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";
import { useIsMobile } from "@/utils/useIsMobile";

const DRAFT_PREFIX = "employee_form_draft_";

const employeeSchema = z.object({
  name: z.string().min(1, "Employee name is required"),
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),
  phone: z.string().min(1, "Phone number is required"),
  employee_position_id: z
    .union([z.string(), z.number()])
    .refine((val) => !!val, { message: "Please select a position" }),
  salary: z.coerce.number().min(0, "Salary must be 0 or more"),
  hire_date: z.string().min(1, "Hire date is required"),
  address: z.string().optional().nullable(),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
});

const CommonAddEmployee = ({
  isOpen,
  onClose,
  mode,
  selectedEmployee,
  onSuccess,
  appTag,
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  DoneByComponent,
  CostCenterComponent,
  PositionComponent,
}) => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;
  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createEmployee, isPending: creating } = useCreateHook();
  const { mutateAsync: updateEmployee, isPending: updating } = useUpdateHook();
  const { mutateAsync: deleteEmployee, isPending: deleting } = useDeleteHook();

  const defaultValues = {
    name: "",
    email: "",
    phone: "",
    employee_position_id: "",
    salary: "",
    hire_date: new Date().toISOString().split("T")[0],
    address: "",
    done_by_id: null,
    cost_center_id: null,
  };

  const { control, handleSubmit, reset, watch, setFocus } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues,
  });

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      isSubmittingSuccess.current = false;
      if (mode !== "add") {
        reset({ ...defaultValues, ...selectedEmployee });
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (selectedEmployee?.name) {
          reset({ ...defaultValues, name: selectedEmployee.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    }
  }, [isOpen, mode, selectedEmployee, reset, setFocus, draftKey]);

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const payload = {
      ...data,
      employee_position_id: Number(data.employee_position_id),
      salary: Number(data.salary),
    };
    try {
      if (mode === "edit") {
        await updateEmployee({
          id: selectedEmployee.id,
          employeeData: payload,
        });
        showToast({
          crudItem: CRUDITEM.EMPLOYEE,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createEmployee(payload);
        isSubmittingSuccess.current = true;
        localStorage.removeItem(draftKey);
        reset(defaultValues);
        showToast({
          crudItem: CRUDITEM.EMPLOYEE,
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
        <Title report={Report.Employee} mode={mode} />
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
                  label="Employee Name"
                  disabled={disabled}
                  required
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
                  required
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
                />
              )}
            />
            <Controller
              name="done_by_id"
              control={control}
              render={({ field }) => (
                <DoneByComponent {...field} disabled={disabled} />
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
              name="address"
              control={control}
              render={({ field }) => (
                <TextArea {...field} label="Address" disabled={disabled} />
              )}
            />
            <Controller
              name="employee_position_id"
              control={control}
              render={({ field }) => (
                <PositionComponent {...field} disabled={disabled} required />
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
                      disabled={disabled}
                      required
                    />
                  )}
                />
                <Controller
                  name="hire_date"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Hire Date"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(d) =>
                        field.onChange(d?.toISOString().split("T")[0])
                      }
                      disabled={disabled}
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
                      disabled={disabled}
                      required
                    />
                  )}
                />
                <Controller
                  name="hire_date"
                  control={control}
                  render={({ field }) => (
                    <DateField
                      label="Hire Date"
                      value={field.value ? new Date(field.value) : null}
                      onChange={(d) =>
                        field.onChange(d?.toISOString().split("T")[0])
                      }
                      disabled={disabled}
                    />
                  )}
                />
              </HStack>
            )}
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
        {mode !== "edit" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Employee}
            onDelete={async () => {
              await deleteEmployee(selectedEmployee.id);
              showToast({
                crudItem: CRUDITEM.EMPLOYEE,
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
            disabled={disabled}
            type={mode}
            onClick={handleSubmit(onFormSubmit)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddEmployee;
