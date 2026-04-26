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
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";

import { useCreateEmployeePosition } from "@/hooks/api/employeePosition/useCreateEmployeePosition";
import { useUpdateEmployeePosition } from "@/hooks/api/employeePosition/useUpdateEmployeePosition";
import { useDeleteEmployeePosition } from "@/hooks/api/employeePosition/useDeleteEmployeePosition";

const AddEmployeePosition = ({
  isOpen,
  onClose,
  mode,
  selectedEmployeePosition,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const defaultForm = {
    name: "",
    done_by_id: "",
    cost_center_id: localStorage.getItem("DEFAULT_COST_CENTER") ?? "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";
  // const isDisableCostCenter =
  //   localStorage.getItem("DEFAULT_COST_CENTER") !== "";

  const { mutateAsync: createEmployeePosition, isLoading: creating } =
    useCreateEmployeePosition();
  const { mutateAsync: updateEmployeePosition, isLoading: updating } =
    useUpdateEmployeePosition();
  const { mutateAsync: deleteEmployeePosition, isLoading: deleting } =
    useDeleteEmployeePosition();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedEmployeePosition });
      } else if (mode === "add") {
        setForm({ ...defaultForm });
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedEmployeePosition]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter employee position name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const payload = { ...form };

      if (selectedEmployeePosition && selectedEmployeePosition.id) {
        await updateEmployeePosition({
          id: selectedEmployeePosition.id,
          data: payload,
        });
        showToast({
          crudItem: CRUDITEM.EMPLOYEE_POSITION,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        await createEmployeePosition(payload);
        showToast({
          crudItem: CRUDITEM.EMPLOYEE_POSITION,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
      }
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
      await deleteEmployeePosition(selectedEmployeePosition.id);
      showToast({
        crudItem: CRUDITEM.EMPLOYEE_POSITION,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || "Failed to delete employee position.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <Title report={Report.EmployeePosition} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          label="Name"
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          // placeholder="e.g., Manager, Developer"
          value={form.name}
          onChange={handleChange}
          required
        />
        <DoneByAutoComplete
          value={form.done_by_id}
          onChange={handleChange}
          name="done_by_id"
          disabled={disabled}
          is_edit={mode === "edit"}
        />
        <CostCenterAutoComplete
          value={form.cost_center_id}
          onChange={handleChange}
          name="cost_center_id"
          disabled={disabled || disabled}
          is_edit={mode === "edit"}
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
            transaction={Transaction.EmployeePosition}
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

export default AddEmployeePosition;
