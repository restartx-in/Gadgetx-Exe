import React, { useEffect, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaPlus, FaTrash } from "react-icons/fa";

import InputField from "@/components/InputField";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import VStack from "@/components/VStack";
import HStack from "@/components/HStack";
import SelectField from "@/components/SelectField";
import PermissionSwitchButton from "@/components/PermissionSwitchButton";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Transaction } from "@/constants/object/transaction";
import Title from "@/components/Title";
import { Report } from "@/constants/object/report";
import { onFormError } from "@/utils/formUtils";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import DeleteTextButton from "@/components/DeleteTextButton";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
} from "@/components/Table";
import "./style.scss";

const DRAFT_PREFIX = "category_form_draft_";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  done_by_id: z.union([z.string(), z.number()]).optional().nullable(),
  cost_center_id: z.union([z.string(), z.number()]).optional().nullable(),
  custom_fields: z.array(
    z.object({
      label: z.string().min(1, "Label is required"),
      type: z.string().min(1, "Type is required"),
      is_required: z.boolean().default(false),
    })
  ).optional(),
});

const CommonAddCategory = ({
  isOpen,
  onClose,
  mode,
  selectedCategory,
  onCategoryCreated,
  // Injected Hooks
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
  useGetByIdHook, // Added fetch hook
  // Injected Components
  DoneByComponent,
  CostCenterComponent,
  appTag = "common",
}) => {
  const showToast = useToast();
  const disabled = mode === "view";
  const draftKey = `${DRAFT_PREFIX}${appTag}`;

  const isSubmittingSuccess = useRef(false);

  const { mutateAsync: createCategory, isPending: creating } = useCreateHook();
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateHook();
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteHook();

  const defaultValues = {
    name: "",
    done_by_id: null,
    cost_center_id: null,
    custom_fields: [],
  };

  const { control, handleSubmit, reset, watch, setFocus, trigger } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "custom_fields",
  });

  const { data: fullCategory, isLoading: fetchingFull } = useGetByIdHook
    ? useGetByIdHook(selectedCategory?.id)
    : { data: null, isLoading: false };

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        if (fullCategory) {
          reset({ ...defaultValues, ...fullCategory });
        } else {
          reset({ ...defaultValues, ...selectedCategory });
        }
      } else {
        const savedDraft = localStorage.getItem(draftKey);
        if (selectedCategory?.name) {
          reset({ ...defaultValues, name: selectedCategory.name });
        } else {
          reset(savedDraft ? JSON.parse(savedDraft) : defaultValues);
        }
      }
      if (mode !== "view") setTimeout(() => setFocus("name"), 100);
    } else {
      reset(defaultValues);
    }
  }, [isOpen, mode, selectedCategory, reset, setFocus, draftKey, fullCategory]);

  useEffect(() => {
    if (mode === "add" && isOpen && !isSubmittingSuccess.current) {
      localStorage.setItem(draftKey, JSON.stringify(watchedFields));
    }
  }, [watchedFields, mode, isOpen, draftKey]);

  const onFormSubmit = async (data) => {
    const payload = {
      name: data.name,
      done_by_id: data.done_by_id ? Number(data.done_by_id) : null,
      cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : null,
      custom_fields: data.custom_fields || [],
    };

    try {
      if (mode === "edit") {
        await updateCategory({ id: selectedCategory.id, data: payload });
        showToast({
          crudItem: CRUDITEM.CATEGORY,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const res = await createCategory(payload);
        isSubmittingSuccess.current = true;
        localStorage.removeItem(draftKey);
        reset(defaultValues);
        showToast({
          crudItem: CRUDITEM.CATEGORY,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        localStorage.removeItem(draftKey);
        onCategoryCreated?.(res.data || res);
      }
      onClose();
    } catch (err) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: err.response?.data?.error || "An error occurred.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory?.id) return;
    try {
      await deleteCategory(selectedCategory.id);
      showToast({
        crudItem: CRUDITEM.CATEGORY,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Failed to delete.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <Title report={Report.Category} mode={mode} />
      </ModalHeader>
      <form
        onSubmit={handleSubmit(onFormSubmit, (e) => onFormError(e, showToast))}
      >
        <ModalBody>
          {fetchingFull ? (
            <Loader />
          ) : (
            <VStack spacing={20}>
              <HStack spacing={10} style={{ alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        {...field}
                        label="Category Name"
                        disabled={disabled}
                        required
                      />
                    )}
                  />
                </div>
              </HStack>

              <HStack spacing={15}>
                <div style={{ flex: 1 }}>
                  <Controller
                    name="done_by_id"
                    control={control}
                    render={({ field }) => (
                      <DoneByComponent
                        {...field}
                        placeholder="Select Done By"
                        disabled={disabled}
                      />
                    )}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <Controller
                    name="cost_center_id"
                    control={control}
                    render={({ field }) => (
                      <CostCenterComponent
                        {...field}
                        placeholder="Select Cost Center"
                        disabled={disabled}
                      />
                    )}
                  />
                </div>
              </HStack>

              {fields.length > 0 || !disabled ? (
                <div className="custom-fields-section">
                  <div className="custom-fields-header">Custom Fields</div>
                  <div className="field-table-container">
                    <Table>
                      <Thead>
                        <Tr>
                          <Th style={{ width: "45%" }}>Label</Th>
                          <Th style={{ width: "30%" }}>Type</Th>
                          <Th style={{ width: "10%", textAlign: "center" }}>
                            Req.
                          </Th>
                          <Th style={{ width: "15%", textAlign: "right", paddingRight: "20px" }}>
                            {!disabled && (
                              <div
                                className="btn-icon add-header"
                                onClick={() =>
                                  append({
                                    label: "",
                                    type: "text",
                                    is_required: false,
                                  })
                                }
                                title="Add Custom Field"
                              >
                                <FaPlus />
                              </div>
                            )}
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {fields.map((item, index) => (
                          <Tr key={item.id} className="view-row">
                            <Td>
                              <Controller
                                name={`custom_fields.${index}.label`}
                                control={control}
                                render={({ field, fieldState }) => (
                                  <InputField
                                    {...field}
                                    placeholder="Field Label"
                                    disabled={disabled}
                                    error={fieldState.error}
                                    isLabel={false}
                                  />
                                )}
                              />
                            </Td>
                            <Td>
                              <Controller
                                name={`custom_fields.${index}.type`}
                                control={control}
                                render={({ field }) => (
                                  <SelectField
                                    {...field}
                                    placeholder="Type"
                                    disabled={disabled}
                                    isLabel={false}
                                    menuPortalTarget={document.body}
                                    options={[
                                      { value: "text", label: "Text" },
                                      { value: "number", label: "Number" },
                                      { value: "date", label: "Date" },
                                      { value: "boolean", label: "Boolean" },
                                      { value: "dropdown", label: "Dropdown" },
                                      { value: "textarea", label: "TextArea" },
                                    ]}
                                  />
                                )}
                              />
                            </Td>
                            <Td className="text-center">
                              <Controller
                                name={`custom_fields.${index}.is_required`}
                                control={control}
                                render={({ field }) => (
                                  <input
                                    type="checkbox"
                                    className="checkbox-input"
                                    checked={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.checked)
                                    }
                                    disabled={disabled}
                                  />
                                )}
                              />
                            </Td>
                            <Td>
                              {!disabled && (
                                <HStack spacing={5} justifyContent="center">
                                  <div
                                    className="btn-icon add"
                                    onClick={() =>
                                      append({
                                        label: "",
                                        type: "text",
                                        is_required: false,
                                      })
                                    }
                                    title="Add Row"
                                  >
                                    <FaPlus />
                                  </div>
                                  <div
                                    className="btn-icon delete"
                                    onClick={() => remove(index)}
                                    title="Remove Row"
                                  >
                                    <FaTrash />
                                  </div>
                                </HStack>
                              )}
                            </Td>
                          </Tr>
                        ))}

                        {!disabled && fields.length === 0 && (
                          <Tr className="empty-row">
                            <Td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                              No custom fields added yet. Click the + button in the header to add one.
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </div>
                </div>
              ) : null}
            </VStack>
          )}
        </ModalBody>
      </form>
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
          onClick={handleSubmit(onFormSubmit)}
        />
      </ModalFooter>
    </Modal>
  );
};

export default CommonAddCategory;
