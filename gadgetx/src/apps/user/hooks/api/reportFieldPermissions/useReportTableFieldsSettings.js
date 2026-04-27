import { useCallback } from "react";
import { Report } from "@/constants/object/report";
import { ExtraFields } from "@/constants/object/extraFields";

export const useReportTableFieldsSettings = (report) => {
  const getApiExtraFieldKeyByFieldName = useCallback((field) => {
    switch (field) {
      case ExtraFields.InvoiceNo:
        return "invoice_number";
      case ExtraFields.TotalAmount:
        return "total_amount";
      case ExtraFields.PaidAmount:
        return "paid_amount";
      case ExtraFields.DoneBy:
        return "done_by";
      case ExtraFields.CostCenter:
        return "cost_center";
      case ExtraFields.ReturnDate:
        return "return_date";
      case ExtraFields.RefundAmount:
        return "refund_amount";
      case ExtraFields.ItemName:
        return "item_name";
      case ExtraFields.BarCode:
        return "bar_code";
      case ExtraFields.VoucherNo:
        return "voucher_no";
      case ExtraFields.InvoiceType:
        return "invoice_type";
      case ExtraFields.PaymentFrom:
        return "payment_from";
      case ExtraFields.PaymentTo:
        return "payment_to";
      case ExtraFields.PriceWTax:
        return "price_w_tax";
      case ExtraFields.CreditLimit:
        return "credit_limit";
      case ExtraFields.OutstandingBalance:
        return "outstanding_balance";
      case ExtraFields.PaymentTerms:
        return "payment_terms";
      case ExtraFields.OrderDate:
        return "order_date";
      case ExtraFields.DeliveryDate:
        return "expected_delivery";
      case ExtraFields.ActualDate:
        return "actual_delivery";
      case ExtraFields.Customer:
        return "party_name";
      case ExtraFields.Status:
        return "payment_status";
      case ExtraFields.OrderStatus:
        return "order_status";
      default:
        return field.toLowerCase().replace(/ /g, "_");
    }
  }, []);

  const getExtraFields = useCallback(() => {
    const allPossibleFields = Object.values(ExtraFields).map((label) => ({
      label: label,
      value: getApiExtraFieldKeyByFieldName(label),
      show: false,
    }));

    if (report === Report.Sale) {
      return allPossibleFields.filter((item) =>
        [
          ExtraFields.Date,
          ExtraFields.Customer,
          ExtraFields.InvoiceNo,
          ExtraFields.Account,
          ExtraFields.TotalAmount,
          ExtraFields.PaidAmount,
          ExtraFields.Balance,
          ExtraFields.Status,
          ExtraFields.CostCenter,
          ExtraFields.DoneBy,
        ].includes(item.label),
      )
      .sort((a, b) => {
        const order = [
          ExtraFields.Date,
          ExtraFields.Customer,
          ExtraFields.InvoiceNo,
          ExtraFields.Account,
          ExtraFields.TotalAmount,
          ExtraFields.PaidAmount,
          ExtraFields.Balance,
          ExtraFields.Status,
          ExtraFields.OrderDate,
          ExtraFields.OrderStatus,
          ExtraFields.DeliveryDate,
          ExtraFields.ActualDate,
          ExtraFields.CostCenter,
          ExtraFields.DoneBy,
        ];
        return order.indexOf(a.label) - order.indexOf(b.label);
      });
    } else if (report === Report.SaleReturn) {
      return allPossibleFields.filter((item) =>
        [
          ExtraFields.ReturnDate,
          ExtraFields.Customer,
          ExtraFields.Item,
          ExtraFields.Quantity,
          ExtraFields.Amount,
          ExtraFields.Status,
          ExtraFields.Reason,
          ExtraFields.DoneBy,
          ExtraFields.CostCenter,
        ].includes(item.label),
      );
    } else if (report === Report.Purchase) {
      return allPossibleFields.filter((item) =>
        [
          ExtraFields.Date,
          ExtraFields.Supplier,
          ExtraFields.InvoiceNo,
          ExtraFields.Status,
          ExtraFields.Account,
          ExtraFields.TotalAmount,
          ExtraFields.Discount,
          ExtraFields.PaidAmount,
          ExtraFields.Balance,
          ExtraFields.DoneBy,
          ExtraFields.CostCenter,
        ].includes(item.label),
      );
    } else if (report === Report.Expense) {
      return allPossibleFields.filter((item) =>
        [
          ExtraFields.Date,
          ExtraFields.Type,
          ExtraFields.Ledger,
          ExtraFields.TotalAmount,
          ExtraFields.PaidAmount,
          ExtraFields.Balance,
          ExtraFields.Description,
          ExtraFields.DoneBy,
          ExtraFields.CostCenter,
          ExtraFields.Status,
        ].includes(item.label),
      );
    } else if (report === Report.Jobsheet) {
      return allPossibleFields.filter((item) =>
        [
          ExtraFields.Date,
          ExtraFields.Customer,
          ExtraFields.InvoiceNo,
          ExtraFields.ItemName,
          ExtraFields.Servicer,
          ExtraFields.DoneBy,
          ExtraFields.CostCenter,
          ExtraFields.Status,
          ExtraFields.Charges,
          ExtraFields.Cost,
          ExtraFields.Profit,
          ExtraFields.BarCode,
        ].includes(item.label),
      );
    } else if (report === Report.PurchaseReturn) {
      return allPossibleFields.filter((item) =>
        [
          ExtraFields.ReturnDate,
          ExtraFields.Supplier,
          ExtraFields.Item,
          ExtraFields.Quantity,
          ExtraFields.Amount,
          ExtraFields.Status,
          ExtraFields.Reason,
          ExtraFields.DoneBy,
          ExtraFields.CostCenter,
        ].includes(item.label),
      );
    }
  }, [report, getApiExtraFieldKeyByFieldName]);

  const getReportSettingsKey = useCallback(() => {
    switch (report) {
      case Report.Sale:
        return "sale_report_fields";
      case Report.SaleReturn:
        return "sale_return_report_fields";
      case Report.Purchase:
        return "purchase_report_fields";
      case Report.PurchaseReturn:
        return "purchase_return_report_fields";
      case Report.Expense:
        return "expense_report_fields";
      case Report.Supplier:
        return "supplier_report_fields";
      case Report.Customer:
        return "customer_report_fields";
      case Report.Jobsheet:
        return "jobsheet_report_fields";
      case Report.Receipt:
        return "receipt_report_fields";
      case Report.Payment:
        return "payment_report_fields";
      case Report.Accounts:
        return "accounts_report_fields";
      case Report.LedgerReport:
        return "ledger_report_fields";
      case Report.Item:
        return "item_report_fields";
      default:
        return "";
    }
  }, [report]);

  return {
    getExtraFields,
    getReportSettingsKey,
  };
};
