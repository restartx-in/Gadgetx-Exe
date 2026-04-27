import { useRef, useEffect, useState } from "react";
import { IoClose, IoChevronDown } from "react-icons/io5";
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import useFetchPrintSettings from "@/apps/user/hooks/api/printSettings/useFetchPrintSettings";
import useUpdatePrintSettings from "@/apps/user/hooks/api/printSettings/useUpdatePrintSettings";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

import InputFieldwithlabel from "@/components/InputFieldwithlabel";
import CancelButton from "@/components/CancelButton";
import SubmitButton from "@/components/SubmitButton";
import Button from "@/components/Button";
import HStack from "@/components/HStack";
import { IoIosArrowUp } from "react-icons/io";
import Loader from "@/components/Loader";
import Select from "@/components/Select";
import demoLogo from "@/assets/user/demo-logo.svg";
import {  useQueryClient } from "@tanstack/react-query";


import "./style.scss";

const userTypeOptions = [
  { value: "thermal", label: "Thermal" },
  { value: "a4", label: "A4" },
];

const paperWidthOptions = [
  { value: "80", label: "80 mm (Standard Thermal)" },
  { value: "58", label: "58 mm (Compact Thermal)" },
];

const barcodeLabelOptions = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "both", label: "Top + Bottom" },
  { value: "none", label: "Hide Label" },
];

const LOCAL_ONLY_FIELDS = new Set([
  "paper_width_mm",
  "print_margin_mm",
  "thermal_font_size_px",
  "barcode_height_px",
  "barcode_line_width",
  "barcode_label_mode",
]);

const defaultForm = {
  company_name: "",
  email: "",
  phone: "",
  tr_number: "",
  address: "",
  store: "",
  image_width: "",
  image_height: "",
  qr_width: "",
  qr_height: "",
  footer_message: "",
  header_image_url: "",
  qr_image_url: "",
  show_qr_code: true,
  print_type: "thermal",
  show_arabic_translations: false,
  paper_width_mm: "80",
  print_margin_mm: "0",
  thermal_font_size_px: "13",
  barcode_height_px: "40",
  barcode_line_width: "1.5",
  barcode_label_mode: "top",
};

const PrintSettings = ({ isOpen, onClose }) => {
  const showToast = useToast();
  const firstInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrInputRef = useRef(null);

  const { data: printSettings, isLoading } = useFetchPrintSettings();
  const { mutateAsync: updatePrintSettings, isPending: isUpdating } =
    useUpdatePrintSettings();

  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(demoLogo);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(demoLogo);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showQrSettings, setShowQrSettings] = useState(false);
  const [showAdvancedPrinterSettings, setShowAdvancedPrinterSettings] =
    useState(false);
  const [enableTrNumber, setEnableTrNumber] = useState(false);
  const [enableQrCode, setEnableQrCode] = useState(false);
  const [showArabic, setShowArabic] = useState(false);
  const queryClient = useQueryClient();


  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
      setShowImageSettings(false);
      setShowQrSettings(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      setImageFile(null);
      setQrFile(null);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (printSettings) {
      let localSettings = {};
      try {
        localSettings = JSON.parse(localStorage.getItem("PRINT_SETTINGS") || "{}");
      } catch {
        localSettings = {};
      }

      // Correctly construct the full image URL
      const fullImageUrl = buildUploadUrl(API_UPLOADS_BASE, printSettings.header_image_url);
      if (fullImageUrl) {
        setImagePreview(`${fullImageUrl}?t=${new Date().getTime()}`);
      } else {
        setImagePreview(demoLogo);
      }

      const fullQrUrl = buildUploadUrl(API_UPLOADS_BASE, printSettings.qr_image_url);
      if (fullQrUrl) {
        setQrPreview(`${fullQrUrl}?t=${new Date().getTime()}`);
      } else {
        setQrPreview(demoLogo);
      }

      setEnableQrCode(typeof printSettings.show_qr_code === "boolean" ? printSettings.show_qr_code : !!printSettings.qr_image_url);
      setShowArabic(!!printSettings.show_arabic_translations);

      const testData = {
        company_name: printSettings.company_name || "",
        email: printSettings.email || "",
        phone: printSettings.phone || "",
        tr_number: printSettings.tr_number || "",
        address: printSettings.address || "",
        store: printSettings.store || "",
        image_width: printSettings.image_width || "100px",
        image_height: printSettings.image_height || "auto",
        qr_width: printSettings.qr_width || "100px",
        qr_height: printSettings.qr_height || "auto",
        footer_message: printSettings.footer_message || "",
        header_image_url: printSettings.header_image_url || "",
        header_image_proxy_path: printSettings.header_image_proxy_path || "",
        qr_image_url: printSettings.qr_image_url || "",
        qr_image_proxy_path: printSettings.qr_image_proxy_path || "",
        show_qr_code: printSettings.show_qr_code !== false,
        print_type: printSettings.print_type || "thermal",
        show_arabic_translations: !!printSettings.show_arabic_translations,
        paper_width_mm:
          localSettings.paper_width_mm || printSettings.paper_width_mm || "80",
        print_margin_mm:
          localSettings.print_margin_mm || printSettings.print_margin_mm || "0",
        thermal_font_size_px:
          localSettings.thermal_font_size_px ||
          printSettings.thermal_font_size_px ||
          "13",
        barcode_height_px:
          localSettings.barcode_height_px || printSettings.barcode_height_px || "40",
        barcode_line_width:
          localSettings.barcode_line_width || printSettings.barcode_line_width || "1.5",
        barcode_label_mode:
          localSettings.barcode_label_mode || printSettings.barcode_label_mode || "top",
      };
      setFormData(testData);
      localStorage.setItem("PRINT_SETTINGS", JSON.stringify(testData));
    }
  }, [printSettings]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:"))
        URL.revokeObjectURL(imagePreview);
      if (qrPreview && qrPreview.startsWith("blob:"))
        URL.revokeObjectURL(qrPreview);
    };
  }, [imagePreview, qrPreview]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleQrChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = new FormData();

    Object.keys(formData).forEach((key) => {
      if (LOCAL_ONLY_FIELDS.has(key)) {
        return;
      }
      if (key === "tr_number" && !enableTrNumber) {
        dataToSubmit.append(key, "");
        return;
      }
      if ((key === "qr_width" || key === "qr_height") && !enableQrCode) {
        dataToSubmit.append(key, "");
        return;
      }
      if (key === "qr_image_url" && !enableQrCode) {
        dataToSubmit.append("qr_image_url", "");
        return;
      }
      if (key === "show_arabic_translations" || key === "show_qr_code") {
        return;
      }
      dataToSubmit.append(key, formData[key]);
    });

    dataToSubmit.append("show_arabic_translations", showArabic);
        dataToSubmit.append("show_qr_code", enableQrCode);
    if (imageFile) dataToSubmit.append("header_image", imageFile);
    if (enableQrCode) {
      if (qrFile) dataToSubmit.append("qr_image", qrFile);
    } else {
      dataToSubmit.append("qr_image_url", "");
    }

    try {
      await updatePrintSettings(dataToSubmit, {
        onSuccess: async () => {
          showToast({
            crudItem: "Print Settings",
            crudType: CRUDTYPE.UPDATE_SUCCESS,
          });
          const nextLocalSettings = {
            ...formData,
            tr_number: enableTrNumber ? formData.tr_number : "",
            qr_width: enableQrCode ? formData.qr_width : "",
            qr_height: enableQrCode ? formData.qr_height : "",
            qr_image_url: enableQrCode ? formData.qr_image_url : "",
            show_qr_code: enableQrCode,
            print_type: formData.print_type,
            show_arabic_translations: showArabic,
          };

          localStorage.setItem(
            "PRINT_SETTINGS",
            JSON.stringify(nextLocalSettings)
          );
          await queryClient.refetchQueries({ queryKey: ["printSettings"] });
          onClose();
        },
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update settings.";
      showToast({
        type: TOASTTYPE.GENARAL,
        message: msg,
        status: TOASTSTATUS.ERROR,
      });
    }
  };

  const formatLabel = (key) => {
    if (key === "tr_number") return "TR Number";
    const withSpaces = key.replace(/_/g, " ");
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

  const fields = [
    "company_name",
    "email",
    "phone",
    "address",
    "store",
    "footer_message",
  ];

  const toNumber = (value, fallback) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const previewPaperWidth = clamp(toNumber(formData.paper_width_mm, 80), 58, 120);
  const previewMargin = clamp(toNumber(formData.print_margin_mm, 0), 0, 10);
  const previewFontSize = clamp(toNumber(formData.thermal_font_size_px, 13), 10, 18);
  const previewBarcodeHeight = clamp(
    toNumber(formData.barcode_height_px, 40),
    24,
    80,
  );
  const previewBarcodeLineWidth = clamp(
    toNumber(formData.barcode_line_width, 1.5),
    1,
    3,
  );
  const previewBarcodeMode = ["top", "bottom", "both", "none"].includes(
    formData.barcode_label_mode,
  )
    ? formData.barcode_label_mode
    : "top";

  const showPreviewTopLabel =
    previewBarcodeMode === "top" || previewBarcodeMode === "both";
  const showPreviewBottomLabel =
    previewBarcodeMode === "bottom" || previewBarcodeMode === "both";

  if (!isOpen) return null;

  return (
    <div className="print-settings-modal__overlay" onClick={onClose}>
      <div
        className="print-settings-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="print-settings-modal__header">
          <h2 className="fs18 fw600">Update Print Settings</h2>
          <button
            className="print-settings-modal__close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IoClose color="var(--navy)" size={25} />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="print-settings__form">
          <main className="print-settings-modal__body">
            {isLoading ? (
              <Loader />
            ) : (
              <div className="other_settings__form-grid">
                <div className="print-settings__accordion">
                  <div
                    className="print-settings__accordion-header"
                    onClick={() => setShowImageSettings(!showImageSettings)}
                  >
                    <span className="fw600 fs14">Company Logo</span>
                    {showImageSettings ? (
                      <IoIosArrowUp size={18} />
                    ) : (
                      <IoChevronDown size={18} />
                    )}
                  </div>
                  {showImageSettings && (
                    <div className="print-settings__accordion-content">
                      <div className="print-settings__image-upload">
                        <img
                          src={imagePreview}
                          alt="Print Header Preview"
                          className="print-settings__preview-image"
                          style={{ objectFit: "contain" }}
                          onError={(e) => (e.target.src = demoLogo)}
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/png, image/jpeg, image/gif"
                          style={{ display: "none" }}
                        />
                        <Button
                          onClick={() => fileInputRef.current.click()}
                          disabled={isUpdating}
                          type="button"
                          className="mt-2"
                        >
                          Change Logo
                        </Button>
                        <div className="print-settings__dimensions-row">
                          <InputFieldwithlabel
                            id="image_width"
                            name="image_width"
                            label="Logo Width"
                            value={formData.image_width}
                            onChange={handleChange}
                            placeholder="100px"
                            inputClassName="settings_page__input"
                          />
                          <InputFieldwithlabel
                            id="image_height"
                            name="image_height"
                            label="Logo Height"
                            value={formData.image_height}
                            onChange={handleChange}
                            placeholder="auto"
                            inputClassName="settings_page__input"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {fields.map((field, idx) => (
                  <InputFieldwithlabel
                    key={field}
                    ref={idx === 0 ? firstInputRef : null}
                    id={`print-setting-${field}`}
                    name={field}
                    label={formatLabel(field)}
                    value={formData[field]}
                    onChange={handleChange}
                    inputClassName="settings_page__input"
                    wrapperClassName="settings_page__input-wrapper"
                    disabled={isUpdating}
                    placeholder={`Enter ${formatLabel(field).toLowerCase()}`}
                    required={field !== "store" && field !== "footer_message"}
                  />
                ))}
                <div className="settings_page__input-wrapper">
                  <label htmlFor="print_type" className="settings_page__label">
                    Print Format
                  </label>
                  <div className="select-wrapper">
                    <Select
                      placeholder="User Role"
                      id="print_type"
                      name="print_type"
                      value={formData.print_type}
                      onChange={handleChange}
                      options={userTypeOptions}
                    />
                  </div>
                </div>

                <div className="print-settings__accordion fade-in">
                  <div
                    className="print-settings__accordion-header"
                    onClick={() =>
                      setShowAdvancedPrinterSettings(!showAdvancedPrinterSettings)
                    }
                  >
                    <span className="fw600 fs14">Advanced Printer Controls</span>
                    {showAdvancedPrinterSettings ? (
                      <IoIosArrowUp size={18} />
                    ) : (
                      <IoChevronDown size={18} />
                    )}
                  </div>

                  {showAdvancedPrinterSettings && (
                    <div className="print-settings__accordion-content">
                      <div className="print-settings__advanced-grid">
                        <div className="settings_page__input-wrapper">
                          <label
                            htmlFor="paper_width_mm"
                            className="settings_page__label"
                          >
                            Paper Width
                          </label>
                          <div className="select-wrapper">
                            <Select
                              id="paper_width_mm"
                              name="paper_width_mm"
                              value={formData.paper_width_mm}
                              onChange={handleChange}
                              options={paperWidthOptions}
                            />
                          </div>
                        </div>

                        <InputFieldwithlabel
                          id="print_margin_mm"
                          name="print_margin_mm"
                          label="Print Margin (mm)"
                          value={formData.print_margin_mm}
                          onChange={handleChange}
                          placeholder="0"
                          inputClassName="settings_page__input"
                        />

                        <InputFieldwithlabel
                          id="thermal_font_size_px"
                          name="thermal_font_size_px"
                          label="Base Font Size (px)"
                          value={formData.thermal_font_size_px}
                          onChange={handleChange}
                          placeholder="13"
                          inputClassName="settings_page__input"
                        />

                        <InputFieldwithlabel
                          id="barcode_height_px"
                          name="barcode_height_px"
                          label="Barcode Height (px)"
                          value={formData.barcode_height_px}
                          onChange={handleChange}
                          placeholder="40"
                          inputClassName="settings_page__input"
                        />

                        <InputFieldwithlabel
                          id="barcode_line_width"
                          name="barcode_line_width"
                          label="Barcode Line Width"
                          value={formData.barcode_line_width}
                          onChange={handleChange}
                          placeholder="1.5"
                          inputClassName="settings_page__input"
                        />

                        <div className="settings_page__input-wrapper">
                          <label
                            htmlFor="barcode_label_mode"
                            className="settings_page__label"
                          >
                            Barcode Label Position
                          </label>
                          <div className="select-wrapper">
                            <Select
                              id="barcode_label_mode"
                              name="barcode_label_mode"
                              value={formData.barcode_label_mode}
                              onChange={handleChange}
                              options={barcodeLabelOptions}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="print-settings__accordion fade-in">
                  <div className="print-settings__accordion-header">
                    <span className="fw600 fs14">Live Thermal Preview</span>
                  </div>
                  <div className="print-settings__accordion-content">
                    {formData.print_type !== "thermal" ? (
                      <div className="print-settings__preview-note">
                        Thermal preview is shown when Print Format is set to Thermal.
                      </div>
                    ) : (
                      <>
                        <div className="print-settings__preview-note">
                          Preview updates instantly based on advanced printer controls.
                        </div>
                        <div className="print-settings__preview-stage">
                          <div
                            className="print-settings__receipt-preview"
                            style={{
                              width: `${previewPaperWidth}mm`,
                              maxWidth: "100%",
                              padding: `${previewMargin}mm`,
                              fontSize: `${previewFontSize}px`,
                            }}
                          >
                            <div className="print-settings__receipt-company">
                              {formData.company_name || "DEMO ACCOUNT"}
                            </div>
                            <div className="print-settings__receipt-line">
                              {formData.address || "RESTRTX MANJERI"}
                            </div>
                            <div className="print-settings__receipt-line">
                              {formData.phone || "Ph: 0569486201"}
                            </div>
                            <div className="print-settings__receipt-separator" />

                            <div className="print-settings__receipt-row">
                              <span>Receipt #</span>
                              <strong>SALE-0005</strong>
                            </div>
                            <div className="print-settings__receipt-row">
                              <span>Date</span>
                              <span>16/03/2026 03:31</span>
                            </div>
                            <div className="print-settings__receipt-separator" />

                            <div className="print-settings__receipt-row print-settings__receipt-head">
                              <strong>Item</strong>
                              <strong>Amount</strong>
                            </div>
                            <div className="print-settings__receipt-row">
                              <span>sw × 2</span>
                              <span>AED 190.48</span>
                            </div>
                            <div className="print-settings__receipt-row">
                              <span>Tax (incl.)</span>
                              <strong>AED 9.52</strong>
                            </div>
                            <div className="print-settings__receipt-row print-settings__receipt-total">
                              <strong>GRAND TOTAL</strong>
                              <strong>AED 200.00</strong>
                            </div>

                            <div className="print-settings__receipt-separator" />

                            {(showPreviewTopLabel || showPreviewBottomLabel || previewBarcodeMode === "none") && (
                              <div className="print-settings__receipt-barcode-wrap">
                                {showPreviewTopLabel && (
                                  <div className="print-settings__receipt-barcode-label">
                                    Receipt No: SALE-0005
                                  </div>
                                )}
                                <div
                                  className="print-settings__mock-barcode"
                                  style={{
                                    height: `${previewBarcodeHeight}px`,
                                    backgroundSize: `${Math.max(
                                      1,
                                      previewBarcodeLineWidth,
                                    ) * 3}px 100%`,
                                  }}
                                />
                                {showPreviewBottomLabel && (
                                  <div className="print-settings__receipt-barcode-label print-settings__receipt-barcode-label--bottom">
                                    SALE-0005
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <HStack>
                  <div className="print-settings__toggle-wrapper">
                    <input
                      type="checkbox"
                      id="enableTrToggle"
                      checked={enableTrNumber}
                      onChange={(e) => setEnableTrNumber(e.target.checked)}
                    />
                    <label htmlFor="enableTrToggle">Enable TR Number</label>
                  </div>
                  <div className="print-settings__toggle-wrapper">
                    <input
                      type="checkbox"
                      id="enableQrToggle"
                      checked={enableQrCode}
                      onChange={(e) => setEnableQrCode(e.target.checked)}
                    />
                    <label htmlFor="enableQrToggle">Enable QR Code</label>
                  </div>
                </HStack>
                <div className="print-settings__toggle-wrapper">
                  <input
                    type="checkbox"
                    id="enableArabicToggle"
                    checked={showArabic}
                    onChange={(e) => setShowArabic(e.target.checked)}
                  />
                  <label htmlFor="enableArabicToggle">
                    Show Arabic Translations on Receipt
                  </label>
                </div>
                {enableTrNumber && (
                  <InputFieldwithlabel
                    id="print-setting-tr_number"
                    name="tr_number"
                    label="TRN Number"
                    value={formData.tr_number}
                    onChange={handleChange}
                    inputClassName="settings_page__input"
                    wrapperClassName="settings_page__input-wrapper"
                    disabled={isUpdating}
                    placeholder="Enter TRN Number"
                  />
                )}
                {enableQrCode && (
                  <div className="print-settings__accordion fade-in">
                    <div
                      className="print-settings__accordion-header"
                      onClick={() => setShowQrSettings(!showQrSettings)}
                    >
                      <span className="fw600 fs14">QR Code Settings</span>
                      {showQrSettings ? (
                        <IoIosArrowUp size={18} />
                      ) : (
                        <IoChevronDown size={18} />
                      )}
                    </div>
                    {showQrSettings && (
                      <div className="print-settings__accordion-content">
                        <div className="print-settings__image-upload">
                          <img
                            src={qrPreview}
                            alt="QR Code Preview"
                            className="print-settings__preview-image"
                            onError={(e) => (e.target.src = demoLogo)}
                          />
                          <input
                            type="file"
                            ref={qrInputRef}
                            onChange={handleQrChange}
                            accept="image/png, image/jpeg, image/gif"
                            style={{ display: "none" }}
                          />
                          <Button
                            onClick={() => qrInputRef.current.click()}
                            disabled={isUpdating}
                            type="button"
                            className="mt-2"
                          >
                            Change QR Code
                          </Button>
                          <div className="print-settings__dimensions-row">
                            <InputFieldwithlabel
                              id="qr_width"
                              name="qr_width"
                              label="QR Width"
                              value={formData.qr_width}
                              onChange={handleChange}
                              placeholder="100px"
                              inputClassName="settings_page__input"
                            />
                            <InputFieldwithlabel
                              id="qr_height"
                              name="qr_height"
                              label="QR Height"
                              value={formData.qr_height}
                              onChange={handleChange}
                              placeholder="auto"
                              inputClassName="settings_page__input"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
          <footer className="print-settings-modal__footer">
            <HStack>
              <CancelButton onClick={onClose} />
              <SubmitButton
                isLoading={isUpdating}
                disabled={isLoading || isUpdating}
                type="edit"
                onClick={handleSubmit}
              />
            </HStack>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default PrintSettings;
