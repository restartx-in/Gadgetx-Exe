import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const useExpenseExportAndPrint = ({
  listData = [],
  reportType = "Expense Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { totalAmount }
  filterDatas = {},
  searchType = "",
  searchKey = "",
}) => {
  // 1. Get common utilities and maps from the common hook
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getExpenseStatus = (amount, amountPaid) => {
    const balance = (parseFloat(amount) || 0) - (parseFloat(amountPaid) || 0);
    let status = "Unpaid";
    if (balance <= 0) {
      status = "Paid";
    } else if (amountPaid > 0 && balance > 0) {
      status = "Partial";
    }
    return status;
  };

  const getTableData = (isPdf = false) => {
    if (listData && listData.length) {
      const data = listData.map((item, index) => {
        // Calculate Serial Number
        const SL = (pageNumber - 1) * selectedPageCount + index + 1;

        // Calculate Balance
        const amount = parseFloat(item.amount || 0);
        const amountPaid = parseFloat(item.amount_paid || 0);
        const balance = amount - amountPaid;
        const status = getExpenseStatus(amount, amountPaid);

        // Resolve Names (API usually provides names, fallback to maps if needed)
        const accountName =
          item.account_name || maps?.accounts?.[item.account_id] || "";
        const doneByName =
          item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName =
          item.cost_center_name ||
          maps?.costCenters?.[item.cost_center_id] ||
          "";

        return {
          SL: SL,
          Date: item.date,
          Type: item.category || "", // Expense Category
          Account: accountName,
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Description: item.description || "",
          Amount: amount.toFixed(2),
          Paid: amountPaid.toFixed(2),
          Balance: balance.toFixed(2),
          Status: status,
        };
      });

      // Add Summary Row (if totalData is provided)
      if (totalData && totalData.totalAmount !== undefined) {
        const totalRow = {
          SL: "",
          Date: "Total",
          Type: "",
          Account: "",
          "Done By": "",
          "Cost Center": "",
          Description: "",
          Amount: parseFloat(totalData.totalAmount || 0).toFixed(2),
          Paid: "", // Totals for paid/balance could be added if API provided them
          Balance: "",
          Status: "",
        };
        data.push(totalRow);
      }

      return data;
    } else {
      return [
        {
          SL: "",
          Date: "",
          Type: "",
          Account: "",
          "Done By": "",
          "Cost Center": "",
          Description: "",
          Amount: "",
          Paid: "",
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
