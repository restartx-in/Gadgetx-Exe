import React from "react";
// Hooks
import useDeletePurchaseReturns from "@/apps/user/hooks/api/purchaseReturns/useDeletePurchaseReturns";
import usePurchaseReturnsPaginated from "@/apps/user/hooks/api/purchaseReturns/usePurchaseReturnsPaginated";
import usePurchaseReturnById from "@/apps/user/hooks/api/purchaseReturns/usePurchaseReturnsById";
import useItemsPaginated from "@/apps/user/hooks/api/item/useItemPaginated";
import useSuppliersPaginated from "@/apps/user/hooks/api/supplier/useSuppliersPaginated";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { usePurchaseReturnExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/usePurchaseReturnExportAndPrint";
import { useReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useReportFieldPermissions";
import { useReportTableFieldsSettings } from "@/apps/user/hooks/api/reportFieldPermissions/useReportTableFieldsSettings";
import { useUpdateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useUpdateReportFieldPermissions";
import { useCreateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useCreateReportFieldPermissions";

// Components
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import AmountSummary from "@/apps/user/components/AmountSummary";
import StatusButton from "@/apps/user/components/StatusButton";
import DotMenu from "@/apps/user/components/DotMenu";
import PaymentsModal from "@/apps/user/components/PaymentsModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ReceiptPDF from "@/apps/user/components/ReceiptPDF";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import AmountSymbol from "@/apps/user/components/AmountSymbol";

// Config
import { getPurchaseReturnMenuItems } from "@/config/menuItems";
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import { Report } from "@/constants/object/report";

// Engine
import CommonPurchaseReturnReport from "@/pages/CommonPurchaseReturnReport";

const PurchaseReturnReport = () => {
  const hooks = {
    useDeletePurchaseReturns, usePurchaseReturnsPaginated, usePurchaseReturnById,
    useItemsPaginated, useSuppliersPaginated, useAccounts, useModeOfPayments,
    usePurchaseReturnExportAndPrint, useReportFieldPermissions, useReportTableFieldsSettings,
    useUpdateReportFieldPermissions, useCreateReportFieldPermissions
  };

  const components = {
    TableTopContainer, AmountSummary, StatusButton, DotMenu, PaymentsModal,
    ReceiptModal, ReceiptPDF, DoneByAutoComplete, CostCenterAutoComplete, AmountSymbol
  };

  const config = { getPurchaseReturnMenuItems, API_UPLOADS_BASE, buildUploadUrl, Report };

  return <CommonPurchaseReturnReport hooks={hooks} components={components} config={config} />;
};

export default PurchaseReturnReport;