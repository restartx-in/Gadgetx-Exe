import { useState, useEffect, useRef } from "react";
import useCreateAccount from "@/hooks/api/account/useCreateAccount";
import useUpdateAccount from "@/hooks/api/account/useUpdateAccount";
import useDeleteAccount from "@/hooks/api/account/useDeleteAccount";
import { Transaction } from "@/constants/object/transaction";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { useToast } from "@/context/ToastContext";
import { Report } from "@/constants/object/report";
import DoneByAutoCompleteWithAddOption from '@/apps/user/components/DoneByAutoCompleteWithAddOption';
import CostCenterAutoCompleteWithAddOption from '@/apps/user/components/CostCenterAutoCompleteWithAddOption';
import SupplierAutoCompleteWithAddOption from '@/apps/user/components/SupplierAutoCompleteWithAddOption';

import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import InputField from "@/components/InputField";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import Title from "@/apps/user/components/Title";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import InputFieldWithCalculator from '@/apps/user/components/InputFieldWithCalculator'

import "./style.scss";

const DRAFT_STORAGE_KEY = "account_form_draft";

const AddAccount = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  selectedAccount,
  onDeposit,
  onWithdrawal,
  onShowTransactions,
  onAccountCreated,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);

  const defaultForm = {
    name: "",
    type: "cash",
    description: "",
    balance: "",
    done_by_id: "",
    cost_center_id: "",
    party_id: "", // ADDED: Initialize party_id
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createAccount, isPending: creating } =
    useCreateAccount();
  const { mutateAsync: updateAccount, isPending: updating } =
    useUpdateAccount();
  const { mutateAsync: deleteAccount, isPending: deleting } =
    useDeleteAccount();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedAccount, balance: selectedAccount?.balance || 0 });
      } else if (mode === "add") {
        if (selectedAccount?.name) {
          setForm({ ...defaultForm, name: selectedAccount.name });
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } else {
          const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedAccount]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleDelete = async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount(selectedAccount.id);
      showToast({
        crudItem: CRUDITEM.ACCOUNT,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete account.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter an account name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const commonPayload = {
        name: form.name,
        type: form.type,
        description: form.description,
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
        party_id: form.party_id || null, // ADDED: Include party_id in payload
      };

      if (mode === "edit") {
        await updateAccount({ id: selectedAccount.id, data: commonPayload });
        showToast({
          crudItem: CRUDITEM.ACCOUNT,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const payload = {
          ...commonPayload,
          initial_balance: parseFloat(form.balance) || 0, 
        };
        
        const newAccount = await createAccount(payload);
        showToast({
          crudItem: CRUDITEM.ACCOUNT,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorageAndResetForm();
        
        if (onAccountCreated) {
          onAccountCreated(newAccount);
        }
      }

      if (onSuccess) onSuccess();
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

  const handleDepositClick = () => {
    if (selectedAccount) onDeposit(selectedAccount);
  };

  const handleWithdrawalClick = () => {
    if (selectedAccount) onWithdrawal(selectedAccount);
  };

  const handleShowTransactionsClick = () => {
    if (selectedAccount) onShowTransactions(selectedAccount);
  };

  const accountTypeOptions = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Accounts} mode={mode} />
      </ModalHeader>

      <ModalBody>
        {(mode === "edit" || mode === "view") && (
          <div className="add_account__quick-actions">
            <button className="btn btn-deposit" onClick={handleDepositClick}>
              Deposit
            </button>
            <button
              className="btn btn-withdrawal"
              onClick={handleWithdrawalClick}
            >
              Withdrawal
            </button>
          </div>
        )}

        <InputField
          label="Account Name"
          ref={nameInputRef}
          disabled={disabled}
          name="name"
          type="text"
          placeholder="e.g. Main Cash, HDFC Bank"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Select
          name="type"
          value={form.type}
          onChange={handleChange}
          options={accountTypeOptions}
          disabled={disabled}
          required
          className="select_field"
        />
        
        <SupplierAutoCompleteWithAddOption
            placeholder="Select Party (Optional)"
            name="party_id"
            value={form.party_id}
            onChange={handleChange}
            disabled={disabled}
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
         <InputFieldWithCalculator
          name="balance" 
          placeholder={mode === 'add' ? "Opening Balance" : "Current Balance"}
          value={form.balance}
          onChange={handleChange}
          disabled={disabled || mode === 'edit'} 
          required={mode === 'add'}
        />
        <TextArea
          label="Description (Optional)"
          disabled={disabled}
          name="description"
          placeholder="Add any relevant notes here"
          value={form.description}
          onChange={handleChange}
        />
        {(mode === "edit" || mode === "view") && (
          <div className="add_account__bottom-actions">
            <button
              className="btn-secondaryy"
              onClick={handleShowTransactionsClick}
            >
              Show Transactions
            </button>
          </div>
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
            transaction={Transaction.Account}
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
  );
};

export default AddAccount;