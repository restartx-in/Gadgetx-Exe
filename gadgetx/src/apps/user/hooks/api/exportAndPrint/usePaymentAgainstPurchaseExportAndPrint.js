import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const usePaymentAgainstPurchaseExportAndPrint = ({
  voucherData = {}, // From state.form
  listData = [],    // From state.purchaseInvoices
  totalNowPaying = 0,
  reportType = "Payment Against Purchase",
}) => {
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getTableData = () => {
    if (listData && listData.length) {
      const data = listData.map((inv, index) => {
        return {
          SL: index + 1,
          "Invoice No": inv.invoice_number,
          Date: inv.date ? inv.date.split("T")[0] : "",
          Status: inv.status,
          "Total Amt": parseFloat(inv.total_amount || 0).toFixed(2),
          "Paid Earlier": parseFloat(inv.paid_amount || 0).toFixed(2),
          "Paying Now": parseFloat(inv.now_paying_amount || 0).toFixed(2),
          Balance: parseFloat(inv.balance || 0).toFixed(2),
        };
      });

      // Add Total Row
      data.push({
        SL: "",
        "Invoice No": "Total",
        Date: "",
        Status: "",
        "Total Amt": "",
        "Paid Earlier": "",
        "Paying Now": parseFloat(totalNowPaying).toFixed(2),
        Balance: "",
      });

      return data;
    }
    return [];
  };

  const getDisplayFilters = () => {
    return {
      voucherNo: voucherData.voucher_no,
      date: voucherData.date ? voucherData.date.split("T")[0] : "",
      supplier: maps?.customers?.[voucherData.party_id] || "N/A", // Maps customers/suppliers
      fromLedger: maps?.accounts?.[voucherData.from_ledger_id] || "N/A",
      costCenter: maps?.costCenters?.[voucherData.cost_center_id] || "",
      doneBy: maps?.doneBys?.[voucherData.done_by_id] || "",
    };
  };

  const exportToExcel = () => {
    getExcelFile(reportType, getTableData(), getDisplayFilters(), "", true);
  };

  const exportToPdf = () => {
    getPDFFile(reportType, getTableData(), getDisplayFilters(), 1, 1, "", true);
  };

  const printDocument = () => {
    printPDFFile(reportType, getTableData(), getDisplayFilters(), 1, 1, "", true);
  };

  return { exportToExcel, exportToPdf, printDocument };
};