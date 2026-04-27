import React from "react";
// Hooks
import useCreatePurchaseReturn from "@/apps/user/hooks/api/purchaseReturns/useCreatePurchaseReturns";
import { usePurchaseReturnInvoiceNo } from "@/apps/user/hooks/api/purchaseReturnInvoiceNo/usePurchaseReturnInvoiceNo";
import useUpdatePurchaseReturn from "@/apps/user/hooks/api/purchaseReturns/useUpdatePurchaseReturns";
import usePurchaseReturnById from "@/apps/user/hooks/api/purchaseReturns/usePurchaseReturnsById";
import usePurchasesPaginated from "@/apps/user/hooks/api/purchase/usePurchasesPaginated";
import usePurchaseById from "@/apps/user/hooks/api/purchase/usePurchaseById";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useTransactionTableFieldsSettings } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionTableFieldsSettings";
import { useTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionFieldPermissions";
import {useUpdateTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useUpdateTransactionFieldPermissions";

// Components
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import IconBackButton from "@/apps/user/components/IconBackButton";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ThreeDotActionMenu from "@/apps/user/components/ThreeDotActionMenu";
import ItemDetailModal from "@/apps/user/components/ItemDetailModal";
import ViewButtonForReceiptAndPayment from "@/apps/user/components/ViewButtonForReceiptAndPayment";
import QuantitySelector from "@/apps/user/components/QuantitySelector";

// Config
import { API_UPLOADS_BASE, buildUploadUrl } from "@/config/api";

// Core Engine
import CommonPurchaseReturn from "@/pages/CommonPurchaseReturn";

const PurchaseReturn = () => {
  const hooks = {
    useCreatePurchaseReturn,
    usePurchaseReturnInvoiceNo,
    useUpdatePurchaseReturn,
    usePurchaseReturnById,
    usePurchasesPaginated,
    usePurchaseById,
    useAccounts,
    useModeOfPayments,
    useTransactionTableFieldsSettings,
    useTransactionFieldPermissions,
    useUpdateTransactionFieldPermissions,
  };

  const components = {
    AmountSymbol,
    IconBackButton,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    PaymentModal,
    ReceiptModal,
    ThreeDotActionMenu,
    ItemDetailModal,
    ViewButtonForReceiptAndPayment,
    QuantitySelector,
  };

  const config = { API_UPLOADS_BASE, buildUploadUrl };

  return (
    <CommonPurchaseReturn
      hooks={hooks}
      components={components}
      config={config}
    />
  );
};

export default PurchaseReturn;
