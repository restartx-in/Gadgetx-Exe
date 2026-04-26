import { useState, useEffect, useRef } from "react";
import useCreateLedger from "@/hooks/api/ledger/useCreateLedger";
import useUpdateLedger from "@/hooks/api/ledger/useUpdateLedger";
import useDeleteLedger from "@/hooks/api/ledger/useDeleteLedger";
import { Transaction } from "@/constants/object/transaction";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import Title from "@/apps/user/components/Title";
import { Report } from "@/constants/object/report";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";


const AddLedger = ({ isOpen, onClose, mode, selectedLedger, onLedgerCreated }) => {
  const showToast = useToast();
  const nameRef = useRef(null);
  const balanceRef = useRef(null);

  const defaultForm = {
    name: "",
    balance: "0.00",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createLedger, isLoading: creating } = useCreateLedger();
  const { mutateAsync: updateLedger, isLoading: updating } = useUpdateLedger();
  const { mutateAsync: deleteLedger, isLoading: deleting } = useDeleteLedger();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        // Ensure balance is formatted as a string for input fields
        setForm({ 
            ...defaultForm, 
            ...selectedLedger, 
            balance: selectedLedger?.balance !== undefined ? String(selectedLedger.balance) : "0.00"
        });
      } else {
        const savedForm = localStorage.getItem("ledger_form");
        setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm, ...selectedLedger });
      }
    }
    if (mode !== "view") {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, mode, selectedLedger]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("ledger_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("ledger_form");
    setForm({ ...defaultForm });
  };

  const handleDelete = async () => {
    try {
      await deleteLedger(selectedLedger.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.LEDGER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        crudItem: CRUDITEM.LEDGER,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a ledger name.",
        status: TOASTSTATUS.ERROR,
      });
      nameRef.current?.focus();
      return;
    }

    if (form.balance === "" || isNaN(parseFloat(form.balance))) {
        showToast({
            type: TOASTTYPE.GENARAL,
            message: "Please enter a valid starting balance.",
            status: TOASTSTATUS.ERROR,
        });
        balanceRef.current?.focus();
        return;
    }
    
    // Prepare data (Ledger doesn't use FormData/files)
    const dataToSend = { ...form };

    // Convert numeric strings to actual numbers/floats
    dataToSend.balance = parseFloat(dataToSend.balance);
    if (dataToSend.done_by_id) dataToSend.done_by_id = parseInt(dataToSend.done_by_id, 10);
    if (dataToSend.cost_center_id) dataToSend.cost_center_id = parseInt(dataToSend.cost_center_id, 10);
    
    try {
      if (mode === "edit") {
        await updateLedger(
          { id: selectedLedger.id, data: dataToSend },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.LEDGER,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newLedger = await createLedger(dataToSend);

        showToast({
          crudItem: CRUDITEM.LEDGER,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();
        onClose();

        if (onLedgerCreated) {
          onLedgerCreated(newLedger);
        }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Ledger} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          label="Ledger Name"
          disabled={disabled}
          ref={nameRef}
          name="name"
          type="text"
          placeholder="Ledger Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <InputField
          label="Starting Balance"
          ref={balanceRef}
          name="balance"
          placeholder="Starting Balance"
          value={form.balance}
          onChange={handleChange}
          disabled={disabled}
          required
          type="number"
          step="0.01"
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
            transaction={Transaction.Ledger}
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

export default AddLedger;