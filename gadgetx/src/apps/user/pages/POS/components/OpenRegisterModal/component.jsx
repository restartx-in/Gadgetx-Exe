import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import InputField from "@/components/InputField";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance"; 
import SubmitButton from "@/components/SubmitButton";
import { useToast } from "@/context/ToastContext";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import useCreateRegisterSession from "@/apps/user/hooks/api/registerSession/useCreateRegisterSession";

import "./style.scss";

const OpenRegisterModal = ({ isOpen, onClose, onRegisterOpened }) => {
  const showToast = useToast();

  const defaultCostCenter = localStorage.getItem("DEFAULT_COST_CENTER") ?? "";

  // Default State
  const defaultForm = {
    done_by_id: "",
    cost_center_id: defaultCostCenter,
    ledger_id: "",
    opening_cash: "",
    opening_note: "",
  };
  const [form, setForm] = useState({ ...defaultForm });

  const { mutateAsync: openSession, isPending: isOpening } =
    useCreateRegisterSession();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ ...defaultForm });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!form.done_by_id || !form.ledger_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Done By and Ledger are required.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    try {
      const payload = {
        done_by_id: form.done_by_id,
        ledger_id: form.ledger_id,
        cost_center_id: form.cost_center_id || null,
        opening_cash: parseFloat(form.opening_cash) || 0,
        opening_note: form.opening_note,
      };

      await openSession(payload);

      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Register Opened Successfully",
        status: TOASTSTATUS.SUCCESS,
      });

      if (onRegisterOpened) {
        onRegisterOpened(form.done_by_id);
      }
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to open register";
      if (msg.includes("already has an open session")) {
        if (onRegisterOpened) {
          onRegisterOpened(form.done_by_id);
        }
        showToast({
          type: TOASTTYPE.GENARAL,
          message: "Session restored.",
          status: TOASTSTATUS.INFO,
        });
        onClose();
      } else {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: msg,
          status: TOASTSTATUS.ERROR,
        });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="register-modal"
      size="md"
    >
      <ModalHeader className="register-modal__header">
        <h3 className="fs18">Open Register</h3>
      </ModalHeader>

      <ModalBody className="register-modal__body">
        <p className="modal-instruction fs16">
          Please open a register session to continue.
        </p>

        <div className="form-group">
          <DoneByAutoCompleteWithAddOption
            value={form.done_by_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, done_by_id: e.target.value }))
            }
            placeholder="Select User"
          />
        </div>
         <div className="form-group">
          <LedgerAutoCompleteWithAddOptionWithBalance
            value={form.ledger_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ledger_id: e.target.value }))
            }
            placeholder="Select Ledger (Cash/Bank Account)"
            filters={{ is_party: false }} 
          />
        </div>

        <div className="form-group">
          <CostCenterAutoCompleteWithAddOption
            value={form.cost_center_id}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cost_center_id: e.target.value }))
            }
            placeholder="Select Cost Center (Optional)"
          />
        </div>

        <InputField
          placeholder="Opening Cash"
          type="number"
          value={form.opening_cash}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, opening_cash: e.target.value }))
          }
        />

        <InputField
          placeholder="Opening note"
          value={form.opening_note}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, opening_note: e.target.value }))
          }
        />
      </ModalBody>

      <ModalFooter className="register-modal__footer">
        <SubmitButton
          onClick={handleSubmit}
          label="Open Register"
          isLoading={isOpening}
        />
      </ModalFooter>
    </Modal>
  );
};

export default OpenRegisterModal;
