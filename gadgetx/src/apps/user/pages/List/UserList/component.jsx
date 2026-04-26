import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useReducer,
  useEffect,
} from "react";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useUsers from "@/hooks/api/user/useUsers";
import useDeleteUser from "@/hooks/api/user/useDeleteUser";
import { useIsMobile } from "@/utils/useIsMobile";
import Loader from "@/components/Loader";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ThSort,
  TdSL,
  ThSL,
  TdMenu,
  ThMenu,
  ThContainer,
  TableCaption,
} from "@/components/Table";
import AddButton from "@/components/AddButton";
import PageHeader from "@/components/PageHeader";
import TableTopContainer from "@/components/TableTopContainer";
import AddUser from "./components/AddUser";
import UserSettingsModal from "./components/UserSettingsModal";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import TableWrapper from "@/components/TableWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import Button from "@/components/Button";

const stateReducer = (state, newState) => ({ ...state, ...newState });

const initialModalState = {
  isUserModalOpen: false,
  isSettingsModalOpen: false,
  mode: "view",
  selectedUser: null,
};

const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN_USER_MODAL":
      return {
        ...state,
        isUserModalOpen: true,
        mode: action.mode,
        selectedUser: action.payload || null,
      };
    case "OPEN_SETTINGS_MODAL":
      return {
        ...state,
        isSettingsModalOpen: true,
        selectedUser: action.payload,
      };
    case "CLOSE_MODALS":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const UserRow = React.memo(
  ({ user, index, onEdit, onView, onDelete, onOpenSettings }) => (
    <Tr>
      <TdSL index={index} />
      <Td>{user.username}</Td>
      <Td>{user.role_name || "N/A"}</Td>
      <Td>
        <Button variant="secondary" onClick={() => onOpenSettings(user)}>
          Settings
        </Button>
      </Td>
      <TdMenu
        onEdit={() => onEdit(user)}
        onView={() => onView(user)}
        onDelete={() => onDelete(user.id)}
      />
    </Tr>
  )
);

const UserList = () => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const addButtonRef = useRef(null);

  const [filters, setFilters] = useReducer(stateReducer, { sort: "" });

  const { data: usersData, isLoading, refetch } = useUsers(filters);
  const { mutateAsync: deleteUser } = useDeleteUser();

  const listData = useMemo(() => usersData?.data || [], [usersData]);

  const [sort, setSort] = useState("");
  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  useEffect(() => {
    setFilters({ sort: sort });
  }, [sort]);

  const handleSort = useCallback((value) => {
    setSort(value);
  }, []);

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN_USER_MODAL", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (user) =>
      dispatchModal({ type: "OPEN_USER_MODAL", mode: "edit", payload: user }),
    []
  );
  const handleViewClick = useCallback(
    (user) =>
      dispatchModal({ type: "OPEN_USER_MODAL", mode: "view", payload: user }),
    []
  );
  const handleOpenSettingsModal = useCallback(
    (user) => dispatchModal({ type: "OPEN_SETTINGS_MODAL", payload: user }),
    []
  );
  const handleCloseModals = useCallback(
    () => dispatchModal({ type: "CLOSE_MODALS" }),
    []
  );

  const handleSettingsSuccess = useCallback(() => {
    handleCloseModals();
    showToast({
      type: TOASTTYPE.GENARAL,
      message: "User settings updated successfully.",
      status: TOASTSTATUS.SUCCESS,
    });
    refetch();
  }, [refetch, showToast, handleCloseModals]);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteUser(id);
        showToast({
          crudItem: CRUDITEM.USER,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: error.response?.data?.error || "Failed to delete user.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deleteUser, refetch, showToast]
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Users" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <AddButton onClick={handleAddClick} ref={addButtonRef}>
                  Add User
                </AddButton>
              }
            />
            <TableWrapper>
              {isLoading ? (
                <Loader />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <ThSL />
                      <Th>
                        Username
                        <ThContainer>
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="username"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      <Th>Role</Th>
                      <Th>Settings</Th>
                      <ThMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((user, index) => (
                        <UserRow
                          key={user.id}
                          user={user}
                          index={index}
                          onEdit={handleEditClick}
                          onView={handleViewClick}
                          onDelete={handleDelete}
                          onOpenSettings={handleOpenSettingsModal}
                        />
                      ))
                    ) : (
                      <TableCaption item="User" noOfCol={5} />
                    )}
                  </Tbody>
                </Table>
              )}
            </TableWrapper>
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Users" />
            <ScrollContainer>
              <PageHeader>
                <div style={{ marginLeft: "auto" }}>
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add User
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item="User" />
              ) : (
                <div>
                  {listData.map((user) => (
                    <ListItem
                      key={user.id}
                      title={user.username}
                      subtitle={`Role: ${user.role_name || "N/A"}`}
                      onView={() => handleViewClick(user)}
                      onEdit={() => handleEditClick(user)}
                      onDelete={() => handleDelete(user.id)}
                      extraButton={
                        <Button
                          variant="edit"
                          size="m"
                          onClick={() => handleOpenSettingsModal(user)}
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

      <AddUser
        isOpen={modalState.isUserModalOpen}
        onClose={handleCloseModals}
        mode={modalState.mode}
        selectedUser={modalState.selectedUser}
        onSuccess={refetch}
      />
      {modalState.isSettingsModalOpen && (
        <UserSettingsModal
          isOpen={modalState.isSettingsModalOpen}
          onClose={handleCloseModals}
          userId={modalState.selectedUser?.id}
          onSuccess={handleSettingsSuccess}
        />
      )}
    </>
  );
};

export default UserList;
