import { useExportCommon } from "@/hooks/api/exportAndPrint/useExportCommon";

export const useSaleExportAndPrint = ({
  listData = [],
  reportType = "Sale Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10, // Items per page
  totalPage = 0,
  totalData = {}, // { totalAmount, paidAmount, balance }
  filterDatas = {},
  searchType = "",
  searchKey = "",
}) => {
  // 1. Destructure maps from the common hook to look up names
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getTableData = (isPdf = false) => {
    if (listData && listData.length) {
      const data = listData.map((item, index) => {
        // Calculate Serial Number based on pagination
        const SL = (pageNumber - 1) * selectedPageCount + index + 1;
        
        // Calculate Row Balance
        const rowBalance = (item.total_amount || 0) - (item.paid_amount || 0);

        // 2. Map IDs to Names using the maps from useExportCommon
        const customerName = maps?.customers?.[item.party_id] || "";
        const doneByName = maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName = maps?.costCenters?.[item.cost_center_id] || "";

        // 3. Handle Payment Methods (Array of accounts)
        const accountNames =
     item.payment_methods && item.payment_methods.length > 0
    ? item.payment_methods
        .map((p) => p.account_name || maps?.accounts?.[p.account_id])
        .filter(Boolean)
        .join(", ")
    : "";

        // 4. Return the formatted row object
        return {
          SL: SL,
          Date: item.date,
          Customer: customerName,
          "Invoice No": item.invoice_number,
          Account: accountNames,
          "Done By": doneByName,
          "Cost Center": costCenterName,
          "Total Amount": parseFloat(item.total_amount || 0).toFixed(2),
          "Paid Amount": parseFloat(item.paid_amount || 0).toFixed(2),
          Balance: rowBalance.toFixed(2),
          Status: item.status,
        };
      });

      // 5. Add Total Row at the bottom
      if (totalData && (totalData.totalAmount || totalData.paidAmount)) {
        const totalRow = {
          SL: "",
          Date: "Total",
          Customer: "",
          "Invoice No": "",
          Account: "",
          "Done By": "",
          "Cost Center": "",
          "Total Amount": parseFloat(totalData.totalAmount || 0).toFixed(2),
          "Paid Amount": parseFloat(totalData.paidAmount || 0).toFixed(2),
          Balance: parseFloat(totalData.balance || 0).toFixed(2),
          Status: "",
        };
        data.push(totalRow);
      }

      return data;
    } else {
      // Return empty structure if no data
      return [
        {
          SL: "",
          Date: "",
          Customer: "",
          "Invoice No": "",
          Account: "",
          "Done By": "",
          "Cost Center": "",
          "Total Amount": "",
          "Paid Amount": "",
          Balance: "",
          Status: "",
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