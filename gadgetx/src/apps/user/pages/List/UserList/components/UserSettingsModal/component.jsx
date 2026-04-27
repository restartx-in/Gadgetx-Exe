import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalFooter, ModalBody } from "@/components/Modal";
import Button from "@/components/Button";
import useFetchSettings from "@/apps/user/hooks/api/settings/useFetchSettings";
import useUpdateSettings from "@/apps/user/hooks/api/settings/useUpdateSettings";
import Loader from "@/components/Loader";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

const UserSettingsModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const [form, setForm] = useState({ default_cost_center_id: "" });

  const { data: settings, isLoading: isLoadingSettings } =
    useFetchSettings(userId);
  const { mutateAsync: updateSettings, isLoading: isSaving } =
    useUpdateSettings();

  useEffect(() => {
    if (settings) {
      setForm({
        default_cost_center_id:
          settings.user_settings?.default_cost_center_id || "",
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const payload = {
        user_settings: {
          default_cost_center_id: form.default_cost_center_id,
        },
      };
      await updateSettings({ userId, settingsData: payload });
      onSuccess();
    } catch (error) {
      console.error("Failed to save user settings:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>User Settings</ModalHeader>
      <ModalBody>
        {isLoadingSettings ? (
          <Loader />
        ) : (
          <CostCenterAutoCompleteWithAddOption
            label="Default Cost Center"
            name="default_cost_center_id"
            value={form.default_cost_center_id}
            onChange={handleChange}
          />
        )}
      </ModalBody>
      <ModalFooter
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          gap: "16px",
        }}
      >
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UserSettingsModal;
