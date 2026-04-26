import { useState, useEffect, useRef } from "react";
import useDeleteRole from "@/hooks/api/role/useDeleteRole";
import useCreateRole from "@/hooks/api/role/useCreateRole";
import useUpdateRole from "@/hooks/api/role/useUpdateRole";
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
import Button from "@/components/Button";
import HStack from "@/components/HStack";
import PermissionsModal from "@/components/PermissionsModal";

const AddRole = ({ isOpen, onClose, mode, selectedRole, onSuccess }) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);

  const defaultForm = {
    name: "",
    permissions: {},
  };

  const [form, setForm] = useState({ ...defaultForm });
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const disabled = mode === "view";

  const { mutateAsync: createRole, isLoading: creating } = useCreateRole();
  const { mutateAsync: updateRole, isLoading: updating } = useUpdateRole();
  const { mutateAsync: deleteRole, isLoading: deleting } = useDeleteRole();

  useEffect(() => {
    if (isOpen) {
      // This is updated - Logic now correctly handles all modes, including from autocomplete
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedRole });
      } else if (mode === "add") {
        // If opened from autocomplete, selectedRole will be a partial object like { name: '...' }
        // If opened from the main "Add" button, selectedRole will be null.
        const initialData =
          selectedRole ||
          (localStorage.getItem("role_form")
            ? JSON.parse(localStorage.getItem("role_form"))
            : defaultForm);
        setForm({ ...defaultForm, ...initialData });
      }

      if (mode !== "view") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedRole]);

  useEffect(() => {
    // Only save to localStorage for a brand new form, not one from autocomplete
    if (mode === "add" && !selectedRole) {
      localStorage.setItem("role_form", JSON.stringify(form));
    }
  }, [form, mode, selectedRole]);

  const clearLocalStorage = () => {
    localStorage.removeItem("role_form");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSavePermissions = (newPermissions) => {
    setForm((prev) => ({ ...prev, permissions: newPermissions }));
  };

  // This is updated - Correctly uses await with mutateAsync
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a role name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    const payload = { ...form };

    try {
      let result;
      if (mode === "edit") {
        await updateRole({ id: selectedRole.id, data: payload });
        showToast({
          crudItem: CRUDITEM.ROLE,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        result = await createRole(payload); // Await the promise
        showToast({
          crudItem: CRUDITEM.ROLE,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorage();
      }

      // Call success functions AFTER the await is complete
      onSuccess(result); // Pass the new role back to the autocomplete if it was created
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

  // This is updated - Correctly uses await with mutateAsync
  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id); // Await the promise

      // Call success functions AFTER the await is complete
      showToast({ crudItem: CRUDITEM.ROLE, crudType: CRUDTYPE.DELETE_SUCCESS });
      clearLocalStorage();
      onSuccess();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete role.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <Title report={Report.Role} mode={mode} />
        </ModalHeader>
        <ModalBody>
          <HStack>
            <InputField
              ref={nameInputRef}
              disabled={disabled}
              name="name"
              type="text"
              label="Role Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <div className="permissions-button-container">
              <label className="form-label">&nbsp;</label>
              <Button
                variant="secondary"
                onClick={() => setIsPermissionsModalOpen(true)}
                disabled={disabled}
              >
                Set Permissions
              </Button>
            </div>
          </HStack>
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
              transaction={Transaction.Role}
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

      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        onSave={handleSavePermissions}
        initialPermissions={form.permissions}
      />
    </>
  );
};

export default AddRole;
