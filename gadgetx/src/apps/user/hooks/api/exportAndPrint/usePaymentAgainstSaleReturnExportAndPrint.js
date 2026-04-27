import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const usePaymentAgainstSaleReturnExportAndPrint = ({
  voucherData = {},
  listData = [],
  totalNowPaying = 0,
  reportType = "Payment Against Sale Return",
}) => {
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getTableData = () => {
    if (listData && listData.length) {
      const data = listData.map((ret, index) => {
        return {
          SL: index + 1,
          "Return No": ret.invoice_number,
          Date: ret.date ? ret.date.split("T")[0] : "",
          Status: ret.status,
          "Refund Due": parseFloat(ret.total_refund_amount || 0).toFixed(2),
          "Already Refunded": parseFloat(ret.refunded_amount || 0).toFixed(2),
          "Refunding Now": parseFloat(ret.now_paying_amount || 0).toFixed(2),
          Balance: parseFloat(ret.balance || 0).toFixed(2),
        };
      });

      data.push({
        SL: "",
        "Return No": "Total",
        Date: "",
        Status: "",
        "Refund Due": "",
        "Already Refunded": "",
        "Refunding Now": parseFloat(totalNowPaying).toFixed(2),
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
      toLedgerParty: maps?.customers?.[voucherData.party_id] || "N/A",
      fromLedgerBank: maps?.accounts?.[voucherData.from_ledger_id] || "N/A",
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
    printPDFFile(
      reportType,
      getTableData(),
      getDisplayFilters(),
      1,
      1,
      "",
      true
    );
  };

  return { exportToExcel, exportToPdf, printDocument };
};
