import useExpensesPaginated from "@/apps/user/hooks/api/expense/useExpensesPaginated";
import useDeleteExpense from "@/apps/user/hooks/api/expense/useDeleteExpense";
import { useExpenseTypes } from "@/apps/user/hooks/api/expenseType/useExpenseTypes";
import useLedger from "@/apps/user/hooks/api/ledger/useLedger";
import Expense from "@/apps/user/pages/Transactions/Expense";
import AmountSummary from "@/apps/user/components/AmountSummary";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import { useExpenseExportAndPrint } from "@/apps/user/hooks/api/exportAndPrint/useExpenseExportAndPrint";
import StatusButton from "@/apps/user/components/StatusButton";
import { Report } from "@/constants/object/report";
import { useReportTableFieldsSettings } from "@/apps/user/hooks/api/reportFieldPermissions/useReportTableFieldsSettings";
import { useReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useReportFieldPermissions";
import { useUpdateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useUpdateReportFieldPermissions";
import { useCreateReportFieldPermissions } from "@/apps/user/hooks/api/reportFieldPermissions/useCreateReportFieldPermissions";

import CommonExpenseReport from "@/pages/CommonExpenseReport";

const ExpenseReport = () => {
  const hooks = {
    useExpensesPaginated,
    useDeleteExpense,
    useExpenseTypes,
    useLedger,
    useExpenseExportAndPrint,
    useReportTableFieldsSettings,
    useReportFieldPermissions,
    useUpdateReportFieldPermissions,
    useCreateReportFieldPermissions,
  };
  const components = {
    AmountSummary,
    TableTopContainer,
    LedgerAutoCompleteWithAddOptionWithBalance,
    DoneByAutoComplete,
    CostCenterAutoComplete,
    StatusButton,
    Expense,
  };
  const config = { Report };
  return (
    <CommonExpenseReport hooks={hooks} components={components} config={config} />
  );
};

export default ExpenseReport;
