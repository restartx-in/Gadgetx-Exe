import React, { useCallback, useMemo, useReducer } from "react"; 
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSL,
  TdSL,
  TdMenu,
  ThMenu,
  TableCaption,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { Transaction } from "@/constants/object/transaction";
import { useCostCenters } from "@/hooks/api/costCenter/useCostCenters";
import { useDeleteCostCenter } from "@/hooks/api/costCenter/useDeleteCostCenter";
import AddCostCenter from "./components/AddCostCenter";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import Spacer from "@/components/Spacer";
import TableTopContainer from "@/components/TableTopContainer";

// 2. Define a reducer for modal state management
const initialModalState = {
  isOpen: false,
  mode: "view",
  selected: null,
};

const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN":
      return {
        isOpen: true,
        mode: action.mode,
        selected: action.payload || null,
      };
    case "CLOSE":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const CostCenterRow = React.memo(
  ({ item, index, onEdit, onView, onDelete }) => (
    <Tr>
      <TdSL index={index} page={1} pageSize={10} />
      <Td>{item.name}</Td>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  )
);

const CostCenterList = () => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const { data: costCenters, isLoading } = useCostCenters();
  const { mutateAsync: deleteCostCenter } = useDeleteCostCenter();

  const costCenterList = useMemo(() => costCenters || [], [costCenters]);

  // 3. Replace multiple useState calls with a single useReducer
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  // 4. Update event handlers to dispatch actions
  const handleAddClick = useCallback(() => {
    dispatchModal({ type: "OPEN", mode: "add" });
  }, []);

  const handleEditClick = useCallback((costCenter) => {
    dispatchModal({ type: "OPEN", mode: "edit", payload: costCenter });
  }, []);

  const handleViewClick = useCallback((costCenter) => {
    dispatchModal({ type: "OPEN", mode: "view", payload: costCenter });
  }, []);

  const handleCloseModal = useCallback(() => {
    dispatchModal({ type: "CLOSE" });
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteCostCenter(id);
        showToast({
          crudItem: CRUDITEM.CostCenter,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.CostCenter,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteCostCenter, showToast]
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Cost Centers" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <AddButton onClick={handleAddClick}>
                    Add Cost Center
                  </AddButton>
                </>
              }
            />
            {isLoading ? (
              <Loader />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    <Th>Name</Th>
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {costCenterList.length > 0 ? (
                    costCenterList.map((type, index) => (
                      <CostCenterRow
                        key={type.id}
                        item={type}
                        index={index}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.CostCenter} noOfCol={4} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Cost Centers" />
            <ScrollContainer>
              <PageHeader>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>
                    Add Cost Center
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : costCenterList.length === 0 ? (
                <TableCaption item={Transaction.CostCenter} />
              ) : (
                <div>
                  {costCenterList.map((type) => (
                    <ListItem
                      key={type.id}
                      title={type.name}
                      onView={() => handleViewClick(type)}
                      onEdit={() => handleEditClick(type)}
                      onDelete={() => handleDelete(type.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      {/* Update props to use the new modalState */}
      <AddCostCenter
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedCostCenter={modalState.selected}
      />
    </>
  );
};

export default CostCenterList;
