import { useState, useEffect } from "react";
import usePartners from "@/hooks/api/partner/usePartners";
import useCreatePartnership from "@/hooks/api/partnership/useCreatePartnership";
import useUpdatePartnership from "@/hooks/api/partnership/useUpdatePartnership";
import useDeletePartnership from "@/hooks/api/partnership/useDeletePartnership";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
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

const PartnershipModal = ({
  isOpen,
  onClose,
  mode,
  selectedPartnership,
  onSuccess,
}) => {
  const showToast = useToast();

  const defaultForm = {
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

  const [form, setForm] = useState(() => {
    if (mode === "add") {
      const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
      return savedForm ? JSON.parse(savedForm) : { ...defaultForm };
    }
    return { ...defaultForm };
  });

  const disabled = mode === "view";

  const { data: partners } = usePartners();
  const { mutateAsync: createPartnership, isLoading: isCreating } =
    useCreatePartnership();
  const { mutateAsync: updatePartnership, isLoading: isUpdating } =
    useUpdatePartnership();
  const { mutateAsync: deletePartnership, isLoading: isDeleting } =
    useDeletePartnership();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        // Ensure all default keys are present even if selectedPartnership is missing some
        setForm({ ...defaultForm, ...(selectedPartnership || {}) });
      } else if (mode === "add") {
        const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
        setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
      }
    }
  }, [isOpen, mode, selectedPartnership]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm({ ...defaultForm });
  };


  useEffect(() => {
    const contribution = parseFloat(form.contribution) || 0;
    const paid = parseFloat(form.contribution_payment_paid) || 0;
    let newStatus = "pending";
    if (contribution > 0) {
      if (paid >= contribution) newStatus = "paid";
      else if (paid > 0) newStatus = "partial";
    }
    if (newStatus !== form.contribution_payment_status) {
      setForm((prev) => ({ ...prev, contribution_payment_status: newStatus }));
    }
  }, [form.contribution, form.contribution_payment_paid]);

  useEffect(() => {
    if (!form.contribution || parseFloat(form.contribution) <= 0) {
      if (form.contribution_payment_paid) {
        setForm((prev) => ({ ...prev, contribution_payment_paid: "" }));
      }
    }
  }, [form.contribution]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    if (name === "contribution_payment_paid") {
      const contribution = parseFloat(form.contribution) || 0;
      if (contribution > 0 && numericValue > contribution) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Paid amount cannot be greater than the contribution.",
          status: TOASTSTATUS.ERROR,
        });
        return;
      }
    }
    if (name === "contribution") {
      const paid = parseFloat(form.contribution_payment_paid) || 0;
      if (value !== "" && numericValue < paid) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Contribution cannot be less than the amount already paid.",
          status: TOASTSTATUS.WARNING,
        });
        setForm((prev) => ({
          ...prev,
          contribution: value,
          contribution_payment_paid: value,
        }));
        return;
      }
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        partner_id: form.partner_id,
        contribution: Number(form.contribution) || 0,
        contribution_payment_paid: Number(form.contribution_payment_paid) || 0,
        from_account: form.from_account,
        contribution_payment_status: form.contribution_payment_status,
        profit_share: Number(form.profit_share) || 0,
        profit_share_payment_status:
          form.profit_share_payment_status || "pending",
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
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
        <PartnerAutoCompleteWithAddOption
          name="partner_id"
          value={form.partner_id || ""}
          onChange={handleChange}
          options={partnerOptions}
          disabled={disabled}
          required
        />
        <InputFieldWithCalculator
          name="contribution"
          type="number"
          placeholder="Partner Contribution (INR)"
          value={form.contribution || ""}
          onChange={handleChange}
          disabled={disabled}
          required
        />
        <InputFieldWithCalculator
          name="contribution_payment_paid"
          type="number"
          placeholder="Contribution Paid Amount"
          value={form.contribution_payment_paid || ""}
          onChange={handleChange}
          disabled={
            disabled || !form.contribution || Number(form.contribution) <= 0
          }
        />
        <AccountAutoCompleteWithAddOption
          placeholder="From Account"
          name="from_account"
          value={form.from_account || ""}
          onChange={handleChange}
          disabled={disabled}
          required
          debitAmount={form.contribution_payment_paid}
        />
        <DoneByAutoCompleteWithAddOption
            placeholder="Done By"
            name="done_by_id"
            value={form.done_by_id}
            onChange={handleChange}
            disabled={disabled}
        />
        <CostCenterAutoCompleteWithAddOption
            placeholder="Cost Center"
            name="cost_center_id"
            value={form.cost_center_id}
            onChange={handleChange}
            disabled={disabled}
        />
        <Select
          name="contribution_payment_status"
          value={form.contribution_payment_status || ""}
          onChange={handleChange}
          options={paymentStatuses}
          disabled={true}
          required
        />
        <InputFieldWithCalculator
          name="profit_share"
          type="number"
          placeholder="Partner Profit Share Amount"
          value={form.profit_share || ""}
          onChange={handleChange}
          disabled={disabled}
        />
        <Select
          name="profit_share_payment_status"
          label="Profit Share Payment Status"
          value={form.profit_share_payment_status || ""}
          onChange={handleChange}
          options={paymentStatuses}
          disabled={disabled}
          required
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
            onClick={handleSubmit}
          />
        )}
      </ModalFooter>
    </Modal>
  );
};

export default PartnershipModal;