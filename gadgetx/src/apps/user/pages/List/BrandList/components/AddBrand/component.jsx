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

import { useCreateBrand } from "@/hooks/api/brand/useCreateBrand";
import { useUpdateBrand } from "@/hooks/api/brand/useUpdateBrand";
import { useDeleteBrand } from "@/hooks/api/brand/useDeleteBrand";

const AddBrand = ({ isOpen, onClose, mode, selectedBrand, onBrandCreated }) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const defaultForm = {
    name: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createBrand, isLoading: creating } = useCreateBrand();
  const { mutateAsync: updateBrand, isLoading: updating } = useUpdateBrand();
  const { mutateAsync: deleteBrand, isLoading: deleting } = useDeleteBrand();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedBrand });
      } else if (mode === "add") {
        if (selectedBrand?.name) {
          setForm({ ...defaultForm, name: selectedBrand.name });
          localStorage.removeItem("brand_form");
        } else {
          const savedForm = localStorage.getItem("brand_form");
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedBrand]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("brand_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("brand_form");
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Brand name.",
        status: TOASTSTATUS.ERROR,
      });
      nameInputRef.current?.focus();
      return;
    }

    try {
      const payload = {
        name: form.name,
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
      };

      if (mode === "edit") {
        await updateBrand(
          { id: selectedBrand.id, data: payload },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.BRAND,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newBrand = await createBrand(payload);

        showToast({
          crudItem: CRUDITEM.BRAND,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();
        onClose();

        if (onBrandCreated) {
          onBrandCreated(newBrand);
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
      await deleteBrand(selectedBrand.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.BRAND,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete brand.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <Title report={Report.Brand} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <VStack>
          <InputField
            label="Brand Name"
            ref={nameInputRef}
            disabled={disabled}
            name="name"
            type="text"
            // placeholder="Brand Name"
            value={form.name}
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
            transaction={Transaction.Brand}
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

export default AddBrand;
