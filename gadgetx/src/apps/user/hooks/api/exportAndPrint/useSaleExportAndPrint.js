import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

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

  const printThermalDocument = () => {
    const rows = getTableData(true);
    const printSettings = JSON.parse(localStorage.getItem("PRINT_SETTINGS") || "{}");
    const paperWidth = Number(printSettings.paper_width_mm) || 80;
    const companyName = printSettings.company_name || "Company";

    const esc = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const printableRows = rows.filter((row) => Object.values(row).some((v) => `${v}`.trim() !== ""));

    const htmlRows = printableRows
      .map(
        (row) => `
          <tr>
            <td>${esc(row.SL)}</td>
            <td>${esc(row["Invoice No"])}</td>
            <td style="text-align:right;">${esc(row["Total Amount"])}</td>
            <td style="text-align:right;">${esc(row["Paid Amount"])}</td>
            <td style="text-align:right;">${esc(row.Balance)}</td>
          </tr>
        `,
      )
      .join("");

    const win = window.open("", "_blank", "width=480,height=860");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${esc(reportType)} Thermal Print</title>
          <style>
            @page { size: ${paperWidth}mm auto; margin: 2mm; }
            body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; color: #000; }
            .wrap { width: ${paperWidth}mm; max-width: 100%; }
            h3 { margin: 0 0 2mm; font-size: 12px; text-align: center; }
            .meta { font-size: 9px; margin-bottom: 2mm; text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px dashed #999; padding: 2px 0; vertical-align: top; }
            th { font-size: 9px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h3>${esc(companyName)}</h3>
            <h3>${esc(reportType)}</h3>
            <div class="meta">${esc(duration || "")}</div>
            <table>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Inv</th>
                  <th style="text-align:right;">Total</th>
                  <th style="text-align:right;">Paid</th>
                  <th style="text-align:right;">Bal</th>
                </tr>
              </thead>
              <tbody>${htmlRows}</tbody>
            </table>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return { exportToExcel, exportToPdf, printDocument, printThermalDocument };
};