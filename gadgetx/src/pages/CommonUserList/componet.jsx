import React, {
  useEffect,
  useCallback,
  useReducer,
} from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom"; 
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import { useIsMobile } from "@/utils/useIsMobile";
import Loader from "@/components/Loader";
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
import ScrollContainer from "@/components/ScrollContainer";
import TableTopContainer2 from "@/components/TableTopContainer2";
import HStack from "@/components/HStack";
import ListItem from "@/components/ListItem";
import { CRUDITEM, CRUDTYPE } from "@/constants/object/crud";
import { useToast } from "@/context/ToastContext";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import Button from "@/components/Button";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const UserRow = React.memo(
  ({ item, index, onEdit, onView, onDelete, onOpenSettings }) => {
    return (
      <Tr>
        <TdSL index={index} page={1} pageSize={10} />
        <Td>{item.username}</Td>
        <Td>{item.role_name || "N/A"}</Td>
        <Td>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings(item);
            }}
          >
            Settings
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

const CommonUserList = ({
  AddUserModal, 
  SettingsModalComponent, 
  list,
  isLoading,
  deleteItem,
  refetch,
  title = "Users",
  addBtnText = "Add User",
  tableHeaders = ["Username", "Role", "Settings"],
  TABLE_CAPTION = CRUDITEM.USER,
}) => {
  const [searchParams] = useSearchParams(); 
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const showToast = useToast();
  const isMobile = useIsMobile();

  const [modalState, dispatchModalState] = useReducer(stateReducer, {
    selectedItem: null, 
    selectedItemId: null, 
    mode: "view",
    isCRUDModalOpen: false, 
    isSettingsModalOpen: false,
  });

  const {
    selectedItem,
    selectedItemId,
    mode,
    isCRUDModalOpen,
    isSettingsModalOpen,
  } = modalState;


  const closeCRUDModal = useCallback(
    () => dispatchModalState({ isCRUDModalOpen: false, selectedItem: null }),
    []
  );

  const closeSettingsModal = useCallback(
    () =>
      dispatchModalState({ isSettingsModalOpen: false, selectedItemId: null }),
    []
  );

  const handleAddClick = useCallback(() => {
    dispatchModalState({
      mode: "add",
      selectedItem: null,
      isCRUDModalOpen: true,
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "add" && !isCRUDModalOpen) {
      handleAddClick();
      navigate(location.pathname, { replace: true });
    }
  }, [searchParams, isCRUDModalOpen, navigate, location.pathname, handleAddClick]);

  const handleEditClick = useCallback((item) => {
    dispatchModalState({
      selectedItem: item,
      mode: "edit",
      isCRUDModalOpen: true,
    });
  }, []);

  const handleViewClick = useCallback((item) => {
    dispatchModalState({
      selectedItem: item,
      mode: "view",
      isCRUDModalOpen: true,
    });
  }, []);

  const handleOpenSettingsModal = useCallback((item) => {
    dispatchModalState({
      selectedItemId: item.id,
      isSettingsModalOpen: true,
    });
  }, []);

  const handleSettingsSuccess = useCallback(() => {
    closeSettingsModal();
    showToast({
      type: TOASTTYPE.GENARAL,
      message: `${TABLE_CAPTION} settings updated successfully.`,
      status: TOASTSTATUS.SUCCESS,
    });
    refetch();
  }, [refetch, showToast, TABLE_CAPTION, closeSettingsModal]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteItem(id);
        showToast({
          crudItem: TABLE_CAPTION,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
        if (selectedItem?.id === id) closeCRUDModal();
        if (selectedItemId === id) closeSettingsModal();
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
      refetch,
      showToast,
      TABLE_CAPTION,
      selectedItem,
      selectedItemId,
      closeCRUDModal,
      closeSettingsModal,
    ]
  );

  const commonRowProps = {
    onEdit: handleEditClick,
    onView: handleViewClick,
    onDelete: handleDelete,
    onOpenSettings: handleOpenSettingsModal,
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
                      <UserRow 
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
                      title={item.username}
                      subtitle={`Role: ${item.role_name || "N/A"}`}
                      onView={() => handleViewClick(item)}
                      onEdit={() => handleEditClick(item)}
                      onDelete={() => handleDelete(item.id)}
                      extraButton={
                        <Button
                          variant="edit"
                          size="m"
                          onClick={() => handleOpenSettingsModal(item)}
                        >
                          Settings
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      <AddUserModal
        isOpen={isCRUDModalOpen}
        onClose={closeCRUDModal}
        mode={mode}
        selectedUser={selectedItem}
        onSuccess={refetch}
      />

      {isSettingsModalOpen && SettingsModalComponent && (
        <SettingsModalComponent
          isOpen={isSettingsModalOpen}
          onClose={closeSettingsModal}
          userId={selectedItemId}
          onSuccess={handleSettingsSuccess}
        />
      )}
    </>
  );
};

export default CommonUserList;
