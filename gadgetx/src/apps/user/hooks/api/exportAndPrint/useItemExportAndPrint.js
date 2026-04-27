import { useExportCommon } from "@/apps/user/hooks/api/exportAndPrint/useExportCommon";

export const useItemExportAndPrint = ({
  listData = [],
  reportType = "Item List Report",
  duration = "",
  pageNumber = 1,
  selectedPageCount = 10,
  totalPage = 0,
  totalData = {}, // { totalItems } if you want a count row
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

        // Resolve Names (API usually provides these, but fallback to maps if needed)
        const categoryName = item.category_name || "";
        const brandName = item.brand_name || "";
        const unitName = item.unit_name || "";
        const doneByName =
          item.done_by_name || maps?.doneBys?.[item.done_by_id] || "";
        const costCenterName =
          item.cost_center_name ||
          maps?.costCenters?.[item.cost_center_id] ||
          "";

        return {
          SL: SL,
          Name: item.name,
          Category: categoryName,
          SKU: item.sku || "",
          Brand: brandName,
          "Done By": doneByName,
          "Cost Center": costCenterName,
          Unit: unitName,
          Barcode: item.bar_code || "",
          Stock: item.stock_quantity || 0,
          Price: parseFloat(item.selling_price || 0).toFixed(2),
          "Price (W/Tax)": parseFloat(item.selling_price_with_tax || 0).toFixed(
            2
          ),
          "Tax %": item.tax || 0,
          Date: item.created_at || "",
        };
      });

      // Add Summary Row (if totalData is provided - usually items list just shows rows)
      if (totalData && totalData.totalItems !== undefined) {
        // Optional total row logic here
      }

      return data;
    } else {
      return [
        {
          SL: "",
          Name: "",
          Category: "",
          SKU: "",
          Brand: "",
          "Done By": "",
          "Cost Center": "",
          Unit: "",
          Barcode: "",
          Stock: "",
          Price: "",
          "Price (W/Tax)": "",
          "Tax %": "",
          Date: "",
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
