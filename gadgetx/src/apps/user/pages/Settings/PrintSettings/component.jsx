import { useRef, useEffect, useState } from "react";
import { IoClose, IoChevronDown } from "react-icons/io5";
import { useQueryClient } from "@tanstack/react-query";
import { API_FILES as server } from "@/config/api";
import useFetchPrintSettings from "@/hooks/api/printSettings/useFetchPrintSettings";
import useUpdatePrintSettings from "@/hooks/api/printSettings/useUpdatePrintSettings";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

import InputFieldwithlabel from "@/components/InputFieldwithlabel";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import Button from "@/components/Button";
import HStack from "@/components/HStack";
import { IoIosArrowUp } from "react-icons/io";
import Loader from "@/components/Loader";
import Select from "@/components/Select";
import demoLogo from "@/assets/user/demo-logo.svg";

import "./style.scss";
const userTypeOptions = [
  { value: "thermal", label: "Thermal" },
  { value: "a4", label: "A4" },
];

// MODIFIED: Added show_arabic_translations to the default form state
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
  print_type: "thermal",
  show_arabic_translations: false, // ADDED THIS LINE
};

const PrintSettings = ({ isOpen, onClose }) => {
  const showToast = useToast();
  const queryClient = useQueryClient();
  const firstInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrInputRef = useRef(null);

  const {
    data: printSettings,
    isLoading,
    refetch: refetchOnOpen,
  } = useFetchPrintSettings();

  const { mutateAsync: updatePrintSettings, isPending: isUpdating } =
    useUpdatePrintSettings();

  const storedSettings = localStorage.getItem("PRINT_SETTINGS");

  const [formData, setFormData] = useState(defaultForm);

  // Header Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    storedSettings && JSON.parse(storedSettings)?.header_image_url
      ? JSON.parse(storedSettings)?.header_image_url
      : demoLogo
  );

  // QR Code Image State
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(demoLogo);

  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showQrSettings, setShowQrSettings] = useState(false);

  // Enable/Disable Toggles
  const [enableTrNumber, setEnableTrNumber] = useState(false);
  const [enableQrCode, setEnableQrCode] = useState(false);
  // ADDED: State for the new Arabic toggle
  const [showArabic, setShowArabic] = useState(false);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
      refetchOnOpen();

      // Reset UI states
      setShowImageSettings(false);
      setShowQrSettings(false);

      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      // Cleanup on close
      setImageFile(null);
      setQrFile(null);
      setImagePreview(demoLogo);
      setQrPreview(demoLogo);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, refetchOnOpen]);

  useEffect(() => {
    if (printSettings) {
      // --- Handle Header Image ---
      if (printSettings.header_image_url) {
        const fullImageUrl = `${server}${printSettings.header_image_url}`;
        const cacheBustedUrl = `${fullImageUrl}?t=${new Date().getTime()}`;
        setImagePreview(cacheBustedUrl);
      } else {
        setImagePreview(demoLogo);
      }

      // --- Handle QR Image ---
      if (printSettings.qr_image_url) {
        const fullQrUrl = `${server}${printSettings.qr_image_url}`;
        const cacheBustedQrUrl = `${fullQrUrl}?t=${new Date().getTime()}`;
        setQrPreview(cacheBustedQrUrl);
        setEnableQrCode(true);
      } else {
        setQrPreview(demoLogo);
        setEnableQrCode(false);
      }

      // --- Handle TR Number ---
      if (printSettings.tr_number) {
        setEnableTrNumber(true);
      } else {
        setEnableTrNumber(false);
      }

      // ADDED: Set the state of the Arabic toggle from fetched data
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
        qr_image_url: printSettings.qr_image_url || "",
        print_type: printSettings.print_type || "thermal",
        // ADDED: Ensure the boolean is included in the form's data
        show_arabic_translations: !!printSettings.show_arabic_translations,
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
      if (key === "tr_number" && !enableTrNumber) {
        dataToSubmit.append(key, "");
        return;
      }
      if ((key === "qr_width" || key === "qr_height") && !enableQrCode) {
        dataToSubmit.append(key, "");
        return;
      }
      if (key === "qr_image_url" && !enableQrCode) {
        return;
      }
      // ADDED: Skip the boolean from this loop; it's handled separately
      if (key === "show_arabic_translations") {
        return;
      }
      dataToSubmit.append(key, formData[key]);
    });

    // ADDED: Append the current state of the toggle to the form data
    dataToSubmit.append("show_arabic_translations", showArabic);

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
          localStorage.setItem(
            "PRINT_SETTINGS",
            JSON.stringify({
              ...formData,
              tr_number: enableTrNumber ? formData.tr_number : "",
              qr_width: enableQrCode ? formData.qr_width : "",
              qr_height: enableQrCode ? formData.qr_height : "",
              qr_image_url: enableQrCode ? formData.qr_image_url : "",
              print_type: formData.print_type,
              // ADDED: Save the correct toggle state to local storage
              show_arabic_translations: showArabic,
            })
          );
          await queryClient.invalidateQueries({ queryKey: ["printSettings"] });
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

                {/* --- ADDED THIS SECTION --- */}
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
                {/* --- END OF ADDED SECTION --- */}

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
