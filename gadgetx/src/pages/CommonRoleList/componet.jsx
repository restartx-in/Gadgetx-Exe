import React, { useCallback, useMemo, useReducer, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
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
import Button from "@/components/Button";

const RoleRow = React.memo(
  ({ item, index, onEdit, onView, onDelete, onSetPermissions }) => {
    return (
      <Tr>
        <TdSL index={index} page={1} pageSize={10} />
        <Td>{item.name}</Td>
        <Td>
          <Button variant="secondary" onClick={() => onSetPermissions(item)}>
            Set Permissions
          </Button>
        </Td>
        <TdMenu
          onEdit={() => onEdit(item)}
          onView={() => onView(item)}
          onDelete={() => onDelete(item.id)}
        />
      </Tr>
    );
  }
);

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

const CommonRoleList = ({
  AddRoleModal,
  PermissionsModalComponent,
  list,
  isLoading,
  deleteItem,
  updateItemForPermissions, 
  refetch, 
  title = "Roles",
  addBtnText = "Add Role",
  tableHeaders = ["Name", "Permissions"], 
  TABLE_CAPTION = CRUDITEM.ROLE, 
}) => {
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );
  const { selectedItem, mode, isOpen } = modalState;

  const isPermissionsAction = searchParams.get("action") === "permissions";

  const findItemById = useCallback(
    (id) => {
      return list.find((item) => item.id.toString() === id);
    },
    [list]
  );

  const selectedItemForPermissions = useMemo(() => {
    const id = searchParams.get("id");
    return isPermissionsAction && id ? findItemById(id) : null;
  }, [searchParams, isPermissionsAction, findItemById]);

  const handleCloseModal = useCallback(() => {
    setSearchParams({}, { replace: true });
    dispatchModal({ type: "CLOSE" });
  }, [setSearchParams]);

  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (
      action &&
      !isOpen &&
      (action === "add" || action === "edit" || action === "view")
    ) {
      if (action === "add") {
        dispatchModal({ type: "OPEN", mode: "add", payload: null });
      } else if (id) {
        const item = findItemById(id);
        if (item) {
          dispatchModal({ type: "OPEN", mode: action, payload: item });
        } else {
          handleCloseModal();
        }
      }
    }
    else if (!action && (isOpen || isPermissionsAction)) {
      dispatchModal({ type: "CLOSE" });
    }
  }, [searchParams, isOpen, findItemById, isPermissionsAction, handleCloseModal]);

  const handleAddClick = useCallback(() => {
    setSearchParams({ action: "add" }, { replace: true });
  }, [setSearchParams]);

  const handleEditClick = useCallback(
    (item) => {
      setSearchParams({ action: "edit", id: item.id }, { replace: true });
    },
    [setSearchParams]
  );

  const handleViewClick = useCallback(
    (item) => {
      setSearchParams({ action: "view", id: item.id }, { replace: true });
    },
    [setSearchParams]
  );

  const handleSetPermissionsClick = useCallback(
    (item) => {
      setSearchParams(
        { action: "permissions", id: item.id },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleSavePermissions = useCallback(
    async (newPermissions) => {
      if (!selectedItemForPermissions) return;

      const payload = {
        ...selectedItemForPermissions,
        permissions: newPermissions,
      };

      try {
        await updateItemForPermissions({
          id: selectedItemForPermissions.id,
          data: payload,
        });
        handleCloseModal();
        refetch();
        showToast({
          crudItem: TABLE_CAPTION,
          crudType: CRUDTYPE.UPDATE_SUCCESS,
        });
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || "An unexpected error occurred.";
        showToast({
          type: TOASTTYPE.GENARAL,
          message: errorMsg,
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [
      selectedItemForPermissions,
      updateItemForPermissions,
      handleCloseModal,
      refetch,
      showToast,
      TABLE_CAPTION,
    ]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: TABLE_CAPTION,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        if (selectedItem?.id === id || selectedItemForPermissions?.id === id) {
          handleCloseModal();
        }
        refetch();
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message:
            error.response?.data?.error || `Failed to delete ${TABLE_CAPTION}.`,
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [
      deleteItem,
      showToast,
      selectedItem,
      selectedItemForPermissions,
      handleCloseModal,
      TABLE_CAPTION,
      refetch,
    ]
  );

  const commonRowProps = {
    onEdit: handleEditClick,
    onView: handleViewClick,
    onDelete: handleDelete,
    onSetPermissions: handleSetPermissionsClick, 
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
                      <RoleRow
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

      <AddRoleModal
        isOpen={isOpen}
        onClose={handleCloseModal} 
        mode={mode}
        selectedRole={selectedItem}
        onSuccess={refetch} 
      />

      {selectedItemForPermissions && (
        <PermissionsModalComponent
          isOpen={isPermissionsAction}
          onClose={handleCloseModal} 
          onSave={handleSavePermissions}
          initialPermissions={selectedItemForPermissions.permissions || {}}
        />
      )}
    </>
  );
};

export default CommonRoleList;
