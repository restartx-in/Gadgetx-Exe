import React from "react";
// Hooks
import useCreateExpense from "@/apps/user/hooks/api/expense/useCreateExpense";
import useUpdateExpense from "@/apps/user/hooks/api/expense/useUpdateExpense";
import useDeleteExpense from "@/apps/user/hooks/api/expense/useDeleteExpense";
import { useExpenseTypes } from "@/apps/user/hooks/api/expenseType/useExpenseTypes";
import useLedger from "@/apps/user/hooks/api/ledger/useLedger";

// Components
import InputFieldWithCalculator from "@/apps/user/components/InputFieldWithCalculator";
import ExpenseTypeAutoCompleteWithAddOption from "@/apps/user/components/ExpenseTypeAutoCompleteWithAddOption";
import LedgerAutoCompleteWithAddOptionWithBalance from "@/apps/user/components/LedgerAutoCompleteWithAddOptionWithBalance";
import DoneByAutoCompleteWithAddOption from "@/apps/user/components/DoneByAutoCompleteWithAddOption";
import CostCenterAutoCompleteWithAddOption from "@/apps/user/components/CostCenterAutoCompleteWithAddOption";

// Config
import { Report } from "@/constants/object/report";
import { Transaction } from "@/constants/object/transaction";

// Engine
import CommonExpense from "@/pages/CommonExpense";

const Expense = (props) => {
  const hooks = {
    useCreateExpense,
    useUpdateExpense,
    useDeleteExpense,
    useExpenseTypes,
    useLedger,
  };

  const components = {
    InputFieldWithCalculator,
    ExpenseTypeAutoCompleteWithAddOption,
    LedgerAutoCompleteWithAddOptionWithBalance,
    DoneByAutoCompleteWithAddOption,
    CostCenterAutoCompleteWithAddOption,
  };

  const config = { Report, Transaction };

  return (
    <CommonExpense
      {...props}
      hooks={hooks}
      components={components}
      config={config}
    />
  );
};

export default Expense;
