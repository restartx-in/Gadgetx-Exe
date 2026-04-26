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
import { useDoneBys } from "@/hooks/api/doneBy/useDoneBys";
import { useDeleteDoneBy } from "@/hooks/api/doneBy/useDeleteDoneBy";
import AddDoneBy from "./components/AddDoneBy";
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

const DoneByRow = React.memo(({ item, index, onEdit, onView, onDelete }) => (
  <Tr>
    <TdSL index={index} page={1} pageSize={10} />
    <Td>{item.name}</Td>
    <TdMenu
      onEdit={() => onEdit(item)}
      onView={() => onView(item)}
      onDelete={() => onDelete(item.id)}
    />
  </Tr>
));

const DoneByList = () => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const { data: doneBys, isLoading } = useDoneBys();
  const { mutateAsync: deleteDoneBy } = useDeleteDoneBy();

  const doneByList = useMemo(() => doneBys || [], [doneBys]);

  // 3. Replace multiple useState calls with a single useReducer
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  // 4. Update event handlers to dispatch actions
  const handleAddClick = useCallback(() => {
    dispatchModal({ type: "OPEN", mode: "add" });
  }, []);

  const handleEditClick = useCallback((doneBy) => {
    dispatchModal({ type: "OPEN", mode: "edit", payload: doneBy });
  }, []);

  const handleViewClick = useCallback((doneBy) => {
    dispatchModal({ type: "OPEN", mode: "view", payload: doneBy });
  }, []);

  const handleCloseModal = useCallback(() => {
    dispatchModal({ type: "CLOSE" });
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteDoneBy(id);
        showToast({
          crudItem: CRUDITEM.DoneBy,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.DoneBy,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteDoneBy, showToast]
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Done Bys" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <>
                  <AddButton onClick={handleAddClick}>Add Done By</AddButton>
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
                  {doneByList.length > 0 ? (
                    doneByList.map((type, index) => (
                      <DoneByRow
                        key={type.id}
                        item={type}
                        index={index}
                        onEdit={handleEditClick}
                        onView={handleViewClick}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <TableCaption item={Transaction.DoneBy} noOfCol={4} />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Done Bys" />
            <ScrollContainer>
              <PageHeader>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>Add Done By</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : doneByList.length === 0 ? (
                <TableCaption item={Transaction.DoneBy} />
              ) : (
                <div>
                  {doneByList.map((type) => (
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
      <AddDoneBy
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        selectedDoneBy={modalState.selected}
      />
    </>
  );
};

export default DoneByList;
