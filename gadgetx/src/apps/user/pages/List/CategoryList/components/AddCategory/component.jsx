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

import { useCreateCategory } from "@/hooks/api/category/useCreateCategory";
import { useUpdateCategory } from "@/hooks/api/category/useUpdateCategory";
import { useDeleteCategory } from "@/hooks/api/category/useDeleteCategory";

const AddCategory = ({
  isOpen,
  onClose,
  mode,
  selectedCategory,
  onCategoryCreated,
}) => {
  const showToast = useToast();
  const nameInputRef = useRef(null);
  const defaultForm = {
    name: "",
    done_by_id: "",
    cost_center_id: "",
  };

  const [form, setForm] = useState({ ...defaultForm });
  const disabled = mode === "view";

  const { mutateAsync: createCategory, isLoading: creating } =
    useCreateCategory();
  const { mutateAsync: updateCategory, isLoading: updating } =
    useUpdateCategory();
  const { mutateAsync: deleteCategory, isLoading: deleting } =
    useDeleteCategory();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        setForm({ ...defaultForm, ...selectedCategory });
      } else if (mode === "add") {
        if (selectedCategory?.name) {
          setForm({ ...defaultForm, name: selectedCategory.name });
          localStorage.removeItem("category_form");
        } else {
          const savedForm = localStorage.getItem("category_form");
          setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
        }
      }
      if (mode === "add" || mode === "edit") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedCategory]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem("category_form", JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorage = () => {
    localStorage.removeItem("category_form");
    setForm({ ...defaultForm });
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Enter Category name.",
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
        await updateCategory(
          { id: selectedCategory.id, data: payload },
          {
            onSuccess: () => {
              onClose();
            },
          }
        );
        showToast({
          crudItem: CRUDITEM.CATEGORY,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const newCategory = await createCategory(payload);

        showToast({
          crudItem: CRUDITEM.CATEGORY,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });

        clearLocalStorage();
        onClose();

        if (onCategoryCreated) {
          onCategoryCreated(newCategory);
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
      await deleteCategory(selectedCategory.id, {
        onSuccess: () => {
          onClose();
          clearLocalStorage();
        },
      });
      showToast({
        crudItem: CRUDITEM.CATEGORY,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete category.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <Title report={Report.Category} mode={mode} />
      </ModalHeader>
      <ModalBody>
        <VStack>
          <InputField
            label="Category Name"
            ref={nameInputRef}
            disabled={disabled}
            name="name"
            type="text"
            placeholder="Category Name"
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
            transaction={Transaction.Category}
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

export default AddCategory;
