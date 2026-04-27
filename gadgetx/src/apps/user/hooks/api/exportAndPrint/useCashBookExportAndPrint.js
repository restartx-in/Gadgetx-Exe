import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const useCashBookExportAndPrint = ({
  listData = [],
  reportType = "Cash Book Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { balance }
  filterDatas = {},
  searchType = "",
  searchKey = "",
}) => {
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const cleanDescription = (description) => {
    if (!description) return "";
    return description
      .replace(
        /linked to (purchase|sale|expense|partnership|sale_return|purchase_return) ID \d+\./i,
        ""
      )
      .trim();
  };

  const getTableData = (isPdf = false) => {
    if (listData && listData.length) {
      const data = listData.map((item, index) => {
        const SL = (pageNumber - 1) * selectedPageCount + index + 1;

        // Use maps to get names if they aren't directly on the item object
        const doneByName =
          item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName =
          item.cost_center_name ||
          maps?.costCenters?.[item.cost_center_id] ||
          "";
        const accountName =
          item.account_name || maps?.accounts?.[item.account_id] || "";

        return {
          SL: SL,
          Date: item.created_at,
          Account: accountName,
          Type: item.transaction_type
            ? item.transaction_type.replace(/_/g, " ")
            : "",
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Description: cleanDescription(item.description),
          Debit:
            parseFloat(item.debit || 0) > 0
              ? parseFloat(item.debit).toFixed(2)
              : "-",
          Credit:
            parseFloat(item.credit || 0) > 0
              ? parseFloat(item.credit).toFixed(2)
              : "-",
        };
      });

      // Add Balance Row if an account is filtered and total is provided
      if (
        totalData &&
        totalData.balance !== undefined &&
        totalData.balance !== null
      ) {
        const totalRow = {
          SL: "",
          Date: "Total Balance",
          Account: "",
          Type: "",
          "Done By": "",
          "Cost Center": "",
          Description: "",
          Debit: "",
          Credit: parseFloat(totalData.balance).toFixed(2), // Showing net balance in last column usually, or separate
        };
        // Note: For Cashbook, usually we just show the net balance at the bottom.
        // We will modify the total row to just show the value.
        data.push({
          ...totalRow,
          Credit: `${parseFloat(totalData.balance).toFixed(2)} (Net)`,
        });
      }

      return data;
    } else {
      return [
        {
          SL: "",
          Date: "",
          Account: "",
          Type: "",
          "Done By": "",
          "Cost Center": "",
          Description: "",
          Debit: "",
          Credit: "",
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
      true,
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
      true,
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
      true,
      searchType,
      searchKey
    );
  };

  return { exportToExcel, exportToPdf, printDocument };
};
