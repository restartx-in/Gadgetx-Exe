import React from "react";
import useCreateRole from "@/apps/user/hooks/api/role/useCreateRole";
import useUpdateRole from "@/apps/user/hooks/api/role/useUpdateRole";
import useDeleteRole from "@/apps/user/hooks/api/role/useDeleteRole";
import PermissionsModal from "@/apps/user/components/PermissionsModal"; 
import CommonRoleModal from "@/pages/CommonRoleModal"; 


const AddRole = ({
  isOpen,
  onClose,
  mode,
  selectedRole,
  onSuccess,
}) => {
  return (
    <CommonRoleModal
      // App-specific hooks
      useCreateHook={useCreateRole}
      useUpdateHook={useUpdateRole}
      useDeleteHook={useDeleteRole}
      
      // App-specific components
      PermissionsModalComponent={PermissionsModal}

      // Modal Props
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      selectedItem={selectedRole} 
      onSuccess={onSuccess} 
    />
  );
};

export default AddRole;