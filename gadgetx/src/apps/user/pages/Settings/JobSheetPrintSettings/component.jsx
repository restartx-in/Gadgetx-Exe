import { useRef, useEffect, useState } from "react";
import { IoClose, IoChevronDown } from "react-icons/io5";
import { useQueryClient } from "@tanstack/react-query";
import { API_FILES as server } from "@/config/api";
import useFetchJobSheetPrintSettings from "@/hooks/api/jobSheetPrintSettings/useFetchJobSheetPrintSettings";
import useUpdateJobSheetPrintSettings from "@/hooks/api/jobSheetPrintSettings/useUpdateJobSheetPrintSettings";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE } from "@/constants/object/crud";
import { TOASTSTATUS, TOASTTYPE } from "@/constants/object/toastType";

import InputFieldwithlabel from "@/components/InputFieldwithlabel";
import CancelButton from "@/apps/user/components/CancelButton";
import SubmitButton from "@/apps/user/components/SubmitButton";
import Button from "@/components/Button";
import HStack from "@/components/HStack";
import Select from "@/components/Select";

import Loader from "@/components/Loader";
import demoLogo from "@/assets/user/demo-logo.svg";
import { IoIosArrowUp } from "react-icons/io";

import "./style.scss";

const STORAGE_KEY = "JOB_SHEET_PRINT_SETTINGS";

const userTypeOptions = [
  { value: "thermal", label: "Thermal" },
  { value: "a4", label: "A4" },
];

// MODIFIED: Added show_arabic_translations to default form state
const defaultForm = {
  company_name: "",
  email: "",
  phone: "",
  tr_number: "",
  address: "",
  store: "",
  image_width: "",
  image_height: "",
  footer_message: "",
  print_type: "thermal",
  show_arabic_translations: false, // ADDED THIS LINE
};

const JobSheetPrintSettings = ({ isOpen, onClose }) => {
  const showToast = useToast();
  const queryClient = useQueryClient();
  const firstInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    data: printSettings,
    isLoading,
    refetch: refetchOnOpen,
  } = useFetchJobSheetPrintSettings();

  const { mutateAsync: updatePrintSettings, isPending: isUpdating } =
    useUpdateJobSheetPrintSettings();

  const storedSettings = localStorage.getItem(STORAGE_KEY);

  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    storedSettings && JSON.parse(storedSettings)?.header_image_url
      ? JSON.parse(storedSettings)?.header_image_url
      : demoLogo
  );

  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showTrNumber, setShowTrNumber] = useState(false);
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
      setShowImageSettings(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } else {
      setImageFile(null);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, refetchOnOpen]);

  useEffect(() => {
    if (printSettings) {
      // 1. Handle Image URL
      if (printSettings.header_image_url) {
        const fullImageUrl = `${server}${printSettings.header_image_url}`;
        const cacheBustedUrl = `${fullImageUrl}?t=${new Date().getTime()}`;
        setImagePreview(cacheBustedUrl);
      } else {
        setImagePreview(demoLogo);
      }

      // 2. Handle TR Number toggle state
      if (printSettings.tr_number) {
        setShowTrNumber(true);
      } else {
        setShowTrNumber(false);
      }

      // ADDED: Set the state of the Arabic toggle from fetched data
      setShowArabic(!!printSettings.show_arabic_translations);

      // 3. Populate Form Data
      const testData = {
        company_name: printSettings.company_name || "",
        email: printSettings.email || "",
        phone: printSettings.phone || "",
        tr_number: printSettings.tr_number || "",
        address: printSettings.address || "",
        store: printSettings.store || "",
        header_image_url: printSettings.header_image_url,
        image_width: printSettings.image_width || "100px",
        image_height: printSettings.image_height || "auto",
        footer_message: printSettings.footer_message || "",
        print_type: printSettings.print_type || "thermal",
        // ADDED: Ensure the boolean is included in the form's data
        show_arabic_translations: !!printSettings.show_arabic_translations,
      };
      setFormData(testData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
    }
  }, [printSettings]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = new FormData();

    Object.keys(formData).forEach((key) => {
      // ADDED: Skip the boolean from this loop; it's handled separately
      if (key === "show_arabic_translations") {
        return;
      }

      if (key === "tr_number" && !showTrNumber) {
        dataToSubmit.append(key, "");
      } else {
        dataToSubmit.append(key, formData[key]);
      }
    });

    if (imageFile) dataToSubmit.append("header_image", imageFile);

    // ADDED: Append the current state of the toggle to the form data
    dataToSubmit.append("show_arabic_translations", showArabic);

    try {
      await updatePrintSettings(dataToSubmit, {
        onSuccess: async () => {
          showToast({
            crudItem: "Job Sheet Print Settings",
            crudType: CRUDTYPE.UPDATE_SUCCESS,
          });

          // Update Local Storage
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              ...formData,
              tr_number: showTrNumber ? formData.tr_number : "",
              print_type: formData.print_type,
              // ADDED: Save the correct toggle state to local storage
              show_arabic_translations: showArabic,
            })
          );

          await queryClient.invalidateQueries({
            queryKey: ["job-sheet-print-settings"],
          });
          await queryClient.refetchQueries({
            queryKey: ["job-sheet-print-settings"],
          });
          onClose();
        },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to update job sheet settings.";
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
          <h2 className="fs18 fw600">JobSheet Print Settings</h2>
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
                          Change Image
                        </Button>
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "15px",
                            width: "100%",
                          }}
                        >
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
                    required={
                      field !== "store" &&
                      field !== "footer_message" &&
                      field !== "address"
                    }
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="enableTrToggle"
                      checked={showTrNumber}
                      onChange={(e) => setShowTrNumber(e.target.checked)}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor="enableTrToggle"
                      className="fw600 fs14"
                      style={{ cursor: "pointer" }}
                    >
                      Enable Temporary Registration Number
                    </label>
                  </div>
                  {/* --- ADDED THIS SECTION --- */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="enableArabicToggle"
                      checked={showArabic}
                      onChange={(e) => setShowArabic(e.target.checked)}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor="enableArabicToggle"
                      className="fw600 fs14"
                      style={{ cursor: "pointer" }}
                    >
                      Show Arabic Translations
                    </label>
                  </div>
                  {/* --- END OF ADDED SECTION --- */}
                </div>
                {showTrNumber && (
                  <InputFieldwithlabel
                    id="print-setting-tr_number"
                    name="tr_number"
                    label="TR Number"
                    value={formData.tr_number}
                    onChange={handleChange}
                    inputClassName="settings_page__input"
                    wrapperClassName="settings_page__input-wrapper"
                    disabled={isUpdating}
                    placeholder="Enter tr number"
                  />
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

export default JobSheetPrintSettings;
