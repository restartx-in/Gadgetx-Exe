import { useCallback } from "react";

export const useTransactionTableFieldsSettings = (transactionType) => {
  const getFieldsForType = useCallback(() => {
    switch (transactionType) {
      case "Sale":
        return [
          { label: "Price", value: "price" },
          { label: "Quantity", value: "quantity" },
          { label: "Tax", value: "tax" },
          { label: "Sub Total", value: "sub_total" },
        ];
      case "SaleReturn":
        return [
          { label: "Product", value: "product" },
          { label: "Price", value: "price" },
          { label: "Returnable", value: "returnable" },
          { label: "Return Quantity", value: "return_quantity" },
          { label: "Tax", value: "tax" },
          { label: "Sub Total", value: "sub_total" },
        ];
      case "Purchase":
        return [
          { label: "Cost", value: "cost" },
          { label: "Quantity", value: "quantity" },
          { label: "Tax", value: "tax" },
          { label: "Sub Total", value: "sub_total" },
        ];
      case "PurchaseReturn":
        return [
          { label: "Product", value: "product" },
          { label: "Price", value: "price" },
          { label: "Available", value: "available" },
          { label: "Return Quantity", value: "return_quantity" },
          { label: "Tax", value: "tax" },
          { label: "Sub Total", value: "sub_total" },
        ];
      default:
        return [];
    }   
  }, [transactionType]);

  const getSettingsKey = useCallback(() => {
    switch (transactionType) {
      case "Sale": return "sale_form_fields";
      case "SaleReturn": return "sale_return_form_fields";
      case "Purchase": return "purchase_form_fields";
      case "PurchaseReturn": return "purchase_return_form_fields";
      default: return "";
    }
  }, [transactionType]);

  return {
    getFieldsForType,
    getSettingsKey,
  };
};