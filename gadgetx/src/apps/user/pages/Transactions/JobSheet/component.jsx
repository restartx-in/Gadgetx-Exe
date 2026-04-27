import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useCreateJobSheet from "@/apps/user/hooks/api/jobSheets/useCreateJobSheet";
import { useJobSheetInvoiceNo } from "@/apps/user/hooks/api/jobSheetInvoiceNo/useJobSheetInvoiceNo";
import useUpdateJobSheet from "@/apps/user/hooks/api/jobSheets/useUpdateJobSheet";
import useDeleteJobSheet from "@/apps/user/hooks/api/jobSheets/useDeleteJobSheet";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import useEmployees from "@/apps/user/hooks/api/employee/useEmployees";
import DateField from "@/components/DateField";
import Select from "@/components/Select";
import HStack from "@/components/HStack";
import TextArea from "@/components/TextArea";
import CancelButton from "@/components/CancelButton";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import Button from "@/components/Button";
import DeleteTextButton from "@/components/DeleteTextButton";
import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import Title from "@/components/Title";
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import { Report } from "@/constants/object/report";
import { Transaction } from "@/constants/object/transaction";
import JobSheetInvoiceModal from "@/apps/user/components/JobSheetInvoiceModal";
import AccountAutoCompleteWithAddOption from "@/apps/user/components/AccountAutoCompleteWithAddOption";
import JsBarcode from "jsbarcode";
import EmployeeAutoCompleteWithAddOption from "@/apps/user/components/EmployeeAutoCompleteWithAddOption";
import PrintBarcodeButton from "@/apps/user/components/PrintBarcodeButton";
import { useIsMobile } from "@/utils/useIsMobile";

import "./style.scss";

const DRAFT_STORAGE_KEY = "job_sheet_form_draft";

// 1. Define Zod Schema
const jobSheetSchema = z
  .object({
    party_id: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, "Customer is required"),
    item_name: z.string().min(1, "Item name is required"),
    item_id: z.any().optional(),
    servicer_id: z
      .union([z.string(), z.number()])
      .refine((val) => val !== "" && val !== null, "Servicer is required"),
    bar_code: z.string().optional(),
    issue_reported: z.string().min(1, "Issue description is required"),
    diagnosis: z.string().optional(),
    status: z.string().min(1, "Status is required"),
    service_cost: z.coerce.number().min(0, "Service cost is required"),
    service_charges: z.coerce.number().optional().default(0),
    estimated_completion_date: z.string().nullable().optional(),
    completion_date: z.string().nullable().optional(),
    remarks: z.string().optional(),
    done_by_id: z.any().optional().nullable(),
    cost_center_id: z.any().optional().nullable(),
    invoice_number: z.any().optional(),
    account_id: z.any().refine((val) => val !== "" && val !== null, "Account is required"),
  })
  .refine(
    (data) => {
      if (data.status === "Completed") {
        return data.account_id !== null && data.account_id !== "";
      }
      return true;
    },
    {
      message: "Please Select Receiver Account when status is Completed",
      path: ["account_id"],
    },
  );

const LiveBarcodePreview = ({ value, options }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          textMargin: 0,
          marginTop: 5,
          marginBottom: 5,
          height: 50,
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [value, options]);

  return (
    <div className="live-barcode-preview">
      <div className="item-details">
        <span className="customer-name">
          {options.showCustomer && options.customerName
            ? options.customerName
            : ""}
        </span>
        <span
          className="customer-phone"
          style={{ fontSize: "12px", display: "block" }}
        >
          {options.showPhone && options.customerPhone
            ? options.customerPhone
            : ""}
        </span>
        <span className="item-name">
          {options.showItem && options.itemName ? options.itemName : ""}
        </span>
      </div>
      <svg ref={barcodeRef}></svg>
    </div>
  );
};

const JobSheet = ({ isOpen, onClose, mode, selectedJobSheet, onSuccess }) => {
  const showToast = useToast();
  const isMobile = useIsMobile();

  const partyRef = useRef(null);
  const itemNameRef = useRef(null);
  const barcodeRef = useRef(null);

  const [isOpenInvoiceModal, setIsOpenInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [printOptions, setPrintOptions] = useState({
    showCustomer: true,
    showItem: true,
    showPhone: true,
  });

  const disabled = mode === "view";

  const defaultValues = {
    party_id: "",
    item_name: "",
    item_id: "",
    servicer_id: "",
    bar_code: "",
    issue_reported: "",
    diagnosis: "",
    status: "Pending",
    service_cost: "",
    service_charges: "",
    estimated_completion_date: null,
    completion_date: null,
    remarks: "",
    done_by_id: "",
    cost_center_id: "",
    invoice_number: null,
    account_id: null,
  };

  // 2. Setup React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSheetSchema),
    defaultValues,
  });

  const watchedFormData = watch();
  const watchedPartyId = watch("party_id");
  const watchedBarcode = watch("bar_code");
  const watchedItemName = watch("item_name");

  const { mutateAsync: createJobSheet, isPending: creating } =
    useCreateJobSheet();
  const { mutateAsync: updateJobSheet, isPending: updating } =
    useUpdateJobSheet();
  const { mutateAsync: deleteJobSheet, isPending: deleting } =
    useDeleteJobSheet();
  const { data: invoiceNoData } = useJobSheetInvoiceNo(
    !["view", "edit"].includes(mode),
  );

  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const customerOptions = [
    { value: "", label: "Select Customer" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const getSelectedCustomerName = () => {
    const customer = customerOptions.find((c) => c.value === watchedPartyId);
    return customer ? customer.label : "";
  };

  const getSelectedCustomerPhone = () => {
    const customer = customers.find((c) => c.id === watchedPartyId);
    return customer ? customer.phone || "" : "";
  };

  const handlePrintOptionChange = (e) => {
    const { name, checked } = e.target;
    setPrintOptions((prev) => ({ ...prev, [name]: checked }));
  };

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const handleGenerateBarcode = () => {
    const randomBarcode = Math.floor(
      100000000000 + Math.random() * 900000000000,
    ).toString();
    setValue("bar_code", randomBarcode);
  };

  const handleClearBarcode = () => {
    setValue("bar_code", "");
  };

  // Load Data
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        const initialData = { ...defaultValues, ...selectedJobSheet };
        initialData.estimated_completion_date =
          selectedJobSheet.estimated_completion_date
            ? new Date(selectedJobSheet.estimated_completion_date)
                .toISOString()
                .split("T")[0]
            : null;
        initialData.completion_date = selectedJobSheet.completion_date
          ? new Date(selectedJobSheet.completion_date)
              .toISOString()
              .split("T")[0]
          : null;

        reset(initialData);
      } else if (mode === "add") {
        const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedForm) {
          try {
            reset(JSON.parse(savedForm));
          } catch (e) {
            reset(defaultValues);
          }
        } else {
          reset(defaultValues);
        }
      }

      if (mode !== "view") {
        setTimeout(() => partyRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedJobSheet, reset]);

  // Save Draft
  useEffect(() => {
    if (mode === "add" && isOpen) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedFormData));
    }
  }, [watchedFormData, mode, isOpen]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset(defaultValues);
  };

  const handleDelete = async () => {
    if (!selectedJobSheet?.job_id) return;
    try {
      await deleteJobSheet(selectedJobSheet.job_id);
      showToast({
        crudItem: CRUDITEM.JOBSHEET,
        crudType: CRUDTYPE.DELETE_SUCCESS,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: error.response?.data?.error || "Failed to delete jobsheet.",
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const onFormError = (errors) => {
    const firstError = Object.values(errors)[0];
    if (firstError) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: firstError.message || "Please check required fields.",
        status: TOASTSTATUS.ERROR,
      });
      // Focus logic based on error field
      if (errors.party_id) partyRef.current?.focus();
      if (errors.item_name) itemNameRef.current?.focus();
    }
  };

  const onFormSubmit = async (data, shouldPrint = false) => {
    try {
      const payload = {
        ...data,
        service_cost: parseFloat(data.service_cost) || 0,
        service_charges: parseFloat(data.service_charges) || 0,
        party_id: Number(data.party_id),
        item_id: Number(data.item_id) || null,
        servicer_id: Number(data.servicer_id),
        done_by_id: data.done_by_id || null,
        cost_center_id: data.cost_center_id || null,
        invoice_number: ["view", "edit"].includes(mode)
          ? data.invoice_number
          : invoiceNoData?.invoice_number,
      };

      let responseData;
      if (mode === "edit") {
        const response = await updateJobSheet({
          id: selectedJobSheet.job_id,
          jobSheetData: payload,
        });
        responseData = response.data?.data || response.data;
        showToast({
          crudItem: CRUDITEM.JOBSHEET,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } else {
        const response = await createJobSheet(payload);
        responseData = response.data?.data || response.data || response;
        showToast({
          crudItem: CRUDITEM.JOBSHEET,
          crudType: CRUDTYPE.CREATE_SUCCESS,
        });
        clearLocalStorageAndResetForm();
      }
      if (onSuccess) onSuccess();

      if (shouldPrint && responseData) {
        setInvoiceData(responseData);
        setIsOpenInvoiceModal(true);
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
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalHeader>
          <Title report={Report.Jobsheet} mode={mode} />
        </ModalHeader>
        <ModalBody>
          <Controller
            name="party_id"
            control={control}
            render={({ field }) => (
              <CustomerAutoCompleteWithAddOption
                {...field}
                ref={partyRef}
                options={customerOptions}
                disabled={disabled || customersLoading}
                required
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <Controller
            name="item_name"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Item Name"
                ref={itemNameRef}
                disabled={disabled}
                placeholder="Item Name (e.g., iPhone 13, Dell Laptop)"
                required
              />
            )}
          />

          <Controller
            name="servicer_id"
            control={control}
            render={({ field }) => (
              <EmployeeAutoCompleteWithAddOption
                {...field}
                placeholder="Select Servicer"
                disabled={disabled}
                required
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <div className="barcode-section">
            <div className="barcode-section__input-wrapper">
              <Controller
                name="bar_code"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Barcode"
                    disabled={disabled}
                    ref={barcodeRef}
                    placeholder="Barcode (Optional)"
                  />
                )}
              />
            </div>
            {watchedBarcode ? (
              <button
                type="button"
                onClick={handleClearBarcode}
                disabled={disabled}
                className="barcode-section__button barcode-section__button-clear"
              >
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateBarcode}
                disabled={disabled}
                className="barcode-section__button barcode-section__button-generate"
              >
                Generate
              </button>
            )}

            <PrintBarcodeButton
              barcodeValue={watchedBarcode}
              storeName={
                printOptions.showCustomer ? getSelectedCustomerName() : ""
              }
              phone={printOptions.showPhone ? getSelectedCustomerPhone() : ""}
              itemName={printOptions.showItem ? watchedItemName : ""}
              variant="jobsheet"
              disabled={disabled || !watchedBarcode}
            />
          </div>

          {watchedBarcode && (
            <div className="barcode-display-section">
              <div className="barcode-section__display">
                <div className="print-options-container">
                  <label className="print-options-container__label">
                    <input
                      type="checkbox"
                      name="showCustomer"
                      checked={printOptions.showCustomer}
                      onChange={handlePrintOptionChange}
                      disabled={disabled}
                    />
                    Customer Name
                  </label>
                  <label className="print-options-container__label">
                    <input
                      type="checkbox"
                      name="showPhone"
                      checked={printOptions.showPhone}
                      onChange={handlePrintOptionChange}
                      disabled={disabled}
                    />
                    Customer Phone
                  </label>
                  <label className="print-options-container__label">
                    <input
                      type="checkbox"
                      name="showItem"
                      checked={printOptions.showItem}
                      onChange={handlePrintOptionChange}
                      disabled={disabled}
                    />
                    Item Name
                  </label>
                </div>

                <LiveBarcodePreview
                  value={watchedBarcode}
                  options={{
                    showCustomer: printOptions.showCustomer,
                    showPhone: printOptions.showPhone,
                    showItem: printOptions.showItem,
                    customerName: getSelectedCustomerName(),
                    customerPhone: getSelectedCustomerPhone(),
                    itemName: watchedItemName,
                  }}
                />
              </div>
            </div>
          )}

          <Controller
            name="done_by_id"
            control={control}
            render={({ field }) => (
              <DoneByAutoCompleteWithAddOption
                {...field}
                placeholder="Done By"
                disabled={disabled}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <Controller
            name="cost_center_id"
            control={control}
            render={({ field }) => (
              <CostCenterAutoCompleteWithAddOption
                {...field}
                placeholder="Cost Center"
                disabled={disabled}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <Controller
            name="issue_reported"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                label="Issue Reported"
                disabled={disabled}
                placeholder="Issue Reported"
                required
              />
            )}
          />

          <Controller
            name="diagnosis"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                label="Diagnosis"
                disabled={disabled}
                placeholder="Diagnosis"
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Status"
                options={statusOptions}
                disabled={disabled}
                required
              />
            )}
          />

          <Controller
            name="service_cost"
            control={control}
            render={({ field }) => (
              <InputFieldWithCalculator
                {...field}
                label="Service Cost"
                disabled={disabled}
                placeholder="Service Cost"
                required
              />
            )}
          />

          <Controller
            name="service_charges"
            control={control}
            render={({ field }) => (
              <InputFieldWithCalculator
                {...field}
                label="Service Charges"
                disabled={disabled}
                placeholder="Service Charges"
              />
            )}
          />

          <Controller
            name="account_id"
            control={control}
            render={({ field }) => (
              <AccountAutoCompleteWithAddOption
                {...field}
                placeholder="Receiver Account"
                required={watch("status") === "Completed"}
                disabled={disabled}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <HStack justifyContent="flex-start">
            <Controller
              name="estimated_completion_date"
              control={control}
              render={({ field }) => (
                <DateField
                  label="Est. Completion"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) =>
                    field.onChange(
                      date ? date.toISOString().split("T")[0] : null,
                    )
                  }
                  disabled={disabled}
                />
              )}
            />
            <Controller
              name="completion_date"
              control={control}
              render={({ field }) => (
                <DateField
                  label="Actual Completion"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) =>
                    field.onChange(
                      date ? date.toISOString().split("T")[0] : null,
                    )
                  }
                  disabled={disabled}
                />
              )}
            />
          </HStack>

          <Controller
            name="remarks"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                label="Remarks"
                disabled={disabled}
                placeholder="Remarks"
              />
            )}
          />
        </ModalBody>
        <ModalFooter>
          <HStack justifyContent="flex-end" style={{ width: "100%" }}>
            <div style={{ flex: 1 }}>
              {mode === "edit" && (
                <DeleteTextButton
                  transaction={Transaction.JobSheet}
                  onDelete={handleDelete}
                  isLoading={deleting}
                />
              )}
            </div>
            <CancelButton onClick={onClose} />
            {mode !== "view" && (
              <>
                <SubmitButton
                  isLoading={creating || updating}
                  disabled={disabled}
                  type={mode}
                  onClick={handleSubmit(
                    (data) => onFormSubmit(data, false),
                    onFormError,
                  )}
                />
                {mode === "add" && !isMobile && (
                  <Button
                    variant="print"
                    disabled={disabled || creating || updating}
                    onClick={handleSubmit(
                      (data) => onFormSubmit(data, true),
                      onFormError,
                    )}
                  >
                    {creating || updating ? "Processing..." : "Submit & Print"}
                  </Button>
                )}
              </>
            )}
          </HStack>
        </ModalFooter>
      </Modal>
      {isOpenInvoiceModal && (
        <JobSheetInvoiceModal
          isOpen={isOpenInvoiceModal}
          onClose={() => setIsOpenInvoiceModal(false)}
          invoiceData={invoiceData}
        />
      )}
    </>
  );
};

export default JobSheet;
