import { useRef, useEffect, useState } from "react";
import { useUserContext } from "@/context/user.context";
import useUpdateSettings from "@/apps/user/hooks/api/settings/useUpdateSettings";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE } from "@/constants/object/crud";

import SettingsBackButton from "@/apps/user/components/SettingsBackButton";
import InputFieldwithlabel from "@/components/InputFieldwithlabel";

import "./style.scss";

const OtherSettings = ({ onBackClick }) => {
  const showToast = useToast();
  const { mutateAsync: updateUser } = useUpdateSettings();

  const {
    isUpdating,
    sidebarLabels: contextSidebarLabels,
    defaultTax: contextDefaultTax,
    settings,
    refetchSettings,
  } = useUserContext();

  const [defaultTax, setDefaultTax] = useState("");
  const [initialDefaultTax, setInitialDefaultTax] = useState("");

  const [formLabels, setFormLabels] = useState({});
  const [initialLabels, setInitialLabels] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const firstLabelInputRef = useRef(null);

  useEffect(() => {
    firstLabelInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (contextSidebarLabels) {
      setFormLabels(contextSidebarLabels);
      setInitialLabels(contextSidebarLabels);
    }
  }, [contextSidebarLabels]);

  useEffect(() => {
    const val = contextDefaultTax != null ? String(contextDefaultTax) : "";
    setDefaultTax(val);
    setInitialDefaultTax(val);
  }, [contextDefaultTax]);

  const handleDefaultTaxSave = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(defaultTax);
    if (defaultTax !== "" && (isNaN(parsed) || parsed < 0)) {
      return showToast({ title: "Tax must be a valid number (0 or more).", status: "error" });
    }
    try {
      const existingUserSettings = settings?.user_settings || {};
      await updateUser({
        user_settings: {
          ...existingUserSettings,
          default_tax: defaultTax === "" ? null : parsed,
        },
      });
      if (refetchSettings) await refetchSettings();
      setInitialDefaultTax(defaultTax);
      showToast({ crudItem: "Default Tax", crudType: CRUDTYPE.UPDATE_SUCCESS });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update default tax.";
      showToast({ title: msg, status: "error" });
    }
  };

  useEffect(() => {
    if (JSON.stringify(formLabels) !== JSON.stringify(initialLabels)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formLabels, initialLabels]);

  const validateSidebarLabels = (labels) =>
    Object.values(labels).every((label) => label?.trim().length > 0);

  const handleLabelsSave = async (e) => {
    e.preventDefault();
    if (!validateSidebarLabels(formLabels)) {
      return showToast({
        title: "All sidebar labels must be filled.",
        status: "error",
      });
    }
    try {
      await updateUser({ sidebar_labels: formLabels });

      if (refetchSettings) {
        await refetchSettings();
      }

      setInitialLabels(formLabels);

      showToast({
        crudItem: "Sidebar Labels",
        crudType: CRUDTYPE.UPDATE_SUCCESS,
      });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to update sidebar labels.";
      showToast({ title: msg, status: "error" });
    }
  };

  const formatLabel = (key) => {
    const withSpaces = key.replace(/_/g, " ");
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

  return (
    <div className="sidebar-menu-container">
      <div className="other_settings">
        <header className="other_settings-header">
          <SettingsBackButton
            title="Other Settings"
            onBackClick={onBackClick}
          />
        </header>
        <section
          className="other_settings-section"
          aria-labelledby="sidebar-labels-title"
        >
          <h2
            id="sidebar-labels-title"
            className="other_settings-section-title fw600"
          >
            Sidebar Menu Labels
          </h2>
          <form onSubmit={handleLabelsSave} className="other_settings__form">
            <div className="other_settings__form-grid">
              {Object.keys(formLabels).map((key, idx) => (
                <InputFieldwithlabel
                  key={key}
                  id={`sidebar-label-${key}`}
                  label={formatLabel(key)}
                  value={formLabels[key] || ""}
                  onChange={(e) =>
                    setFormLabels((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  inputClassName="settings_page__input"
                  wrapperClassName="settings_page__input-wrapper"
                  disabled={isUpdating}
                  ref={idx === 0 ? firstLabelInputRef : null}
                  aria-label={`${key} Label Input`}
                />
              ))}
            </div>
            <div className="other_settings__form-footer">
              {hasUnsavedChanges && (
                <button
                  className="other_settings__form-footer-submit_button2"
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="other_settings__form-footer-submit_button2-loader"></span>
                  ) : (
                    <span className="other_settings__form-footer-submit_button2-text fw500">
                      Save Labels
                    </span>
                  )}
                </button>
              )}
            </div>
          </form>
        </section>

        <section
          className="other_settings-section"
          aria-labelledby="default-tax-title"
        >
          <h2
            id="default-tax-title"
            className="other_settings-section-title fw600"
          >
            Default Tax
          </h2>
          <p className="other_settings-section-desc">
            This value will be pre-filled in the Tax (%) field when adding a new item.
          </p>
          <form onSubmit={handleDefaultTaxSave} className="other_settings__form">
            <div className="other_settings__tax-row">
              <InputFieldwithlabel
                id="default-tax-input"
                label="Default Tax (%)"
                type="number"
                min="0"
                step="0.01"
                value={defaultTax}
                onChange={(e) => setDefaultTax(e.target.value)}
                placeholder="e.g. 5"
                inputClassName="settings_page__input"
                wrapperClassName="settings_page__input-wrapper"
                disabled={isUpdating}
              />
            </div>
            <div className="other_settings__form-footer">
              {defaultTax !== initialDefaultTax && (
                <button
                  className="other_settings__form-footer-submit_button2"
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="other_settings__form-footer-submit_button2-loader"></span>
                  ) : (
                    <span className="other_settings__form-footer-submit_button2-text fw500">
                      Save Tax
                    </span>
                  )}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default OtherSettings;
