import React from "react";
// Hooks
import useSalesPaginated from "@/apps/user/hooks/api/sales/useSalesPaginated";
import { useCustomers } from "@/apps/user/hooks/api/customer/useCustomers";
import useItem from "@/apps/user/hooks/api/item/useItem";
import { useSalesById } from "@/apps/user/hooks/api/sales/useSalesById";
import { useSaleReturnById } from "@/apps/user/hooks/api/saleReturns/useSaleReturnsById";
import useCreateSaleReturn from "@/apps/user/hooks/api/saleReturns/useCreateSaleReturns";
import { useSaleReturnInvoiceNo } from "@/apps/user/hooks/api/saleReturnInvoiceNo/useSaleReturnInvoiceNo";
import useUpdateSaleReturn from "@/apps/user/hooks/api/saleReturns/useUpdateSaleReturns";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import { useTransactionTableFieldsSettings } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionTableFieldsSettings";
import { useTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useTransactionFieldPermissions";
import {useUpdateTransactionFieldPermissions } from "@/apps/user/hooks/api/transactionFieldPermissions/useUpdateTransactionFieldPermissions";
// Components
import AmountSymbol from "@/apps/user/components/AmountSymbol";
import IconBackButton from "@/apps/user/components/IconBackButton";
import QuantitySelector from "@/apps/user/components/QuantitySelector";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";
import PaymentModal from "@/apps/user/pages/POS/components/PaymentModal";
import ReceiptModal from "@/apps/user/components/ReceiptModal";
import ViewButtonForReceiptAndPayment from "@/apps/user/components/ViewButtonForReceiptAndPayment";

// Core Engine
import CommonSaleReturn from "@/pages/CommonSaleReturn";

const SaleReturn = () => {
  const hooks = {
    useSalesPaginated,
    useCustomers,
    useItem,
    useSalesById,
    useSaleReturnById,
    useCreateSaleReturn,
    useSaleReturnInvoiceNo,
    useUpdateSaleReturn,
    useAccounts,
    useModeOfPayments,
    useTransactionTableFieldsSettings,
    useTransactionFieldPermissions,
    useUpdateTransactionFieldPermissions,
  };

  const components = {
    AmountSymbol,
    IconBackButton,
    QuantitySelector,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
    PaymentModal,
    ReceiptModal,
    ViewButtonForReceiptAndPayment,
  };

  return <CommonSaleReturn hooks={hooks} components={components} />;
};

export default SaleReturn;
