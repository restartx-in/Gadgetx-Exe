import { useExportCommon } from "@/hooks/api/exportAndPrint/useExportCommon";

export const useJobSheetExportAndPrint = ({
  listData = [],
  reportType = "Job Sheet Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // Optional: { totalCharges, totalCost } if you want totals
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
        
        // Calculate Profit
        const charges = parseFloat(item.service_charges || 0);
        const cost = parseFloat(item.service_cost || 0);
        const profit = item.status === 'Completed' ? (charges - cost) : 0;

        // Resolve Names
        const doneByName = item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName = item.cost_center_name || maps?.costCenters?.[item.cost_center_id] || "";

        return {
          SL: SL,
          Date: item.created_at,
          Customer: item.party_name || "",
          "Invoice No": item.invoice_number,
          "Item Name": item.item_name || "",
          Servicer: item.servicer_name || "-",
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Status: item.status,
          Charges: charges.toFixed(2),
          Cost: cost.toFixed(2),
          Profit: profit > 0 ? profit.toFixed(2) : "-",
          "Bar Code": item.bar_code || ""
        };
      });

      // Add Summary Row (if totalData is provided)
      if (totalData && totalData.totalCharges !== undefined) {
        const totalRow = {
          SL: "",
          Date: "Total",
          Customer: "",
          "Invoice No": "",
          "Item Name": "",
          Servicer: "",
          "Done By": "",
          "Cost Center": "",
          Status: "",
          Charges: parseFloat(totalData.totalCharges || 0).toFixed(2),
          Cost: parseFloat(totalData.totalCost || 0).toFixed(2),
          Profit: parseFloat(totalData.totalProfit || 0).toFixed(2),
          "Bar Code": ""
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
          "Invoice No": "",
          "Item Name": "",
          Servicer: "",
          "Done By": "",
          "Cost Center": "",
          Status: "",
          Charges: "",
          Cost: "",
          Profit: "",
          "Bar Code": ""
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