import React from "react";
// Hooks
import useItem from "@/apps/user/hooks/api/item/useItem";
import useSalesById from "@/apps/user/hooks/api/sales/useSalesById";
import useCreateSales from "@/apps/user/hooks/api/sales/useCreateSales";
import { useSaleInvoiceNo } from "@/apps/user/hooks/api/saleInvoiceNo/useSaleInvoiceNo";
import useUpdateSales from "@/apps/user/hooks/api/sales/useUpdateSales";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useTransactionTableFieldsSettings } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionTableFieldsSettings";
import { useTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionFieldPermissions";
import {useUpdateTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useUpdateTransactionFieldPermissions";
import { usePrescriptions } from "@/apps/user/hooks/api/prescription/usePrescriptions";
// Components
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import IconBackButton from "@/apps/user/components/IconBackButton";
import CustomerAutoCompleteWithAddOption from "@/apps/user/components/CustomerAutoCompleteWithAddOption";
import ItemAutoCompleteWithAddOption from "@/apps/user/components/ItemAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import ItemDetailModal from "@/apps/user/components/ItemDetailModal";
import QuantitySelector from "@/apps/user/components/QuantitySelector";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ThreeDotActionMenu from "@/apps/user/components/ThreeDotActionMenu";
import ViewButtonForReceiptAndPayment from "@/apps/user/components/ViewButtonForReceiptAndPayment";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import PrescriptionSaleSection from "@/pages/CommonSale/components/PrescriptionSaleSection";
import PrescriptionSaleModal from "@/pages/CommonSale/components/PrescriptionSaleModal";

import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";

import CommonSale from "@/pages/CommonSale";

const Sale = () => {
  const hooks = {
    useItem,
    useSalesById,
    useCreateSales,
    useSaleInvoiceNo,
    useUpdateSales,
    useAccounts,
    useCustomers,
    useModeOfPayments,
    useTransactionTableFieldsSettings,
    useTransactionFieldPermissions,
    useUpdateTransactionFieldPermissions,
    usePrescriptions,
  };

  const components = {
    AmountSymbol,
    IconBackButton,
    CustomerAutoCompleteWithAddOption,
    ItemAutoCompleteWithAddOption,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    ItemDetailModal,
    QuantitySelector,
    PaymentModal,
    ThreeDotActionMenu,
    ViewButtonForReceiptAndPayment,
    ReceiptModal,
    PrescriptionSection: PrescriptionSaleSection,
    PrescriptionModal: PrescriptionSaleModal,
  };

  const config = { API_UPLOADS_BASE, buildUploadUrl };

  return <CommonSale hooks={hooks} components={components} config={config} />;
};

export default Sale;
