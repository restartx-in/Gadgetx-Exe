
import { useState, useEffect, useRef } from "react";
import useCreateUser from "@/hooks/api/user/useCreateUser";
import useUpdateUserByAdmin from "@/hooks/api/user/useUpdateUserByAdmin";
import useDeleteUser from "@/hooks/api/user/useDeleteUser";
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
import InputField from "@/components/InputField";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import RoleAutoCompleteWithAddOption from "@/apps/user/components/RoleAutoCompleteWithAddOption"; 
import "./style.scss";

const AddUser = ({ isOpen, onClose, mode, selectedUser, onSuccess }) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const roleRef = useRef(null); // This is updated - Added ref for role field

  const [showPassword, setShowPassword] = useState(false);
  const defaultForm = { username: "", password: "", role_id: "" };
  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createUser, isLoading: creating } = useCreateUser();
  const { mutateAsync: updateUser, isLoading: updating } = useUpdateUserByAdmin();
  const { mutateAsync: deleteUser, isLoading: deleting } = useDeleteUser();

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
      if (mode !== "view") setTimeout(() => nameInputRef.current?.focus(), 100);
      setShowPassword(false);
    }
  }, [isOpen, mode, selectedUser]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username) {
      showToast({ type: TOASTTYPE.GENARAL, message: "Username is required.", status: TOASTSTATUS.ERROR });
      nameInputRef.current?.focus();
      return;
    }
    if (!form.role_id) {
      showToast({ type: TOASTTYPE.GENARAL, message: "Please select a role.", status: TOASTSTATUS.ERROR });
      roleRef.current?.focus();
      return;
    }
    if (mode === "add" && !form.password) {
      showToast({ type: TOASTTYPE.GENARAL, message: "Password is required for new users.", status: TOASTSTATUS.ERROR });
      return;
    }
    const payload = { ...form };
    if (!payload.password) delete payload.password;

    try {
      if (selectedUser) {
        await updateUser({ userId: selectedUser.id, userData: payload });
        showToast({ crudItem: CRUDITEM.USER, crudType: CRUDTYPE.UPDATE_SUCCESS });
      } else {
        await createUser(payload);
        showToast({ crudItem: CRUDITEM.USER, crudType: CRUDTYPE.CREATE_SUCCESS });
      }
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "An unexpected error occurred.";
      showToast({ type: TOASTTYPE.GENARAL, message: errorMsg, status: TOASTSTATUS.ERROR });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      showToast({ crudItem: CRUDITEM.USER, crudType: CRUDTYPE.DELETE_SUCCESS });
      onSuccess();
      onClose();
    } catch (error) {
      showToast({ type: TOASTTYPE.GENARAL, message: error.response?.data?.error || "Failed to delete user.", status: TOASTSTATUS.ERROR });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.User} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          ref={nameInputRef}
          disabled={disabled}
          name="username"
          type="text"
          label="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <div className="password-input-container">
          <InputField
          
            disabled={disabled}
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder={mode === "edit" ? "Leave blank to keep current" : "Password"}
            value={form.password}
            onChange={handleChange}
            required={mode === "add"}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {/* This is updated - Replaced simple select with the new autocomplete component */}
        <RoleAutoCompleteWithAddOption
          ref={roleRef}
          disabled={disabled}
          name="role_id"
          value={form.role_id}
          onChange={handleChange}
          required
        />
      </ModalBody>
      <ModalFooter style={{ width: "100%", display: "flex", justifyContent: "flex-end", gap: "16px" }}>
        {mode === "add" && <CancelButton onClick={onClose} />}
        {mode === "edit" && (
          <DeleteTextButton
            transaction={Transaction.User}
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

export default AddUser;