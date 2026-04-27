import { useMemo } from "react";
import { useModeOfPayments } from "@/apps/user/hooks/api/modeOfPayment/useModeOfPayments";
import useAccounts from "@/apps/user/hooks/api/account/useAccounts";

const useById = (type, id, returnField = "name") => {
  const { data: modeOfPayments } = useModeOfPayments();
  const { data: accounts } = useAccounts();

  const list = useMemo(() => {
    if (!type) return [];

    switch (type.toLowerCase()) {
      case "mop":
      case "mode_of_payment":
      case "modeofpayment":
        return modeOfPayments || [];

      case "acc":
      case "account":
      case "accounts":
        return accounts || [];

      default:
        console.warn(`useById: Unknown type "${type}"`);
        return [];
    }
  }, [type, modeOfPayments, accounts]);

  return useMemo(() => {
    if (!id || !list.length) return "";

    const found = list.find((item) => item.id == id);

    if (!found) return "";

    if (!returnField) return found;

    return found[returnField] !== undefined ? found[returnField] : "";
  }, [list, id, returnField]);
};

export default useById;
