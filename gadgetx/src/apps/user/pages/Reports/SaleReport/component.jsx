import React from "react";
// Hooks
import useDeleteSales from "@/apps/user/hooks/api/sales/useDeleteSales";
import useSalesPaginated from "@/apps/user/hooks/api/sales/useSalesPaginated";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import { useSalesById } from "@/apps/user/hooks/api/sales/useSalesById";
import { useCostCenters } from "@/apps/user/hooks/api/costCenter/useCostCenters";
import { useDoneBys } from "@/apps/user/hooks/api/doneBy/useDoneBys";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useSaleExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/useSaleExportAndPrint";
import { useReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useReportFieldPermissions";
import { useReportTableFieldsSettings } from "@/apps/user/hooks/api/reportFieldPermissions/useReportTableFieldsSettings";
import { useUpdateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useUpdateReportFieldPermissions";
import { useCreateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useCreateReportFieldPermissions";
import "./style.scss";
// Components
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import DotMenu from "@/apps/user/components/DotMenu/component";
import DeleteConfirmationModal from "@/apps/user/components/DeleteConfirmationModal/component";
import InvoiceModal from "@/apps/user/components/InvoiceModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ReceiptPDF from "@/apps/user/components/ReceiptPDF";
import AmountSummary from "@/apps/user/components/AmountSummary";
import PaymentsModal from "@/apps/user/components/PaymentsModal";
import LedgerAutoComplete from "@/apps/user/components/LedgerAutoComplete";
import CustomerAutoComplete from "@/apps/user/components/CustomerAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import StatusButton from "@/apps/user/components/StatusButton";

// Config/Utils
import { getSaleMenuItems } from "@/config/menuItems.jsx";
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";
import { Report } from "@/constants/object/report";

// Common Report Component
import CommonSaleReport from "@/pages/CommonSaleReport";

const SaleReport = () => {
  const hooks = {
    useSalesPaginated,
    useAccounts,
    useCustomers,
    useDoneBys,
    useCostCenters,
    useDeleteSales,
    useSalesById,
    useModeOfPayments,
    useSaleExportAndPrint,
    useReportFieldPermissions,
    useReportTableFieldsSettings,
    useUpdateReportFieldPermissions,
    useCreateReportFieldPermissions,
  };

  const components = {
    TableTopContainer,
    DotMenu,
    DeleteConfirmationModal,
    InvoiceModal,
    ReceiptModal,
    ReceiptPDF,
    AmountSummary,
    PaymentsModal,
    LedgerAutoComplete,
    CustomerAutoComplete,
    DoneByAutoComplete,
    CostCenterAutoComplete,
    StatusButton,
  };

  const config = { getSaleMenuItems, API_UPLOADS_BASE, buildUploadUrl, Report };

  return (
    <CommonSaleReport hooks={hooks} components={components} config={config} />
  );
};

export default SaleReport;
