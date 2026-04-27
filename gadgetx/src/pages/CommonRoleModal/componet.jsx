import { useState, useEffect, useRef, useCallback } from "react";
import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Title from "@/components/Title";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import Button from "@/components/Button";
import HStack from "@/components/HStack";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import { Report } from "@/constants/object/report";

const PermissionsDisplay = ({ permissions }) => {
  if (!permissions || Object.keys(permissions).length === 0) {
    return <p>No permissions assigned.</p>;
  }

  const permissionsListStyle = {
    maxHeight: "150px",
    overflowY: "auto",
    marginTop: "5px",
  };

  const listItemStyle = {
    padding: "5px 0",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h4
        style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold" }}
      >
        Permissions
      </h4>
      <div style={permissionsListStyle}>
        {Object.entries(permissions).map(([entity, actions]) => {
          let actionsToDisplay = "";

          if (Array.isArray(actions) && actions.length > 0) {
            actionsToDisplay = actions.join(", ");
          } else if (typeof actions === "string" && actions.trim() !== "") {
            actionsToDisplay = actions;
          } else if (Array.isArray(actions) && actions.length === 0) {
            actionsToDisplay = "";
          } else {
            actionsToDisplay = "N/A";
          }

          return (
            <div key={entity} style={listItemStyle}>
              <strong>{entity}:</strong> {actionsToDisplay}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CommonRoleModal = ({
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  PermissionsModalComponent,

  isOpen,
  onClose,
  mode,
  selectedItem,
  onSuccess,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const localStorageKey = "role_form";

  const defaultForm = { name: "", permissions: {} };

  const [form, setForm] = useState({ ...defaultForm });
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const disabled = mode === "view";

  const { mutateAsync: createItem, isLoading: creating } = useCreateHook();
  const { mutateAsync: updateItem, isLoading: updating } = useUpdateHook();
  const { mutateAsync: deleteItem, isLoading: deleting } = useDeleteHook();

  const ENTITY_NAME = CRUDITEM.ROLE;
  const NAME_LABEL = "Role Name";
  const REPORT_TITLE = Report.Role;
  const TRANSACTION_TYPE = Transaction.Role;

  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem(localStorageKey);
    setForm({ ...defaultForm });
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedItem });
      } else if (mode === "add") {
        const initialData =
          selectedItem ||
          (localStorage.getItem(localStorageKey)
            ? JSON.parse(localStorage.getItem(localStorageKey))
            : defaultForm);
        setForm({ ...defaultForm, ...initialData });
      }

      if (mode !== "view") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedItem]);

  useEffect(() => {
    if (mode === "add" && !selectedItem) {
      localStorage.setItem(localStorageKey, JSON.stringify(form));
    }
  }, [form, mode, selectedItem]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSavePermissions = useCallback((newPermissions) => {
    setForm((prev) => ({ ...prev, permissions: newPermissions }));
    setIsPermissionsModalOpen(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: `Please Enter ${NAME_LABEL}.`,
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    const payload = { ...form };

    try {
      let result;
      if (mode === "edit") {
        await updateItem({ id: selectedItem.id, data: payload });
        showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.UPDATE_SUCCESS });
      } else {
        result = await createItem(payload);
        showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.CREATE_SUCCESS });
        clearLocalStorage();
      }

      onSuccess(result);
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
    if (!selectedItem) return;
    try {
      await deleteItem(selectedItem.id);
      showToast({ crudItem: ENTITY_NAME, crudType: CRUDTYPE.DELETE_SUCCESS });

      onSuccess();
      onClose();
      clearLocalStorage();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message:
          error.response?.data?.error || `Failed to delete ${ENTITY_NAME}.`,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          <Title report={REPORT_TITLE} mode={mode} />
        </ModalHeader>

        <ModalBody>
          {mode === "view" ? (
            <>
              <InputField
                ref={nameInputRef}
                disabled={disabled}
                name="name"
                type="text"
                label={NAME_LABEL}
                placeholder={`Enter ${NAME_LABEL}`}
                value={form.name}
                readOnly
                required
              />
              <PermissionsDisplay permissions={form.permissions} />
            </>
          ) : (
            <HStack>
              <InputField
                ref={nameInputRef}
                disabled={disabled}
                name="name"
                type="text"
                label={NAME_LABEL}
                placeholder={`Enter ${NAME_LABEL}`}
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
          {(mode === "add" || mode === "view") && (
            <CancelButton onClick={onClose} />
          )}

          {mode === "edit" && (
            <DeleteTextButton
              transaction={TRANSACTION_TYPE}
              onDelete={handleDelete}
              isLoading={deleting}
            />
          )}

          {mode !== "view" && (
            <SubmitButton
              isLoading={creating || updating}
              disabled={disabled}
              type={mode}
              onClick={handleSubmit}
            />
          )}
        </ModalFooter>
      </Modal>

      {PermissionsModalComponent && (
        <PermissionsModalComponent
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          onSave={handleSavePermissions}
          initialPermissions={form.permissions}
        />
      )}
    </>
  );
};

export default CommonRoleModal;
