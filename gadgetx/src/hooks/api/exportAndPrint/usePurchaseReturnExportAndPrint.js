import { useExportCommon } from "@/hooks/api/exportAndPrint/useExportCommon";

export const usePurchaseReturnExportAndPrint = ({
  listData = [],
  reportType = "Purchase Return Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { totalRefundAmount } (if applicable, though list usually shows qty/amount per row)
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

        // Resolve Names (API usually provides names, fallback to maps if needed)
        const supplierName = item.party_name || maps?.suppliers?.[item.party_id] || "";
        const itemName = item.item_name || maps?.items?.[item.item_id] || "";
        const doneByName = item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName = item.cost_center_name || maps?.costCenters?.[item.cost_center_id] || "";

        return {
          SL: SL,
          Date: item.date,
          Supplier: supplierName,
          "Item Name": itemName,
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Quantity: item.return_quantity,
          "Refund Amount": parseFloat(item.refund_amount || 0).toFixed(2), // Ensure your API returns this field
          Reason: item.reason || "",
        };
      });

      // Add Summary Row (if totalData is provided)
      if (totalData && totalData.totalRefundAmount !== undefined) {
        const totalRow = {
          SL: "",
          Date: "Total",
          Supplier: "",
          "Item Name": "",
          "Done By": "",
          "Cost Center": "",
          Quantity: "",
          "Refund Amount": parseFloat(totalData.totalRefundAmount || 0).toFixed(2),
          Reason: "",
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
          "Item Name": "",
          "Done By": "",
          "Cost Center": "",
          Quantity: "",
          "Refund Amount": "",
          Reason: "",
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