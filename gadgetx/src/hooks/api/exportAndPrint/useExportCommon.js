import { useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import API hooks to fetch names
import { useCustomers } from "@/hooks/api/customer/useCustomers";
import useAccounts from "@/hooks/api/account/useAccounts";
import { useDoneBys } from "@/hooks/api/doneBy/useDoneBys";
import { useCostCenters } from "@/hooks/api/costCenter/useCostCenters";

export const useExportCommon = () => {
  // 1. Fetch Data Internally
  const { data: customersData = [] } = useCustomers();
  const { data: accountsData = [] } = useAccounts();
  const { data: doneBysData = [] } = useDoneBys();
  const { data: costCentersData = [] } = useCostCenters();

  // 2. Create Lookup Maps (ID -> Name)
  const maps = useMemo(() => ({
    customers: customersData.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {}),
    accounts: accountsData.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {}),
    doneBys: doneBysData.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {}),
    costCenters: costCentersData.reduce((acc, item) => ({ ...acc, [item.id]: item.name }), {}),
  }), [customersData, accountsData, doneBysData, costCentersData]);

  const decimalLength = 2;

  const getSTDNumberFormat = (number) => {
    return "getSTDNumberFormat";
  };

  const companyName = (() => {
    try {
      const settings = localStorage.getItem("PRINT_SETTINGS");
      const parsed = settings ? JSON.parse(settings) : {};
      return parsed.company_name || "My Company";
    } catch (e) {
      return "My Company";
    }
  })();

  const getUserNameInfo = () => {
    return `User: Test User`;
  };

  const getPageInfo = (pageNumber = 0, totalPage = 0) => {
    return `${
      pageNumber === 0 && totalPage === 0
        ? ""
        : `page :${pageNumber}/${totalPage}`
    }`;
  };

  const getPeriodInfo = (period) => {
    if (period === "") return "";
    return `Period : ${period}`;
  };

  const removeUnwatedFromFilterData = (filterData) => {
    const appliedFilterData = {};
    for (const key in filterData) {
      if (
        filterData[key] !== undefined &&
        filterData[key] !== null &&
        filterData[key].checked !== false &&
        filterData[key] !== "" &&
        filterData[key] !== false &&
        filterData[key].length !== 0
      ) {
        appliedFilterData[key] = filterData[key];
      }
    }
    const actualFilterData = {};
    for (const key in appliedFilterData) {
      actualFilterData[key] = getAcutalValueFromObject(
        key,
        appliedFilterData[key]
      );
    }

    return actualFilterData;
  };

  const getAcutalValueFromObject = (key, data) => {
    switch (key) {
      case "customer":
      case "Ledger":
      case "doneBy":
      case "costCenter":
        return data?.name || data;
      case "VoucherTypes":
        return data.value;
      case "statusFilter":
        return data.status;
      case "dueStartDate":
      case "dueEndDate":
      case "followupStartDate":
      case "followupEndDate":
      case "saleInvoiceStartDate":
      case "saleInvoiceEndDate":
      case "invoiceStartDate":
      case "invoiceEndDate":
      case "followupStartDate":
      case "followupEndDate":
      case "dateStart":
      case "dateEnd":
      case "poDateStart":
      case "poDateEnd":
      case "receivedDateStart":
      case "receivedDateEnd":
      case "chequeDateStart":
      case "chequeDateEnd":
      case "clearedDateStart":
      case "clearedDateEnd":
      case "depositDateStart":
      case "depositDateEnd":
        return data && typeof data.format === 'function' ? data.format("YYYY-MM-DD") : data;

      case "invoiceItemType":
        return data.type;
      case "taxFilter":
        return data.label;
      case "taxType":
      case "placeOfSupply":
      case "serviceLedger":
        // array strings
        return Array.isArray(data) ? data.join(",") : data;
      case "costCenter":
      case "doneBy":
      case "voucherType":
      case "Customer":
      case "Supplier":
      case "party":
      case "unit":
      case "category":
      case "group":
      case "brand":
      case "partyOrLedger":
      case "estimateStatus":
        // array ids
        return getFilterValuesForArrayOfIds(key, data);
      case "taxPercentage":
        return `${data}%`;
      default:
        return data;
    }
  };

  const getFilterValuesForArrayOfIds = (key, value) => {
    if (!Array.isArray(value)) return value;
    const arrayItemNames = value?.map((id) => {
      switch (key) {
        case "costCenter":
          return maps.costCenters[id] || "Name";
        default: return null;
      }
    });
    return arrayItemNames?.filter((item) => item !== null).join(", ");
  };

  const getAppliedFiltersData = (filterData) => {
    const updatedFilterData = removeUnwatedFromFilterData(filterData);
    const appliedFiltersText = Object.entries(updatedFilterData)
      .map(
        ([key, value]) =>
          `${getFilterTypeName(key)}:${getFilterValue(key, value)}`
      )
      .join(",");
    return {
      text: appliedFiltersText,
      head: appliedFiltersText.length ? "Applied Filter->" : "",
    };
  };

  const getFilterValue = (key, value) => {
    switch (key) {
      case "costCenterId":
        return maps.costCenters[value] || value;
      case "customerId":
      case "headerCustomer":
      case "party_id":
        return maps.customers[value] || value;
      case "accountId":
        return maps.accounts[value] || value;
      case "doneById":
        return maps.doneBys[value] || value;
      default:
        return value;
    }
  };

  const getFilterTypeName = (key) => {
    switch (key) {
      case "costCenterId":
        return "Cost Center";
      case "customerId":
      case "headerCustomer":
        return "Customer";
      case "doneById":
        return "Done By";
      case "accountId":
        return "Account";
      case "invoiceNumber":
        return "Invoice No";
      default:
        const words = key.split(/(?=[A-Z])/);
        const formattedWords = words.map((word, index) => {
          if (index === 0) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }
          return word.toLowerCase();
        });
        return formattedWords.join(" ");
    }
  };

  const getTableHeading = (type, isReport = true) => {
    return type;
  };

  const getFileName = (type, isReport = true) => {
    let lowerCaseStr = type.toLowerCase();
    lowerCaseStr = lowerCaseStr.replace(/\s+/g, " ");
    let kebabCaseStr = lowerCaseStr.replace(/\s/g, "-");
    return `${kebabCaseStr}-${isReport ? "report" : "list"}`;
  };

  const getTableColumnSum = (data) => {
    const columnKeys = ["Gross", "Tax", "Net"];
    const sums = Object.fromEntries(columnKeys.map((key) => [key, 0]));

    if (!data || !Array.isArray(data)) return sums;

    data.forEach((row) => {
      columnKeys.forEach((key) => {
        const value = row?.[key];
        if (value !== undefined && value !== null && value !== "") {
          sums[key] += parseFloat(value) || 0;
        }
      });
    });

    return sums;
  };

  const getPDFFloat = (value) => {
    const decimal = decimalLength[0];
    return parseFloat(value ?? 0).toFixed(decimal);
  };
  const getExcelFloat = (value) => {
    const decimal = decimalLength[0];
    return parseFloat(parseFloat(value ?? 0).toFixed(decimal));
  };

  const getExcelFile = (
    listType,
    excelData,
    filterDatas,
    duration = "",
    isReport = false,
    searchType = "",
    searchKey = ""
  ) => {
    const tableHeading = getTableHeading(listType, isReport);
    const appliedFiltersData = getAppliedFiltersData(filterDatas);
    const fileName = getFileName(listType, isReport);
    const appliedSearchData = getSearchTypeData(searchType, searchKey);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const dateAndTimeInfo = getExportOrPrintDateInfo();
    const userNameInfo = getUserNameInfo();
    const periodInfo = getPeriodInfo(duration);

    const combinedHeading = [`${tableHeading}     ${periodInfo}`];

    const sheetData = [
      combinedHeading,
      [companyName],
      [userNameInfo],
      [dateAndTimeInfo],
      [`${appliedFiltersData.head} ${appliedFiltersData.text}`],
      [appliedSearchData.length ? `Applied Search-> ${appliedSearchData}` : ""],
      ...XLSX.utils.sheet_to_json(worksheet, { header: 1 }),
    ];

    sheetData.splice(0, 0, []);
    sheetData.splice(7, 0, []);
    const modifiedWorksheet = XLSX.utils.aoa_to_sheet(sheetData);

    const columnWidths = [{ wch: 8 }];
    if (excelData.length > 0) {
      const numKeys = Object.keys(excelData[0]).length;
      for (let i = 0; i < numKeys - 1; i++) {
        columnWidths.push({ wch: 15 });
      }
    }
    modifiedWorksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, modifiedWorksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const getPDFItemsPosition = (columns) => {
    const commonAlignment = {
      startY: 32,
      tableHeadAndCompanyY: 10,
      durationAndUserY: 16,
      filterAndActionTimeY: 22,
      searchAndPageY: 28,
      filterX: 35,
      searchX: 38,
      isLandScape: true,
    };

    const defaultAlignment = {
      startY: 90,
      tableHeadAndCompanyY: 30,
      durationAndUserY: 45,
      filterAndActionTimeY: 60,
      searchAndPageY: 75,
      searchX: 90,
      filterX: 82,
      isLandScape: false,
    };

    const columnRanges = [
      { min: 7, max: 12, width: 350 },
      { min: 13, max: 15, width: 400 },
      { min: 16, max: 18, width: 500 },
      { min: 19, max: 22, width: 600 },
      { min: 23, max: 24, width: 650 },
    ];

    const matchingRange = columnRanges.find(
      (range) => columns.length >= range.min && columns.length <= range.max
    );

    if (matchingRange) {
      return { tableW: matchingRange.width, ...commonAlignment };
    }

    return defaultAlignment;
  };

  const getExportOrPrintDateInfo = (isPrint = false) => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const timeStr = currentDate.toLocaleTimeString();
    return `${isPrint ? "Printed" : "Exported"} Date&Time: ${dateStr} ${timeStr}`;
  };

  const getPDFFile = (
    listType,
    pdfData,
    filterDatas,
    pageNumber = 0,
    totalPage = 0,
    duration = "",
    isReport = false,
    searchType = "",
    searchKey = "",
    isPrint = false
  ) => {
    if (!pdfData || pdfData.length === 0) return;

    const tableHeading = getTableHeading(listType, isReport);
    const appliedFiltersData = getAppliedFiltersData(filterDatas);
    const appliedSearchData = getSearchTypeData(searchType, searchKey);
    const fileName = getFileName(listType, isReport);
    const columns = getPDFTableColumn(pdfData);
    const alignment = getPDFItemsPosition(columns);
    const dateAndTimeInfo = getExportOrPrintDateInfo(isPrint);
    const userNameInfo = getUserNameInfo();
    const pageInfo = getPageInfo(pageNumber, totalPage);
    const periodInfo = getPeriodInfo(duration);

    const doc = alignment.isLandScape
      ? new jsPDF("l", "mm", [alignment.tableW, 219])
      : new jsPDF("p", "pt");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // FIX: Use functional autoTable
    autoTable(doc, {
      body: pdfData,
      columns: columns,
      startY: alignment.startY,
      margin: { horizontal: 10 },
      styles: { overflow: "linebreak" },

      bodyStyles: { valign: "top" },
      columnStyles: getPDFTablecolumnStyles(pdfData),
      theme: "grid",
      showHead: "everyPage",
      didDrawPage: function (data) {
        if (data.pageNumber === 1) {
          const pageWidth = alignment.isLandScape
            ? alignment.tableW
            : doc.internal.pageSize.width;
          const rightMargin = 10;

          const getRightAlignedX = (text) => {
            const textWidth = doc.getTextWidth(text);
            return pageWidth - textWidth - rightMargin;
          };
          doc.setFontSize(16);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "bold");
          doc.text(
            tableHeading,
            data.settings.margin.left,
            alignment.tableHeadAndCompanyY
          );
          doc.setFontSize(10);
          doc.setTextColor("#23807b");
          doc.setFont("helvetica", "normal");
          doc.text(
            periodInfo,
            data.settings.margin.left,
            alignment.durationAndUserY
          );
          doc.setFontSize(12);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "bold");
          doc.text(
            companyName,
            getRightAlignedX(companyName),
            alignment.tableHeadAndCompanyY
          );
          doc.setFontSize(10);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "normal");
          doc.text(
            userNameInfo,
            getRightAlignedX(userNameInfo),
            alignment.durationAndUserY
          );
          doc.setFontSize(10);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "normal");
          doc.text(
            dateAndTimeInfo,
            getRightAlignedX(dateAndTimeInfo),
            alignment.filterAndActionTimeY
          );

          doc.setFontSize(10);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "normal");
          doc.text(
            pageInfo,
            getRightAlignedX(pageInfo),
            alignment.searchAndPageY
          );

          doc.setFontSize(9);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "bold");
          doc.text(
            appliedFiltersData.head,
            data.settings.margin.left,
            alignment.filterAndActionTimeY
          );
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor("161C22");
          doc.text(
            appliedFiltersData.text,
            alignment.filterX,
            alignment.filterAndActionTimeY
          );
          doc.setFontSize(9);
          doc.setTextColor("#161C22");
          doc.setFont("helvetica", "bold");
          doc.text(
            appliedSearchData.length ? "Applied Search->" : "",
            data.settings.margin.left,
            alignment.searchAndPageY
          );
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor("161C22");
          doc.text(
            appliedSearchData,
            alignment.searchX,
            alignment.searchAndPageY
          );
        }
      },
    });

    if (!isPrint) {
      doc.save(`${fileName}.pdf`);
    } else {
      doc.autoPrint();
      const blob = doc.output("blob");
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      const url = URL.createObjectURL(blob);
      iframe.src = url;
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
    }
  };

  const printPDFFile = (
    listType,
    pdfData,
    filterDatas,
    pageNumber = 0,
    totalPage = 0,
    duration = "",
    isReport = false,
    searchType = "",
    searchKey = ""
  ) => {
    getPDFFile(
      listType,
      pdfData,
      filterDatas,
      pageNumber,
      totalPage,
      duration,
      isReport,
      searchType,
      searchKey,
      true
    );
  };

  const getPDFTableColumn = (pdfData) => {
    const data = pdfData[0];
    const value = Object.keys(data).map((key) => ({
      header: getPDFTableColumnHeadingByKey(key),
      dataKey: key,
    }));
    return value;
  };

  const getPDFTableColumnHeadingByKey = (key) => {
    switch (key) {
      case "GST_No":
        return "GST NO";
      case "SP_with_tax":
        return "SP with tax";
      case "SP_without_tax":
        return "SP without tax";
      case "PP_with_tax":
        return "PP with tax";
      case "PP_without_tax":
        return "PP without taxt";
      case "Balance_as_per_Ledger":
        return "Balance as per Ledger";
      case "CHQ_No":
        return "CHQ No";
      case "CHQ_Date":
        return "CHQ Date";
      case "RCD_Date":
        return "RCD Date";
      case "CHQ_Amount":
        return "CHQ Amount";
      case "No_Of_Days_for_Cheque_Date":
        return "No of days for cheque Date";
      case "No_of_Days_for_Deposit_Date":
        return "No of days for deposit date";
      case "SetOff_to":
        return "Setoff To";
      case "DO_NO":
        return "DO NO";
      case "Customer_Or_Supplier":
        return "Customer / Supplier";
      case "Received_To_Or_Paid_From":
        return "Received to / Paid from";
      default:
        return replaceUnderScoreWithSpace(key);
    }
  };

  const getPDFTablecolumnStyles = (pdfData) => {
    if (!pdfData || !pdfData[0]) return {};
    const keys = Object.keys(pdfData[0]);
    return keys.reduce((acc, key, index) => {
      const halign = getPDFTableColumnItmesAlignMentByKey(key);
      acc[index] = { halign };
      return acc;
    }, {});
  };

  const getPDFTableColumnItmesAlignMentByKey = (key) => {
    switch (key) {
      case "Balance":
      case "Current_balance":
      case "No_of_decimal":
      case "Current_cost":
      case "Current_qty":
      case "SP_with_tax":
      case "SP_without_tax":
      case "PP_with_tax":
      case "PP_without_tax":
      case "Opening_Balance":
      case "Debit":
      case "Credit":
      case "Closing_Balance":
      case "Stock_In_Qty":
      case "Stock_In_Amount":
      case "Stock_Out_Qty":
      case "Stock_Out_Amount":
      case "CHQ_Amount":
      case "Gross":
      case "Tax":
      case "Net":
      case "Amount":
      case "Closing_Amount":
      case "Max_Stock":
      case "Excess":
      case "Min_Stock":
      case "Short":
      case "Available_Stock":
      case "Closing_Qty":
      case "Closing_Cost":
      case "Closing_Amount":
      case "<15_Days":
      case "15-30 Days":
      case "30-60 Days":
      case "60-90 Days":
      case "90-120 Days":
      case "120-150 Days":
      case "150-180 Days":
      case "180_Days":
      case "Invoice_Amt":
      case "Received_Amt":
      case "Balance_Amt":
      case "Rate_Per_Qty":
      case "Qty":
      case "Total_Amount":
      case "Total_Amount_To":
      case "Total_Avail_Qty":
      case "System_Avail_Qty":
      case "Total_Diff_Qty":
      case "Total_Diff_Value":
      case "Rate/Qty (WT)":
      case "Rate/Qty":
      case "Trade Markup":
      case "Trade Discount":
      case "Invoice Amount":
      case "Received Amount":
      case "Net Amount":
      case "Stock In Quantity":
      case "Stock Out Quantity":
      case "Stock In Amount":
      case "Stock Out Amount":
      case "Stock Out Rate":
      case "Stock In Rate":
      case "Trade Discounts":
      case "Rate Per Quantity":
      case "Gross Amount":
      case "Trade Markups":
      case "Cheque Amount":
      case "MRP":
        return "right";
      default:
        return "left";
    }
  };

  const getSearchTypeData = (searchType, searchKey) => {
    if (searchKey !== "") return `${getSearchTypeName(searchType)}:${searchKey}`;
    else return "";
  };

  const getSearchTypeName = (type) => {
    switch (type) {
      case "party":
        return "Customer";
      case "d_o_number":
        return "D.O No";

      case "total":
        return `${replaceUnderScoreWithSpace(type)} Amount`;
      default:
        return replaceUnderScoreWithSpace(type);
    }
  };

  const replaceUnderScoreWithSpace = (typ) => {
    return typ
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return {
    getExcelFile,
    getPDFFile,
    printPDFFile,
    maps, // Export the maps for use in other hooks
  };
};