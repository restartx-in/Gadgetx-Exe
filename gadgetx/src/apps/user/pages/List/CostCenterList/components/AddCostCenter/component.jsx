import { useState, useEffect, useRef } from "react";
import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import Title from "@/apps/user/components/Title";
import { Report } from "@/constants/object/report";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";

import { useCreateCostCenter } from "@/hooks/api/costCenter/useCreateCostCenter";
import { useUpdateCostCenter } from "@/hooks/api/costCenter/useUpdateCostCenter";
import { useDeleteCostCenter } from "@/hooks/api/costCenter/useDeleteCostCenter";

const AddCostCenter = ({
  isOpen,
  onClose,
  mode,
  selectedCostCenter,
  onCostCenterCreated,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const defaultForm = {
    name: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createCostCenter, isLoading: creating } =
    useCreateCostCenter();
  const { mutateAsync: updateCostCenter, isLoading: updating } =
    useUpdateCostCenter();
  const { mutateAsync: deleteCostCenter, isLoading: deleting } =
    useDeleteCostCenter();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedCostCenter });
      } else if (mode === "add") {
        if (selectedCostCenter?.name) {
          setForm({ ...defaultForm, name: selectedCostCenter.name });
          localStorage.removeItem("cost_center_form");
        } else {
          const savedForm = localStorage.getItem("cost_center_form");
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedCostCenter]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("cost_center_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("cost_center_form");
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Cost Center name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const payload = { ...form };

      if (mode === "edit") {
        await updateCostCenter(
          { id: selectedCostCenter.id, data: payload },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.CostCenter, // Changed
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newCostCenter = await createCostCenter(payload);

        showToast({
          crudItem: CRUDITEM.CostCenter, // Changed
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();
        onClose();

        if (onCostCenterCreated) {
          onCostCenterCreated(newCostCenter);
        }
      }
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
      await deleteCostCenter(selectedCostCenter.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.CostCenter, // Changed
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete cost center.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <Title report={Report.CostCenter} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          label="Cost Center Name" // Changed
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          placeholder="Cost Center Name" // Changed
          value={form.name}
          onChange={handleChange}
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
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.CostCenter} // Changed
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        <SubmitButton
          isLoading={creating || updating}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit}
        />
      </ModalFooter>
    </Modal>
  );
};

export default AddCostCenter;
