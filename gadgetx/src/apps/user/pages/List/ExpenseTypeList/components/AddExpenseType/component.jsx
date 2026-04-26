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

import { useCreateExpenseType } from "@/hooks/api/expenseType/useCreateExpenseType";
import { useUpdateExpenseType } from "@/hooks/api/expenseType/useUpdateExpenseType";
import { useDeleteExpenseType } from "@/hooks/api/expenseType/useDeleteExpenseType";

// --- CHANGE 1: Accept the new 'onExpenseTypeCreated' prop ---
const AddExpenseType = ({
  isOpen,
  onClose,
  mode,
  selectedExpenseType,
  onExpenseTypeCreated,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const defaultForm = {
    name: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createExpenseType, isLoading: creating } =
    useCreateExpenseType();
  const { mutateAsync: updateExpenseType, isLoading: updating } =
    useUpdateExpenseType();
  const { mutateAsync: deleteExpenseType, isLoading: deleting } =
    useDeleteExpenseType();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedExpenseType });
      } else if (mode === "add") {
        // This existing logic correctly handles pre-filling the name
        if (selectedExpenseType?.name) {
          setForm({ ...defaultForm, name: selectedExpenseType.name });
          localStorage.removeItem("expense_type_form");
        } else {
          const savedForm = localStorage.getItem("expense_type_form");
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedExpenseType]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("expense_type_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("expense_type_form");
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // --- CHANGE 2: Updated handleSubmit to call the callback on creation ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Expense Type name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const payload = { ...form };

      if (mode === "edit") {
        // Simplified condition
        await updateExpenseType(
          { id: selectedExpenseType.id, data: payload },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.ExpenseType,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        // Logic for creating a new expense type
        const newExpenseType = await createExpenseType(payload); // Await the result

        showToast({
          crudItem: CRUDITEM.ExpenseType,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();
        onClose(); // Close the modal

        // If the callback function exists, call it with the new expense type
        if (onExpenseTypeCreated) {
          onExpenseTypeCreated(newExpenseType);
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
      await deleteExpenseType(selectedExpenseType.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.ExpenseType,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || "Failed to delete expense type.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <Title report={Report.ExpenseType} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          label="Expense Type Name"
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          placeholder="Expense Type Name"
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
            transaction={Transaction.ExpenseType}
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

export default AddExpenseType;
