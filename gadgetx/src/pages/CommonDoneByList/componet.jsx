import React, { useCallback, useMemo, useReducer, useEffect } from "react";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { useToast } from "@/context/ToastContext";
import { useSearchParams } from "react-router-dom";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  TdSL,
  TdMenu,
  Th,
  ThSL,
  ThMenu,
  TableCaption,
  ThContainer,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import ContainerWrapper from "@/components/ContainerWrapper";
import Loader from "@/components/Loader";
import { useIsMobile } from "@/utils/useIsMobile";
import ScrollContainer from "@/components/ScrollContainer";
import Spacer from "@/components/Spacer";
import TableTopContainer2 from "@/components/TableTopContainer2";
import HStack from "@/components/HStack";
import ListItem from "@/components/ListItem";

const DoneByRow = React.memo(({ item, index, onEdit, onView, onDelete }) => {
  return (
    <Tr>
      <TdSL index={index} page={1} pageSize={10} />
      <Td>{item.name}</Td>
      <TdMenu
        onEdit={() => onEdit(item)}
        onView={() => onView(item)}
        onDelete={() => onDelete(item.id)}
      />
    </Tr>
  );
});

const initialModalState = { isOpen: false, mode: "view", selectedItem: null };
const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN":
      return {
        isOpen: true,
        mode: action.mode,
        selectedItem: action.payload || null,
      };
    case "CLOSE":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const CommonDoneByList = ({
  AddDoneByModal,
  list, // Full list data is needed here
  isLoading,
  deleteItem,
}) => {
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const title = "Done Bys";
  const addBtnText = "Add Done By";
  const tableHeaders = ["Name"];
  const TABLE_CAPTION = CRUDITEM.DONEBY;

  const isMobile = useIsMobile();
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );
  const { selectedItem, mode, isOpen } = modalState;

  // Helper to find the item in the list based on a given ID
  const findItemById = useCallback(
    (id) => {
      // Ensure the ID is compared correctly (e.g., convert to string if item.id is string)
      return list.find((item) => item.id.toString() === id);
    },
    [list]
  );

  // EFFECT: Handles opening/closing modal based on URL
  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id"); // Get the item ID from URL

    // 1. OPEN Modal Logic (URL has action)
    if (action && !isOpen) {
      if (action === "add") {
        dispatchModal({ type: "OPEN", mode: "add", payload: null });
      }
      // Handle Edit/View actions
      else if ((action === "edit" || action === "view") && id) {
        const item = findItemById(id);
        if (item) {
          dispatchModal({ type: "OPEN", mode: action, payload: item });
        } else {
          // If item not found (e.g., stale ID in URL), clean up the URL
          handleCloseModal();
        }
      }
    }
    // 2. CLOSE Modal Logic (URL cleared but modal is open)
    else if (!action && isOpen) {
      dispatchModal({ type: "CLOSE" });
    }
  }, [searchParams, isOpen, findItemById]);

  // HANDLER: Closes modal and clears URL
  const handleCloseModal = useCallback(() => {
    // Setting to an empty object clears all search parameters
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // 1. HANDLER: Opens modal and updates URL (Add)
  const handleAddClick = useCallback(() => {
    setSearchParams({ action: "add" }, { replace: true });
  }, [setSearchParams]);

  // 2. HANDLER: Opens modal and updates URL (Edit)
  const handleEditClick = useCallback(
    (item) => {
      // Set both action and the item's ID in the URL
      setSearchParams({ action: "edit", id: item.id }, { replace: true });
    },
    [setSearchParams]
  );

  // 3. HANDLER: Opens modal and updates URL (View)
  const handleViewClick = useCallback(
    (item) => {
      // Set both action and the item's ID in the URL
      setSearchParams({ action: "view", id: item.id }, { replace: true });
    },
    [setSearchParams]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: CRUDITEM.DONEBY,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        // Close modal if the currently viewed/edited item was deleted
        if (selectedItem?.id === id) {
          handleCloseModal();
        }
      } catch (error) {
        showToast({
          crudItem: CRUDITEM.DONEBY,
          crudType: CRUDTYPE.DELETE_ERROR,
        });
      }
    },
    [deleteItem, showToast, selectedItem, handleCloseModal]
  );

  const commonRowProps = {
    onEdit: handleEditClick, // Calls URL setter
    onView: handleViewClick, // Calls URL setter
    onDelete: handleDelete,
  };

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <TableTopContainer2>
              <PageTitleWithBackButton title={title} />
              <HStack>
                <AddButton onClick={handleAddClick}>{addBtnText}</AddButton>
              </HStack>
            </TableTopContainer2>

            {isLoading ? (
              <Loader />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <ThSL />
                    {tableHeaders.map((header) => (
                      <Th key={header}>
                        <ThContainer>{header}</ThContainer>
                      </Th>
                    ))}
                    <ThMenu />
                  </Tr>
                </Thead>
                <Tbody>
                  {list.length > 0 ? (
                    list.map((item, index) => (
                      <DoneByRow
                        key={item.id}
                        item={item}
                        index={index}
                        {...commonRowProps}
                      />
                    ))
                  ) : (
                    <TableCaption
                      item={TABLE_CAPTION}
                      noOfCol={tableHeaders.length + 2}
                    />
                  )}
                </Tbody>
              </Table>
            )}
          </>
        ) : (
          <>
            <PageTitleWithBackButton title={title} />
            <ScrollContainer>
              <PageHeader>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick}>{addBtnText}</AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : list.length === 0 ? (
                <TableCaption item={TABLE_CAPTION} />
              ) : (
                <div>
                  {list.map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.name}
                      onView={() => handleViewClick(item)}
                      onEdit={() => handleEditClick(item)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </div>
              )}
              <Spacer />
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddDoneByModal
        isOpen={isOpen}
        onClose={handleCloseModal} // Now clears URL
        mode={mode}
        selectedDoneBy={selectedItem}
      />
    </>
  );
};

export default CommonDoneByList;
