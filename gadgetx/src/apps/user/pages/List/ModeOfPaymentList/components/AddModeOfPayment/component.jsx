import { useState, useEffect, useRef } from "react";
import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import Title from "@/apps/user/components/Title";
import { Report } from "@/constants/object/report";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

import { useCreateModeOfPayment } from "@/hooks/api/modeOfPayment/useCreateModeOfPayment";
import { useUpdateModeOfPayment } from "@/hooks/api/modeOfPayment/useUpdateModeOfPayment";
import { useDeleteModeOfPayment } from "@/hooks/api/modeOfPayment/useDeleteModeOfPayment";

const AddModeOfPayment = ({
  isOpen,
  onClose,
  mode,
  selectedMOP,
  onMOPCreated,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);

  const defaultForm = {
    name: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createMOP, isLoading: creating } =
    useCreateModeOfPayment();
  const { mutateAsync: updateMOP, isLoading: updating } =
    useUpdateModeOfPayment();
  const { mutateAsync: deleteMOP, isLoading: deleting } =
    useDeleteModeOfPayment();

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        // Edit/View: Load the existing object
        setForm({ ...defaultForm, ...selectedMOP });
      } else if (mode === "add") {
        // Add Mode Logic
        if (selectedMOP && selectedMOP.name) {
          // Case 1: Coming from Autocomplete (User typed a name and clicked Add)
          setForm({ ...defaultForm, name: selectedMOP.name });
        } else {
          // Case 2: Normal Add Button (Load draft from LocalStorage)
          const savedForm = localStorage.getItem("mop_form");
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }

      // Focus the name input
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedMOP]);

  // Save draft to LocalStorage only in 'add' mode
  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("mop_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("mop_form");
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Mode Name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const payload = {
        name: form.name,
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
      };

      if (mode === "edit") {
        await updateMOP(
          { id: selectedMOP.id, data: payload },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.MODEOFPAYMENT || "Mode Of Payment",
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newMOP = await createMOP(payload);

        showToast({
          crudItem: CRUDITEM.MODEOFPAYMENT || "Mode Of Payment",
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();

        // IMPORTANT: Pass the new object back to the autocomplete
        if (onMOPCreated) {
          onMOPCreated(newMOP);
        }

        onClose();
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
      await deleteMOP(selectedMOP.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.MODEOFPAYMENT || "Mode Of Payment",
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || "Failed to delete mode of payment.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <Title report={Report.ModeOfPayment || "Mode Of Payment"} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <VStack>
          <InputField
            label="Mode Name"
            ref={nameInputRef}
            disabled={disabled}
            name="name"
            type="text"
            // label="Name"
            placeholder="Mode Name (e.g. card, upi, cash)"
            value={form.name}
            onChange={handleChange}
            required
          />
          <DoneByAutoCompleteWithAddOption
            // label="Done By"
            placeholder="Select Done By"
            name="done_by_id"
            value={form.done_by_id}
            onChange={handleChange}
            disabled={disabled}
          />
          <CostCenterAutoCompleteWithAddOption
            // label="Cost Center"
            placeholder="Select Cost Center"
            name="cost_center_id"
            value={form.cost_center_id}
            onChange={handleChange}
            disabled={disabled}
          />
        </VStack>
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
            transaction={Transaction.ModeOfPayment || "Mode Of Payment"}
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

export default AddModeOfPayment;
