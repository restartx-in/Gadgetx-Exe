import { useState, useEffect, useRef } from "react";
import useCreateSupplier from "@/hooks/api/supplier/useCreateSupplier";
import useUpdateSupplier from "@/hooks/api/supplier/useUpdateSupplier";
import useDeleteSupplier from "@/hooks/api/supplier/useDeleteSupplier";
import useCreateAccount from "@/hooks/api/account/useCreateAccount";

import InputField from "@/components/InputField";
import TextArea from "@/components/TextArea";
import PhoneNoField from "@/components/PhoneNoField";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import { Transaction } from "@/constants/object/transaction";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import Title from "@/apps/user/components/Title";
import { Report } from "@/constants/object/report";
import Select from "@/components/Select";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";


const AddSupplier = ({
  isOpen,
  onClose,
  mode,
  selectedSupplier,
  onSupplierCreated,
}) => {
  const showToast = useToast();

  const defaultForm = {
    name: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });

  const [createLinkedAccount, setCreateLinkedAccount] = useState(false);
  const defaultAccountForm = {
    type: "cash",
    balance: "",
    description: "",
  };
  const [accountForm, setAccountForm] = useState({ ...defaultAccountForm });

  const disabled = mode === "view";

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const paymentTermsRef = useRef(null);

  const { mutateAsync: createSupplier, isLoading: creating } =
    useCreateSupplier();
  const { mutateAsync: updateSupplier, isLoading: updating } =
    useUpdateSupplier();
  const { mutateAsync: deleteSupplier, isLoading: deleting } =
    useDeleteSupplier();
  const { mutateAsync: createAccount, isPending: creatingAccount } =
    useCreateAccount();

  useEffect(() => {
    if (isOpen) {
      setCreateLinkedAccount(false);
      setAccountForm({ ...defaultAccountForm });

      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedSupplier });
      } else {
        const savedForm = localStorage.getItem("supplier_form");
        const initialData = savedForm ? JSON.parse(savedForm) : defaultForm;
        setForm({ ...initialData, ...selectedSupplier });
      }
      if ((mode === "add" || mode === "edit") && nameRef.current) {
        setTimeout(() => nameRef.current.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedSupplier]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("supplier_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("supplier_form");
    setForm({ ...defaultForm });
    setAccountForm({ ...defaultAccountForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAccountChange = (e) =>
    setAccountForm({ ...accountForm, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!(form.name || "").trim()) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Supplier Name.",
        status: TOASTSTATUS.ERROR,
      });
      nameRef.current?.focus();
      return;
    }

    const trimmedEmail = (form.email || "").trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter a valid email address.",
        status: TOASTSTATUS.ERROR,
      });
      emailRef.current?.focus();
      return;
    }

    if (!(form.phone || "").trim()) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Phone number.",
        status: TOASTSTATUS.ERROR,
      });
      phoneRef.current?.focus();
      return;
    }

    const payload = {
      name: (form.name || "").trim(),
      email: (form.email || "").trim(),
      phone: (form.phone || "").trim(),
      address: (form.address || "").trim(),
      payment_terms: (form.payment_terms || "").trim(),
      done_by_id: form.done_by_id || null,
      cost_center_id: form.cost_center_id || null,
      type: 'supplier'
    };

    try {
      if (mode === "edit") {
        await updateSupplier({
          id: selectedSupplier.id,
          supplierData: payload,
        });
        showToast({
          crudItem: CRUDITEM.SUPPLIER,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
        onClose();
      } else {
        const newSupplier = await createSupplier(payload);

        if (createLinkedAccount) {
          try {
            const accountPayload = {
              name: newSupplier.name,
              party_id: newSupplier.id,
              cost_center_id: newSupplier.cost_center_id,
              done_by_id: newSupplier.done_by_id,
              type: accountForm.type,
              description: accountForm.description,
              initial_balance: parseFloat(accountForm.balance) || 0,
            };
            await createAccount(accountPayload);

            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Supplier and Account created successfully.",
              status: TOASTSTATUS.SUCCESS,
            });
          } catch (accErr) {
            console.error("Account creation failed", accErr);
            showToast({
              type: TOASTTYPE.GENARAL,
              message: "Supplier created, but failed to create Account.",
              status: TOASTSTATUS.WARNING,
            });
          }
        } else {
          showToast({
            crudItem: CRUDITEM.SUPPLIER,
            crudType: CRUDTYPE.CREATE_SUCCESS,
          });
        }

        clearLocalStorage();

        if (onSupplierCreated) {
          onSupplierCreated(newSupplier);
        }
        onClose();
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        `Failed to ${mode === "edit" ? "update" : "create"} supplier.`;
      showToast({
        type: TOASTTYPE.GENARAL,
        message: errorMessage,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSupplier(selectedSupplier.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.SUPPLIER,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch {
      showToast({
        crudItem: CRUDITEM.SUPPLIER,
        crudType: CRUDTYPE.DELETE_ERROR,
      });
    }
  };

  const accountTypeOptions = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <Title report={Report.Supplier} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <InputField
          label="Supplier Name"
          ref={nameRef}
          name="name"
          placeholder="Supplier Name"
          value={form.name}
          onChange={handleChange}
          disabled={disabled}
          required
        />
        <InputField
          label="Email"
          ref={emailRef}
          disabled={disabled}
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <PhoneNoField
          ref={phoneRef}
          name="phone"
          placeholder="Phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          disabled={disabled}
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
        <TextArea
          ref={addressRef}
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          disabled={disabled}
          required
        />
        <InputField
          label="Payment Terms"
          ref={paymentTermsRef}
          name="payment_terms"
          placeholder="Payment Terms (e.g., Net 30)"
          value={form.payment_terms}
          onChange={handleChange}
          disabled={disabled}
          required
        />

        {/* --- ADDED: Account Creation Section (Only in Add Mode) --- */}
        {mode !== "view" && (
          <>
            <div>
              <input
                type="checkbox"
                id="createLinkedAccount"
                checked={createLinkedAccount}
                onChange={(e) => setCreateLinkedAccount(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="createLinkedAccount"
                style={{ cursor: "pointer", fontWeight: "500" }}
              >
                Create associated Account?
              </label>
            </div>

            {createLinkedAccount && (
             
              <>
                <Select
                  label="Account Type"
                  name="type"
                  value={accountForm.type}
                  onChange={handleAccountChange}
                  options={accountTypeOptions}
                  required
                />
                <InputFieldWithCalculator
                  name="balance"
                  placeholder="Opening Balance"
                  value={accountForm.balance}
                  onChange={handleAccountChange}
                  required={createLinkedAccount}
                />
                <TextArea
                  label="Account Description (Optional)"
                  name="description"
                  placeholder="Add notes for the account"
                  value={accountForm.description}
                  onChange={handleAccountChange}
                />
                </>
           
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
        }}>
        {mode === 'add' && <CancelButton onClick={onClose} />}
        {mode === 'edit' && (
          <DeleteTextButton
            transaction={Transaction.Supplier}
            onDelete={handleDelete}
            isLoading={deleting}
          />
        )}
        <SubmitButton
          isLoading={creating || updating || creatingAccount}
          disabled={disabled}
          type={mode}
          onClick={handleSubmit}
        />
      </ModalFooter>
    </Modal>
  );
};

export default AddSupplier;
