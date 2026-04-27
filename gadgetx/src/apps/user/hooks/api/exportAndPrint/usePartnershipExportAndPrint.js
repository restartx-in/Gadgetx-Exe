import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const usePartnershipExportAndPrint = ({
  listData = [],
  reportType = "Partnership Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { totalContribution, totalPaid, totalBalance }
  filterDatas = {},
  searchType = "",
  searchKey = "",
}) => {
  const { getPDFFile, getExcelFile, printPDFFile, maps } = useExportCommon();

  const getTableData = (isPdf = false) => {
    if (listData && listData.length) {
      const data = listData.map((item, index) => {
        const SL = (pageNumber - 1) * selectedPageCount + index + 1;
        const contribution = parseFloat(item.contribution || 0);
        const paid = parseFloat(item.contribution_payment_paid || 0);
        const balance = contribution - paid;

        // Resolve Names
        const doneByName =
          item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName =
          item.cost_center_name ||
          maps?.costCenters?.[item.cost_center_id] ||
          "";
        const accountName =
          item.account_name || maps?.accounts?.[item.from_account] || "";

        return {
          SL: SL,
          Date: item.created_at,
          "Partner Name": item.partner_name || "",
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Status: item.contribution_payment_status || "",
          Contribution: contribution.toFixed(2),
          Paid: paid.toFixed(2),
          Balance: balance.toFixed(2),
          "Profit Share": item.profit_share || "-",
          "From Account": accountName,
        };
      });

      // Add Summary Row (if totalData provided)
      if (totalData && totalData.totalContribution !== undefined) {
        const totalRow = {
          SL: "",
          Date: "Total",
          "Partner Name": "",
          "Done By": "",
          "Cost Center": "",
          Status: "",
          Contribution: parseFloat(totalData.totalContribution || 0).toFixed(2),
          Paid: parseFloat(totalData.totalPaid || 0).toFixed(2),
          Balance: parseFloat(totalData.totalBalance || 0).toFixed(2),
          "Profit Share": "",
          "From Account": "",
        };
        data.push(totalRow);
      }

      return data;
    } else {
      return [
        {
          SL: "",
          Date: "",
          "Partner Name": "",
          "Done By": "",
          "Cost Center": "",
          Status: "",
          Contribution: "",
          Paid: "",
          Balance: "",
          "Profit Share": "",
          "From Account": "",
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
