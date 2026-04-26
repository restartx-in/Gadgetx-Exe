import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useReducer, 
} from "react";
import PageTitleWithBackButton from "@/components/PageTitleWithBackButton";
import useRoles from "@/hooks/api/role/useRoles";
import useDeleteRole from "@/hooks/api/role/useDeleteRole";
import useUpdateRole from "@/hooks/api/role/useUpdateRole";
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
import AddRole from "./components/AddRole";
import { useToast } from "@/context/ToastContext";
import { CRUDTYPE, CRUDITEM } from "@/constants/object/crud";
import ContainerWrapper from "@/components/ContainerWrapper";
import TableWrapper from "@/components/TableWrapper";
import ScrollContainer from "@/components/ScrollContainer";
import ListItem from "@/apps/user/components/ListItem/component";
import { TOASTTYPE, TOASTSTATUS } from "@/constants/object/toastType";
import PermissionsModal from "@/components/PermissionsModal";
import Button from "@/components/Button";


const stateReducer = (state, newState) => ({ ...state, ...newState });

const initialModalState = {
  isRoleModalOpen: false,
  isPermissionsModalOpen: false,
  mode: "view",
  selectedRole: null,
};

const modalReducer = (state, action) => {
  switch (action.type) {
    case "OPEN_ROLE_MODAL":
      return {
        ...state,
        isRoleModalOpen: true,
        mode: action.mode,
        selectedRole: action.payload || null,
      };
    case "OPEN_PERMISSIONS_MODAL":
      return {
        ...state,
        isPermissionsModalOpen: true,
        selectedRole: action.payload,
      };
    case "CLOSE_MODALS":
      return initialModalState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

const RoleRow = React.memo(
  ({ role, index, onEdit, onView, onDelete, onSetPermissions }) => (
    <Tr>
      <TdSL index={index} />
      <Td>{role.name}</Td>
      <Td>
        <Button variant="secondary" onClick={() => onSetPermissions(role)}>
          Set Permissions
        </Button>
      </Td>
      <TdMenu
        onEdit={() => onEdit(role)}
        onView={() => onView(role)}
        onDelete={() => onDelete(role.id)}
      />
    </Tr>
  )
);

const RoleList = () => {
  const showToast = useToast();
  const isMobile = useIsMobile();
  const addButtonRef = useRef(null);

  const [state, setState] = useReducer(stateReducer, {
    name: "",
    sort: "",
    searchType: "",
    searchKey: "",
  });

  const { data, isLoading, refetch } = useRoles(state);
  const { mutateAsync: deleteRole } = useDeleteRole();
  const { mutateAsync: updateRole } = useUpdateRole();

  const listData = useMemo(() => data || [], [data]);

  const [sort, setSort] = useState("");

  const [modalState, dispatchModal] = useReducer(
    modalReducer,
    initialModalState
  );

  const handleSort = useCallback((value) => {
    setSort(value);
    setState({ sort: value });
  }, []);

  const handleAddClick = useCallback(
    () => dispatchModal({ type: "OPEN_ROLE_MODAL", mode: "add" }),
    []
  );
  const handleEditClick = useCallback(
    (role) =>
      dispatchModal({ type: "OPEN_ROLE_MODAL", mode: "edit", payload: role }),
    []
  );
  const handleViewClick = useCallback(
    (role) =>
      dispatchModal({ type: "OPEN_ROLE_MODAL", mode: "view", payload: role }),
    []
  );
  const handleSetPermissionsClick = useCallback(
    (role) => dispatchModal({ type: "OPEN_PERMISSIONS_MODAL", payload: role }),
    []
  );
  const handleCloseModals = useCallback(
    () => dispatchModal({ type: "CLOSE_MODALS" }),
    []
  );

  const handleSavePermissions = useCallback(
    async (newPermissions) => {
      if (!modalState.selectedRole) return;

      const payload = {
        ...modalState.selectedRole,
        permissions: newPermissions,
      };

      try {
        await updateRole(
          { id: modalState.selectedRole.id, data: payload },
          {
            onSuccess: () => {
              handleCloseModals();
              refetch();
              showToast({
                crudItem: CRUDITEM.ROLE,
                crudType: CRUDTYPE.UPDATE_SUCCESS,
              });
            },
          }
        );
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
    [modalState.selectedRole, updateRole, refetch, showToast, handleCloseModals]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteRole(id);
        showToast({
          crudItem: CRUDITEM.ROLE,
          crudType: CRUDTYPE.DELETE_SUCCESS,
        });
        refetch();
      } catch (error) {
        showToast({
          type: TOASTTYPE.GENARAL,
          message: error.response?.data?.error || "Failed to delete role.",
          status: TOASTSTATUS.ERROR,
        });
      }
    },
    [deleteRole, refetch, showToast]
  );

  return (
    <>
      <ContainerWrapper>
        {!isMobile ? (
          <>
            <PageTitleWithBackButton title="Roles" />
            <TableTopContainer
              isMargin={true}
              mainActions={
                <AddButton onClick={handleAddClick} ref={addButtonRef}>
                  Add Role
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
                        Name
                        <ThContainer>
                          <ThSort
                            sort={sort}
                            setSort={setSort}
                            value="name"
                            handleSort={handleSort}
                          />
                        </ThContainer>
                      </Th>
                      <Th>Permissions</Th>
                      <ThMenu />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {listData.length > 0 ? (
                      listData.map((role, index) => (
                        <RoleRow
                          key={role.id}
                          role={role}
                          index={index}
                          onEdit={handleEditClick}
                          onView={handleViewClick}
                          onDelete={handleDelete}
                          onSetPermissions={handleSetPermissionsClick}
                        />
                      ))
                    ) : (
                      <TableCaption item="Role" noOfCol={4} />
                    )}
                  </Tbody>
                </Table>
              )}
            </TableWrapper>
          </>
        ) : (
          <>
            <PageTitleWithBackButton title="Roles" />
            <ScrollContainer>
              <PageHeader>
                <div style={{marginLeft:"auto"}}>
                  <AddButton onClick={handleAddClick} ref={addButtonRef}>
                    Add Role
                  </AddButton>
                </div>
              </PageHeader>
              {isLoading ? (
                <Loader />
              ) : listData.length === 0 ? (
                <TableCaption item="Role" />
              ) : (
                <div>
                  {listData.map((role) => (
                    <ListItem
                      key={role.id}
                      title={role.name}
                      onView={() => handleViewClick(role)}
                      onEdit={() => handleEditClick(role)}
                      onDelete={() => handleDelete(role.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollContainer>
          </>
        )}
      </ContainerWrapper>

      {/* 5. Update component props to use modalState */}
      <AddRole
        isOpen={modalState.isRoleModalOpen}
        onClose={handleCloseModals}
        mode={modalState.mode}
        selectedRole={modalState.selectedRole}
        onSuccess={refetch}
      />

      {modalState.selectedRole && (
        <PermissionsModal
          isOpen={modalState.isPermissionsModalOpen}
          onClose={handleCloseModals}
          onSave={handleSavePermissions}
          initialPermissions={modalState.selectedRole.permissions || {}}
        />
      )}
    </>
  );
};

export default RoleList;
