import React from "react";
// Hooks
import usePurchasesPaginated from "@/apps/user/hooks/api/purchase/usePurchasesPaginated";
import useDeletePurchase from "@/apps/user/hooks/api/purchase/useDeletePurchase";
import useSuppliers from "@/apps/user/hooks/api/supplier/useSuppliers";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { usePurchaseById } from "@/apps/user/hooks/api/purchase/usePurchaseById";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { usePurchaseExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/usePurchaseExportAndPrint";
import { useReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useReportFieldPermissions";
import { useReportTableFieldsSettings } from "@/apps/user/hooks/api/reportFieldPermissions/useReportTableFieldsSettings";
import { useUpdateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useUpdateReportFieldPermissions";
import { useCreateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useCreateReportFieldPermissions";

// Components
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import AmountSummary from "@/apps/user/components/AmountSummary";
import StatusButton from "@/apps/user/components/StatusButton";
import DotMenu from "@/apps/user/components/DotMenu/component";
import DeleteConfirmationModal from "@/apps/user/components/DeleteConfirmationModal/component";
import PaymentsModal from "@/apps/user/components/PaymentsModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ReceiptPDF from "@/apps/user/components/ReceiptPDF";
import AccountAutoComplete from "@/apps/user/components/AccountAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";

// Config
import { getPurchaseMenuItems } from "@/config/menuItems";
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import { Report } from "@/constants/object/report";

// Engine
import CommonPurchaseReport from "@/pages/CommonPurchaseReport";

const PurchaseReport = () => {
  const hooks = {
    usePurchasesPaginated, useDeletePurchase, useSuppliers, useAccounts, usePurchaseById, 
    useModeOfPayments, usePurchaseExportAndPrint, useReportFieldPermissions, 
    useReportTableFieldsSettings, useUpdateReportFieldPermissions, useCreateReportFieldPermissions
  };

  const components = {
    TableTopContainer, AmountSummary, StatusButton, DotMenu, DeleteConfirmationModal, 
    PaymentsModal, ReceiptModal, ReceiptPDF, AccountAutoComplete, DoneByAutoComplete, 
    CostCenterAutoComplete
  };

  const config = { getPurchaseMenuItems , API_UPLOADS_BASE, buildUploadUrl, Report };

  return <CommonPurchaseReport hooks={hooks} components={components} config={config} />;
};

export default PurchaseReport;  