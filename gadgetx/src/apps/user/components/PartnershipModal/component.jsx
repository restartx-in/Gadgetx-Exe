import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import usePartners from "@/apps/user/hooks/api/partner/usePartners";
import useCreatePartnership from "@/apps/user/hooks/api/partnership/useCreatePartnership";
import useUpdatePartnership from "@/apps/user/hooks/api/partnership/useUpdatePartnership";
import useDeletePartnership from "@/apps/user/hooks/api/partnership/useDeletePartnership";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import Select from "@/components/Select";
import AccountAutoCompleteWithAddOption from "@/apps/user/components/AccountAutoCompleteWithAddOption";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { Transaction } from "@/constants/object/transaction";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";
import PartnerAutoCompleteWithAddOption from "@/apps/user/components/PartnerAutoCompleteWithAddOption";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

import "./style.scss";

const DRAFT_STORAGE_KEY = "partnership_form_draft";

const paymentStatuses = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

const partnershipSchema = z.object({
  partner_id: z.union([z.string(), z.number()]).refine((val) => val !== "" && val !== null, "Partner is required"),
  contribution: z.coerce.number().min(0).default(0),
  contribution_payment_paid: z.coerce.number().min(0).default(0),
  from_account: z.any(),
  contribution_payment_status: z.string().default("pending"),
  profit_share: z.coerce.number().default(0),
  profit_share_payment_status: z.string().default("pending"),
  done_by_id: z.any().optional().nullable(),
  cost_center_id: z.any().optional().nullable(),
});

const PartnershipModal = ({
  isOpen,
  onClose,
  mode,
  selectedPartnership,
  onSuccess,
}) => {
  const showToast = useToast();
  const disabled = mode === "view";

  const { data: partners } = usePartners();
  const { mutateAsync: createPartnership, isLoading: isCreating } =
    useCreatePartnership();
  const { mutateAsync: updatePartnership, isLoading: isUpdating } =
    useUpdatePartnership();
  const { mutateAsync: deletePartnership, isLoading: isDeleting } =
    useDeletePartnership();

  const defaultValues = {
    partner_id: "",
    contribution: "",
    contribution_payment_paid: "",
    profit_share: "",
    from_account: "",
    contribution_payment_status: "pending",
    profit_share_payment_status: "pending",
    done_by_id: "",
    cost_center_id: "",
  };

  // 2. Setup React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
  } = useForm({
    resolver: zodResolver(partnershipSchema),
    defaultValues,
  });

  const watchedFormData = watch();
  const watchedContribution = watch("contribution");
  const watchedPaid = watch("contribution_payment_paid");

  // Init Data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        reset({ ...defaultValues, ...(selectedPartnership || {}) });
      } else if (mode === "add") {
        const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
        reset(savedForm ? JSON.parse(savedForm) : { ...defaultValues });
      }
    }
  }, [isOpen, mode, selectedPartnership, reset]);

  // Save Draft
  useEffect(() => {
    if (mode === "add" && isOpen) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedFormData));
    }
  }, [watchedFormData, mode, isOpen]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset(defaultValues);
  };

  // Logic: Status Calculation
  useEffect(() => {
    const contribution = parseFloat(watchedContribution) || 0;
    const paid = parseFloat(watchedPaid) || 0;
    let newStatus = "pending";
    if (contribution > 0) {
      if (paid >= contribution) newStatus = "paid";
      else if (paid > 0) newStatus = "partial";
    }
    const currentStatus = getValues("contribution_payment_status");
    if (newStatus !== currentStatus) {
      setValue("contribution_payment_status", newStatus);
    }
  }, [watchedContribution, watchedPaid, setValue, getValues]);

  // Logic: Reset Paid if Contribution is cleared
  useEffect(() => {
    if (!watchedContribution || parseFloat(watchedContribution) <= 0) {
      if (watchedPaid) {
        setValue("contribution_payment_paid", "");
      }
    }
  }, [watchedContribution, watchedPaid, setValue]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        partner_id: data.partner_id,
        contribution: Number(data.contribution) || 0,
        contribution_payment_paid: Number(data.contribution_payment_paid) || 0,
        from_account: data.from_account,
        contribution_payment_status: data.contribution_payment_status,
        profit_share: Number(data.profit_share) || 0,
        profit_share_payment_status:
          data.profit_share_payment_status || "pending",
        done_by_id: data.done_by_id || null,
        cost_center_id: data.cost_center_id || null,
      };

      if (mode === "edit") {
        await updatePartnership({ id: selectedPartnership.id, data: payload });
        showToast({
          crudItem: CRUDITEM.PARTNERSHIP,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createPartnership(payload);
        showToast({
          crudItem: CRUDITEM.PARTNERSHIP,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorageAndResetForm();
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || "An unexpected error occurred.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePartnership(selectedPartnership.id);
      showToast({
        crudItem: CRUDITEM.PARTNERSHIP,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.PARTNERSHIP,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  };

  const partnerOptions = [
    { value: "", label: "Select a Partner" },
    ...(Array.isArray(partners)
      ? partners.map((p) => ({ value: p.id, label: p.name }))
      : []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <h2 className="partnership_modal-title fs26 fw600">
          {mode === "edit" ? "Edit" : mode === "view" ? "View" : "Add"}{" "}
          Partnership
        </h2>
      </ModalHeader>
      <ModalBody>
        <Controller
          name="partner_id"
          control={control}
          render={({ field }) => (
            <PartnerAutoCompleteWithAddOption
              {...field}
              options={partnerOptions}
              disabled={disabled}
              required
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name="contribution"
          control={control}
          render={({ field }) => (
            <InputFieldWithCalculator
              {...field}
              type="number"
              placeholder="Partner Contribution (INR)"
              disabled={disabled}
              required
              onChange={(e) => {
                const value = e.target.value;
                const numericValue = parseFloat(value) || 0;
                const paid = parseFloat(getValues("contribution_payment_paid")) || 0;
                
                // Logic replication: Check if contribution < paid
                if (value !== "" && numericValue < paid) {
                  showToast({
                    type: TOASTTYPE.GENARAL,
                    message: "Contribution cannot be less than the amount already paid.",
                    status: TOASTSTATUS.WARNING,
                  });
                  // Original code sets both contribution and paid to 'value' in this case
                  field.onChange(value);
                  setValue("contribution_payment_paid", value);
                  return;
                }
                field.onChange(value);
              }}
            />
          )}
        />

        <Controller
          name="contribution_payment_paid"
          control={control}
          render={({ field }) => (
            <InputFieldWithCalculator
              {...field}
              type="number"
              placeholder="Contribution Paid Amount"
              disabled={
                disabled || !watchedContribution || Number(watchedContribution) <= 0
              }
              onChange={(e) => {
                const value = e.target.value;
                const numericValue = parseFloat(value) || 0;
                const contribution = parseFloat(getValues("contribution")) || 0;
                
                // Logic replication: Check if paid > contribution
                if (contribution > 0 && numericValue > contribution) {
                  showToast({
                    type: TOASTTYPE.GENARAL,
                    message: "Paid amount cannot be greater than the contribution.",
                    status: TOASTSTATUS.ERROR,
                  });
                  return;
                }
                field.onChange(value);
              }}
            />
          )}
        />

        <Controller
          name="from_account"
          control={control}
          render={({ field }) => (
            <AccountAutoCompleteWithAddOption
              {...field}
              placeholder="From Account"
              disabled={disabled}
              required
              debitAmount={watchedPaid}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name="done_by_id"
          control={control}
          render={({ field }) => (
            <DoneByAutoCompleteWithAddOption
              {...field}
              placeholder="Done By"
              disabled={disabled}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name="cost_center_id"
          control={control}
          render={({ field }) => (
            <CostCenterAutoCompleteWithAddOption
              {...field}
              placeholder="Cost Center"
              disabled={disabled}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />

        <Controller
          name="contribution_payment_status"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              options={paymentStatuses}
              disabled={true}
              required
            />
          )}
        />

        <Controller
          name="profit_share"
          control={control}
          render={({ field }) => (
            <InputFieldWithCalculator
              {...field}
              type="number"
              placeholder="Partner Profit Share Amount"
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="profit_share_payment_status"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Profit Share Payment Status"
              options={paymentStatuses}
              disabled={disabled}
              required
            />
          )}
        />
      </ModalBody>
      <ModalFooter
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px",
        }}
      >
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.Partnership}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        )}
        {mode !== "view" && (
          <SubmitButton
            isLoading={isCreating || isUpdating}
            disabled={isCreating || isUpdating}
            type={mode}
            onClick={handleSubmit(onSubmit)}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default PartnershipModal;