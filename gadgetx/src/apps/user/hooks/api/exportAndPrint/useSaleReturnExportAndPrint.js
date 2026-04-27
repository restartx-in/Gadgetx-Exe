import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const useSaleReturnExportAndPrint = ({
  listData = [],
  reportType = "Sale Return Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { totalRefundAmount }
  filterDatas = {},
  searchType = "",
  searchKey = "",
}) => {
  // 1. Get common utilities and maps
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getTableData = (isPdf = false) => {
    if (listData && listData.length) {
      const data = listData.map((item, index) => {
        // Calculate Serial Number
        const SL = (pageNumber - 1) * selectedPageCount + index + 1;

        // Use names provided by the API (joins) or fallback to maps
        const customerName =
          item.party_name || maps?.customers?.[item.party_id] || "";
        const itemName = item.item_name || "";
        const doneByName =
          item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName =
          item.cost_center_name ||
          maps?.costCenters?.[item.cost_center_id] ||
          "";

        return {
          SL: SL,
          Date: item.date,
          Customer: customerName,
          "Item Name": itemName,
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Quantity: item.return_quantity,
          "Refund Amount": parseFloat(item.total_refund_amount || 0).toFixed(2),
          Reason: item.reason || "",
        };
      });

      // Add Total Row
      if (totalData && totalData.totalRefundAmount !== undefined) {
        const totalRow = {
          SL: "",
          Date: "Total",
          Customer: "",
          "Item Name": "",
          "Done By": "",
          "Cost Center": "",
          Quantity: "",
          "Refund Amount": parseFloat(totalData.totalRefundAmount || 0).toFixed(
            2
          ),
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
          Customer: "",
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
