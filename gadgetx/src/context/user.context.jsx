import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useFetchSettings from "@/apps/user/hooks/api/settings/useFetchSettings";
import useUpdateSettings from "@/apps/user/hooks/api/settings/useUpdateSettings";
import { defaultSidebarLabels } from "@/constants/sidebarLabels";

const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    refetch: refetchSettings,
  } = useFetchSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [companyName, setCompanyName] = useState("WheelX");
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [sidebarLabels, setSidebarLabels] = useState(defaultSidebarLabels);
  const [defaultTax, setDefaultTax] = useState(null);
  const [settings, setSettings] = useState({
    app_name: "WheelX",
    company_logo_url: "",
    sidebar_labels: defaultSidebarLabels,
  });

  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isLabelsEditing, setIsLabelsEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  useEffect(() => {
    if (data) {
      const baseSettings = {
        app_name: "WheelX",
        company_logo_url: "",
        sidebar_labels: defaultSidebarLabels,
      };

      const newSettings = {
        ...data,
        app_name: data.app_name || baseSettings.app_name,
        sidebar_labels:
          data.sidebar_labels && Object.keys(data.sidebar_labels).length > 0
            ? data.sidebar_labels
            : baseSettings.sidebar_labels,
        company_logo_url: data.company_logo_url || data.company_logo || "",
      };

      setSettings(newSettings);
      setCompanyName(newSettings.app_name);
      setSidebarLabels(newSettings.sidebar_labels);
      const tax = data.user_settings?.default_tax;
      setDefaultTax(tax != null ? tax : null);
    }
  }, [data]);

  const updateSettings = (payload, options) => {
    updateSettingsMutation.mutate(payload, {
      ...options,
      onSuccess: (responseData, variables, context) => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        if (options?.onSuccess)
          options.onSuccess(responseData, variables, context);
      },
    });
  };

  const value = {
    settings,
    isLoading,
    error,
    updateSettings,
    isUpdating: updateSettingsMutation.isLoading,
    refetchSettings,

    companyName,
    setCompanyName,
    companyLogoFile,
    setCompanyLogoFile,
    sidebarLabels,
    setSidebarLabels,
    defaultTax,

    isNameEditing,
    setIsNameEditing,
    isLabelsEditing,
    setIsLabelsEditing,
    isPasswordEditing,
    setIsPasswordEditing,

    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,

    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    clearMessages,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserContext must be used within an UserProvider");
  return context;
};
