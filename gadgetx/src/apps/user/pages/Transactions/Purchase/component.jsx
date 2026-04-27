import React from "react";
// Hooks
import useSuppliers from "@/apps/user/hooks/api/supplier/useSuppliers";
import useItem from "@/apps/user/hooks/api/item/useItem";
import usePurchaseById from "@/apps/user/hooks/api/purchase/usePurchaseById";
import useCreatePurchase from "@/apps/user/hooks/api/purchase/useCreatePurchase";
import useUpdatePurchase from "@/apps/user/hooks/api/purchase/useUpdatePurchase";
import { usePurchaseInvoiceNo } from "@/apps/user/hooks/api/purchaseInvoiceNo/usePurchaseInvoiceNo";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useTransactionTableFieldsSettings } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionTableFieldsSettings";
import { useTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionFieldPermissions";
import {useUpdateTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useUpdateTransactionFieldPermissions";

// Components
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import IconBackButton from "@/components/IconBackButton";
import SupplierAutoCompleteWithAddOption from "@/apps/user/components/SupplierAutoCompleteWithAddOption";
import ItemAutoCompleteWithAddOption from "@/apps/user/components/ItemAutoCompleteWithAddOption";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import QuantitySelector from "@/apps/user/components/QuantitySelector";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ItemDetailModal from "@/apps/user/components/ItemDetailModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ThreeDotActionMenu from "@/apps/user/components/ThreeDotActionMenu";
import ViewButtonForReceiptAndPayment from "@/apps/user/components/ViewButtonForReceiptAndPayment";

// Config
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";

// Engine
import CommonPurchase from "@/pages/CommonPurchase";

const Purchase = () => {
  const hooks = {
    useSuppliers,
    useItem,
    usePurchaseById,
    useCreatePurchase,
    useUpdatePurchase,
    usePurchaseInvoiceNo,
    useAccounts,
    useModeOfPayments,
    useTransactionTableFieldsSettings,
    useTransactionFieldPermissions,
    useUpdateTransactionFieldPermissions,
  };

  const components = {
    AmountSymbol,
    IconBackButton,
    SupplierAutoCompleteWithAddOption,
    ItemAutoCompleteWithAddOption,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    QuantitySelector,
    PaymentModal,
    ItemDetailModal,
    ReceiptModal,
    ThreeDotActionMenu,
    ViewButtonForReceiptAndPayment,
  };

  const config = { API_UPLOADS_BASE, buildUploadUrl };

  return (
    <CommonPurchase hooks={hooks} components={components} config={config} />
  );
};

export default Purchase;
