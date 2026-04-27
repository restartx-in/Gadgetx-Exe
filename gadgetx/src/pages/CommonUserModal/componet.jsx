import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import Title from "@/components/Title";
import { Report } from "@/constants/object/report";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import InputField from "@/components/InputField";

const CommonUserModal = ({
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  RoleSelectorComponent,

  isOpen,
  onClose,
  mode,
  selectedUser,
  onSuccess,
}) => {
  const showToast = useToast();
  const usernameInputRef = useRef(null);
  const roleRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const defaultForm = { username: "", password: "", role_id: "" };
  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createItem, isLoading: creating } = useCreateHook();
  const { mutateAsync: updateItem, isLoading: updating } = useUpdateHook();
  const { mutateAsync: deleteItem, isLoading: deleting } = useDeleteHook();

  const ENTITY_NAME = CRUDITEM.USER;
  const REPORT_TITLE = Report.User;
  const TRANSACTION_TYPE = Transaction.User;

  useEffect(() => {
    if (isOpen) {
      if ((mode === "edit" || mode === "view") && selectedUser) {
        setForm({
          ...defaultForm,
          username: selectedUser.username,
          role_id: selectedUser.role_id,
        });
      } else {
        setForm({ ...defaultForm });
      }
      if (mode !== "view")
        setTimeout(() => usernameInputRef.current?.focus(), 100);
      setShowPassword(false);
    }
  }, [isOpen, mode, selectedUser]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Username is required.",
        status: TOASTSTATUS.ERROR,
      });
      usernameInputRef.current?.focus();
      return;
    }
    if (!form.role_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a role.",
        status: TOASTSTATUS.ERROR,
      });
      roleRef.current?.focus();
      return;
    }
    if (mode === "add" && !form.password) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Password is required for new users.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    const payload = { ...form };
    if (!payload.password) delete payload.password;

    try {
      if (mode === "edit") {
        await updateItem({ userId: selectedUser.id, userData: payload });
        showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.UPDATE_SUCCESS });
      } else {
        await createItem(payload);
        showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.CREATE_SUCCESS });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "An unexpected error occurred.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: errorMsg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteItem(selectedUser.id);
      showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.DELETE_SUCCESS });
      onSuccess();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete user.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={REPORT_TITLE} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          ref={usernameInputRef}
          disabled={disabled}
          name="username"
          type="text"
          label="Username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <div>
          <InputField
            disabled={disabled}
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder={
              mode === "edit" ? "Leave blank to keep current" : "Password"
            }
            value={form.password}
            onChange={handleChange}
            required={mode === "add"}
          />
        </div>
        {RoleSelectorComponent && (
          <RoleSelectorComponent
            ref={roleRef}
            disabled={disabled}
            name="role_id"
            value={form.role_id}
            onChange={handleChange}
            required
          />
        )}
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
            transaction={TRANSACTION_TYPE}
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

export default CommonUserModal;
