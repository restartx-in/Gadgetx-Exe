import React, { useMemo } from "react";
import useUsers from "@/apps/user/hooks/api/user/useUsers";
import useDeleteUser from "@/apps/user/hooks/api/user/useDeleteUser";
import AddUser from "./components/AddUser";
import UserSettingsModal from "./components/UserSettingsModal";
import CommonUserList from "@/pages/CommonUserList";

const UserList = () => {
  const { data: usersData, isLoading, refetch } = useUsers({});
  const { mutateAsync: deleteItem } = useDeleteUser();
  const list = useMemo(() => usersData?.data || [], [usersData]);

  return (
    <CommonUserList
      list={list}
      isLoading={isLoading}
      deleteItem={deleteItem}
      refetch={refetch}
      AddUserModal={AddUser}
      SettingsModalComponent={UserSettingsModal}

      // title="Users"
    />
  );
};

export default UserList;
