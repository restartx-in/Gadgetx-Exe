import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import Title from "@/components/Title";
import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import SelectField from "@/components/SelectField";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";

import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { Report } from "@/constants/object/report";
import {useCreateService} from "@/apps/user/hooks/api/services/useCreateService";
import {useUpdateService} from "@/apps/user/hooks/api/services/useUpdateService";
import {useDeleteService} from "@/apps/user/hooks/api/services/useDeleteService";

const serviceSchema = z.object({
  customer_id: z.coerce.number().min(1, "Customer is required"),
  item_name: z.string().optional().nullable(),
  issue_report: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  service_charge: z.coerce.number().min(0, "Charge must be 0 or more"),
  service_charge_status: z.enum(["unpaid", "paid"]),
  estimate_date: z.string().optional().nullable().or(z.literal("")),
  complete_date: z.string().optional().nullable().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["pending", "completed"]),
  cost: z.coerce.number().min(0, "Cost must be 0 or more"),
});

const AddService = ({ isOpen, onClose, mode, selectedService }) => {
  const showToast = useToast();
  const disabled = mode === "view";

  const { mutateAsync: createService, isPending: creating } =
    useCreateService();
  const { mutateAsync: updateService, isPending: updating } =
    useUpdateService();
  const { mutateAsync: deleteService, isPending: deleting } =
    useDeleteService();

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      customer_id: "",
      item_name: "",
      issue_report: "",
      diagnosis: "",
      service: "",
      service_charge: 0,
      service_charge_status: "unpaid",
      estimate_date: new Date().toISOString().split("T")[0],
      complete_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: "",
      status: "pending",
      cost: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (selectedService) {
        reset({
          customer_id: selectedService.customer_id,
          item_name: selectedService.item_name || "",
          issue_report: selectedService.issue_report || "",
          diagnosis: selectedService.diagnosis || "",
          service: selectedService.service || "",
          service_charge: selectedService.service_charge || 0,
          service_charge_status: selectedService.service_charge_status || "unpaid",
          estimate_date: selectedService.estimate_date
            ? new Date(selectedService.estimate_date).toISOString().split("T")[0]
            : "",
          complete_date: selectedService.complete_date
            ? new Date(selectedService.complete_date).toISOString().split("T")[0]
            : "",
          description: selectedService.description,
          status: selectedService.status,
          cost: selectedService.cost,
        });
      } else {
        reset({
          customer_id: "",
          item_name: "",
          issue_report: "",
          diagnosis: "",
          service: "",
          service_charge: 0,
          service_charge_status: "unpaid",
          estimate_date: new Date().toISOString().split("T")[0],
          complete_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          description: "",
          status: "pending",
          cost: 0,
        });
      }
    }
  }, [isOpen, selectedService, reset]);

  const onFormSubmit = async (data) => {
    try {
      if (mode === "edit") {
        await updateService({ id: selectedService.id, data });
        showToast({
          crudItem: CRUDITEM.SERVICE || "Service",
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createService(data);
        showToast({
          crudItem: CRUDITEM.SERVICE || "Service",
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
      onClose();
    } catch (err) {
      showToast({
        type: "error",
        message: err.response?.data?.error || "Operation failed",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteService(selectedService.id);
      showToast({
        crudItem: CRUDITEM.SERVICE || "Service",
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      onClose();
    } catch (err) {
      showToast({ type: "error", message: "Failed to delete" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        {/* FIX: Use a fallback if Report.Service is missing */}
        <Title report={Report.Service || "Service Record"} mode={mode} />
      </ModalHeader>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <ModalBody>
          <VStack spacing={20}>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <CustomerAutoCompleteWithAddOption
                  {...field}
                  label="Customer"
                  disabled={disabled}
                  required
                />
              )}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Controller
                name="item_name"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Item Name"
                    disabled={disabled}
                    placeholder="e.g. Ray-Ban Frame"
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <SelectField
                    {...field}
                    label="Job Status"
                    disabled={disabled}
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "completed", label: "Completed" },
                    ]}
                  />
                )}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Controller
                name="issue_report"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    label="Issue Report"
                    disabled={disabled}
                    placeholder="Describe the problem"
                  />
                )}
              />
              <Controller
                name="diagnosis"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    label="Diagnosis"
                    disabled={disabled}
                    placeholder="What was found?"
                  />
                )}
              />
            </div>

            <Controller
              name="service"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  label="Service/Action Taken"
                  disabled={disabled}
                  placeholder="What was done?"
                />
              )}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Controller
                name="service_charge"
                control={control}
                render={({ field }) => (
                  <InputFieldWithCalculator
                    {...field}
                    label="Service Charge"
                    disabled={disabled}
                    type="number"
                  />
                )}
              />
              <Controller
                name="service_charge_status"
                control={control}
                render={({ field }) => (
                  <SelectField
                    {...field}
                    label="Charge Status"
                    disabled={disabled}
                    options={[
                      { value: "unpaid", label: "Unpaid" },
                      { value: "paid", label: "Paid" },
                    ]}
                  />
                )}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Controller
                name="estimate_date"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Service Date"
                    type="date"
                    disabled={disabled}
                  />
                )}
              />
              <Controller
                name="complete_date"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Complete Date"
                    type="date"
                    disabled={disabled}
                  />
                )}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    label="Internal Remarks"
                    disabled={disabled}
                    required
                  />
                )}
              />
              <Controller
                name="cost"
                control={control}
                render={({ field }) => (
                  <InputFieldWithCalculator
                    {...field}
                    label="Internal Cost"
                    disabled={disabled}
                    type="number"
                  />
                )}
              />
            </div>
          </VStack>
        </ModalBody>
        <ModalFooter
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <CancelButton onClick={onClose} />
          {mode === "edit" && (
            <DeleteTextButton onDelete={handleDelete} isLoading={deleting} />
          )}
          {!disabled && (
            <SubmitButton
              isLoading={creating || updating}
              type={mode === "add" ? "submit" : "update"}
            />
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddService;
