import React from "react";
import CommonUnitList from "@/pages/CommonUnitList";
import { useUnits } from "@/apps/user/hooks/api/unitType/useUnits";
import { useDeleteUnit } from "@/apps/user/hooks/api/unitType/useDeleteUnit";
import AddUnit from "./components/AddUnit";
import DoneByAutoComplete from "@/apps/user/components/DoneByAutoComplete";
import CostCenterAutoComplete from "@/apps/user/components/CostCenterAutoComplete";
import TableTopContainer from "@/apps/user/components/TableTopContainer";
import { Transaction } from "@/constants/object/transaction";

const UnitList = () => (
  <CommonUnitList
    useUnitsHook={useUnits}
    useDeleteUnitHook={useDeleteUnit}
    AddUnitModal={AddUnit}
    DoneByAutoComplete={DoneByAutoComplete}
    CostCenterAutoComplete={CostCenterAutoComplete}
    TableTopContainer={TableTopContainer}
    unitItemConstant={Transaction.Unit}
  />
);

export default UnitList;