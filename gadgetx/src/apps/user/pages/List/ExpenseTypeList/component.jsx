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
import { useExpenseTypes } from "@/hooks/api/expenseType/useExpenseTypes";
import { useDeleteExpenseType } from "@/hooks/api/expenseType/useDeleteExpenseType";
import AddExpenseType from "./components/AddExpenseType";
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

const ExpenseTypeRow = React.memo(
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

const ExpenseTypeList = () => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const { data: expenseTypes, isLoading } = useExpenseTypes();
  const { mutateAsync: deleteExpenseType } = useDeleteExpenseType();

  const expenseTypeList = useMemo(() => expenseTypes || [], [expenseTypes]);

  // 3. Replace multiple useState calls with a single useReducer
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  // 4. Update event handlers to dispatch actions
  const handleAddClick = useCallback(() => {
    dispatchModal({ type: "OPEN", mode: "add" });
  }, []);

  const handleEditClick = useCallback((expenseType) => {
    dispatchModal({ type: "OPEN", mode: "edit", payload: expenseType });
  }, []);

  const handleViewClick = useCallback((expenseType) => {
    dispatchModal({ type: "OPEN", mode: "view", payload: expenseType });
  }, []);

  const handleCloseModal = useCallback(() => {
    dispatchModal({ type: "CLOSE" });
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteExpenseType(id);
        showToast({
          crudItem: CRUDITEM.ExpenseType,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.ExpenseType,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteExpenseType, showToast]
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Expense Types" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <AddButton onClick={handleAddClick}>
                    Add Expense Type
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
                  {expenseTypeList.length > 0 ? (
                    expenseTypeList.map((type, index) => (
                      <ExpenseTypeRow
                        key={type.id}
                        item={type}
                        index={index}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.ExpenseType} noOfCol={4} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Expense Types" />
            <ScrollContainer>
              <PageHeader>
                <div style={{ style: "auto" }}>
                  <AddButton onClick={handleAddClick}>
                    Add Expense Type
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : expenseTypeList.length === 0 ? (
                <TableCaption item={Transaction.ExpenseType} />
              ) : (
                <div>
                  {expenseTypeList.map((type) => (
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

      <AddExpenseType
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedExpenseType={modalState.selected}
      />
    </>
  );
};

export default ExpenseTypeList;
