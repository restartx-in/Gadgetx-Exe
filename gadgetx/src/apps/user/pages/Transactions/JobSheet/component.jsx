import { useState, useEffect, useRef } from "react";
import useCreateJobSheet from "@/hooks/api/jobSheets/useCreateJobSheet";
import { useJobSheetInvoiceNo } from "@/hooks/api/jobSheetInvoiceNo/useJobSheetInvoiceNo";
import useUpdateJobSheet from "@/hooks/api/jobSheets/useUpdateJobSheet";
import useDeleteJobSheet from "@/hooks/api/jobSheets/useDeleteJobSheet";
import { useCustomers } from "@/hooks/api/customer/useCustomers";
import useEmployees from "@/hooks/api/employee/useEmployees";
import DateField from "@/components/DateField";
import Select from "@/components/Select";
import HStack from "@/components/HStack";
import TextArea from "@/components/TextArea";
import CancelButton from "@/apps/user/components/CancelButton";
import InputField from "@/components/InputField";
import SubmitButton from "@/apps/user/components/SubmitButton";
import DeleteTextButton from "@/apps/user/components/DeleteTextButton";
import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import Title from "@/apps/user/components/Title";
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
// IMPORT YOUR BUTTON
import PrintBarcodeButton from "@/components/PrintBarcodeButton";
import { useIsMobile } from "@/utils/useIsMobile";

import "./style.scss";

const DRAFT_STORAGE_KEY = "job_sheet_form_draft";

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
        {/* NEW PHONE NUMBER DISPLAY IN PREVIEW */}
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

  const defaultForm = {
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

  const [form, setForm] = useState({ ...defaultForm });
  const [isOpenInvoiceModal, setIsOpenInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [printOptions, setPrintOptions] = useState({
    showCustomer: true,
    showItem: true,
    showPhone: true, // New property
  });

  const disabled = mode === "view";

  const { mutateAsync: createJobSheet, isPending: creating } =
    useCreateJobSheet();
  const { mutateAsync: updateJobSheet, isPending: updating } =
    useUpdateJobSheet();
  const { mutateAsync: deleteJobSheet, isPending: deleting } =
    useDeleteJobSheet();
  const { data: invoiceNoData } = useJobSheetInvoiceNo(
    !["view", "edit"].includes(mode)
  );

  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const customerOptions = [
    { value: "", label: "Select Customer" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const getSelectedCustomerName = () => {
    const customer = customerOptions.find((c) => c.value === form.party_id);
    return customer ? customer.label : "";
  };

  // Helper to get phone number
  const getSelectedCustomerPhone = () => {
    const customer = customers.find((c) => c.id === form.party_id);
    return customer ? customer.phone || "" : "";
  };

  const handlePrintOptionChange = (e) => {
    const { name, checked } = e.target;
    setPrintOptions((prev) => ({ ...prev, [name]: checked }));
  };

  const employeeOptions = [
    { value: "", label: "Select Servicer" },
    ...employees.map((emp) => ({ value: emp.id, label: emp.name })),
  ];

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const handleGenerateBarcode = () => {
    const randomBarcode = Math.floor(
      100000000000 + Math.random() * 900000000000
    ).toString();
    setForm({ ...form, bar_code: randomBarcode });
  };

  const handleClearBarcode = () => {
    setForm({ ...form, bar_code: "" });
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "view") {
        const initialData = { ...defaultForm, ...selectedJobSheet };
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

        setForm(initialData);
      } else if (mode === "add") {
        const savedForm = localStorage.getItem(DRAFT_STORAGE_KEY);
        setForm(savedForm ? JSON.parse(savedForm) : { ...defaultForm });
      }

      if (mode !== "view") {
        setTimeout(() => partyRef.current?.focus(), 100);
      }
    }
  }, [isOpen, mode, selectedJobSheet]);

  useEffect(() => {
    if (mode === "add") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, mode]);

  const clearLocalStorageAndResetForm = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm({ ...defaultForm });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleDateChange = (name, newDate) => {
    setForm({
      ...form,
      [name]: newDate ? newDate.toISOString().split("T")[0] : null,
    });
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

  const handleSubmit = async (e, shouldPrint = false) => {
    e.preventDefault();

    if (!form.party_id) {
      showToast({
        message: "Please select a customer.",
        status: TOASTSTATUS.WARNING,
      });
      partyRef.current?.focus();
      return;
    }
    if (!form.item_name) {
      showToast({
        message: "Please enter an item name.",
        status: TOASTSTATUS.WARNING,
      });
      itemNameRef.current?.focus();
      return;
    }
    if (!form.issue_reported) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please describe the issue.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }
    if (!form.servicer_id) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please select a servicer.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }
    if (form.service_cost === "" || form.service_cost === null) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please enter the service cost.",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }
    if (form.status === "Completed" && form.account_id === null) {
      showToast({
        type: TOASTTYPE.GENARAL,
        message: "Please Select Receiver Account",
        status: TOASTSTATUS.ERROR,
      });
      return;
    }

    try {
      const payload = {
        ...form,
        service_cost: parseFloat(form.service_cost) || 0,
        service_charges: parseFloat(form.service_charges) || 0,
        party_id: Number(form.party_id),
        item_id: Number(form.item_id) || null,
        servicer_id: Number(form.servicer_id),
        done_by_id: form.done_by_id || null,
        cost_center_id: form.cost_center_id || null,
        invoice_number: ["view", "edit"].includes(mode)
          ? form.invoice_number
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
          <CustomerAutoCompleteWithAddOption
            ref={partyRef}
            name="party_id"
            value={form.party_id}
            onChange={handleChange}
            options={customerOptions}
            disabled={disabled || customersLoading}
            required
          />
          <InputField
            label="Item Name"
            ref={itemNameRef}
            disabled={disabled}
            name="item_name"
            placeholder="Item Name (e.g., iPhone 13, Dell Laptop)"
            value={form.item_name}
            onChange={handleChange}
            required
          />

          <EmployeeAutoCompleteWithAddOption
            placeholder="Select Servicer"
            name="servicer_id"
            value={form.servicer_id}
            onChange={handleChange}
            disabled={disabled}
            required
          />

          <div className="barcode-section">
            <div className="barcode-section__input-wrapper">
              <InputField
                label="Barcode"
                disabled={disabled}
                ref={barcodeRef}
                name="bar_code"
                placeholder="Barcode (Optional)"
                value={form.bar_code}
                onChange={handleChange}
              />
            </div>
            {form.bar_code ? (
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

            {/* USING THE UPDATED BUTTON */}
            <PrintBarcodeButton
              barcodeValue={form.bar_code}
              storeName={
                printOptions.showCustomer ? getSelectedCustomerName() : ""
              }
              phone={printOptions.showPhone ? getSelectedCustomerPhone() : ""}
              itemName={printOptions.showItem ? form.item_name : ""}
              variant="jobsheet" // Triggers the Side-by-Side layout
              disabled={disabled || !form.bar_code}
            />
          </div>

          {form.bar_code && (
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
                  {/* NEW CHECKBOX FOR CUSTOMER PHONE */}
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
                  value={form.bar_code}
                  options={{
                    showCustomer: printOptions.showCustomer,
                    showPhone: printOptions.showPhone,
                    showItem: printOptions.showItem,
                    customerName: getSelectedCustomerName(),
                    customerPhone: getSelectedCustomerPhone(),
                    itemName: form.item_name,
                  }}
                />
              </div>
            </div>
          )}

          <DoneByAutoCompleteWithAddOption
            placeholder="Done By"
            name="done_by_id"
            value={form.done_by_id}
            onChange={handleChange}
            disabled={disabled}
          />
          <CostCenterAutoCompleteWithAddOption
            placeholder="Cost Center"
            name="cost_center_id"
            value={form.cost_center_id}
            onChange={handleChange}
            disabled={disabled}
          />
          <TextArea
            label="Issue Reported"
            disabled={disabled}
            name="issue_reported"
            placeholder="Issue Reported"
            value={form.issue_reported}
            onChange={handleChange}
            required
          />
          <TextArea
            label="Diagnosis"
            disabled={disabled}
            name="diagnosis"
            placeholder="Diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={statusOptions}
            disabled={disabled}
            required
          />
          <InputFieldWithCalculator
            label="Service Cost"
            disabled={disabled}
            name="service_cost"
            placeholder="Service Cost"
            value={form.service_cost}
            onChange={handleChange}
            required
          />
          <InputFieldWithCalculator
            label="Service Charges"
            disabled={disabled}
            name="service_charges"
            placeholder="Service Charges"
            value={form.service_charges}
            onChange={handleChange}
          />

          <AccountAutoCompleteWithAddOption
            name="account_id"
            value={form.account_id}
            onChange={handleChange}
            placeholder="Receiver Account"
            required
            disabled={disabled}
          />
          <HStack justifyContent="flex-start">
            <DateField
              disabled={disabled}
              label="Est. Completion"
              value={
                form.estimated_completion_date
                  ? new Date(form.estimated_completion_date)
                  : null
              }
              onChange={(date) =>
                handleDateChange("estimated_completion_date", date)
              }
            />
            <DateField
              disabled={disabled}
              label="Actual Completion"
              value={
                form.completion_date ? new Date(form.completion_date) : null
              }
              onChange={(date) => handleDateChange("completion_date", date)}
            />
          </HStack>
          <TextArea
            label="Remarks"
            disabled={disabled}
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleChange}
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
                  onClick={(e) => handleSubmit(e, false)}
                />
                {mode === "add" && !isMobile && (
                  <SubmitButton
                    label="Submit & Print"
                    isLoading={creating || updating}
                    disabled={disabled}
                    onClick={(e) => handleSubmit(e, true)}
                  />
                )}
              </>
            )}
            {/* {selectedJobSheet && mode !== 'add' && (
              <SubmitButton
                label="Print"
                onClick={() => {
                  setInvoiceData(selectedJobSheet)
                  setIsOpenInvoiceModal(true)
                }}
              />
            )} */}
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
