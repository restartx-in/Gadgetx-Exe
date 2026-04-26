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

import { useCreateUnit } from "@/hooks/api/unitType/useCreateUnit";
import { useUpdateUnit } from "@/hooks/api/unitType/useUpdateUnit";
import { useDeleteUnit } from "@/hooks/api/unitType/useDeleteUnit";

const AddUnit = ({ isOpen, onClose, mode, selectedUnit, onUnitCreated }) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const defaultForm = {
    name: "",
    symbol: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createUnit, isLoading: creating } = useCreateUnit();
  const { mutateAsync: updateUnit, isLoading: updating } = useUpdateUnit();
  const { mutateAsync: deleteUnit, isLoading: deleting } = useDeleteUnit();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedUnit });
      } else if (mode === "add") {
        if (selectedUnit?.name) {
          setForm({ ...defaultForm, name: selectedUnit.name });
          localStorage.removeItem("unit_form");
        } else {
          const savedForm = localStorage.getItem("unit_form");
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedUnit]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("unit_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("unit_form");
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.symbol) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter both Unit Name and Symbol.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const payload = {
        name: form.name,
        symbol: form.symbol,
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
      };

      if (mode === "edit") {
        await updateUnit(
          { id: selectedUnit.id, data: payload },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.Unit,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newUnit = await createUnit(payload);
        showToast({
          crudItem: CRUDITEM.Unit,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorage();
        onClose();
        if (onUnitCreated) {
          onUnitCreated(newUnit);
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
      await deleteUnit(selectedUnit.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.Unit,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete unit.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalHeader>
        <Title report={Report.Unit} mode={mode} />
      </ModalHeader>
      <ModalBody >
        <VStack>
          <InputField
            label="Unit Name"
            ref={nameInputRef}
            disabled={disabled}
            name="name"
            type="text"
            placeholder="Unit Name (e.g., Piece, Kilogram)"
            value={form.name}
            onChange={handleChange}
            required
          />
          <InputField
            label="Symbol"
            disabled={disabled}
            name="symbol"
            type="text"
            placeholder="Symbol (e.g., pcs, kg)"
            value={form.symbol}
            onChange={handleChange}
            required
          />
          <DoneByAutoCompleteWithAddOption
            placeholder="Select Done By"
            name="done_by_id"
            value={form.done_by_id}
            onChange={handleChange}
            disabled={disabled}
          />
          <CostCenterAutoCompleteWithAddOption
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
            transaction={Transaction.Unit}
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

export default AddUnit;