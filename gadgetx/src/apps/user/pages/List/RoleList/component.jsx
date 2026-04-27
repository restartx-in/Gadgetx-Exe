import React, { useMemo } from "react";
import useRoles from "@/apps/user/hooks/api/role/useRoles";
import useDeleteRole from "@/apps/user/hooks/api/role/useDeleteRole";
import useUpdateRole from "@/apps/user/hooks/api/role/useUpdateRole";

import AddRole from "./components/AddRole";
import PermissionsModal from "@/apps/user/components/PermissionsModal";
import CommonRoleList from "@/pages/CommonRoleList";

const RoleList = () => {
  const { data: listData, isLoading, refetch } = useRoles(); 
  const { mutateAsync: deleteItem } = useDeleteRole();
  const { mutateAsync: updateItemForPermissions } = useUpdateRole(); 

  const list = useMemo(() => listData || [], [listData]);

  return (
    <CommonRoleList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      updateItemForPermissions={updateItemForPermissions}
      refetch={refetch}
      AddRoleModal={AddRole} 
      PermissionsModalComponent={PermissionsModal} 
      // Title, button text, and headers are set to their defaults in CommonRoleList
      // but can be overridden here if needed:
      // title="Roles"
      // addBtnText="Add Role"
      // tableHeaders={["Name", "Permissions"]} 
    />
  );
};

export default RoleList;