import React from "react";
// Hooks
import useDeleteSaleReturns from "@/apps/user/hooks/api/saleReturns/useDeleteSaleReturns";
import useSaleReturnsPaginated from "@/apps/user/hooks/api/saleReturns/useSaleReturnsPaginated";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import useItemPaginated from "@/apps/user/hooks/api/item/useItemPaginated";
import { useSaleReturnById } from "@/apps/user/hooks/api/saleReturns/useSaleReturnsById";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useSaleReturnExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/useSaleReturnExportAndPrint";
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
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import CustomerAutoComplete from "@/apps/user/components/CustomerAutoComplete";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";

// Config
import { getSaleReturnMenuItems } from "@/config/menuItems";
import { Report } from "@/constants/object/report";

// Engine
import CommonSaleReturnReport from "@/pages/CommonSaleReturnReport"; 

const SaleReturnReport = () => {
  const hooks = {
    useDeleteSaleReturns, useSaleReturnsPaginated, useCustomers, useItemPaginated,
    useSaleReturnById, useModeOfPayments, useAccounts, useSaleReturnExportAndPrint,
    useReportFieldPermissions, useReportTableFieldsSettings,
    useUpdateReportFieldPermissions, useCreateReportFieldPermissions
  };

  const components = {
    TableTopContainer, AmountSummary, StatusButton, DotMenu, PaymentsModal,
    AmountSymbol, ReceiptModal, CustomerAutoComplete, DoneByAutoComplete, 
    CostCenterAutoComplete
  };

  const config = { getSaleReturnMenuItems, Report };

  return <CommonSaleReturnReport hooks={hooks} components={components} config={config} />;
};

export default SaleReturnReport;