import { useExportCommon } from "@/hooks/api/exportAndPrint/useExportCommon";

export const usePurchaseExportAndPrint = ({
  listData = [],
  reportType = "Purchase Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { totalAmount, paidAmount, dueAmount }
  filterDatas = {},
  searchType = "",
  searchKey = "",
}) => {
  // 1. Get common utilities and maps from the common hook
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getTableData = (isPdf = false) => {
    if (listData && listData.length) {
      const data = listData.map((item, index) => {
        // Calculate Serial Number
        const SL = (pageNumber - 1) * selectedPageCount + index + 1;

        // Calculate Due Amount (Balance)
        const dueAmount = (item.total_amount || 0) - (item.paid_amount || 0);

        // Resolve Names (API usually provides names, fallback to maps if needed)
        const supplierName = item.party_name || maps?.suppliers?.[item.party_id] || "";
        const doneByName = item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName = item.cost_center_name || maps?.costCenters?.[item.cost_center_id] || "";

        // Handle Payment Methods (Array of accounts)
        const accountNames =
          item.payment_methods && item.payment_methods.length > 0
            ? item.payment_methods
                .map((p) => p.account_name || maps?.accounts?.[p.account_id])
                .filter(Boolean)
                .join(", ")
            : "";

        return {
          SL: SL,
          Date: item.date,
          Supplier: supplierName,
          "Invoice No": item.invoice_number,
          Account: accountNames,
          "Done By": doneByName,
          "Cost Center": costCenterName,
          "Total Amount": parseFloat(item.total_amount || 0).toFixed(2),
          Discount: parseFloat(item.discount || 0).toFixed(2),
          "Paid Amount": parseFloat(item.paid_amount || 0).toFixed(2),
          "Due Amount": dueAmount.toFixed(2),
        };
      });

      // Add Summary Row
      if (totalData && (totalData.totalAmount || totalData.paidAmount)) {
        const totalRow = {
          SL: "",
          Date: "Total",
          Supplier: "",
          "Invoice No": "",
          Account: "",
          "Done By": "",
          "Cost Center": "",
          "Total Amount": parseFloat(totalData.totalAmount || 0).toFixed(2),
          Discount: "",
          "Paid Amount": parseFloat(totalData.paidAmount || 0).toFixed(2),
          "Due Amount": parseFloat(totalData.dueAmount || 0).toFixed(2),
        };
        data.push(totalRow);
      }

      return data;
    } else {
      return [
        {
          SL: "",
          Date: "",
          Supplier: "",
          "Invoice No": "",
          Account: "",
          "Done By": "",
          "Cost Center": "",
          "Total Amount": "",
          Discount: "",
          "Paid Amount": "",
          "Due Amount": "",
        },
      ];
    }
  };

  const exportToExcel = () => {
    const excelData = getTableData(false);
    getExcelFile(
      reportType,
      excelData,
      filterDatas,
      duration,
      true, // isReport
      searchType,
      searchKey
    );
  };

  const exportToPdf = () => {
    const pdfData = getTableData(true);
    getPDFFile(
      reportType,
      pdfData,
      filterDatas,
      pageNumber,
      totalPage,
      duration,
      true, // isReport
      searchType,
      searchKey
    );
  };

  const printDocument = () => {
    const pdfData = getTableData(true);
    printPDFFile(
      reportType,
      pdfData,
      filterDatas,
      pageNumber,
      totalPage,
      duration,
      true, // isReport
      searchType,
      searchKey
    );
  };

  return { exportToExcel, exportToPdf, printDocument };
};